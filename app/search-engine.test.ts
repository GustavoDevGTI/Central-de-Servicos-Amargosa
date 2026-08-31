import assert from "node:assert/strict";
import test from "node:test";
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
  { id: "lai", title: "Acesso à Informação", category: "Cidadania", department: "CGM", audienceIds: ["cidadao", "empresa"], summary: "Acompanhe a resposta pelo número de protocolo." },
  { id: "licenca", title: "Solicitação de Licença Ambiental", category: "Meio Ambiente", department: "SEAMA", audienceIds: ["empresa"] },
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
