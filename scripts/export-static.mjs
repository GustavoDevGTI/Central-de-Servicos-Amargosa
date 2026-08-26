import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import portalProject from "../desktop/portal-project.cjs";

const { writePortalContent } = portalProject;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectRoot, "portal-estatico");
const templateDirectory = path.join(projectRoot, "desktop", "templates");
const contentPath = path.join(projectRoot, "content", "site.json");
const packagePath = path.join(projectRoot, "package.json");

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

if (path.dirname(outputDirectory) !== projectRoot || path.basename(outputDirectory) !== "portal-estatico") {
  throw new Error("Destino de exportação inválido.");
}

if (fs.existsSync(outputDirectory)) fs.rmSync(outputDirectory, { recursive: true });
fs.mkdirSync(outputDirectory, { recursive: false });

for (const file of ["index.html", "styles.css", "dynamic.css", "portal-fixes.css", "fonts.css", "accessibility.css", "app.js"]) {
  fs.copyFileSync(path.join(templateDirectory, file), path.join(outputDirectory, file));
}

copyDirectory(path.join(templateDirectory, "fonts"), path.join(outputDirectory, "fonts"));
copyDirectory(path.join(templateDirectory, "menu"), path.join(outputDirectory, "menu"));

const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
writePortalContent(outputDirectory, content, packageJson.version);

process.stdout.write(`${outputDirectory}\n`);
