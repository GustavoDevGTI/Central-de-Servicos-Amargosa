# Atendimento sem repetição

A regra de apresentação solicitada em 09/10/2026 está implementada no componente compartilhado `app/workbook-where-when.tsx`, aplicada às fichas existentes e às futuras importações, e documentada no `AGENTS.md`.

Contatos e plataforma idênticos aos valores visíveis nos cartões deixam de ser repetidos na introdução de “Onde e quando solicitar”. O trecho original com horários ou orientação de confirmação vai para o campo Horário do cartão existente. Se não restar informação específica na introdução, o parágrafo é omitido. Contatos diferentes, condições de agendamento, instruções adicionais e formatos não reconhecidos permanecem visíveis.

As células e as propriedades originais do catálogo não são alteradas. A auditoria independente verifica a cobertura dos trechos da célula, a posição do horário no cartão e o equivalente visível de cada duplicata omitida. Não foram modificados arquivos CSS, cores, fontes ou o modelo das páginas.

Validação: 52 testes aprovados; 145 páginas com espelho conferidas contra o XLSX original, com 2.479 ocorrências visíveis verificadas; importação administrativa do mesmo XLSX com 145 páginas aprovada; builds de produção da main e do projeto local concluídos. A prévia visual de férias confirma a introdução omitida e os dados nos cartões existentes.

Essas verificações se referem ao código e à prévia local. A atualização do repositório não confirma a implantação no site público.
