import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const buildFiles = new Set([
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "tsconfig.json",
  ".github/workflows/deploy.yml",
]);

export function needsBuild(path) {
  if (path.startsWith("src/")) {
    return !/\.(test|spec)\.[cm]?[jt]sx?$/.test(path);
  }
  return buildFiles.has(path)
    || path.startsWith("public/")
    || path.startsWith(".github/actions/deploy-cloudflare/");
}

export function needsRelease(pages) {
  if (!Array.isArray(pages) || pages.some((page) => !Array.isArray(page))) {
    throw new Error("Resposta inválida da API de arquivos do pull request.");
  }
  const files = pages.flat();
  if (files.length >= 3000) {
    throw new Error("O pull request atingiu o limite da API de 3000 arquivos.");
  }
  return files.some(({ filename, previous_filename }) => {
    if (typeof filename !== "string") {
      throw new Error("Arquivo do pull request sem nome válido.");
    }
    return needsBuild(filename)
      || (typeof previous_filename === "string" && needsBuild(previous_filename));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pages = JSON.parse(readFileSync(0, "utf8"));
  console.log(`deploy=${needsRelease(pages)}`);
}
