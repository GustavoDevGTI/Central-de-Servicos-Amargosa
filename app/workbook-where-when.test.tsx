import assert from "node:assert/strict";
import test from "node:test";
import { workbookWhereWhenParts, whereWhenColumn } from "./workbook-where-when";

const cells = { Telefone: "(75) 3512-7811", "E-mail do setor/unidade": "A preencher", Plataforma: "SEI", Ramal: "", [whereWhenColumn]: "" };
const presented = (source: string, overrides = {}) => {
  const row = { ...cells, ...overrides, [whereWhenColumn]: source };
  const parts = workbookWhereWhenParts(row);
  assert.equal(parts.map(part => source.slice(part.start, part.end)).join(""), source, "Source coverage must be complete");
  return {
    parts,
    intro: parts.filter(part => part.placement === "intro").map(part => source.slice(part.start, part.end)).join(""),
    hours: parts.filter(part => part.placement === "hours").map(part => source.slice(part.start, part.end)).join(""),
  };
};

test("repeated contacts and channel leave the intro; the original hours instruction moves to its card", () => {
  const source = "Canal: SEI. Telefone: (75) 3512-7811. E-mail: A preencher. Horário e atendimento presencial devem ser confirmados com a unidade responsável.";
  const result = presented(source);
  assert.equal(result.intro, "");
  assert.equal(result.hours, "Horário e atendimento presencial devem ser confirmados com a unidade responsável.");
  assert.deepEqual(result.parts.filter(part => part.placement === "duplicate").map(part => part.column), ["Plataforma", "Telefone", "E-mail do setor/unidade"]);
});

test("different contacts, spelling and missing structured fields stay visible", () => {
  for (const [source, overrides] of [
    ["Telefone: (75) 9999-0000.", {}],
    ["E-mail: A preencher.", { "E-mail do setor/unidade": "a preencher" }],
    ["Telefone: (75) 3512-7811.", { Telefone: "" }],
  ] as const) assert.equal(presented(source, overrides).intro, source);
});

test("unrecognized instructions after a contact are not discarded", () => {
  const source = "Telefone: (75) 3512-7811. Leve o CPF e compareça pessoalmente.";
  assert.equal(presented(source).intro, source);
});

test("opening hours move without rewriting; a separate request instruction stays in the intro", () => {
  const result = presented("Somente com agendamento. Horário de atendimento: Segunda a sexta, das 8h às 12h. Leve o protocolo.");
  assert.equal(result.hours, "Horário de atendimento: Segunda a sexta, das 8h às 12h.");
  assert.equal(result.intro, "Somente com agendamento.  Leve o protocolo.");
});

test("free text, whitespace and empty values remain unchanged", () => {
  for (const source of ["  Atendimento apenas mediante agendamento.\nLeve o protocolo.  ", "", "Canal, local e horário devem ser confirmados com a unidade."])
    assert.equal(presented(source).intro, source);
});

test("several contacts are removed only when their complete values match", () => {
  const result = presented("Telefone: (75) 3512-7811 / (75) 9999-0000. E-mail: A preencher.");
  assert.equal(result.intro, "Telefone: (75) 3512-7811 / (75) 9999-0000. ");
});

test("source offsets also preserve Unicode symbols before the contact fields", () => {
  const result = presented("🌿 Agende antes. Telefone: (75) 3512-7811. Horário: Das 8h às 12h.");
  assert.equal(result.intro, "🌿 Agende antes. ");
  assert.equal(result.hours, "Horário: Das 8h às 12h.");
});
