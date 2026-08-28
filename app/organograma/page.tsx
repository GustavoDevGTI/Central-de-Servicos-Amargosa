import type { Metadata } from "next";
import { PortalHeader } from "../internal-portal";
import PortalFooter from "../portal-footer";
import Organogram, { type OrganogramEntry } from "./organogram";

const sourceUrl = "https://servicos.amargosa.ba.gov.br/b.php?pg=o/organograma";

export const metadata: Metadata = {
  title: "Organograma | Central de Serviços de Amargosa",
  description: "Estrutura hierárquica dos setores e grupos de trabalho da Prefeitura Municipal de Amargosa.",
};

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}

function parseOrganogram(html: string): OrganogramEntry[] {
  const entries: OrganogramEntry[] = [];
  const rowPattern = /<li class="linha_organograma nivel_(\d+)"[^>]*id="linha_(\d+)"[^>]*>([\s\S]*?)<\/li>/g;

  for (const match of html.matchAll(rowPattern)) {
    const body = match[3];
    const label = body.match(/(?:&nbsp;\s*)?([^<>\r\n]+)<\/strong>\s*-\s*<abbr[^>]*>([\s\S]*?)<\/abbr>/);
    if (!label) continue;
    entries.push({
      id: match[2],
      level: Number(match[1]),
      code: decodeHtml(label[1]),
      name: decodeHtml(label[2]),
      isWorkgroup: body.includes("icon-group"),
    });
  }

  return entries;
}

async function loadOrganogram() {
  try {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`1Doc respondeu ${response.status}`);
    return parseOrganogram(await response.text());
  } catch {
    return [];
  }
}

export default async function OrganogramPage() {
  const entries = await loadOrganogram();
  return (
    <main className="site-root internal-site organogram-page">
      <a className="skip" href="#estrutura-organizacional">Ir para o organograma</a>
      <PortalHeader />
      <section className="organogram-intro">
        <span>ESTRUTURA ORGANIZACIONAL</span>
        <h1>Organograma da Prefeitura de Amargosa</h1>
        <p>Explore a hierarquia dos órgãos, setores, unidades e grupos de trabalho cadastrados no sistema 1Doc.</p>
      </section>
      <section id="estrutura-organizacional" className="organogram-content" aria-labelledby="organogram-title">
        <header>
          <div>
            <span>HIERARQUIA MUNICIPAL</span>
            <h2 id="organogram-title">Município de Amargosa</h2>
          </div>
          <div className="organogram-legend" aria-label="Legenda">
            <span><i aria-hidden="true" /> Setor ou unidade</span>
            <span><b aria-hidden="true">👥</b> Grupo de trabalho</span>
          </div>
        </header>
        {entries.length ? (
          <Organogram entries={entries} />
        ) : (
          <div className="organogram-unavailable" role="status">
            <strong>Não foi possível carregar o organograma agora.</strong>
            <p>Consulte temporariamente a <a href={sourceUrl}>estrutura publicada no 1Doc</a>.</p>
          </div>
        )}
        <p className="organogram-source">Fonte: <a href={sourceUrl}>Organograma do Município de Amargosa no 1Doc</a>. Os dados são apresentados de acordo com os níveis hierárquicos publicados na plataforma.</p>
      </section>
      <PortalFooter />
    </main>
  );
}
