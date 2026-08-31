import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Informe o caminho da imagem da bandeira.");
const contentPath = path.resolve("content/site.json");
const content = JSON.parse(await readFile(contentPath, "utf8"));
const dataUrl = `data:image/jpeg;base64,${(await readFile(source)).toString("base64")}`;
const palette = { primaryColor: "#146b3a", accentColor: "#2f8a57", deepColor: "#0b4f2c", surfaceColor: "#ffffff", softColor: "#eef5f0", textColor: "#17352a", mutedColor: "#5f746a" };
Object.assign(content.site, palette);
content.site.design = { ...content.site.design, palette: "amargosa" };

for (const page of content.pages) {
  for (const segment of page.segments) {
    const logo = segment.items.find((item) => item.type === "image" && item.role === "logo");
    if (logo) { logo.src = dataUrl; logo.alt = "Bandeira de Amargosa"; }
    if (segment.type === "header" || segment.type === "internalHeader") Object.assign(segment.style, { background: "#ffffff", color: palette.textColor, accent: palette.primaryColor });
    else if (["hero", "help", "footer"].includes(segment.type)) Object.assign(segment.style, { background: palette.primaryColor, color: "#ffffff", accent: palette.deepColor });
    else Object.assign(segment.style, { background: segment.type === "categories" ? palette.softColor : palette.surfaceColor, color: palette.textColor, accent: palette.primaryColor });
  }
}

await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log("Marca e paleta da bandeira aplicadas ao portal.");
