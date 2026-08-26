const fs = require("node:fs");
const path = require("node:path");
const { writePortalContent } = require("../portal-project.cjs");

const STATIC_FILES = ["index.html", "styles.css", "dynamic.css", "portal-fixes.css", "fonts.css", "accessibility.css", "app.js"];

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

function exportStaticPortal({ projectDirectory, templateDirectory, content, builderVersion }) {
  const resolvedProject = path.resolve(projectDirectory);
  const outputDirectory = path.join(resolvedProject, "portal-estatico");
  if (path.dirname(outputDirectory) !== resolvedProject || path.basename(outputDirectory) !== "portal-estatico") {
    throw new Error("Destino de exportação inválido.");
  }
  if (fs.existsSync(outputDirectory)) fs.rmSync(outputDirectory, { recursive: true });
  fs.mkdirSync(outputDirectory);
  for (const file of STATIC_FILES) fs.copyFileSync(path.join(templateDirectory, file), path.join(outputDirectory, file));
  copyDirectory(path.join(templateDirectory, "fonts"), path.join(outputDirectory, "fonts"));
  copyDirectory(path.join(templateDirectory, "menu"), path.join(outputDirectory, "menu"));
  writePortalContent(outputDirectory, content, builderVersion);
  return outputDirectory;
}

module.exports = { exportStaticPortal };
