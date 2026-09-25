import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sourceUrl = "https://acesso.amargosa.ba.gov.br/coletalixo";
const outputPath = fileURLToPath(new URL("../app/coleta-cronograma.json", import.meta.url));

function textContent(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}

function parseSchedule(html) {
  if (!/<title>Cronograma da Coleta de Lixo \| Prefeitura de Amargosa<\/title>/.test(html)) {
    throw new Error("O documento recebido não é o cronograma de coleta esperado.");
  }
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>") + 7);
  const groupMatches = [...main.matchAll(/<section class="group" id="([^"]+)"><h2>([^<]+)<\/h2>/g)];
  const groups = groupMatches.map((match, index) => {
    const body = main.slice(match.index, groupMatches[index + 1]?.index ?? main.length);
    const places = [...body.matchAll(/<section class="place">([\s\S]*?)<\/section>/g)].map((placeMatch) => {
      const placeHtml = placeMatch[1];
      const name = textContent(placeHtml.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] || "");
      const routes = [...placeHtml.matchAll(/<(details|article) class="card(?: single-card)?">([\s\S]*?)<\/\1>/g)].map((cardMatch) => {
        const card = cardMatch[2];
        const routeName = textContent(card.match(/<(?:summary|div class="single-title")>([\s\S]*?)<\/(?:summary|div)>/)?.[1] || "");
        const slots = [...card.matchAll(/<div class="slot"><span>([^<]+)<\/span><time datetime="(\d{2}:\d{2})">([^<]+)<\/time><\/div>/g)]
          .map((slot) => ({ day: textContent(slot[1]), time: slot[2] }));
        if (!routeName || !slots.length || slots.some((slot) => !slot.day)) {
          throw new Error(`Rota incompleta em ${name || match[2]}.`);
        }
        return { name: routeName, slots };
      });
      if (!name || !routes.length) throw new Error(`Local incompleto em ${match[2]}.`);
      return { name, routes };
    });
    if (!places.length) throw new Error(`Grupo vazio: ${match[2]}.`);
    return { id: match[1], title: textContent(match[2]), places };
  });
  const routeCount = groups.flatMap((group) => group.places.flatMap((place) => place.routes)).length;
  const slotCount = groups.flatMap((group) => group.places.flatMap((place) => place.routes.flatMap((route) => route.slots))).length;
  if (groups.length !== 3 || routeCount < 20 || slotCount < 50) {
    throw new Error(`Cronograma incompleto: ${groups.length} grupos, ${routeCount} rotas, ${slotCount} horários.`);
  }
  return { sourceUrl, retrievedAt: new Date().toISOString().slice(0, 10), groups };
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Informe o caminho do cronograma HTML baixado.");
const schedule = parseSchedule(await readFile(inputPath, "utf8"));
await writeFile(outputPath, `${JSON.stringify(schedule, null, 2)}\n`, "utf8");
const places = schedule.groups.reduce((sum, group) => sum + group.places.length, 0);
const routes = schedule.groups.reduce((sum, group) => sum + group.places.reduce((count, place) => count + place.routes.length, 0), 0);
console.log(`Cronograma atualizado: ${schedule.groups.length} grupos, ${places} locais, ${routes} rotas.`);
