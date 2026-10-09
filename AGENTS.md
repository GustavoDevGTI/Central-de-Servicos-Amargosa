# Instruções para agentes do projeto

## Planilha e páginas de serviços

A planilha oficial é a fonte prioritária dos serviços que têm espelho no portal. Esta regra vale para qualquer agente que altere o catálogo, importe planilhas ou mantenha as páginas de serviços.

- Sempre que um serviço for adicionado ou alterado na planilha, verifique se já existe uma página correspondente. Se existir, atualize o serviço e todos os seus espelhos com as informações da nova linha da planilha. Dados antigos do site não podem prevalecer sobre a planilha.
- Os dados e os textos importados devem ser EXATAMENTE iguais às células: preserve grafia, acentos, pontuação, numeração, espaços, quebras de linha, links, campos vazios e textos como “A preencher”. Não reescreva, resuma, corrija nem complete os dados. A exceção de apresentação autorizada abaixo permite distribuir informações entre os campos existentes e omitir duplicatas visuais comprovadas; nunca modificar a célula original.
- Esta prioridade inclui título, descrição, público, requisitos, documentos obrigatórios e opcionais, etapas, locais, horários, custo, prazo, categoria, setor, secretaria, telefone, ramal, e-mail, plataforma e link de acesso. Não preserve um link antigo quando a planilha trouxer outro.
- Use o vínculo explícito entre o ID consolidado da planilha e o serviço. Não deduza correspondência apenas de números herdados de outras fontes. Ao adicionar um vínculo, verifique também URLs alternativas que compartilhem a mesma linha.
- Não acrescente endereço, contato, legislação, estudos, vistorias ou outras instruções de fontes externas às fichas com espelho. Se a planilha estiver incompleta ou contiver um erro, mantenha seu texto e registre a pendência para correção na fonte.
- Ao atualizar a planilha, sincronize `app/workbook-service-data.json` com `scripts/sync-workbook-content.py`, revise os vínculos do catálogo e as exclusões da legenda e confira a apresentação nos componentes existentes em `app/internal-portal.tsx`. Uma importação deve aplicar as células originais por último, sem enriquecimentos posteriores.
- Os serviços sem espelho permanecem publicados e listados como exceções em `docs/textos-literais-planilha.md`. Quando passarem a ter espelho, atualize a página pela planilha e retire o serviço da lista de exceções.
- Antes de concluir ou publicar uma atualização, execute os testes do catálogo, o verificador TypeScript e a comparação do HTML com o XLSX original descritos em `docs/textos-literais-planilha.md`. Verifique cobertura dos registros ativos, campos renderizados sem diferenças e build de produção. Não declare fidelidade à planilha com base apenas nos dados intermediários em JSON.
- Se a conferência encontrar diferenças no projeto local, corrija-as e repita a comparação antes de concluir. Não entregue apenas um levantamento de divergências que podem ser corrigidas no código. Valide também a importação administrativa e todos os espelhos de uma mesma linha; não substitua textos, links ou campos vazios por dados antigos do site.

## Preservação obrigatória do design

A planilha fornece CONTEÚDO, nunca um novo design. Atualizar o conteúdo não autoriza alterar o layout preestabelecido do site.

Extraia da planilha apenas as informações dos serviços. A organização das colunas, os títulos internos, a formatação e a aparência da planilha não são instruções para modificar a apresentação da Central.

- Preserve os componentes, os modelos de página, as classes CSS, fontes, cores, espaçamentos, listas, cartões, botões e comportamento responsivo existentes. Não substitua a página por um renderizador genérico de células. Mudanças de design exigem solicitação explícita do usuário.
- Distribua o texto das etapas nos itens numerados já existentes, mantendo todos os caracteres e a sequência da célula. Não transforme etapas numeradas em um parágrafo corrido. Os marcadores podem ocupar os elementos visuais de numeração existentes.
- Use a lista original de documentos com as células de documentos obrigatórios e opcionais. A coluna consolidada de documentação serve de alternativa quando essas células não estiverem preenchidas; não duplique a mesma documentação em blocos com novos subtítulos.
- Exiba os dados da planilha nos cartões de atendimento existentes. Não crie endereços, horários, contatos ou etapas ausentes na fonte para preencher cartões. Preserve os recursos de navegação e os componentes funcionais existentes, incluindo o cronograma de coleta.
- Antes de publicar, confira tanto a igualdade do conteúdo com o XLSX original quanto a apresentação visual em relação à versão anterior. Validar apenas o texto não basta.
- Ao conferir o site publicado, audite as URLs públicas separadamente do código local e da `main`. Se a versão publicada divergir, registre a pendência de implantação e as diferenças; não declare que o site está atualizado apenas porque o repositório passou na verificação.

## Apresentação sem redundância dos dados de atendimento

Regra autorizada pelo usuário para todos os serviços atuais, novos serviços e novas importações: cada informação de atendimento deve aparecer no campo apropriado, sem repetição no texto introdutório de “Onde e quando solicitar”.

- Telefone, ramal, e-mail e plataforma pertencem aos campos estruturados dos cartões existentes. Se o texto introdutório repetir exatamente o valor que já aparece no cartão, omita apenas essa repetição na apresentação. Conserve as células e as propriedades originais do catálogo.
- Horários e orientações de confirmação de horário pertencem ao campo “Horário” do cartão de atendimento presencial. Se não houver esse cartão, use o cartão de contatos existente. Mova o trecho original sem inventar dias, horas ou disponibilidade.
- O parágrafo introdutório deve conter apenas informações ainda não representadas: condições de acesso, necessidade de agendamento ou outras instruções específicas. Se não restar informação própria, omita o parágrafo; não escreva um resumo artificial para substituí-lo.
- Não remova por palavras-chave isoladas. Um contato diferente, múltiplos telefones, uma instrução adicional ou um trecho não reconhecido deve permanecer visível. Registre conflitos para correção na fonte, sem escolher ou descartar silenciosamente um dos valores.
- Aplique a regra pelo componente compartilhado `app/workbook-where-when.tsx`, também nos serviços importados. Não crie exceções manuais por nome de serviço, não altere o XLSX e não substitua o design dos cartões.
- Antes de concluir, verifique: fonte intacta; informação única preservada; duplicata omitida com equivalente visível; horário no cartão; introdução sem contato repetido; mesmas regras para serviços novos e espelhos. Execute os testes de apresentação e o verificador do HTML, que confere trechos da célula e equivalências, além da igualdade literal dos demais campos.
