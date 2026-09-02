type Channel = { label: string; value: string; url?: string };
type Legislation = { label: string; url: string };
type WhereWhenItem = {
  label: string;
  schedule?: string;
  description: string;
  wide?: boolean;
};

type ApprovedServiceDetail = {
  slug: string;
  destination: string;
  url: string;
  summary: string;
  eligibility: string;
  documents: string[];
  steps: string[];
  whereWhen: string;
  whereWhenItems?: WhereWhenItem[];
  cost: string;
  duration: string;
  channels: Channel[];
  legislation: Legislation[];
  relatedServiceIds?: string[];
  notice: string;
  noticeAction: string;
  updatedAt: string;
};

const oneDocCentral = "https://amargosa.1doc.com.br/b.php?pg=wp/wp";
const amargosaPhone = "(75) 3512-7811";
const userRightsLaw =
  "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm";
const trafficCode =
  "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm";
const contran900 =
  "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucao-contran-no-900-de-9-de-marco-de-2022";
const contran918 =
  "https://www.gov.br/infraestrutura/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao9182022.pdf";
const contran1012 =
  "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao10122024.pdf";
const senatranCredential =
  "https://www.gov.br/pt-br/servicos/emitir-credencial-de-estacionamento-digital";

const municipalTrafficWhere =
  "Em Amargosa, o atendimento municipal de trânsito é realizado pela SEMOP/SUPET. A Prefeitura informa atendimento presencial e disponibiliza a Central 1Doc; antes de comparecer, confirme endereço e horário pelo telefone geral do Município.";
const municipalTrafficChannels: Channel[] = [
  { label: "Online", value: "Central de Atendimento 1Doc", url: oneDocCentral },
  { label: "Telefone", value: amargosaPhone },
  { label: "Presencial", value: "SEMOP/SUPET — atendimento municipal de trânsito" },
];
const trafficLegislation: Legislation[] = [
  { label: "Lei Federal nº 9.503/1997 — Código de Trânsito Brasileiro", url: trafficCode },
  { label: "Resolução CONTRAN nº 900/2022 — defesa e recursos", url: contran900 },
  { label: "Resolução CONTRAN nº 918/2022 — processo de multas", url: contran918 },
];

