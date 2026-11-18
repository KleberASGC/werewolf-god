import assert from "node:assert/strict";
import { test } from "node:test";
import { needsRelease } from "./release-needs-build.mjs";

test("rebuilds for application, assets, configuration and deploy action changes", () => {
  for (const filename of [
    "src/app/App.tsx", "src/app/styles.css", "public/sw.js", "index.html",
    "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts",
    ".github/actions/deploy-cloudflare/action.yml", ".github/workflows/deploy.yml",
  ]) {
    assert.equal(needsRelease([[{ filename }]]), true, filename);
  }
});

test("does not rebuild for documentation, tests, and unrelated workflows", () => {
  assert.equal(needsRelease([[
    { filename: "README.md" },
    { filename: "docs/rules/ruleset-v1.md" },
    { filename: "src/app/App.test.tsx" },
    { filename: "src/domain/example.spec.ts" },
    { filename: ".github/workflows/ci.yml" },
  ]]), false);
});

test("considers all pages and previous names of renamed files", () => {
  assert.equal(needsRelease([[{ filename: "README.md" }], [
    { filename: "docs/old.css", previous_filename: "src/app/old.css" },
  ]]), true);
});

test("rejects malformed or potentially truncated API responses", () => {
  assert.throws(() => needsRelease({}));
  assert.throws(() => needsRelease([[{}]]));
  assert.throws(() => needsRelease([Array.from({ length: 3000 }, () => ({ filename: "README.md" }))]));
});
