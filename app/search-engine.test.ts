import assert from "node:assert/strict";
import test from "node:test";
import { searchPath, searchTermFromSlug } from "./search-url.ts";
import siteContent from "../content/site.json" with { type: "json" };
import { analyzeSearchQuery, rankSearchSuggestions, searchServices, type SearchableService } from "./search-engine.ts";
import { serviceSearchTags } from "./service-search-tags.ts";

const audiences = [
  { id: "cidadao", label: "Cidadãos" },
  { id: "empresa", label: "Empresas" },
];
const categories = [
  { id: "cat-tributos", label: "Tributos" },
  { id: "cat-meio-ambiente", label: "Meio Ambiente" },
];
const services: SearchableService[] = [
  { id: "luz", title: "Troca de lâmpadas", category: "Serviços Urbanos", department: "SEMOP", audienceIds: ["cidadao"] },
  { id: "alvara", title: "Alvará de funcionamento", category: "Tributos", department: "SEAFI", audienceIds: ["empresa"] },
  { id: "lai", title: "Acesso à Informação — LAI", category: "Cidadania", department: "CGM", audienceIds: ["cidadao", "empresa"], summary: "Acompanhe a resposta pelo número de protocolo." },
  { id: "licenca", title: "Solicitação de Licença Ambiental", category: "Meio Ambiente", department: "SEAMA", audienceIds: ["empresa"] },
  { id: "iptu", title: "Revisão de cálculo de IPTU", category: "Tributos", department: "SEAFI", audienceIds: ["cidadao"] },
  { id: "nfs", title: "Cancelamento de NFS-e", category: "Tributos", department: "SEAFI", audienceIds: ["empresa"] },
  { id: "jari", title: "Recurso de infração — JARI", category: "Trânsito", department: "SEMOP", audienceIds: ["cidadao"] },
  { id: "pcd", title: "Credencial de estacionamento para PCD", category: "Trânsito", department: "SEMOP", audienceIds: ["cidadao"] },
];

test("normaliza erro de português e usa sinônimos", () => {
  assert.equal(searchServices(services, "iluminasao", audiences, categories)[0]?.service.id, "luz");
});

test("reconhece público dentro da consulta", () => {
  const analysis = analyzeSearchQuery("alvará para empresa", audiences, categories);
  assert.deepEqual(analysis.audienceIds, ["empresa"]);
  assert.equal(searchServices(services, "alvará para empresa", audiences, categories)[0]?.service.id, "alvara");
});

test("reconhece categoria dentro da consulta", () => {
  const results = searchServices(services, "meio ambiente", audiences, categories);
  assert.deepEqual(results.map((entry) => entry.service.id), ["licenca"]);
});

test("pesquisa o conteúdo explicativo", () => {
  const result = searchServices(services, "numero de protocolo", audiences, categories)[0];
  assert.equal(result?.service.id, "lai");
  assert.equal(result?.matchedField, "descrição");
});

test("gera tags invisíveis para todos os serviços do catálogo", () => {
  const catalog = siteContent.pages[0].segments.find((segment) => segment.type === "catalog");
  const catalogServices = catalog?.items.filter((item) => item.type === "service") || [];
  assert.ok(catalogServices.length > 0);
  assert.ok(catalogServices.every((service) => serviceSearchTags(service).length >= 3));
});

test("combina semelhança e popularidade nas sugestões", () => {
  const ranked = rankSearchSuggestions(services, "luz poste", audiences, categories, { luz: 64, alvara: 1000 });
  assert.equal(ranked[0]?.service.id, "luz");
  assert.equal(ranked.length <= 7, true);
});

test("corrige trocas controladas em siglas de serviços", () => {
  const cases = [
    ["iupt", "iptu"],
    ["iput", "iptu"],
    ["itpu", "iptu"],
    ["nsf", "nfs"],
    ["jrai", "jari"],
    ["pdc", "pcd"],
    ["ial", "lai"],
  ];

  for (const [query, expectedId] of cases) {
    assert.equal(
      searchServices(services, query, audiences, categories)[0]?.service.id,
      expectedId,
      `esperava que ${query} localizasse ${expectedId}`,
    );
  }
});

test("normaliza o conjunto controlado de siglas do catálogo", () => {
  const corrections = {
    iptu: ["iupt", "iput", "itpu"],
    iss: ["sis", "ssi"],
    issqn: ["isqn", "isqsn", "isnq", "issnq"],
    itbi: ["ibti", "itib"],
    itiv: ["iitv", "itvi", "ivti"],
    itv: ["ivt"],
    tff: ["fft", "ftf"],
    tll: ["llt", "ltl"],
    nfs: ["nfse", "nsf"],
    lai: ["ail", "ial"],
    pcd: ["pdc"],
    jari: ["jrai", "jria"],
    cetran: ["certan", "cetarn", "cetrna"],
  };

  for (const [canonical, variants] of Object.entries(corrections)) {
    for (const variant of variants) {
      assert.deepEqual(
        analyzeSearchQuery(variant, audiences, categories).terms,
        [canonical],
        `esperava que ${variant} fosse normalizado como ${canonical}`,
      );
    }
  }
});

test("não trata qualquer anagrama como correção válida", () => {
  assert.equal(searchServices(services, "pitu", audiences, categories).length, 0);
});

test("gera endereços de busca legíveis e recupera seus termos", () => {
  assert.equal(
    searchPath("Serviços de Manutenção Pública"),
    "/servicos/busca/servicos-de-manutencao-publica",
  );
  assert.equal(
    searchTermFromSlug("servicos-de-manutencao-publica"),
    "servicos de manutencao publica",
  );
});
