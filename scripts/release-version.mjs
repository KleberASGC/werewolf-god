import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { selectCodename, validateCodenameData } from "./release-codenames.mjs";

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
const packagePath = "package.json";
const currentPackage = JSON.parse(readFileSync(packagePath, "utf8"));

validateCodenameData(codenameData);
if (typeof currentPackage.codename !== "string" || !currentPackage.codename.trim()) {
  throw new Error("O codinome atual do pacote é inválido.");
}

execFileSync("npm", ["version", bump, "--no-git-tag-version"], {
  stdio: "inherit",
});

const packageData = JSON.parse(readFileSync(packagePath, "utf8"));
const codename = selectCodename(codenameData, packageData.version, currentPackage.codename);
packageData.codename = codename;

writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);
writeFileSync(codenamePath, `${JSON.stringify(codenameData, null, 2)}\n`);

if (codenameData.available.length <= 5) {
  console.warn(`::warning::Restam ${codenameData.available.length} codinomes selecionados em ${codenamePath}; nomes serão gerados automaticamente quando necessário.`);
}

console.log(`Release preparado: v${packageData.version} · ${codename}`);