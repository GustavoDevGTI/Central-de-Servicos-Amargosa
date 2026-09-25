import assert from "node:assert/strict";
import test from "node:test";
import { serviceWhereWhen } from "./service-where-when.ts";

const contact = {
  name: "Setor responsável",
  address: "Rua da Prefeitura, 1",
  phone: "(75) 3512-7811",
};

test("specific service link and in-person instructions show both request options", () => {
  const result = serviceWhereWhen({
    accessMode: "digital",
    url: "https://acesso.amargosa.ba.gov.br/cadastro-alteracao",
    whereWhen: "Atendimento presencial: SAC MUNICIPAL. Telefone: (75) 3512-7811. Endereço: Av. Dr. Luis Sandes, 120 Valle Shopping. Horário de atendimento: * Informação a ser adicionada.",
  }, contact);

  assert.equal(result.digital, true);
  assert.equal(result.presencial, true);
  assert.equal(result.local, "SAC MUNICIPAL");
  assert.equal(result.address, "Av. Dr. Luis Sandes, 120 Valle Shopping");
  assert.equal(result.hours, "Segunda a sexta-feira, das 8h às 17h");
  assert.equal(result.hoursSourceUrl, "https://amargosa.ba.gov.br/secretarias&secretaria=desenvolvimento-institucional");
});

test("generic protocol link follows the spreadsheet's digital classification", () => {
  const result = serviceWhereWhen({
    accessMode: "digital",
    url: "https://acesso.amargosa.ba.gov.br/protocolodigital",
    whereWhen: "Atendimento presencial: SAC MUNICIPAL. Endereço: Av. Dr. Luis Sandes, 120 Valle Shopping.",
  }, contact);

  assert.equal(result.digital, true);
  assert.equal(result.presencial, false);
});

test("in-person service without a link shows the responsible office address", () => {
  const result = serviceWhereWhen({
    accessMode: "presencial",
    url: "",
    whereWhen: "Atendimento presencial. Consulte o endereço do órgão responsável nos canais abaixo.",
  }, contact);

  assert.equal(result.digital, false);
  assert.equal(result.presencial, true);
  assert.equal(result.local, contact.name);
  assert.equal(result.address, contact.address);
  assert.match(result.hours, /Confirme o horário/);
  assert.equal(result.hoursSourceUrl, undefined);
});
