import fs from 'node:fs';
import { approvedServiceDetails } from '../app/approved-service-details.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const base = read('content/site.json').pages[0].segments.find(s => s.type === 'catalog').items.filter(s => s.type === 'service');
const generated = fs.existsSync('app/pdf-service-details.json') ? read('app/pdf-service-details.json') : {};
const services = base.map(s => ({ ...s, ...(generated[s.id] ? {} : approvedServiceDetails[s.id]) }));
const pending = read('tmp/pdf-service-gaps/pending-services.json');
const enrichment = read('tmp/pdf-service-gaps/ba-gov-enrichment.json');
const fields = ['Identificação', 'Público', 'Categoria e órgão', 'O que é', 'Quem pode solicitar', 'Documentos', 'Etapas', 'Onde e quando', 'Custo', 'Prazo', 'Links', 'Legislação'];
const existing = new Set(services.filter(s => s.slug).map(s => s.id));
const overrides = {};
const audit = [];
for (const r of pending) {
  const s = services.find(s => norm(s.title) === norm(r['Serviço'])) || services.find(s => s.id === '1doc-' + norm(r['Serviço']).replaceAll(' ', '-')) || services.find(s => s.sourceRow === r['Nº']);
  if (!s) throw Error('Sem correspondência: ' + r['Serviço']);
  const e = enrichment[r['Serviço']] || {};
  const law = r['Legislação / fonte federal-estadual'];
  const stepText = (e.steps || []).join(' ');
  const stepsKnown = !!stepText && norm(stepText) !== norm((e.documents || []).join(' ')) && s.id !== '1doc-lancamento-de-inscricao-imobiliaria';
  const aboutKnown = !!e.about && !['certidao de lancamento de numero de imovel','certidao de valor venal rural','certidao de valor venal urbano'].includes(norm(e.about));
  // As fichas de isenção não confirmam os procedimentos de imunidade e não incidência.
  const sourceMismatch = s.id === '1doc-reconhecimento-de-imunidade-isencao-ou-nao-incidencia';
  const checks = [!!s.title, !!s.audienceIds?.length, !!s.category && !!s.department,
    aboutKnown && !sourceMismatch, !!e.eligibility && !sourceMismatch, !!e.documents?.length && !sourceMismatch, stepsKnown && !sourceMismatch,
    !!e.where_when?.length, !!e.cost && !/a confirmar|não informado/i.test(e.cost),
    !!e.duration && !/indeterminad|não informad|a confirmar/i.test(e.duration),
    !!e.sources?.length, !!law];
  const score = checks.filter(Boolean).length;
  const eligible = score / fields.length > .8;
  audit.push({ id:s.id, title:s.title, originalTitle:r['Serviço'], existing:existing.has(s.id), score, total:fields.length, eligible, missing:fields.filter((_, i) => !checks[i]) });
  if (!eligible || s.summary) continue;
  overrides[s.id] = {
    slug:s.slug || s.id.replace(/^1doc-/, ''),
    summary:e.about || e.steps?.[0] || 'A descrição deste serviço ainda não foi informada.',
    eligibility:e.eligibility || 'Os critérios para solicitar este serviço ainda não foram informados.',
    documents:(e.documents || []).map(x=>x.replace('área ocupado','área ocupada')), steps:stepsKnown ? e.steps : ['Etapas ainda não informadas.'],
    whereWhen:[...(e.where_when || []), 'Horários de atendimento ainda não informados.'].join('. '),
    cost:checks[8] ? e.cost : 'O valor deste serviço ainda não foi definido.',
    duration:checks[9] ? e.duration : 'O prazo estimado deste serviço ainda não foi definido.',
    channels:(e.sources || []).map((x,i) => ({label:'Referência ' + (i+1), value:x.label, url:x.url})),
    legislation:law ? law.split(/\s+(?=https?:)/).filter(x=>x.startsWith('http')).map(url=>({label:url.includes('l5172') ? 'Lei nº 5.172/1966 - Código Tributário Nacional' : 'Legislação relacionada ao serviço',url})) : [],
    notice:'Consulte as orientações desta página e utilize o canal de atendimento para solicitar o serviço.',
    noticeAction:'Acessar o canal de atendimento ↗',
  };
  const detail = overrides[s.id];
  detail.documents = detail.documents.flatMap(x=>x.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/));
  detail.steps = detail.steps.map(x=>x.replace('SAC munipal','SAC Municipal'));
  if (s.id === '1doc-ferias-marcacao-e-alteracao') detail.steps = [
    'Protocole a solicitação no setor de Gestão de Pessoas com antecedência mínima de 30 dias do período pretendido.',
    'Aguarde a análise conforme a conveniência administrativa e a escala da unidade de lotação.',
    'Confirme o período autorizado antes de iniciar o afastamento.'
  ];
  if (s.id === '1doc-licenca-premio') detail.steps = [
    'Verifique no setor de Gestão de Pessoas se o período aquisitivo exigido pela legislação municipal foi completado.',
    'Solicite a análise do período pretendido para a licença.',
    'Aguarde a aprovação, conforme a conveniência administrativa da unidade de lotação.'
  ];
  if (s.id === '1doc-transferencia-de-titularidade-imobiliaria') detail.summary = 'Atualização do titular do imóvel no cadastro imobiliário municipal após a transferência da propriedade.';
  if (s.id === '1doc-revisao-de-caracteristicas-imobiliaria') detail.summary = 'Análise e correção de dados cadastrais do imóvel no banco de dados municipal, como área construída, uso do solo e informações que afetem a tributação.';
  if (s.id === '1doc-certidao-de-comprovacao-de-endereco') detail.whereWhen = detail.whereWhen.replace('Telefone: (75) 3518-7811. ', '');
  if (s.id === '1doc-prescricao-de-credito-tributario-ou-de-renda-iptu-tll-tff') {
    detail.summary = 'Solicitação de análise e reconhecimento da prescrição de débitos tributários municipais, como IPTU, ISS e taxas, para regularização dos registros fiscais quando atendidos os requisitos legais.';
    detail.steps = ['Preencha e assine o requerimento de reconhecimento de prescrição e reúna os documentos do débito.', 'Protocole o pedido no atendimento municipal responsável pelos tributos.', 'Aguarde a análise da constituição do crédito e das condições legais de prescrição pelo setor competente.', 'Acompanhe a decisão e, se o pedido for deferido, a atualização dos registros da dívida ativa.'];
  }
}
console.log(JSON.stringify({existing:existing.size, eligible:audit.filter(x=>x.eligible), distribution:audit.reduce((a,x)=>(a[x.score]=(a[x.score]||0)+1,a),{})},null,2));
if (process.argv.includes('--write')) {
  fs.writeFileSync('app/pdf-service-details.json', JSON.stringify(overrides,null,2)+'\n');
  fs.mkdirSync('tmp/service-review',{recursive:true});
  fs.writeFileSync('tmp/service-review/audit.json',JSON.stringify(audit,null,2));
  fs.writeFileSync('tmp/service-review/services.json',JSON.stringify(services.map(s=>({...s,...overrides[s.id],reviewExisting:existing.has(s.id),reviewCreated:!!overrides[s.id]&&!existing.has(s.id)})),null,2));
}
