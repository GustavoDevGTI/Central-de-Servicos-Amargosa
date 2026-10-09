# Conteúdo da planilha no design existente

A planilha é a fonte prioritária das fichas que têm espelho. Um registro novo ou alterado deve atualizar todas as páginas correspondentes. A regra permanente está em `AGENTS.md`: atualizar conteúdo nunca autoriza mudar o design.

Fonte: aba Catálogo consolidado, planilha de 22/09/2026. SHA-256 da cópia utilizada: `a4202d2e236326bb7acec8ee412291d7488c1614529faa7f63035f50e2fbe61c`.

São 150 registros: oito excluídos pela legenda, 142 ativos e 145 páginas com espelho. Os 16 serviços sem correspondência abaixo permanecem publicados por orientação do responsável.

## Apresentação

Os modelos de página e estilos existentes foram preservados. Título, descrição, requisitos, documentos, passos, atendimento, custo, prazo, contatos e links vêm das células originais. As etapas são repartidas apenas nos marcadores numerados, sem modificar o texto, e exibidas na lista existente com os números em destaque. Os documentos obrigatórios e opcionais ocupam a lista original. A documentação consolidada é usada somente se essas duas colunas estiverem vazias, evitando duplicação.

Os cartões de atendimento usam os dados da planilha. Informações ausentes não são completadas com dados de outras fontes. O cronograma de coleta e os componentes de navegação existentes são preservados como recursos do portal. Os arquivos de CSS e o componente de layout global não foram alterados.

### Onde e quando solicitar sem repetição

Por autorização do usuário, a célula original continua intacta, mas a apresentação distribui seus trechos nos campos existentes. Telefones, e-mails, ramais e canais idênticos aos valores visíveis nos cartões não são repetidos na introdução. Horários e a orientação de confirmar o atendimento vão para o campo Horário do cartão existente. Informações próprias, contatos diferentes e instruções não reconhecidas continuam visíveis. Se não houver informação própria, o parágrafo introdutório é omitido.

O componente compartilhado `app/workbook-where-when.tsx` aplica a regra automaticamente, inclusive após novas importações. O verificador independente confere a cobertura da célula: cada trecho deve estar visível sem reescrita, ou ser uma repetição comprovada de um campo visível. Essa é uma exceção de apresentação, não uma autorização para alterar a fonte, inventar informações ou redesenhar a página.

## Verificação e atualização

```sh
tsx --test app/service-catalog.test.ts
tsx --test app/workbook-where-when.test.tsx
tsx scripts/verify-workbook-services.tsx
python scripts/verify-workbook-rendering.py /caminho/para/planilha.xlsx
python scripts/audit-published-workbook.py /caminho/para/planilha.xlsx
npm run build
```

O Python requer `openpyxl`. O verificador compara o texto dos elementos visíveis do HTML completo com o XLSX, incluindo a concatenação dos marcadores e textos dos passos. Também verifica a lista original de documentos, a ausência dos blocos duplicados e os componentes de etapas e atendimento. Os resultados intermediários são gerados em `tmp/workbook-audit` e não precisam ser versionados.

A auditoria pública consulta todas as URLs, incluindo as exceções, e salva o HTML e a comparação em `tmp/workbook-audit/published-final`. Ela deve ser interpretada separadamente da renderização local: um repositório atualizado não comprova que a mesma versão já foi implantada. A conferência de 09/10/2026 está em `docs/conferencia-planilha-2026-10-09.md`.

Para sincronizar outra planilha com a mesma estrutura:

```sh
python scripts/sync-workbook-content.py /caminho/para/planilha.xlsx
```

Revise os vínculos explícitos de IDs e a legenda de exclusões; não associe serviços apenas por números de outras fontes. Quando uma exceção ganhar um espelho, vincule-a, atualize todas as suas páginas e remova-a da lista abaixo. A integração com o painel administrativo em desenvolvimento deve observar as mesmas regras.

## Exceções sem espelho

- [Câmara de Vereadores](https://maisdigital.amargosa.ba.gov.br/servicos/camara-de-vereadores) — `1doc-camara-de-vereadores`
- [Concurso](https://maisdigital.amargosa.ba.gov.br/servicos/concurso) — `1doc-concurso`
- [Convênios (diversos)](https://maisdigital.amargosa.ba.gov.br/servicos/convenios-diversos) — `1doc-convenios-diversos`
- [Isenção de IPTU](https://maisdigital.amargosa.ba.gov.br/servicos/isencao-de-iptu) — `1doc-isencao-de-iptu`
- [Isenção de taxas](https://maisdigital.amargosa.ba.gov.br/servicos/isencao-de-taxas) — `1doc-isencao-de-taxas`
- [Limpeza pública](https://maisdigital.amargosa.ba.gov.br/servicos/limpeza-publica) — `ba-gov-limpeza-publica`
- [Outros — órgãos públicos e ONGs](https://maisdigital.amargosa.ba.gov.br/servicos/outros-orgaos-publicos-e-ongs) — `1doc-outros-orgaos-publicos-e-ongs`
- [Requerimento ao Gabinete da SEAFI](https://maisdigital.amargosa.ba.gov.br/servicos/requerimento-gabinete-seafi) — `1doc-requerimento-gabinete-seafi`
- [Solicitações para eventos esportivos, caminhadas e carreatas](https://maisdigital.amargosa.ba.gov.br/servicos/solicitacoes-para-eventos-esportivos-caminhadas-carreatas-e-etc) — `1doc-solicitacoes-para-eventos-esportivos-caminhadas-carreatas-e-etc`
- [Transferência de corpos](https://maisdigital.amargosa.ba.gov.br/servicos/transferencia-de-corpos) — `ba-gov-transferencia-de-corpos`
- [2ª via do IPTU](https://maisdigital.amargosa.ba.gov.br/servicos/segunda-via-iptu) — `carta-segunda-via-iptu`
- [Declaração de matrícula](https://maisdigital.amargosa.ba.gov.br/servicos/declaracao-de-matricula) — `carta-declaracao-de-matricula`
- [Emissão de boletim escolar](https://maisdigital.amargosa.ba.gov.br/servicos/emissao-de-boletim-escolar) — `carta-emissao-de-boletim-escolar`
- [Matrícula escolar](https://maisdigital.amargosa.ba.gov.br/servicos/matricula-escolar) — `carta-matricula-escolar`
- [Segunda via de documentos escolares](https://maisdigital.amargosa.ba.gov.br/servicos/segunda-via-de-documentos-escolares) — `carta-segunda-via-de-documentos-escolares`
- [Solicitação de histórico escolar](https://maisdigital.amargosa.ba.gov.br/servicos/solicitacao-de-historico-escolar) — `carta-solicitacao-de-historico-escolar`