export const approvedServiceDetails: Record<string, ApprovedServiceDetail> = {
  "1doc-abastecimento-de-agua": {
    slug: "abastecimento-de-agua",
    destination: "Central de Atendimento 1Doc",
    url: "https://servicos.amargosa.ba.gov.br/b.php?pg=wp/wp&itd=5&is=1991&iser=01JSKXAMY1TV3N486S75PAJH5T",
    summary:
      "Solicitação do primeiro abastecimento de água por carro-pipa, com abertura de ordem de serviço e agendamento pela Prefeitura de Amargosa.",
    eligibility:
      "Moradores que necessitam solicitar o primeiro abastecimento de água por carro-pipa para sua residência ou localidade.",
    documents: [
      "Dados pessoais e telefone para contato.",
      "Endereço ou identificação completa da localidade a ser atendida.",
      "Capacidade, em litros, do reservatório que receberá a água.",
      "Quantidade de pessoas atendidas pela residência.",
    ],
    steps: [
      "Acesse o canal oficial ou procure o atendimento municipal.",
      "Informe os dados pessoais, a localidade, a capacidade do reservatório e o número de moradores.",
      "Confirme o registro da ordem de serviço e guarde o protocolo.",
      "Aguarde o agendamento do abastecimento e mantenha o acesso ao reservatório disponível.",
    ],
    whereWhen:
      "O pedido pode ser iniciado pela Central de Atendimento 1Doc. Para orientação presencial ou confirmação do setor, contate a Prefeitura pelo telefone (75) 3512-7811, de segunda a sexta-feira.",
    cost:
      "A página oficial consultada não informa cobrança. Confirme eventuais condições no momento do protocolo.",
    duration:
      "O atendimento é agendado após a abertura da ordem de serviço, conforme a programação municipal.",
    channels: [
      {
        label: "Online",
        value: "Solicitação de abastecimento no 1Doc",
        url: "https://servicos.amargosa.ba.gov.br/b.php?pg=wp/wp&itd=5&is=1991&iser=01JSKXAMY1TV3N486S75PAJH5T",
      },
      { label: "Telefone", value: amargosaPhone },
      { label: "Presencial", value: "Atendimento da Prefeitura de Amargosa" },
    ],
    legislation: [
      { label: "Lei Federal nº 13.460/2017 — direitos do usuário de serviços públicos", url: userRightsLaw },
    ],
    notice:
      "A solicitação gera uma ordem de serviço para avaliação e agendamento do abastecimento.",
    noticeAction: "Acessar a solicitação oficial no 1Doc ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-credencial-de-estacionamento-para-idoso": {
    slug: "credencial-de-estacionamento-para-idoso",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Credencial que identifica a pessoa idosa e permite o uso das vagas de estacionamento reservadas a esse público em todo o território nacional.",
    eligibility:
      "Pessoa com 60 anos ou mais, como condutora ou passageira, ou seu representante legal. A emissão digital federal exige que a pessoa esteja elegível no cadastro da Senatran.",
    documents: [
      "Documento oficial de identificação da pessoa idosa, com CPF.",
      "Comprovante de residência atualizado.",
      "Procuração e documento do representante, quando outra pessoa fizer a solicitação.",
    ],
    steps: [
      "Reúna a identificação, o comprovante de residência e, se necessário, a representação legal.",
      "Solicite a credencial pelo atendimento municipal da SEMOP/SUPET ou verifique a emissão digital no Portal de Serviços Senatran.",
      "Acompanhe a análise pelo canal utilizado e obtenha a credencial.",
      "Ao estacionar em vaga reservada, mantenha a credencial válida em posição visível no veículo ou use a versão digital conforme a regulamentação.",
    ],
    whereWhen:
      "A Prefeitura de Amargosa informa atendimento presencial na SEMOP/SUPET. Pessoas elegíveis também podem consultar a emissão digital no aplicativo Carteira Digital de Trânsito ou no Portal de Serviços Senatran.",
    cost: "Gratuito.",
    duration:
      "A emissão digital federal é imediata quando o cadastro está elegível. O prazo do atendimento municipal deve ser confirmado no protocolo.",
    channels: [
      { label: "Municipal", value: "Central de Atendimento 1Doc", url: oneDocCentral },
      { label: "Presencial", value: "SEMOP/SUPET — atendimento municipal de trânsito" },
      { label: "Telefone", value: amargosaPhone },
      { label: "Digital", value: "Portal de Serviços Senatran", url: senatranCredential },
    ],
    legislation: [
      { label: "Resolução CONTRAN nº 1.012/2024 — credencial de estacionamento", url: contran1012 },
      { label: "Lei Federal nº 9.503/1997 — Código de Trânsito Brasileiro", url: trafficCode },
      { label: "Lei Federal nº 10.741/2003 — Estatuto da Pessoa Idosa", url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm" },
    ],
    relatedServiceIds: ["1doc-credencial-de-estacionamento-para-pcd"],
    notice:
      "A credencial é pessoal, tem validade nacional e deve ser utilizada somente quando a pessoa idosa estiver no veículo.",
    noticeAction: "Acessar o canal oficial de solicitação ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-credencial-de-estacionamento-para-pcd": {
    slug: "credencial-de-estacionamento-para-pcd",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Credencial para pessoa com deficiência e comprometimento de mobilidade, permanente ou temporário, utilizar vagas de estacionamento reservadas em todo o território nacional.",
    eligibility:
      "Pessoa com deficiência que tenha comprometimento de mobilidade, permanente ou temporário, ou seu representante legal.",
    documents: [
      "Documento oficial de identificação da pessoa com deficiência, com CPF.",
      "Laudo médico que identifique a condição e o comprometimento de mobilidade, indicando se é permanente ou temporário.",
      "Comprovante de residência atualizado.",
      "Procuração e documento do representante, quando outra pessoa fizer a solicitação.",
    ],
    steps: [
      "Reúna a identificação, o comprovante de residência e o laudo médico.",
      "Solicite a credencial pelo atendimento municipal da SEMOP/SUPET ou verifique a emissão digital no Portal de Serviços Senatran.",
      "Acompanhe a análise pelo canal utilizado e obtenha a credencial.",
      "Ao estacionar em vaga reservada, mantenha a credencial válida em posição visível no veículo ou use a versão digital conforme a regulamentação.",
    ],
    whereWhen:
      "A Prefeitura de Amargosa informa atendimento presencial na SEMOP/SUPET. Pessoas elegíveis também podem consultar a emissão digital no aplicativo Carteira Digital de Trânsito ou no Portal de Serviços Senatran.",
    cost: "Gratuito.",
    duration:
      "A emissão digital federal é imediata quando o cadastro está elegível. O prazo do atendimento municipal deve ser confirmado no protocolo.",
    channels: [
      { label: "Municipal", value: "Central de Atendimento 1Doc", url: oneDocCentral },
      { label: "Presencial", value: "SEMOP/SUPET — atendimento municipal de trânsito" },
      { label: "Telefone", value: amargosaPhone },
      { label: "Digital", value: "Portal de Serviços Senatran", url: senatranCredential },
    ],
    legislation: [
      { label: "Resolução CONTRAN nº 1.012/2024 — credencial de estacionamento", url: contran1012 },
      { label: "Lei Federal nº 13.146/2015 — Estatuto da Pessoa com Deficiência", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm" },
      { label: "Lei Federal nº 9.503/1997 — Código de Trânsito Brasileiro", url: trafficCode },
    ],
    relatedServiceIds: ["1doc-credencial-de-estacionamento-para-idoso"],
    notice:
      "A credencial é pessoal e só pode ser usada quando a pessoa com deficiência estiver no veículo.",
    noticeAction: "Acessar o canal oficial de solicitação ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-defesa-de-autuacao-pessoa-juridica": {
    slug: "defesa-de-autuacao-pessoa-juridica",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Defesa apresentada pela pessoa jurídica antes da aplicação da penalidade, para contestar uma autuação de trânsito emitida pelo órgão responsável.",
    eligibility:
      "Pessoa jurídica proprietária do veículo, por meio de seu representante legal ou procurador, ou outra parte legitimada pela legislação de trânsito.",
    documents: [
      "Requerimento de defesa legível, preenchido e assinado, tratando de um único Auto de Infração de Trânsito (AIT).",
      "Notificação de autuação, cópia do AIT ou documento que contenha a placa e o número do auto.",
      "Documento de identificação do representante e documento do veículo.",
      "Contrato social, estatuto, ata, portaria ou outro documento que comprove a representação da pessoa jurídica.",
      "Procuração, quando a defesa for apresentada por procurador.",
      "Documentos e provas que sustentem a alegação, quando houver.",
    ],
    steps: [
      "Confira o órgão autuador e a data-limite indicada na notificação.",
      "Prepare um requerimento para cada auto de infração e reúna os documentos da empresa, do veículo e da representação.",
      "Protocole a defesa no órgão de trânsito responsável pela autuação; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o protocolo e acompanhe a decisão pelo canal informado no recebimento.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Sem cobrança para protocolar a defesa administrativa.",
    duration:
      "O prazo de análise não está publicado no canal municipal. A defesa deve ser apresentada até a data indicada na notificação.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: [
      "1doc-transito-defesa-de-autuacao-pessoa-fisica",
      "1doc-indicacao-de-condutor-infrator-pessoa-juridica",
    ],
    notice:
      "A defesa deve ser encaminhada ao órgão que lavrou a autuação e respeitar a data-limite da notificação.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-indicacao-de-condutor-infrator-pessoa-fisica": {
    slug: "indicacao-de-condutor-infrator-pessoa-fisica",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Procedimento para a pessoa física proprietária de um veículo indicar quem o conduzia no momento de uma infração sem abordagem.",
    eligibility:
      "Pessoa física proprietária do veículo quando não era a condutora no momento da infração e o real condutor não foi identificado durante a abordagem.",
    documents: [
      "Formulário de identificação do condutor infrator recebido com a notificação, preenchido sem rasuras e assinado pelo proprietário e pelo condutor.",
      "Cópia legível da CNH do condutor indicado.",
      "Cópia do documento de identificação do proprietário ou de seu representante legal.",
      "Procuração ou documento de representação, quando aplicável.",
    ],
    steps: [
      "Confira a data-limite e as instruções na notificação de autuação.",
      "Preencha o formulário com os dados do proprietário e do real condutor e recolha as assinaturas exigidas.",
      "Anexe os documentos legíveis e protocole a indicação no órgão autuador; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o comprovante de entrega e acompanhe o processamento pelo canal utilizado.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Gratuito.",
    duration:
      "A indicação deve ser apresentada até a data-limite da notificação. O prazo de processamento não está publicado no canal municipal.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: [
      "1doc-indicacao-de-condutor-infrator-pessoa-juridica",
      "1doc-transito-defesa-de-autuacao-pessoa-fisica",
    ],
    notice:
      "A indicação do condutor não substitui a defesa da autuação e deve respeitar o prazo indicado na notificação.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-indicacao-de-condutor-infrator-pessoa-juridica": {
    slug: "indicacao-de-condutor-infrator-pessoa-juridica",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Procedimento para a pessoa jurídica proprietária de um veículo indicar quem o conduzia no momento de uma infração sem abordagem.",
    eligibility:
      "Pessoa jurídica proprietária do veículo, por seu representante legal ou procurador, quando o real condutor não foi identificado no momento da infração.",
    documents: [
      "Formulário de identificação do condutor infrator recebido com a notificação, preenchido sem rasuras e assinado conforme as instruções.",
      "Cópia legível da CNH do condutor indicado.",
      "Documento de identificação do representante legal.",
      "Contrato social, estatuto ou documento equivalente que comprove a representação da empresa.",
      "Procuração, quando aplicável, e contrato de locação quando se tratar de veículo locado.",
    ],
    steps: [
      "Confira a data-limite e as instruções na notificação de autuação.",
      "Preencha o formulário e reúna os documentos do condutor, da empresa e da representação legal.",
      "Protocole a indicação no órgão autuador; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o comprovante de entrega e acompanhe o processamento pelo canal utilizado.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Gratuito.",
    duration:
      "A indicação deve ser apresentada até a data-limite da notificação. O prazo de processamento não está publicado no canal municipal.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: [
      "1doc-indicacao-de-condutor-infrator-pessoa-fisica",
      "1doc-defesa-de-autuacao-pessoa-juridica",
    ],
    notice:
      "A pessoa jurídica deve comprovar a representação e observar rigorosamente o prazo da notificação.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-limpeza-publica": {
    slug: "limpeza-publica",
    destination: "Orientações da Prefeitura de Amargosa",
    url: "https://www.amargosa.ba.gov.br/faq-%E2%80%93-perguntas-frequentes",
    summary:
      "Coleta regular de resíduos domiciliares e comerciais nos bairros e localidades atendidos pelo cronograma municipal de limpeza pública.",
    eligibility:
      "Moradores, comerciantes e demais ocupantes de imóveis situados nas rotas municipais de coleta.",
    documents: [
      "Não há documento exigido para utilizar a coleta regular.",
      "Acondicione os resíduos de forma segura e coloque-os para coleta pouco antes do horário da rota.",
    ],
    steps: [
      "Identifique abaixo os dias e o horário da coleta em seu bairro ou localidade.",
      "Separe e acondicione os resíduos para evitar vazamentos e acidentes.",
      "Disponibilize o material no ponto de coleta próximo ao horário informado.",
      "Se houver falha recorrente na rota, registre a ocorrência no atendimento municipal.",
    ],
    whereWhen:
      "Consulte o horário da sua localidade e disponibilize os resíduos pouco antes da passagem da equipe.",
    whereWhenItems: [
      {
        label: "07h20",
        schedule: "Segunda, quarta e sexta",
        description: "Urbis 1, São José, Cajueiro e Eline Passos.",
      },
      {
        label: "11h30",
        schedule: "Segunda, quarta e sexta",
        description:
          "Loteamento Muniz, Tropical Center, Loteamento Santo Antônio e Rodão.",
      },
      {
        label: "17h",
        schedule: "Segunda a sábado",
        description: "Centro, Malmequer, Rua do Buraco, Bosque e Comércio.",
      },
      {
        label: "07h",
        schedule: "Terça, quinta e sábado",
        description:
          "Boa Esperança, Loteamento São Jorge, Idalina Figueredo, Parque dos Pássaros, Avenida São Cristóvão, Casas Populares, Santa Rita, Alto da Bela Vista, Mansão do Forró, João Bonfim, Travessa Luís Sandes, Gamboa, São Roque, João do Fórum, Minguara e Urbis 2.",
        wide: true,
      },
      {
        label: "13h",
        schedule: "Terça, quinta e sábado",
        description: "Gravatá, Sucupira e Campo Belo.",
      },
    ],
    cost: "Sem cobrança específica informada para a coleta regular.",
    duration: "Atendimento conforme os dias e horários publicados para cada rota.",
    channels: [
      {
        label: "Cronograma",
        value: "FAQ oficial da Prefeitura",
        url: "https://www.amargosa.ba.gov.br/faq-%E2%80%93-perguntas-frequentes",
      },
      { label: "Telefone", value: amargosaPhone },
      { label: "Online", value: "Central de Atendimento 1Doc", url: oneDocCentral },
    ],
    legislation: [
      { label: "Lei Federal nº 12.305/2010 — Política Nacional de Resíduos Sólidos", url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm" },
      { label: "Lei Federal nº 13.460/2017 — direitos do usuário de serviços públicos", url: userRightsLaw },
    ],
    relatedServiceIds: ["1doc-retirada-de-entulhos"],
    notice:
      "Consulte o cronograma antes de colocar os resíduos na rua; entulho de obra exige solicitação e agendamento próprios.",
    noticeAction: "Consultar o cronograma oficial ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-ouvidoria-geral": {
    slug: "ouvidoria-geral",
    destination: "Ouvidoria Municipal no 1Doc",
    url: "https://amargosa.1doc.com.br/b.php?itd=4&pg=wp/wp",
    summary:
      "Canal oficial para registrar reclamações, denúncias, sugestões, elogios e solicitações sobre os serviços públicos municipais de Amargosa.",
    eligibility:
      "Qualquer pessoa pode registrar uma manifestação, de forma identificada, sigilosa ou anônima. No registro anônimo, não é possível solicitar complementação de informações ao manifestante.",
    documents: [
      "Não há documento obrigatório para iniciar uma manifestação.",
      "Descreva o fato de forma clara, indicando local, data, órgão ou serviço relacionado.",
      "Anexe documentos, imagens ou outros elementos que ajudem na análise, quando houver.",
    ],
    steps: [
      "Acesse a Ouvidoria Municipal pelo botão desta página.",
      "Escolha se deseja se identificar, manter seus dados sob sigilo ou registrar anonimamente.",
      "Selecione o tipo de manifestação e descreva o ocorrido com objetividade.",
      "Envie a manifestação e guarde o número de protocolo para acompanhar a resposta.",
    ],
    whereWhen:
      "Escolha o canal mais conveniente para registrar ou acompanhar a manifestação.",
    whereWhenItems: [
      {
        label: "Online",
        schedule: "A qualquer momento",
        description: "Ouvidoria Municipal no 1Doc.",
      },
      {
        label: "Presencial",
        schedule: "Segunda a sexta, 08h às 12h e 14h às 17h",
        description:
          "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa — BA.",
      },
    ],
    cost: "Gratuito.",
    duration:
      "Resposta em até 30 dias, prorrogáveis uma vez por igual período mediante justificativa.",
    channels: [
      {
        label: "Online",
        value: "Registrar manifestação na Ouvidoria",
        url: "https://amargosa.1doc.com.br/b.php?itd=4&pg=wp/wp",
      },
      { label: "Telefone", value: "(75) 3512-7811 — ramal 4141" },
      {
        label: "E-mail",
        value: "cgm.ouvim@amargosa.ba.gov.br",
        url: "mailto:cgm.ouvim@amargosa.ba.gov.br",
      },
      { label: "Presencial", value: "Avenida Dr. Luís Sandes, Valle Shopping, Amargosa — BA" },
    ],
    legislation: [
      { label: "Lei Federal nº 13.460/2017 — defesa dos usuários de serviços públicos", url: userRightsLaw },
    ],
    notice:
      "A manifestação é registrada no canal oficial da Ouvidoria e pode ser acompanhada pelo número de protocolo.",
    noticeAction: "Registrar manifestação na Ouvidoria ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-cetran": {
    slug: "recurso-a-junta-administrativa-de-recursos-de-infracoes-cetran",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Recurso administrativo de segunda instância apresentado ao Conselho Estadual de Trânsito (CETRAN) após o indeferimento do recurso julgado pela JARI.",
    eligibility:
      "Proprietário, condutor identificado ou representante legal que recebeu decisão desfavorável no recurso de primeira instância.",
    documents: [
      "Requerimento de recurso legível, preenchido e assinado, referente a um único Auto de Infração de Trânsito (AIT).",
      "Cópia da decisão do recurso em primeira instância, quando recebida.",
      "Notificação de penalidade, cópia do AIT ou documento com a placa e o número do auto.",
      "Documento de identificação do recorrente e documento do veículo.",
      "Comprovante de representação da pessoa jurídica e procuração, quando aplicável.",
      "Razões do recurso e documentos que sustentem a alegação.",
    ],
    steps: [
      "Confirme o indeferimento na JARI e a data-limite para o recurso de segunda instância.",
      "Reúna a decisão anterior, as notificações e os documentos do recorrente e do veículo.",
      "Protocole o recurso no órgão autuador; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o protocolo. O órgão encaminhará o processo ao CETRAN para julgamento.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Sem cobrança para protocolar o recurso administrativo.",
    duration:
      "O prazo de julgamento não está publicado no canal municipal. Respeite a data-limite informada na decisão ou notificação.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: ["1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-jari"],
    notice:
      "O recurso ao CETRAN é a segunda instância administrativa e pressupõe decisão anterior da JARI.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-jari": {
    slug: "recurso-a-junta-administrativa-de-recursos-de-infracoes-jari",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Recurso administrativo de primeira instância apresentado à Junta Administrativa de Recursos de Infrações (JARI) contra uma penalidade de trânsito.",
    eligibility:
      "Pessoa física ou jurídica proprietária do veículo, condutor identificado ou representante legal com legitimidade para recorrer da penalidade.",
    documents: [
      "Requerimento de recurso legível, preenchido e assinado, referente a um único Auto de Infração de Trânsito (AIT).",
      "Notificação de penalidade, cópia do AIT ou documento com a placa e o número do auto.",
      "Documento de identificação do recorrente e documento do veículo.",
      "Comprovante de representação da pessoa jurídica e procuração, quando aplicável.",
      "Razões do recurso e documentos que sustentem a alegação.",
    ],
    steps: [
      "Confira o órgão autuador e a data-limite indicada na notificação de penalidade.",
      "Prepare um recurso para cada auto de infração e reúna os documentos necessários.",
      "Protocole o recurso no órgão autuador; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o protocolo e acompanhe o julgamento. Se o recurso for negado, verifique a possibilidade de recorrer ao CETRAN.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Sem cobrança para protocolar o recurso administrativo.",
    duration:
      "O prazo de julgamento não está publicado no canal municipal. Respeite a data-limite indicada na notificação.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: [
      "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-cetran",
      "1doc-transito-defesa-de-autuacao-pessoa-fisica",
    ],
    notice:
      "O recurso à JARI é apresentado depois da penalidade; antes dela, o procedimento correspondente é a defesa da autuação.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-retirada-de-entulhos": {
    slug: "retirada-de-entulhos",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Solicitação de avaliação e agendamento municipal para medição e retirada de entulho em Amargosa.",
    eligibility:
      "Moradores e responsáveis por imóveis ou atividades que precisam solicitar a retirada programada de entulho.",
    documents: [
      "Nome e telefone do solicitante.",
      "Endereço exato do material, com ponto de referência.",
      "Descrição do tipo e da quantidade aproximada de entulho.",
      "Foto do local, quando disponível, para facilitar a avaliação.",
    ],
    steps: [
      "Avise previamente a SEMOP/SUPESP pelo canal online ou presencial.",
      "Informe a localização e as características do material.",
      "Aguarde o agendamento da medição e as orientações para o descarte.",
      "Disponibilize o material somente no local e no período orientados pelo setor.",
    ],
    whereWhen:
      "A solicitação deve ser feita antes de colocar o entulho para coleta. A SEMOP/SUPESP agenda a medição e orienta o descarte conforme a programação do serviço.",
    cost:
      "A fonte oficial consultada não publica valor. Eventual cobrança ou condição será informada após a medição.",
    duration:
      "Prazo conforme avaliação, medição e agenda da SEMOP/SUPESP; guarde o protocolo para acompanhamento.",
    channels: [
      { label: "Online", value: "Central de Atendimento 1Doc", url: oneDocCentral },
      { label: "Telefone", value: amargosaPhone },
      { label: "Presencial", value: "SEMOP/SUPESP — Superintendência de Serviços Públicos" },
    ],
    legislation: [
      { label: "Lei Federal nº 12.305/2010 — Política Nacional de Resíduos Sólidos", url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm" },
      { label: "Lei Federal nº 13.460/2017 — direitos do usuário de serviços públicos", url: userRightsLaw },
    ],
    relatedServiceIds: ["1doc-limpeza-publica"],
    notice:
      "A Prefeitura orienta que a SEMOP/SUPESP seja avisada antes do descarte para agendar a medição e a retirada.",
    noticeAction: "Acessar o canal oficial de solicitação ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-transito-defesa-de-autuacao-pessoa-fisica": {
    slug: "transito-defesa-de-autuacao-pessoa-fisica",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Defesa apresentada pela pessoa física antes da aplicação da penalidade, para contestar uma autuação de trânsito emitida pelo órgão responsável.",
    eligibility:
      "Proprietário do veículo, condutor devidamente identificado ou representante legal legitimado pela legislação de trânsito.",
    documents: [
      "Requerimento de defesa legível, preenchido e assinado, tratando de um único Auto de Infração de Trânsito (AIT).",
      "Notificação de autuação, cópia do AIT ou documento que contenha a placa e o número do auto.",
      "RG e CPF ou outro documento de identificação que comprove a assinatura.",
      "CNH e documento do veículo.",
      "Procuração, quando a defesa for apresentada por representante.",
      "Documentos e provas que sustentem a alegação, quando houver.",
    ],
    steps: [
      "Confira o órgão autuador e a data-limite indicada na notificação.",
      "Prepare um requerimento para cada auto de infração e reúna os documentos pessoais e do veículo.",
      "Protocole a defesa no órgão de trânsito responsável pela autuação; em Amargosa, consulte a SEMOP/SUPET e a Central 1Doc.",
      "Guarde o protocolo e acompanhe a decisão pelo canal informado no recebimento.",
    ],
    whereWhen: municipalTrafficWhere,
    cost: "Sem cobrança para protocolar a defesa administrativa.",
    duration:
      "O prazo de análise não está publicado no canal municipal. A defesa deve ser apresentada até a data indicada na notificação.",
    channels: municipalTrafficChannels,
    legislation: trafficLegislation,
    relatedServiceIds: [
      "1doc-defesa-de-autuacao-pessoa-juridica",
      "1doc-indicacao-de-condutor-infrator-pessoa-fisica",
      "1doc-recurso-a-junta-administrativa-de-recursos-de-infracoes-jari",
    ],
    notice:
      "A defesa deve ser encaminhada ao órgão que lavrou a autuação e respeitar a data-limite da notificação.",
    noticeAction: "Acessar o canal oficial de protocolo ↗",
    updatedAt: "01/09/2026",
  },

  "1doc-troca-de-lampadas": {
    slug: "troca-de-lampadas",
    destination: "Central de Atendimento 1Doc",
    url: oneDocCentral,
    summary:
      "Solicitação de manutenção da iluminação pública para substituir lâmpada apagada, intermitente ou com defeito em via pública de Amargosa.",
    eligibility:
      "Qualquer pessoa que identifique problema em ponto de iluminação pública no Município de Amargosa.",
    documents: [
      "Não há documento obrigatório.",
      "Informe o número da plaqueta instalada no poste, sempre que estiver visível.",
      "Indique rua, número aproximado, bairro e ponto de referência.",
      "Descreva o problema e deixe um telefone para contato.",
    ],
    steps: [
      "Localize o poste e anote o número da plaqueta.",
      "Registre a solicitação pela Central 1Doc ou pelo telefone (75) 3512-7811.",
      "Informe o endereço completo e descreva o defeito observado.",
      "Guarde o protocolo para acompanhar o atendimento.",
    ],
    whereWhen:
      "A solicitação pode ser registrada online ou pelo telefone (75) 3512-7811. O ponto deve estar em área pública e ser identificado pelo número da plaqueta ou por endereço e referência precisos.",
    cost: "Gratuito para registrar a solicitação de manutenção da iluminação pública.",
    duration:
      "O prazo varia conforme vistoria, disponibilidade da equipe e material. A fonte oficial não publica prazo fixo; acompanhe pelo protocolo.",
    channels: [
      { label: "Online", value: "Central de Atendimento 1Doc", url: oneDocCentral },
      { label: "Telefone", value: amargosaPhone },
    ],
    legislation: [
      { label: "Lei Federal nº 13.460/2017 — direitos do usuário de serviços públicos", url: userRightsLaw },
    ],
    notice:
      "Informe o número da plaqueta do poste para que a equipe localize o ponto de iluminação com precisão.",
    noticeAction: "Acessar o canal oficial de solicitação ↗",
    updatedAt: "01/09/2026",
  },
};
