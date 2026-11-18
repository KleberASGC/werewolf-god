import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));

if (event.pull_request?.merged !== true) {
  throw new Error("O release só pode ser preparado após um merge.");
}

const releaseLabels = (event.pull_request.labels ?? [])
  .map(({ name }) => name)
  .filter((name) => name === "release:minor" || name === "release:major");

if (releaseLabels.length > 1) {
  throw new Error("Use no máximo um rótulo de versão: release:minor ou release:major.");
}

const bump = releaseLabels[0]?.slice("release:".length) ?? "patch";
const codenamePath = "docs/release-codenames.json";
const codenameData = JSON.parse(readFileSync(codenamePath, "utf8"));

if (!Array.isArray(codenameData.available) || codenameData.available.length === 0) {
  throw new Error(`Não há codinomes disponíveis em ${codenamePath}.`);
}

const codename = codenameData.available.shift();

execFileSync("npm", ["version", bump, "--no-git-tag-version"], {
  stdio: "inherit",
});

const packagePath = "package.json";
const packageData = JSON.parse(readFileSync(packagePath, "utf8"));
packageData.codename = codename;

writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);
writeFileSync(codenamePath, `${JSON.stringify(codenameData, null, 2)}\n`);

console.log(`Release preparado: v${packageData.version} · ${codename}`);