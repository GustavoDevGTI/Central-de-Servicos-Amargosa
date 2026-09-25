import spreadsheetServiceData from "./spreadsheet-service-data.json" with { type: "json" };

type OfficeKey =
  | "prefeitura"
  | "seafi"
  | "semop"
  | "semed"
  | "sesau"
  | "seama"
  | "secac"
  | "sads"
  | "cgm"
  | "ouvidoria"
  | "pjm"
  | "sac";

export type ServiceContact = {
  name: string;
  officeName?: string;
  phone: string;
  extensionLabel?: string;
  address: string;
  email?: string;
  emailLabel?: string;
  officialUrl: string;
};

type SpreadsheetContact = {
  sourceRow: number;
  secretariat: string;
  sector: string;
  phone?: string;
  extension?: string;
  email?: string;
};

const spreadsheetContacts = spreadsheetServiceData.contacts as Record<string, SpreadsheetContact>;

// Contatos publicados nas páginas institucionais da Prefeitura de Amargosa.
const offices: Record<OfficeKey, ServiceContact> = {
  prefeitura: {
    name: "Prefeitura Municipal de Amargosa",
    phone: "(75) 3512-7811",
    address: "Praça Lourival Monte, nº 001, Centro, Amargosa – BA, CEP 45300-000",
    email: "contato@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/contato",
  },
  seafi: {
    name: "SEAFI — Administração, Finanças e Desenvolvimento Institucional",
    phone: "(75) 3512-7811, ramal 4127",
    address: "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA, CEP 45300-000",
    email: "seafi@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=desenvolvimento-institucional",
  },
  semop: {
    name: "SEMOP — Serviços Públicos, Obras e Planejamento da Cidade",
    phone: "(75) 3512-7811, ramal 4183",
    address: "Praça José Viana Sampaio, 1-117, Amargosa – BA, CEP 45300-000",
    email: "semop@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=obras-planejamento",
  },
  semed: {
    name: "SEMED — Secretaria Municipal de Educação",
    phone: "(75) 3512-7811, ramal 4001",
    address: "Praça José Viana Sampaio, 1-117, Amargosa – BA, CEP 45300-000",
    email: "semed.gab@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=secretaria-de-educacao",
  },
  sesau: {
    name: "SESAU — Secretaria Municipal de Saúde",
    phone: "(75) 3512-7811, ramal 4228",
    address: "Avenida Dr. Aloísio Borges, nº 335, Santa Rita, Amargosa – BA, CEP 45300-000",
    email: "sesau@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=secretaria-de-saude",
  },
  seama: {
    name: "SEAMA — Agricultura e Meio Ambiente",
    phone: "(75) 3512-7811, ramal 4176",
    address: "Avenida ACM, nº 223, Centro, Amargosa – BA, CEP 45300-000",
    email: "seama@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=agricultura-meioambiente",
  },
  secac: {
    name: "SECAC — Secretaria Municipal da Casa Civil",
    phone: "(75) 3512-7811",
    address: "Praça Lourival Monte, nº 001, Centro, Amargosa – BA, CEP 45300-000",
    email: "secac@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=casa-civil",
  },
  sads: {
    name: "SADS — Assistência e Desenvolvimento Social",
    phone: "(75) 3512-7811, ramal 4243",
    address: "Rua Deraldo Bulhões de Souza, nº 381, Centro, Amargosa – BA, CEP 45300-000",
    email: "sads@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=secretaria-de-assistencia-social",
  },
  cgm: {
    name: "CGM — Controladoria Geral do Município",
    phone: "(75) 3512-7811, ramal 4132",
    address: "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA, CEP 45300-000",
    email: "cgm@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=cgm",
  },
  ouvidoria: {
    name: "Ouvidoria Municipal — CGM",
    phone: "(75) 3512-7811, ramal 4141",
    address: "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA, CEP 45300-000",
    email: "cgm.ouvim@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/ouvidoria",
  },
  pjm: {
    name: "PJM — Procuradoria Jurídica do Município",
    phone: "(75) 3512-7811, ramal 4133",
    address: "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa – BA, CEP 45300-000",
    email: "pjm@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=pjm",
  },
  sac: {
    name: "SAC Municipal — SEAFI",
    phone: "(75) 3512-7811",
    address: "Avenida Dr. Luís Sandes, 120, Valle Shopping, Amargosa – BA",
    email: "sacdigital@amargosa.ba.gov.br",
    officialUrl: "https://amargosa.ba.gov.br/secretarias&secretaria=desenvolvimento-institucional",
  },
};

const organizationFilterLabels: Record<OfficeKey, string> = {
  prefeitura: "Prefeitura Municipal",
  seafi: "SEAFI — Administração e Finanças",
  semop: "SEMOP — Obras e Serviços Públicos",
  semed: "SEMED — Educação",
  sesau: "SESAU — Saúde",
  seama: "SEAMA — Agricultura e Meio Ambiente",
  secac: "SECAC — Casa Civil",
  sads: "SADS — Assistência Social",
  cgm: "CGM — Controladoria Geral",
  ouvidoria: "Ouvidoria Municipal",
  pjm: "PJM — Procuradoria Jurídica",
  sac: "SAC Municipal",
};

