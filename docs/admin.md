# Administração da Central de Serviços

O acesso fica em `/admin/login`. As credenciais iniciais são definidas pelo responsável na implantação; não há senha padrão. Veja a preparação do PostgreSQL em [portainer.md](portainer.md).

Senhas novas e redefinições devem ter de 6 a 12 caracteres, podendo incluir letras, números e símbolos. Senhas já cadastradas continuam válidas até serem redefinidas.

## Perfis

O **Administrador geral** gerencia catálogo, diagnóstico e usuários. O **Administrador do catálogo** edita, compara, salva e restaura conteúdo, consulta o histórico e visualiza o diagnóstico. O cadastro público é desabilitado. Desativar uma conta, mudar seu perfil ou redefinir sua senha encerra suas sessões. A aplicação impede retirar o próprio acesso e deixar o sistema sem um administrador geral ativo.

## Editar um serviço

Pesquise por nome, URL ou ID na caixa de seleção e clique em **Editar serviço selecionado**. A comparação e as diferenças por campo são atualizadas automaticamente enquanto você edita. Confira a prévia e clique em **Salvar alterações**, no final da edição ou no início da comparação, para aplicar o conteúdo à Central. Atualizar a prévia não publica nada.

Alterar qualquer campo atualiza novamente a prévia. Os dois botões de salvar gravam os mesmos campos atuais, inclusive quando a atualização da prévia ainda está em andamento. Se outro administrador salvar uma versão nesse intervalo, o servidor impede sobrescrevê-la com uma edição antiga: recarregue o serviço antes de salvar. Trocar de serviço ou sair com alterações pendentes pede confirmação de descarte.

**Desfazer alterações**, ao final da edição ou no início da comparação, recupera os campos e tópicos da versão carregada e devolve Depois ao Antes. Essa ação descarta apenas as alterações ainda não salvas e a prévia temporária, sem publicar nem criar uma edição no histórico. Para reverter uma mudança já salva, use a restauração pelo histórico.

O editor segue os 34 campos e os seis grupos da Carta de Serviço SEI nº 1/2026, com Plataforma e sete campos adicionais de atendimento, totalizando 42 campos; o [mapeamento completo](campos-carta-servico.md) registra a equivalência de cada campo. Os textos e o formato dos botões, o destino da ajuda, URLs internas das páginas e IDs são fixos. Plataforma é um texto editável. “SITE / LINK DE ACESSO” permite alterar o destino de início, com validação HTTP/HTTPS no servidor. O link BA.GOV tem campo próprio.

Em Canais de acesso, escolha onde o atendimento é realizado. “Na própria unidade responsável” reúne os dados em um cartão. “Em outra unidade” disponibiliza Local de atendimento e Unidade responsável, com endereços e contatos independentes. Os dois conjuntos permanecem armazenados ao alternar. Compare antes de salvar; a escolha, os campos e suas diferenças entram no histórico e podem ser restaurados. Abrir um serviço mantém a apresentação histórica até uma edição de atendimento ser comparada e salva.

“STATUS DO SERVIÇO” oculta a página quando Inativo e mantém a página disponível quando Ativo ou Em manutenção. O registro inativo continua aparecendo na busca do admin e pode ser reativado, com os mesmos IDs, URLs e espelhos. O fluxo edita registros existentes, sem criar nem apagar páginas do código.

Responsável pelo preenchimento, contato do responsável, data do preenchimento/atualização e observações para a SIMP ficam somente no admin e no histórico autenticado. Não são enviados ao catálogo público, SSR ou ferramentas da Amanda. Esses campos não substituem o registro automático da conta que salvou a alteração.

Desde 28/10/2026 não há importação de XLSX ou SharePoint no admin. Os arquivos e células de importações anteriores permanecem no histórico; o snapshot mantém a origem arquivada e as edições diretas separadas. A fonte efetiva passa a ser o conteúdo salvo no banco.

O teste `scripts/local-service-editor-test.mjs` verifica o fluxo autenticado em banco local descartável vazio, incluindo os espelhos do ID 22, prévia privada, comparação, salvamento, autoria, concorrência, restauração e limite de 20 edições. Use `LOCAL_ADMIN_SEED=true` e `QA_DISPOSABLE_DATABASE=true`; ele recusa bancos sem o prefixo `central_direct_editor_qa_` e endereços externos. Os testes antigos de importação permanecem como referência do fluxo desativado.

O histórico identifica a conta que fez cada alteração e mantém no máximo **20 publicações com mudanças**, incluindo a edição ativa. As antigas, seus arquivos e suas diferenças são excluídos automaticamente. A limpeza não remove as páginas inativas preservadas na edição atual. Operações sem diferenças não geram publicação. A restauração com mudanças gera uma edição nova: recupera os campos editáveis da versão escolhida, incluindo link de acesso e status, e preserva textos/formato dos botões, destino da ajuda, URLs internas e estrutura.

O histórico e as diferenças por coluna exibem 10 itens por página. Selecione uma edição e abra a comparação para conferir o antes e o depois. O aviso verde identifica a edição atual em uso; rascunhos não publicados usam aviso amarelo. As páginas de serviços, inclusive prévias e histórico, mantêm acessibilidade, VLibras e assistência por IA. A tela de gestão não exibe os widgets do portal.

## Diagnóstico

A seção fica disponível para os dois perfis e incorpora o relatório Google Data Studio configurado em `lib/admin-diagnostics.ts`. A incorporação deve estar habilitada no Google. O acesso também depende das permissões do relatório na conta Google; o login do admin não concede acesso ao relatório externo.

## Uso da Amanda

A seção fica disponível para os dois perfis e apresenta requisições, tokens, taxa de sucesso, falhas, serviços identificados e histórico recente. É possível consultar intervalos rápidos, todo o histórico ou um período personalizado. A lista detalhada exibe 10 requisições por página e permite navegar por todo o resultado filtrado. Os eventos são persistidos no mesmo PostgreSQL do admin a partir da implantação desta versão; os logs antigos do contêiner não são importados automaticamente.

Não são armazenados pergunta, resposta, endereço IP ou identificação do cidadão. A lista de requisições exibe somente o identificador técnico, o uso do provedor e os serviços que a Amanda identificou. O painel não apresenta estimativas financeiras.
