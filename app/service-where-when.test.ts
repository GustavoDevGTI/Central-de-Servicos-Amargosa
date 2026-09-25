import assert from "node:assert/strict";
import test from "node:test";
import { sameInPersonServiceOffice, serviceWhereWhen } from "./service-where-when.ts";

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
  assert.equal(result.hours, "Horário do SAC Municipal não informado. Confirme por telefone antes de comparecer.");
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

test("dual-channel service keeps its own in-person office and schedule", () => {
  const result = serviceWhereWhen({
    accessMode: "a-confirmar",
    url: "https://amargosa.1doc.com.br/",
    whereWhen: "O pedido pode ser registrado online ou presencialmente.",
    whereWhenItems: [
      { label: "Online", schedule: "A qualquer momento", description: "e-SIC." },
      { label: "Presencial", schedule: "De segunda a sexta-feira, das 8h às 12h e das 14h às 17h", description: "Ouvidoria Municipal — Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA." },
    ],
  }, { ...contact, email: "ouvidoria@amargosa.ba.gov.br" });

  assert.equal(result.digital, true);
  assert.equal(result.presencial, true);
  assert.equal(result.local, "Ouvidoria Municipal");
  assert.equal(result.address, "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA");
  assert.equal(result.hours, "De segunda a sexta-feira, das 8h às 12h e das 14h às 17h");
  assert.deepEqual(result.emails, ["ouvidoria@amargosa.ba.gov.br"]);
});

test("BA.gov channel does not become part of the contact email", () => {
  const result = serviceWhereWhen({
    accessMode: "digital",
    url: "https://servicos.ba.gov.br/detalhe/servico/10092",
    whereWhen: "Atendimento presencial: SAC MUNICIPAL. E-mail: sacdigital@amargosa.ba.gov.br. Canal on-line: Ba.gov — https://www.ba.gov.br/. Endereço: Av. Dr. Luis Sandes, 120 Valle Shopping.",
  }, contact);

  assert.deepEqual(result.emails, ["sacdigital@amargosa.ba.gov.br"]);
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
});

test("the same in-person office includes aliases and sectors within its secretariat", () => {
  assert.equal(sameInPersonServiceOffice("Ouvidoria Municipal", "Ouvidoria Municipal — CGM"), true);
  assert.equal(sameInPersonServiceOffice("SAC MUNICIPAL", "SAC - SAC Municipal"), true);
  assert.equal(sameInPersonServiceOffice("Secretaria Municipal de Saúde (SESAU)", "SESAU-DIVISA - Diretoria de Vigilância Sanitária e Ambiental"), true);
  assert.equal(sameInPersonServiceOffice("SADS - CRAS", "SADS - CRAS"), true);
});

test("a separate service office keeps its own contact section", () => {
  assert.equal(sameInPersonServiceOffice("SAC MUNICIPAL", "SEAFI-SUCAI - Supervisão de Cadastro Imobiliário"), false);
  assert.equal(sameInPersonServiceOffice("SADS - CRAS", "SADS - CREAS"), false);
  assert.equal(sameInPersonServiceOffice("Secretaria Municipal de Serviços Públicos, Obras e Planejamento da Cidade (SEMOP)", "DOP - Diretoria de Ordem Pública"), false);
});
