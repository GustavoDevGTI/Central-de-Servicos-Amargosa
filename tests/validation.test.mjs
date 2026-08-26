import assert from "node:assert/strict";
import test from "node:test";
import validation from "../desktop/services/validation.cjs";

const valid = { schemaVersion: 3, pages: [{ id: "home", name: "Início", slug: "/", segments: [{ id: "cabecalho", name: "Cabeçalho", type: "header", enabled: true, style: {}, items: [] }] }] };

test("aceita a estrutura mínima atual", () => {
  assert.deepEqual(validation.validateContent(valid), []);
});

test("aceita rotas internas nos links do portal", () => {
  const content = structuredClone(valid);
  content.pages[0].segments.push({ id: "header-interno", name: "Cabeçalho interno", type: "internalHeader", enabled: true, style: {}, items: [
    { id: "inicio", type: "link", label: "Início", text: "Início", url: "/" },
    { id: "menu", type: "link", label: "Menu", text: "Menu", url: "/menu" },
    { id: "relativo", type: "link", label: "Relativo", text: "Relativo", url: "./?servico=iptu" },
  ] });
  assert.deepEqual(validation.validateContent(content), []);
});

test("detecta endereço repetido e tamanho inválido", () => {
  const content = structuredClone(valid);
  content.pages[0].segments[0].size = { width: 10, height: 12 };
  content.pages.push({ ...structuredClone(content.pages[0]), id: "outra", name: "Outra" });
  const errors = validation.validateContent(content);
  assert.ok(errors.some((message) => message.includes("endereço está repetido")));
  assert.ok(errors.some((message) => message.includes("tamanho personalizado é inválido")));
});

test("valida a galeria de imagens do carrossel da busca", () => {
  const content = structuredClone(valid);
  content.pages[0].segments[0].style.backgroundImages = Array.from({ length: 7 }, () => "data:image/png;base64,AA==");
  let errors = validation.validateContent(content);
  assert.ok(errors.some((message) => message.includes("no máximo 6 imagens")));
  content.pages[0].segments[0].style.backgroundImages = ["arquivo-invalido.jpg"];
  errors = validation.validateContent(content);
  assert.ok(errors.some((message) => message.includes("arquivo é inválido")));
});

test("valida tema global e interações por segmento", () => {
  const content = structuredClone(valid);
  content.site = { design: { theme: "institutional", palette: "amargosa", headingFont: "lora", bodyFont: "source", fontSize: "large" } };
  assert.deepEqual(validation.validateContent(content), []);
  content.site.design.theme = "modelo-inexistente";
  assert.ok(validation.validateContent(content).some((message) => message.includes("Site completo")));
  content.site.design.theme = "institutional";
  content.pages[0].segments[0].style.hoverEffect = "efeito-inexistente";
  assert.ok(validation.validateContent(content).some((message) => message.includes(content.pages[0].segments[0].name)));
});
