# Administração da Central de Serviços

O acesso fica em `/admin/login`. As credenciais iniciais são definidas pelo responsável na implantação; não há senha padrão. Veja a preparação do PostgreSQL em [portainer.md](portainer.md).

## Perfis

O **Administrador geral** gerencia catálogo, diagnóstico e usuários. O **Administrador do catálogo** importa, confere, publica e restaura versões, consulta o histórico e visualiza o diagnóstico. O cadastro público é desabilitado. Desativar uma conta, mudar seu perfil ou redefinir sua senha encerra suas sessões. A aplicação impede retirar o próprio acesso e deixar o sistema sem um administrador geral ativo.

## Planilha e publicação

Envie o XLSX ou use o link oficial do SharePoint. A análise prepara um rascunho privado e não publica alterações. Se editar a planilha depois da análise, analise novamente. A prévia usa o mesmo modelo das páginas públicas, preserva as células originais e permite comparar com a edição atual. Pesquise e selecione serviços por nome, URL ou ID em uma única caixa; o filtro de alterações inclui todos os espelhos da linha.

Um ID novo cria o serviço e sua página ao publicar. Um ID removido gera exclusão no relatório e oculta todos os seus espelhos; as células e as URLs ficam preservadas no snapshot atual. Reincluir o mesmo ID reativa suas páginas com os dados recebidos. Não é necessária marcação vermelha. Colunas desconhecidas bloqueiam a publicação para revisão do mapeamento.

O histórico mantém no máximo **20 publicações com mudanças**, incluindo a edição ativa. As antigas, seus arquivos e suas diferenças são excluídos automaticamente. A limpeza não remove as páginas inativas preservadas na edição atual. Operações sem diferenças não geram publicação. A restauração com mudanças gera uma edição nova e não altera os registros anteriores retidos.

A lista tem rolagem. Selecione uma edição e abra a comparação para conferir o antes e o depois. O aviso verde identifica a edição atual em uso; rascunhos não publicados usam aviso amarelo. As páginas de serviços, inclusive prévias e histórico, mantêm acessibilidade, VLibras e assistência por IA. A tela de gestão não exibe os widgets do portal.

## Diagnóstico

A seção fica disponível para os dois perfis e incorpora o relatório Google Data Studio configurado em `lib/admin-diagnostics.ts`. A incorporação deve estar habilitada no Google. O acesso também depende das permissões do relatório na conta Google; o login do admin não concede acesso ao relatório externo.
