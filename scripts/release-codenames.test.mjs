import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { selectCodename, validateCodenameData } from "./release-codenames.mjs";

test("prefers curated names, skips previously used names and records the current release", () => {
  const data = { available: ["  OLD NAME ", "Current Name", "Crimson Moon"], used: ["Old Name"] };
  assert.equal(selectCodename(data, "1.2.3", "Current Name"), "Crimson Moon");
  assert.deepEqual(data.available, []);
  assert.deepEqual(data.used, ["Old Name", "Current Name", "Crimson Moon"]);
});

test("generates unique names after the curated list is exhausted", () => {
  const data = { available: [], used: [] };
  assert.equal(selectCodename(data, "1.0.1", "Ashen Covenant"), "Ashen Crown");
  assert.equal(selectCodename(data, "1.0.2", "Ashen Crown"), "Ashen Dawn");
});

test("falls back to a versioned name when every combination is used", () => {
  const data = { available: [], used: [] };
  for (let index = 0; index < 900; index += 1) {
    selectCodename(data, `1.0.${index}`, "Current Release");
  }
  data.used.push("Moonlit Legacy v1.0.900");
  assert.equal(selectCodename(data, "1.0.900", "Current Release"), "Moonlit Legacy v1.0.900 2");
});

test("rejects malformed catalogues and release data", () => {
  for (const data of [{}, { available: [], used: null }, { available: [""], used: [] }]) {
    assert.throws(() => validateCodenameData(data), /inválida/);
  }
  assert.throws(() => selectCodename({ available: [], used: [] }, "", "Name"), /versão/);
  assert.throws(() => selectCodename({ available: [], used: [] }, "1.0.0", ""), /codinome/);
});

test("prepares releases with generated and curated names and persists their history", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "werewolf-release-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, "docs"));
  writeFileSync(join(directory, "package.json"), JSON.stringify({
    name: "release-test", version: "1.0.0", codename: "Old Name",
  }));
  writeFileSync(join(directory, "docs/release-codenames.json"), JSON.stringify({
    available: [], used: ["Old Name"],
  }));
  const eventPath = join(directory, "event.json");
  writeFileSync(eventPath, JSON.stringify({ pull_request: { merged: true, labels: [] } }));

  const runRelease = () => spawnSync(process.execPath, [fileURLToPath(new URL("./release-version.mjs", import.meta.url))], {
    cwd: directory,
    env: { ...process.env, GITHUB_EVENT_PATH: eventPath },
    encoding: "utf8",
  });

  const result = runRelease();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /::warning::Restam 0 codinomes/);
  const packageData = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  const catalogue = JSON.parse(readFileSync(join(directory, "docs/release-codenames.json"), "utf8"));
  assert.equal(packageData.version, "1.0.1");
  assert.equal(packageData.codename, "Ashen Covenant");
  assert.deepEqual(catalogue.used, ["Old Name", "Ashen Covenant"]);
  assert.deepEqual(catalogue.available, []);

  catalogue.available.push("Crimson Moon");
  writeFileSync(join(directory, "docs/release-codenames.json"), JSON.stringify(catalogue));
  writeFileSync(eventPath, JSON.stringify({
    pull_request: { merged: true, labels: [{ name: "release:minor" }] },
  }));
  const next = runRelease();
  assert.equal(next.status, 0, next.stderr);
  const updatedPackage = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  const updatedCatalogue = JSON.parse(readFileSync(join(directory, "docs/release-codenames.json"), "utf8"));
  assert.equal(updatedPackage.version, "1.1.0");
  assert.equal(updatedPackage.codename, "Crimson Moon");
  assert.deepEqual(updatedCatalogue.used, ["Old Name", "Ashen Covenant", "Crimson Moon"]);

  writeFileSync(join(directory, "docs/release-codenames.json"), JSON.stringify({ available: [], used: null }));
  const invalid = runRelease();
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Lista de codinomes "used" inválida/);
  assert.equal(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version, "1.1.0");
});
