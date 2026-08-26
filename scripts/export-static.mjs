import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import staticExport from "../desktop/services/static-export-service.cjs";

const { exportStaticPortal } = staticExport;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const templateDirectory = path.join(projectRoot, "desktop", "templates");
const contentPath = path.join(projectRoot, "content", "site.json");
const packagePath = path.join(projectRoot, "package.json");

const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const outputDirectory = exportStaticPortal({ projectDirectory: projectRoot, templateDirectory, content, builderVersion: packageJson.version });

process.stdout.write(`${outputDirectory}\n`);
