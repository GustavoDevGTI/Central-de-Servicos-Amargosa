let content;
let selectedPageId;
let selectedSegmentId;
let selectedItemId;
let dirty = false;
let editorMode = "content";
let project;
let previewAssets;
let previewRuntime;
let activeDevice = "desktop";
let previewZoomMode = "readable";
let previewDocumentHeight = 900;

const SITE_SELECTION_ID = "__site__";
const deviceViewports = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const segmentTypes = ["utility", "header", "hero", "audiences", "featured", "categories", "catalog", "internalHeader", "internalHero", "contextualSearch", "internalCatalog", "serviceHero", "serviceContent", "help", "footer", "amanda", "generic"];
const itemTypes = ["text", "link", "image", "search", "audience", "category", "service", "serviceRef"];
const typeLabels = { utility: "Barra utilitária", header: "Cabeçalho", hero: "Busca principal", audiences: "Públicos", featured: "Mais usados", categories: "Categorias", catalog: "Catálogo", internalHeader: "Cabeçalho interno", internalHero: "Introdução interna", contextualSearch: "Busca contextual", internalCatalog: "Lista interna de serviços", serviceHero: "Apresentação do serviço", serviceContent: "Conteúdo do serviço", help: "Ajuda", footer: "Rodapé", amanda: "Amanda — assistente virtual", generic: "Livre", text: "Texto", link: "Link / botão", image: "Imagem / logo", search: "Campo de busca", audience: "Público", category: "Categoria", service: "Serviço", serviceRef: "Serviço em destaque" };
const modelKeys = ["institutional", "editorial", "compact", "soft", "contrast"];
const siteThemePresets = {
  institutional: { label: "Institucional amplo", description: "Estrutura municipal clara, larga e equilibrada.", variant: "institutional", width: "wide", spacing: "comfortable", radius: "square" },
  editorial: { label: "Editorial humano", description: "Mais respiro, títulos expressivos e leitura guiada.", variant: "editorial", width: "contained", spacing: "airy", radius: "square" },
  compact: { label: "Serviço direto", description: "Maior densidade sem reduzir a legibilidade.", variant: "compact", width: "wide", spacing: "compact", radius: "square" },
  soft: { label: "Acolhedor", description: "Composição leve e cantos discretos.", variant: "soft", width: "contained", spacing: "comfortable", radius: "soft" },
  contrast: { label: "Cívico destacado", description: "Blocos fortes, faixas e hierarquia evidente.", variant: "contrast", width: "wide", spacing: "comfortable", radius: "square" },
};
const sitePalettePresets = {
  amargosa: { label: "Bandeira de Amargosa", primary: "#146b3a", accent: "#2f8a57", deep: "#0b4f2c", surface: "#ffffff", soft: "#eef5f0", ink: "#17352a", muted: "#5f746a" },
  harvest: { label: "Verde e ouro", primary: "#17634d", accent: "#d18b25", deep: "#0a3f34", surface: "#fbf8ef", soft: "#f2ead5", ink: "#243b32", muted: "#6d746b" },
  civic: { label: "Azul cívico", primary: "#174f73", accent: "#d1962d", deep: "#0b304b", surface: "#f7f9fa", soft: "#e8f0f5", ink: "#173344", muted: "#60727d" },
  earth: { label: "Terra e coral", primary: "#704b38", accent: "#c95f45", deep: "#3f2d25", surface: "#fbf7f2", soft: "#f2e7dc", ink: "#3e3029", muted: "#786c65" },
  graphite: { label: "Grafite e âmbar", primary: "#344b47", accent: "#d49a2d", deep: "#1d2d2a", surface: "#f7f7f5", soft: "#e9eeec", ink: "#263532", muted: "#697672" },
};
const segmentModels = {
  hero: ["Busca em degradê", "Busca geométrica", "Busca compacta", "Busca sobre imagem", "Busca sobre carrossel"],
  audiences: ["Cartões sobrepostos", "Diretório por público", "Perfis compactos", "Painel de públicos", "Faixas de público"],
  featured: ["Grade ranqueada", "Lista editorial", "Acesso rápido", "Mosaico de destaques", "Faixa de prioridades"],
  categories: ["Diretório em colunas", "Lista editorial", "Grade de atalhos", "Painel de categorias", "Blocos de assunto"],
  catalog: ["Catálogo institucional", "Lista editorial", "Lista compacta", "Cartões modulares", "Diretório destacado"],
  internalHeader: ["Cabeçalho de diretório", "Cabeçalho editorial", "Barra mínima", "Cabeçalho modular", "Cabeçalho cívico"],
  internalHero: ["Faixa institucional", "Abertura editorial", "Título compacto", "Painel sobreposto", "Faixa cívica"],
  contextualSearch: ["Busca sobreposta", "Busca em linha", "Busca compacta", "Painel de filtros", "Busca destacada"],
  internalCatalog: ["Cartões institucionais", "Lista editorial", "Diretório compacto", "Mosaico de serviços", "Lista cívica"],
  serviceHero: ["Serviço institucional", "Capa editorial", "Resumo compacto", "Painel informativo", "Capa cívica"],
  serviceContent: ["Guia institucional", "Leitura editorial", "Etapas compactas", "Blocos informativos", "Guia destacado"],
  header: ["Cabeçalho municipal", "Cabeçalho editorial", "Barra compacta", "Cabeçalho em camadas", "Cabeçalho de contraste"],
  utility: ["Faixa institucional", "Linha editorial", "Faixa compacta", "Faixa modular", "Faixa de contraste"],
  help: ["Ajuda institucional", "Ajuda editorial", "Ajuda compacta", "Painel de ajuda", "Chamada destacada"],
  footer: ["Rodapé municipal", "Rodapé editorial", "Rodapé compacto", "Rodapé modular", "Rodapé de contraste"],
  amanda: ["Amanda discreta", "Amanda editorial", "Amanda compacta", "Amanda em painel", "Amanda destacada"],
  generic: ["Bloco institucional", "Bloco editorial", "Bloco compacto", "Bloco modular", "Bloco de contraste"],
};

function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function page() { return content.pages.find((entry) => entry.id === selectedPageId) || content.pages[0]; }
function segment() { return page()?.segments.find((entry) => entry.id === selectedSegmentId); }
function item() { return segment()?.items.find((entry) => entry.id === selectedItemId); }
function catalogServices() { return content.pages.flatMap((entry) => entry.segments).filter((entry) => entry.type === "catalog").flatMap((entry) => entry.items).filter((entry) => entry.type === "service"); }
function audiences() { return content.pages.flatMap((entry) => entry.segments).filter((entry) => entry.type === "audiences").flatMap((entry) => entry.items).filter((entry) => entry.type === "audience"); }
function textByRole(entry, role, fallback = "") { return entry.items.find((entryItem) => entryItem.role === role)?.value || fallback; }
function move(array, index, direction) { const target = index + direction; if (index < 0 || target < 0 || target >= array.length) return false; [array[index], array[target]] = [array[target], array[index]]; return true; }

const stateTestApi = { SITE_SELECTION_ID, deviceViewports, escapeHtml, itemTypes, modelKeys, move, segmentModels, segmentTypes, sitePalettePresets, siteThemePresets, typeLabels, uid };
globalThis.CentralEditorState = stateTestApi;
if (typeof module !== "undefined" && module.exports) module.exports = stateTestApi;
