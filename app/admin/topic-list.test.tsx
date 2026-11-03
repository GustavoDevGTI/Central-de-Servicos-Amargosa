import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { readTopics, writeTopics, changeTopic, arrangeTopics } from "./topic-list";
import { TopicEditor } from "./topic-editor";
import { services } from "../service-catalog";
import { serviceEditValues } from "../direct-service-content";
import { serviceEditFields } from "../service-edit-fields";
import { editService, initialEditorSnapshot } from "../../lib/service-editor";

test("opening every existing topic field preserves every character and creates no publication changes", () => {
  const fields = serviceEditFields.filter((field) => "list" in field);
  for (const service of services) {
    const values = serviceEditValues(service);
    for (const field of fields) {
      if (!("list" in field)) continue;
      assert.equal(writeTopics(readTopics(values[field.key], field.list)), values[field.key], `${service.id}: ${field.key}`);
    }
  }
  const snapshot = initialEditorSnapshot();
  const service = snapshot.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const values = serviceEditValues(service);
  const patch = Object.fromEntries(fields.map((field) => [field.key, writeTopics(readTopics(values[field.key], "list" in field ? field.list : "bulleted"))]));
  assert.equal(editService(snapshot, service.id, patch).report.changes.length, 0);
});

test("document and numbered-step items are separate and editing one preserves the others and their delimiters", () => {
  const documents = readTopics("  RG; CPF; comprovante de endereço\r\nProcuração (caso seja procurador)  ", "bulleted");
  assert.deepEqual(documents.items, ["  RG", "CPF", "comprovante de endereço", "Procuração (caso seja procurador)  "]);
  assert.equal(writeTopics(changeTopic(documents, 1, "CPF ou CNPJ")), "  RG; CPF ou CNPJ; comprovante de endereço\r\nProcuração (caso seja procurador)  ");
  assert.deepEqual(readTopics("RG;\r\nCPF", "bulleted").items, ["RG", "CPF"]);
  const steps = readTopics("  1. Consulte os documentos. 2. Acesse o sistema.\r\n3) Guarde o protocolo!  ", "numbered");
  assert.deepEqual(steps.items, ["Consulte os documentos.", "Acesse o sistema.", "Guarde o protocolo!  "]);
  assert.equal(writeTopics(changeTopic(steps, 1, "Acesse o portal.")), "  1. Consulte os documentos. 2. Acesse o portal.\r\n3) Guarde o protocolo!  ");
  for (const text of ["", "\n", "A preencher", "Texto livre.\nSegunda linha.", "RG;\r\nCPF;", "1. Valor 12.50 não é numeração. 2. Continue."]) {
    for (const mode of ["numbered", "bulleted"] as const) assert.equal(writeTopics(readTopics(text, mode)), text);
  }
});

test("explicit additions, removals and moves retain item text and maintain step order", () => {
  const steps = readTopics("1. Primeiro. 2. Segundo.\n3. Terceiro.", "numbered");
  assert.equal(writeTopics(arrangeTopics(steps, "up", 1)), "1. Segundo. 2. Primeiro.\n3. Terceiro.");
  assert.equal(writeTopics(arrangeTopics(steps, "remove", 1)), "1. Primeiro.\n2. Terceiro.");
  const added = changeTopic(arrangeTopics(steps, "add"), 3, "Quarto.");
  assert.equal(writeTopics(added), "1. Primeiro. 2. Segundo.\n3. Terceiro.\n4. Quarto.");
  const documents = readTopics("RG; CPF\nComprovante", "bulleted");
  assert.equal(writeTopics(arrangeTopics(documents, "remove", 0)), "CPF\nComprovante");
  assert.equal(writeTopics(arrangeTopics(readTopics("RG", "bulleted"), "remove", 0)), "");
  assert.deepEqual(arrangeTopics(steps, "up", 0), steps);
  const newSteps = changeTopic(arrangeTopics(changeTopic(readTopics("", "numbered"), 0, "Solicite."), "add"), 1, "Acompanhe.");
  assert.equal(writeTopics(newSteps), "1. Solicite.\n2. Acompanhe.");
});

test("admin topic controls expose separate accessible items and ordering actions", () => {
  const html = renderToStaticMarkup(<TopicEditor id="docs" label="Documentos necessários" name="Etapa 1 · Documentos necessários" value={"RG; CPF\nProcuração"} mode="bulleted" onChange={() => {}} />);
  assert.equal((html.match(/<textarea\b/g) || []).length, 3);
  assert.match(html, /<ul>/);
  assert.match(html, /aria-label="Etapa 1 · Documentos necessários · Item 2"/);
  assert.match(html, /Mover item 2 para cima/);
  assert.match(html, /Adicionar item/);
  assert.match(html, /Remover item 3/);
});
