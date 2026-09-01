type TaggableService = {
  title: string;
  category: string;
  department: string;
  subject?: string;
  audienceId?: string;
  audienceIds?: string[];
};

const normalize = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rules: Array<[RegExp, string[]]> = [
  [
    /abastecimento|agua/,
    ["falta de água", "caminhão pipa", "fornecimento de água"],
  ],
  [
    /acesso a informacao|\blai\b/,
    ["pedido de informação", "transparência", "e-sic", "informação pública"],
  ],
  [
    /licitacao|edital|fornecedor|contrato/,
    ["compras públicas", "contratação", "pregão", "empresa fornecedora"],
  ],
  [
    /cadastro economico|inscricao municipal|alvara de funcionamento/,
    ["abrir empresa", "regularizar empresa", "comércio", "cnpj"],
  ],
  [
    /alvara de obras|construcao|ampliacao|demolicao|habite se/,
    ["construir", "reformar imóvel", "regularizar obra", "licença de obra"],
  ],
  [
    /sanitario|vigilancia sanitaria/,
    ["vigilância sanitária", "licença sanitária", "saúde pública"],
  ],
  [
    /evento|caminhada|carreata|circo|parque de diversoes/,
    ["realizar evento", "festa", "evento público", "autorização de evento"],
  ],
  [
    /imovel|imobiliari|predial|area|lote|fundiari|titularidade/,
    [
      "casa",
      "terreno",
      "propriedade",
      "cadastro de imóvel",
      "regularização urbana",
    ],
  ],
  [
    /iptu|iss|itiv|itbi|tribut|fiscal|taxa|debito|credito/,
    [
      "imposto",
      "tributos municipais",
      "dívida ativa",
      "pagamento",
      "segunda via",
    ],
  ],
  [
    /certidao|declaracao|comprovacao/,
    ["emitir documento", "comprovante", "declaração", "segunda via"],
  ],
  [
    /nfs|nota fiscal/,
    ["nota fiscal eletrônica", "nfse", "cancelar nota", "corrigir nota"],
  ],
  [
    /servidor|funcional|cargo|carreira|salari|contracheque|ferias|licenca|gratificacao|rendimentos/,
    ["rh", "recursos humanos", "funcionário público", "vida funcional"],
  ],
  [
    /concurso|processo seletivo/,
    ["vaga pública", "emprego", "seleção", "edital de concurso"],
  ],
  [
    /estacionamento|idoso|\bpcd\b/,
    ["vaga especial", "cartão de estacionamento", "pessoa com deficiência"],
  ],
  [
    /transito|condutor|infracao|autuacao|multa|cetran|jari/,
    ["multa de trânsito", "recurso de multa", "motorista", "veículo"],
  ],
  [
    /ambiental|arvore|meio ambiente/,
    ["meio ambiente", "licença ambiental", "poda", "vegetação"],
  ],
  [
    /limpeza|entulho|manutencao publica|lampada/,
    ["serviços urbanos", "limpeza urbana", "rua", "bairro", "zeladoria"],
  ],
  [
    /lampada/,
    ["poste apagado", "rua escura", "iluminação pública", "luz queimada"],
  ],
  [/entulho/, ["recolher entulho", "tirar entulho", "resíduos", "coleta"]],
  [/sepultamento|carneira/, ["cemitério", "funeral", "falecimento", "túmulo"]],
  [
    /escolar|educacao/,
    ["escola", "matrícula", "documento escolar", "transferência escolar"],
  ],
  [
    /ouvidoria|reclamacao|denuncia/,
    ["reclamação", "denúncia", "elogio", "sugestão", "manifestação"],
  ],
  [/fundef|precatorio/, ["precatório fundef", "professor", "educação"]],
  [
    /ressarcimento|indenizacao|restituicao|compensacao/,
    ["devolução de dinheiro", "reembolso", "indenização"],
  ],
  [/via|ordem publica/, ["fechar rua", "interditar rua", "espaço público"]],
];

export function serviceSearchTags(service: TaggableService) {
  const corpus = normalize(
    [
      service.title,
      service.category,
      service.department,
      service.subject,
      ...(service.audienceIds ||
        (service.audienceId ? [service.audienceId] : [])),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const tags = new Set(corpus.split(" ").filter((term) => term.length > 2));
  for (const [pattern, additions] of rules) {
    if (pattern.test(corpus)) additions.forEach((tag) => tags.add(tag));
  }
  return [...tags];
}
