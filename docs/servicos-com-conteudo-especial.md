# Conteúdo específico dos serviços

Conferência de 06/11/2026, limitada aos serviços. As páginas institucionais não recebem administração de conteúdo.

Foram conferidos os 161 serviços retornados pelo catálogo público, os dois modelos de ficha em `app/internal-portal.tsx`, os cartões de atendimento e os dados estruturados dos serviços. A conferência identifica as seguintes variantes:

| Variante | Tratamento no admin |
| --- | --- |
| Ficha com origem histórica na planilha | Campos editoriais da Carta, plataforma e atendimento; dados históricos preservados |
| Ficha sem espelho da planilha | Mesmos campos, preenchidos com o conteúdo publicado do próprio serviço |
| Atendimento na própria unidade ou em outra unidade | Escolha e dois conjuntos de contatos já disponíveis no editor |
| Etapa 2 e documentos complementares | Campos existentes, com seção pública condicional |
| Informações adicionais e legislação | Campos existentes, preservando os blocos e a gaveta atuais |
| Coleta de lixo — `/servicos/coleta-de-lixo`, ID `1doc-limpeza-publica` | Editor exclusivo de orientações e cronograma, com grupos, locais, rotas, dias e horários |

No catálogo público conferido, nenhum outro serviço expõe cronogramas em cartões (`whereWhenItems`) ou telefones adicionais do modelo importado que precisem de outro editor específico. Há dados de cartões na definição histórica da Ouvidoria, mas eles não estão na ficha publicada atual; esses dados não foram reintroduzidos por cima do catálogo em uso. O componente de coleta é a única ramificação de conteúdo específica por serviço encontrada nos modelos atuais. Novas particularidades devem ser registradas explicitamente e validadas no servidor, sem aplicar campos exclusivos a todo o catálogo.

O cronograma original conserva três grupos, 19 locais e 43 rotas. O editor usa esse conteúdo como valor inicial, sem gravar ao abrir. Ao editar e salvar, o conteúdo específico entra no snapshot e é usado pelo mesmo componente público. Alterações de cronograma têm diferenças legíveis por campo; desfazer recupera a versão carregada e restauração recupera o histórico. O arquivo `app/coleta-cronograma.json` permanece intacto.

Telefones úteis, Sobre o projeto, Organograma, Manual do SEI, Ajuda da plataforma, Reportar problema e demais páginas fora de `/servicos` não foram incorporados ao admin nem alterados por esta entrega.
