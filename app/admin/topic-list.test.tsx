import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { readTopics, writeTopics, changeTopic, arrangeTopics } from "../service-topics";
import { TopicEditor } from "./topic-editor";
import { services } from "../service-catalog";
import { serviceEditValues } from "../direct-service-content";
import { serviceEditFields } from "../service-edit-fields";
import { editService, initialEditorSnapshot } from "../../lib/service-editor";
import { editorFieldGroups, type ServiceFieldOrder } from "./service-field-order";
import { privateServiceEditFields, serviceEditGroups } from "../service-edit-fields";

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

test("both arrangements expose the Carta fields and platform exactly once", () => {
  const allowed = serviceEditFields.map((field) => field.key).sort();
  for (const order of ["central", "bagov"] as const) for (const workbookSource of [true, false]) for (const mainLegislation of [true, false]) {
    const groups = editorFieldGroups(order, { workbookSource, mainLegislation });
    const keys = groups.flatMap((group) => group.blocks.flatMap((block) => block.fields));
    assert.equal(keys.length, 35);
    assert.equal(new Set(keys).size, 35);
    assert.deepEqual([...keys].sort(), allowed);
    for (const group of groups) assert.equal(new Set(group.blocks.map((block) => block.key)).size, group.blocks.length);
    if (order === "central") {
      assert.deepEqual(groups.find((group) => group.key === "central-controls")!.blocks.flatMap((block) => block.fields), privateServiceEditFields);
      assert.ok(groups.find((group) => group.key === "central-more")!.blocks[0].fields.includes("popularNames"));
      assert.ok(groups.find((group) => group.key === (workbookSource ? "central-more" : "central-channels"))!.blocks[0].fields.includes("address"));
      assert.ok(groups.find((group) => group.key === "central-channels")!.blocks[0].fields.includes("platform"));
      const paired = groups[0].blocks.find((block) => block.paired)!;
      assert.deepEqual(paired.fields, ["audience", "eligibility"]);
    }
  }
});

test("Central follows the page while BA.GOV keeps the Carta order with popular names immediately after the title", () => {
  const central = editorFieldGroups("central");
  assert.deepEqual(central.slice(0, 4).map((group) => group.key), ["central-main", "central-stages", "central-channels", "central-time-cost"]);
  assert.deepEqual(central[1].blocks[0].fields, ["requiredDocuments", "steps"]);
  const bagov = editorFieldGroups("bagov");
  assert.deepEqual(bagov.map((group) => group.label), [...serviceEditGroups]);
  assert.deepEqual(bagov[0].blocks[0].fields.slice(0, 2), ["title", "popularNames"]);
  assert.deepEqual(bagov[3].blocks.find((block) => block.key === "stage-1")!.fields, ["steps", "requiredDocuments"]);
  const contacts = bagov[2].blocks[0].fields;
  assert.equal(contacts.indexOf("platform"), contacts.indexOf("email") + 1);
});

test("changing arrangement preserves canonical text and topic models and does not produce publication changes", () => {
  const snapshot = initialEditorSnapshot();
  const service = snapshot.services.find((entry) => entry.slug === "parcelamento-de-debito-do-iptu")!;
  const values = serviceEditValues(service);
  const source = structuredClone(values);
  for (const order of ["central", "bagov", "central"] as ServiceFieldOrder[]) {
    const reordered = Object.fromEntries(editorFieldGroups(order).flatMap((group) => group.blocks.flatMap((block) => block.fields.map((key) => [key, values[key]]))));
    assert.deepEqual(reordered, source);
    assert.equal(editService(snapshot, service.id, reordered).report.changes.length, 0);
  }
  const model = changeTopic(readTopics("RG; CPF", "bulleted"), 0, "RG; frente e verso");
  const controlled = renderToStaticMarkup(<TopicEditor id="preserved-docs" label="Documentos necessários" name="Etapa 1 · Documentos necessários" value={writeTopics(model)} model={model} mode="bulleted" onChange={() => {}} />);
  assert.equal((controlled.match(/<textarea\b/g) || []).length, 2, "Moving between groups must not reparse an item being edited");
  assert.ok(controlled.includes("RG; frente e verso"));
});
