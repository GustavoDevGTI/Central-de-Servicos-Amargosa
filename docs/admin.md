# Administração da Central de Serviços

O acesso fica em `/admin/login`. As credenciais iniciais são definidas pelo responsável na implantação; não há senha padrão. Veja a preparação do PostgreSQL em [portainer.md](portainer.md).

Senhas novas e redefinições devem ter de 6 a 12 caracteres, podendo incluir letras, números e símbolos. Senhas já cadastradas continuam válidas até serem redefinidas.

## Perfis

O **Administrador geral** gerencia catálogo, diagnóstico e usuários. O **Administrador do catálogo** edita, compara, salva e restaura conteúdo, consulta o histórico e visualiza o diagnóstico. O cadastro público é desabilitado. Desativar uma conta, mudar seu perfil ou redefinir sua senha encerra suas sessões. A aplicação impede retirar o próprio acesso e deixar o sistema sem um administrador geral ativo.

## Editar um serviço

Pesquise por nome, URL ou ID na caixa de seleção e clique em **Editar serviço selecionado**. Altere as informações nos campos e clique em **Comparar antes e depois**. A comparação apresenta duas páginas lado a lado e as diferenças por campo. Até esse momento o catálogo público continua igual. Clique em **Salvar alterações** para aplicar o conteúdo à Central.

Alterar qualquer campo depois de comparar exige uma nova comparação. Se outro administrador salvar uma versão nesse intervalo, o servidor impede sobrescrevê-la com uma edição antiga: recarregue o serviço e compare novamente. Trocar de serviço ou sair com alterações pendentes pede confirmação de descarte.

Os botões de início e ajuda, seus textos e destinos, URLs das páginas, plataforma, IDs e estrutura visual são fixos. O servidor rejeita esses campos mesmo fora do formulário. As páginas e os espelhos existentes são preservados; serviços do mesmo registro recebem o conteúdo em conjunto. O fluxo edita serviços ativos existentes e não cria nem exclui páginas.

Desde 28/10/2026 não há importação de XLSX ou SharePoint no admin. Os arquivos e células de importações anteriores permanecem no histórico; o snapshot mantém a origem arquivada e as edições diretas separadas. A fonte efetiva passa a ser o conteúdo salvo no banco.

O teste `scripts/local-service-editor-test.mjs` verifica o fluxo autenticado em banco local descartável vazio, incluindo os espelhos do ID 22, prévia privada, comparação, salvamento, autoria, concorrência, restauração e limite de 20 edições. Use `LOCAL_ADMIN_SEED=true` e `QA_DISPOSABLE_DATABASE=true`; ele recusa bancos sem o prefixo `central_direct_editor_qa_` e endereços externos. Os testes antigos de importação permanecem como referência do fluxo desativado.

O histórico identifica a conta que fez cada alteração e mantém no máximo **20 publicações com mudanças**, incluindo a edição ativa. As antigas, seus arquivos e suas diferenças são excluídos automaticamente. A limpeza não remove as páginas inativas preservadas na edição atual. Operações sem diferenças não geram publicação. A restauração com mudanças gera uma edição nova: recupera os campos editáveis da versão escolhida e preserva os botões fixos, URLs, estrutura e visibilidade atuais.

A lista tem rolagem. Selecione uma edição e abra a comparação para conferir o antes e o depois. O aviso verde identifica a edição atual em uso; rascunhos não publicados usam aviso amarelo. As páginas de serviços, inclusive prévias e histórico, mantêm acessibilidade, VLibras e assistência por IA. A tela de gestão não exibe os widgets do portal.

## Diagnóstico

A seção fica disponível para os dois perfis e incorpora o relatório Google Data Studio configurado em `lib/admin-diagnostics.ts`. A incorporação deve estar habilitada no Google. O acesso também depende das permissões do relatório na conta Google; o login do admin não concede acesso ao relatório externo.
