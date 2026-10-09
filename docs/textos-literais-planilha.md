# Textos literais da planilha

As páginas com espelho usam as células originais de `app/workbook-service-data.json`, sem reescrever pontuação, espaços, numeração, quebras de linha, links ou textos pendentes. O mapeamento é feito pelo vínculo explícito entre o ID do serviço e o ID consolidado da planilha; números herdados de outras fontes não servem como vínculo.

Fonte: aba **Catálogo consolidado**, cópia local de 07/10/2026 da planilha de 22/09/2026. SHA-256 do XLSX: `a4202d2e236326bb7acec8ee412291d7488c1614529faa7f63035f50e2fbe61c`.

São 150 registros: 8 excluídos pela legenda, 142 ativos e 145 páginas com espelho (há URLs que compartilham o mesmo registro). Os 16 serviços abaixo permanecem publicados por orientação do responsável, como exceções sem espelho.

## Verificação

O teste `app/service-catalog.test.ts` verifica cobertura, campos literais e o caso da licença ambiental. Execute com o runner TypeScript usado no projeto (`tsx --test app/service-catalog.test.ts`).

Para comparar também o HTML completo com o XLSX original, execute a partir da raiz:

```sh
tsx scripts/verify-workbook-services.tsx
python scripts/verify-workbook-rendering.py /caminho/para/planilha.xlsx
```

O verificador Python requer `openpyxl`. Os arquivos intermediários são gerados em `tmp/workbook-audit`; não precisam ser versionados. Para atualizar os dados a partir de outra planilha de mesma estrutura:

```sh
python scripts/sync-workbook-content.py /caminho/para/planilha.xlsx
```

Esta alteração trata o catálogo embutido e a apresentação pública. A integração com o painel administrativo em desenvolvimento fica no trabalho desse painel.

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
