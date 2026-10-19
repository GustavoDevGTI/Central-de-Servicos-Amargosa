import { MAX_WORKBOOK_BYTES } from "./catalog-import";
import { OFFICIAL_CATALOG_LINK } from "./catalog-source-url";

const MAX_REDIRECTS = 3;
const DOWNLOAD_TIMEOUT_MS = 30_000;

function officialUrl(input: string): URL {
  const allowed = new URL(process.env.CATALOG_SHAREPOINT_URL || OFFICIAL_CATALOG_LINK);
  let submitted: URL;
  try { submitted = new URL(input.trim()); } catch { throw new Error("Informe um link válido do SharePoint."); }
  if (submitted.protocol !== "https:" || submitted.origin !== allowed.origin || submitted.pathname !== allowed.pathname ||
      submitted.username || submitted.password) {
    throw new Error("Use o link da planilha oficial do SharePoint.");
  }
  submitted.search = "?download=1";
  submitted.hash = "";
  return submitted;
}

async function readLimited(response: Response): Promise<Buffer> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_WORKBOOK_BYTES) throw new Error("A planilha excede 10 MB.");
  if (!response.body) throw new Error("O SharePoint não enviou o arquivo.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_WORKBOOK_BYTES) throw new Error("A planilha excede 10 MB.");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, length);
}

export async function downloadOfficialCatalog(input: string): Promise<Buffer> {
  let url = officialUrl(input);
  const cookies = new Map<string, string>();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      const cookie = [...cookies.values()].join("; ");
      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: cookie ? { Cookie: cookie } : undefined,
        cache: "no-store",
      });
      for (const entry of response.headers.getSetCookie()) {
        const pair = entry.split(";", 1)[0];
        const name = pair.split("=", 1)[0];
        if (name) cookies.set(name, pair);
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("O SharePoint não indicou o arquivo para download.");
        const next = new URL(location, url);
        if (next.protocol !== "https:" || next.origin !== url.origin || next.username || next.password) {
          throw new Error("O SharePoint redirecionou para um destino inesperado.");
        }
        url = next;
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) throw new Error(`Não foi possível baixar a planilha do SharePoint (HTTP ${response.status}).`);
      const bytes = await readLimited(response);
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        throw new Error("O link não retornou um arquivo XLSX. Confira o acesso à planilha.");
      }
      return bytes;
    }
    throw new Error("O SharePoint redirecionou a solicitação muitas vezes.");
  } catch (error) {
    if (controller.signal.aborted) throw new Error("O download da planilha excedeu 30 segundos.");
    throw error;
  } finally { clearTimeout(timeout); }
}
