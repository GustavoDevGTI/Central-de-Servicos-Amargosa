import type { Service } from "./service-catalog";
import { PENDING_SERVICE_INFORMATION } from "./pending-information";
import { serviceRequestSteps } from "./service-request-steps";

const specificCopy = new Map<string, string>([
  [
    "O pedido de acesso à informação é registrado e acompanhado no e-SIC oficial da Prefeitura de Amargosa.",
    "O pedido de acesso à informação é registrado e pode ser acompanhado pelo número de protocolo.",
  ],
  ["Acesse o e-SIC pelo botão “Solicitar serviço”.", "Use o botão INICIAR desta página para registrar o pedido."],
  ["e-SIC da Prefeitura de Amargosa.", "Disponível pelo botão de solicitação desta página."],
  [
    "É possível obter o contracheque com toda segurança pelo sítio:\nBaixe também o aplicativo para ter acesso ao seu contrachque: https://www.webcontracheque.com.br/app_Login/\nIOS: https://apps.apple.com/br/app/web-contracheque/id1459679336\nAndroid: https://play.google.com/store/apps/details?id=com.webcontracheque",
    "Consulte e obtenha seu contracheque pela internet com segurança.",
  ],
  [
    "Consulta online aos dados cadastrais do CadÚnico e à situação do Programa Bolsa Família no portal oficial do Governo Federal.",
    "Consulta pela internet aos dados cadastrais do CadÚnico e à situação do Programa Bolsa Família.",
  ],
  [
    "Online, pelo Portal CadÚnico – Governo Federal. Para atendimento presencial, consulte a SADS pelos canais abaixo.",
    "Pela internet, use o botão desta página. Para atendimento presencial, consulte a SADS pelos canais abaixo.",
  ],
  [
    "Online, pelo Portal Carteira da Pessoa Idosa. Para atendimento presencial, consulte a SADS pelos canais abaixo.",
    "Pela internet, use o botão desta página. Para atendimento presencial, consulte a SADS pelos canais abaixo.",
  ],
  ["Acesse o portal indicado nesta página.", "Use o botão de atendimento digital desta página."],
  [
    "Solicitação formal de parcelamento, presencial ou via sistema digital.",
    "Solicitação formal de parcelamento, presencialmente ou pela internet.",
  ],
  [
    "Para acesso online: CPF do responsável e senha de acesso ao portal do aluno/educação do município.",
    "Para solicitar pela internet: CPF do responsável e senha de acesso.",
  ],
  [
    "Preencher o formulário de solicitação na unidade escolar ou via portal da Secretaria de Educação (quando disponível).",
    "Preencher o formulário de solicitação na unidade escolar ou pela internet, quando disponível.",
  ],
  [
    "Para consultar o boletim on-line, acessar o site ou aplicativo da Secretaria de Educação com as credenciais fornecidas pela escola.",
    "Para consultar o boletim pela internet, use as credenciais fornecidas pela escola.",
  ],
  [
    "Sem acesso on-line, solicitar uma via impressa na secretaria da unidade escolar em que o aluno está matriculado.",
    "Sem acesso pela internet, solicite uma via impressa na secretaria da escola em que o aluno está matriculado.",
  ],
  [
    "Para o histórico escolar, preencher o formulário na unidade escolar ou pelo portal da Secretaria de Educação, quando disponível.",
    "Para solicitar o histórico escolar, preencha o formulário na unidade escolar ou pela internet, quando disponível.",
  ],
  [
    "Prazo médio de até 5 dias úteis, conforme a etapa publicada no BA.GOV.BR.",
    "Prazo médio de até 5 dias úteis, conforme a etapa do serviço.",
  ],
  [
    "Pessoa com 60 anos ou mais, como condutora ou passageira, ou seu representante legal. A emissão digital federal exige que a pessoa esteja elegível no cadastro da Senatran.",
    "Pessoa com 60 anos ou mais, como condutora ou passageira, ou seu representante legal. A emissão digital federal exige elegibilidade no cadastro federal.",
  ],
  [
    "A Prefeitura de Amargosa informa atendimento presencial na SEMOP/SUPET. Pessoas elegíveis também podem consultar a emissão digital no aplicativo Carteira Digital de Trânsito ou no Portal de Serviços da Senatran.",
    "A Prefeitura de Amargosa informa atendimento presencial na SEMOP/SUPET. Pessoas elegíveis também podem consultar a emissão digital pelo botão desta página.",
  ],
  [
    "Solicite a credencial pelo atendimento municipal da SEMOP/SUPET ou verifique a emissão digital no Portal de Serviços da Senatran.",
    "Solicite a credencial pelo atendimento municipal da SEMOP/SUPET ou pelo botão de atendimento digital desta página.",
  ],
  [
    "Em Amargosa, o atendimento municipal de trânsito é realizado pela SEMOP/SUPET. A Prefeitura informa atendimento presencial e disponibiliza a Portal de Serviços de Amargosa; antes de comparecer, confirme endereço e horário pelo telefone geral do Município.",
    "Em Amargosa, o atendimento municipal de trânsito é realizado pela SEMOP/SUPET. Há atendimento presencial e digital; antes de comparecer, confirme endereço e horário pelo telefone geral do Município.",
  ],
  [
    "O pedido pode ser iniciado pela Portal de Serviços de Amargosa. Para orientação presencial ou confirmação do setor, contate a Prefeitura pelo telefone (75) 3512-7811, de segunda a sexta-feira.",
    "O pedido pode ser iniciado pela internet. Para orientação presencial ou confirmação do setor, contate a Prefeitura pelo telefone (75) 3512-7811, de segunda a sexta-feira.",
  ],
  [
    "O cidadão deve comparecer ao SAC Municipal ou acessar o protocolo digital para formalizar o pedido de construção ou reforma, apresentando toda a documentação necessária.",
    "O cidadão deve comparecer ao SAC Municipal ou fazer o pedido pela internet, apresentando toda a documentação necessária.",
  ],
]);