const officeByServiceId: Record<string, OfficeKey> = {
  "acesso-informacao": "ouvidoria",
  "1doc-ouvidoria-geral": "ouvidoria",
  "1doc-extincao-ou-suspensao-de-execucao-extrajudicial-ou-judicial": "pjm",
  "1doc-alvara-de-funcionamento": "seafi",
  "1doc-alvara-de-obras-construcao-ampliacao-reforma-e-demolicao": "semop",
  "1doc-alvara-temporario-para-parque-de-diversoes-e-circo": "seafi",
  "1doc-ampliacao-de-carga-horaria-enquadramento": "seafi",
  "1doc-atualizacao-de-cadastro-funcional": "seafi",
  "1doc-baixa-do-cadastro-de-inscricao-municipal": "seafi",
  "1doc-certidao-de-inexigibilidade-ci": "seafi",
  "1doc-credencial-de-estacionamento-para-idoso": "semop",
  "1doc-credencial-de-estacionamento-para-pcd": "semop",
  "1doc-defesa-de-autuacao-pessoa-juridica": "semop",
  "1doc-desmembramento-de-lotes": "semop",
  "1doc-dispensa-de-licenca-dl": "seama",
  "1doc-duvidas-sobre-concursos-processos-seletivos": "seafi",
  "1doc-habite-se": "semop",
  "1doc-indicacao-de-condutor-infrator-pessoa-fisica": "semop",
  "1doc-indicacao-de-condutor-infrator-pessoa-juridica": "semop",
  "1doc-isencao-tributaria-cadastro-economico": "seafi",
  "1doc-isencao-tributaria-cadastro-imobiliario": "seafi",
  "1doc-nota-premiada-amargosa": "seafi",
  "1doc-numeracao-predial": "semop",
  "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-cetran": "semop",
  "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-jari": "semop",
  "1doc-regularizacao-de-loteamentos": "semop",
  "1doc-solicitacao-de-licenca-ambiental": "seama",
  "1doc-solicitacao-renovacao-de-licenca-ambiental": "seama",
  "1doc-solicitacoes-para-eventos-esportivos-caminhadas-carreatas-e-etc": "secac",
  "1doc-transito-defesa-de-autuacao-pessoa-fisica": "semop",
  "1doc-unificacao-de-lotes": "semop",
};

function officeForDepartment(value: string): OfficeKey | undefined {
  const department = value.toUpperCase();
  if (department.startsWith("SEAFI") || /^(CAPRS|COCAD|GAB-DGP|SEAP)/.test(department)) return "seafi";
  if (department.startsWith("SEMOP") || /^(DIROB|DOP)/.test(department)) return "semop";
  if (department.startsWith("SEMED") || department.startsWith("PFGEA")) return "semed";
  if (department.startsWith("SESAU")) return "sesau";
  if (department.startsWith("SEAMA")) return "seama";
  if (department.startsWith("SECAC")) return "secac";
  if (department.startsWith("SADS")) return "sads";
  if (department.startsWith("CGM") || department.startsWith("CONTROLADORIA")) return "cgm";
  if (department.startsWith("SAC")) return "sac";
}

function responsibleSector(raw: string, currentDepartment: string): string | undefined {
  const sectors = raw.split(";").map((part) => part.trim()).filter(Boolean);
  if (!sectors.length) return undefined;
  const currentCode = currentDepartment.toUpperCase().match(/^[A-Z]+-[A-Z]+/)?.[0];
  const selected = sectors.find((sector) => currentCode && sector.toUpperCase().startsWith(currentCode)) || sectors[0];
  if (/^(?:Prefeitura Municipal de Amargosa|A preencher|A confirmar)$/i.test(selected)) return undefined;
  return selected.replace("vigil6ancia", "Vigilância");
}

type ServiceContactSource = {
  id: string;
  department: string;
  channels?: { label: string; value: string; url?: string }[];
};

function officeKeyForService(service: ServiceContactSource): OfficeKey {
  const source = spreadsheetContacts[service.id];
  const sector = responsibleSector(source?.sector || "", service.department);
  return officeByServiceId[service.id] ||
    (sector && officeForDepartment(sector)) ||
    (source && officeForDepartment(source.secretariat)) ||
    officeForDepartment(service.department) ||
    "prefeitura";
}

export function organizationForService(service: ServiceContactSource) {
  const id = officeKeyForService(service);
  return { id, label: organizationFilterLabels[id] };
}

export function contactForService(service: ServiceContactSource): ServiceContact {
  const source = spreadsheetContacts[service.id];
  const sector = responsibleSector(source?.sector || "", service.department);
  const officeKey = officeKeyForService(service);
  const office = offices[officeKey];
  const name = officeKey === "ouvidoria" ? office.name : sector ||
    (service.department !== "Prefeitura Municipal de Amargosa" && officeForDepartment(service.department)
      ? service.department
      : office.name);
  const channelPhone = service.channels?.find((channel) =>
    /telefone/i.test(channel.label) && /\(\d{2}\)\s*\d{4,5}-\d{4}/.test(channel.value),
  )?.value;
  const channelEmail = service.channels?.find((channel) =>
    /e-mail/i.test(channel.label) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.value),
  )?.value;
  const basePhone = source?.phone || channelPhone?.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] || office.phone.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] || office.phone;
  const channelExtension = channelPhone?.match(/ramal\s*(\d+)/i)?.[1];
  const extension = source?.extension || channelExtension || office.phone.match(/ramal\s*(\d+)/i)?.[1];
  return {
    name,
    officeName: name === office.name ? undefined : office.name,
    phone: extension ? `${basePhone}, ramal ${extension}` : basePhone,
    extensionLabel: extension ? (source?.extension || channelExtension ? "ramal do setor" : name === office.name ? "ramal" : "ramal da secretaria") : undefined,
    address: office.address,
    email: source?.email || channelEmail || office.email,
    emailLabel: source?.email || channelEmail || name === office.name ? "E-mail" : "E-mail da secretaria",
    officialUrl: office.officialUrl,
  };
}