function neutralCopy(value: string): string {
  if (/^\s*n[aã]o se aplica(?:\s*\(R\$\s*0,00\))?\s*\.?\s*$/i.test(value)) {
    return PENDING_SERVICE_INFORMATION;
  }
  const specific = specificCopy.get(value);
  if (specific) return specific;

  return value
    .replace(/\bsistema REGIN da REDESIM\b/gi, "cadastro empresarial")
    .replace(/\*Acessar o site:\s*https?:\/\/www\.juceb\.ba\.gov\.br\/?/gi, "")
    .replace(/; em Amargosa, consulte a SEMOP\/SUPET e a Portal de Serviços de Amargosa\./gi, "; em Amargosa, consulte a SEMOP/SUPET ou use o botão de atendimento digital desta página.")
    .replace(/\b(?:via|pelo|no) portal da Secretaria da Fazenda\b/gi, "pela internet")
    .replace(/\b(?:via|pelo|no) portal digital(?: da prefeitura)?\b/gi, "pela internet")
    .replace(/\bPortal de Serviços da Senatran\b/gi, "serviço digital federal")
    .replace(/\bCarteira Digital de Trânsito\b/gi, "serviço digital federal")
    .replace(/\b(?:pel[ao]|na|no|ao|a) Portal de Serviços de Amargosa\b/gi, "pela internet")
    .replace(/\bPortal de Serviços de Amargosa\b/gi, "atendimento digital")
    .replace(/\b(?:pelo|no) portal de serviços online(?: do município)?\b/gi, "pela internet")
    .replace(/\bportal de serviços online(?: do município)?\b/gi, "atendimento pela internet")
    .replace(/(?<![\w./-])BA\.?GOV(?:\.BR)?\b/gi, "canal digital")
    .replace(/\be-SIC\b/gi, "atendimento digital")
    .replace(/\bSenatran\b/gi, "órgão federal")
    .replace(/\bvia protocolo digital\b/gi, "pela internet")
    .replace(/\b(?:pelo e-mail|por e-mail), protocolo digital ou presencialmente\b/gi, "por e-mail, pela internet ou presencialmente")
    .replace(/\bacessar o protocolo digital\b/gi, "iniciar o pedido pela internet")
    .replace(/\bprotocolo digital\b/gi, "atendimento digital")
    .replace(/\b(?:Central de Atendimento|Central|Portal de Protocolos) 1Doc\b/gi, "atendimento digital")
    .replace(/\b1Doc\b/gi, "atendimento digital");
}

/** Mantém os destinos e os dados originais; altera apenas a cópia mostrada na ficha. */
export function servicePageCopy(service: Service): Service {
  const copy = (value?: string) => value === undefined ? undefined : neutralCopy(value);
  return {
    ...service,
    summary: copy(service.summary),
    eligibility: copy(service.eligibility),
    documents: service.documents?.map(neutralCopy),
    steps: (serviceRequestSteps[service.slug || service.id] || service.steps)?.map(neutralCopy),
    whereWhen: copy(service.whereWhen),
    whereWhenItems: service.whereWhenItems?.map((item) => ({
      ...item,
      label: neutralCopy(item.label),
      schedule: copy(item.schedule),
      description: neutralCopy(item.description),
    })),
    cost: copy(service.cost),
    duration: copy(service.duration),
    notice: copy(service.notice),
  };
}
