# Administração da Central de Serviços

O acesso fica em `/admin/login`. As credenciais iniciais são definidas pelo responsável na implantação; não há senha padrão. Veja a preparação do PostgreSQL em [portainer.md](portainer.md).

Senhas novas e redefinições devem ter de 6 a 12 caracteres, podendo incluir letras, números e símbolos. Senhas já cadastradas continuam válidas até serem redefinidas.

## Perfis

O **Administrador geral** gerencia catálogo, diagnóstico e usuários. O **Administrador do catálogo** importa, confere, publica e restaura versões, consulta o histórico e visualiza o diagnóstico. O cadastro público é desabilitado. Desativar uma conta, mudar seu perfil ou redefinir sua senha encerra suas sessões. A aplicação impede retirar o próprio acesso e deixar o sistema sem um administrador geral ativo.

## Planilha e publicação

Envie o XLSX ou use o link oficial do SharePoint. A análise prepara um rascunho privado e não publica alterações. Se editar a planilha depois da análise, analise novamente. A prévia usa o mesmo modelo das páginas públicas, preserva as células originais e permite comparar com a edição atual. Pesquise e selecione serviços por nome, URL ou ID em uma única caixa; o filtro de alterações inclui todos os espelhos da linha.

Um ID novo cria o serviço e sua página ao publicar. Um ID removido OU uma linha marcada em vermelho gera exclusão no relatório e oculta todos os seus espelhos; as células e as URLs ficam preservadas no snapshot atual. A marcação é o preenchimento vermelho na célula de ID ou de nome do serviço, incluindo os tons vermelhos do tema da planilha. Observações vermelhas em outras colunas não excluem o serviço. Reincluir o mesmo ID sem vermelho ou remover uma marcação vermelha reconhecida reativa suas páginas com os dados recebidos. Os IDs devem permanecer fixos, mesmo quando linhas forem apagadas ou reordenadas. Colunas desconhecidas bloqueiam a publicação para revisão do mapeamento.

O teste `scripts/local-admin-exclusion-test.mjs` verifica a publicação e reativação dos três espelhos do ID 22, exclusão por cor e por ausência, preservação de células e URLs e reanálise do mesmo arquivo após mudança da regra. Execute apenas em uma stack local com banco descartável vazio, `LOCAL_ADMIN_SEED=true` e `QA_DISPOSABLE_DATABASE=true`, informando o caminho do XLSX oficial. O teste recusa endereços externos e bancos que já tenham histórico.

O histórico mantém no máximo **20 publicações com mudanças**, incluindo a edição ativa. As antigas, seus arquivos e suas diferenças são excluídos automaticamente. A limpeza não remove as páginas inativas preservadas na edição atual. Operações sem diferenças não geram publicação. A restauração com mudanças gera uma edição nova e não altera os registros anteriores retidos.

O histórico e as diferenças por coluna exibem 10 itens por página. Selecione uma edição e abra a comparação para conferir o antes e o depois. O aviso verde identifica a edição atual em uso; rascunhos não publicados usam aviso amarelo. As páginas de serviços, inclusive prévias e histórico, mantêm acessibilidade, VLibras e assistência por IA. A tela de gestão não exibe os widgets do portal.

## Diagnóstico

A seção fica disponível para os dois perfis e incorpora o relatório Google Data Studio configurado em `lib/admin-diagnostics.ts`. A incorporação deve estar habilitada no Google. O acesso também depende das permissões do relatório na conta Google; o login do admin não concede acesso ao relatório externo.

## Uso da Amanda

A seção fica disponível para os dois perfis e apresenta requisições, tokens, taxa de sucesso, falhas, serviços identificados e histórico recente. É possível consultar intervalos rápidos, todo o histórico ou um período personalizado. A lista detalhada exibe 10 requisições por página e permite navegar por todo o resultado filtrado. Os eventos são persistidos no mesmo PostgreSQL do admin a partir da implantação desta versão; os logs antigos do contêiner não são importados automaticamente.

Não são armazenados pergunta, resposta, endereço IP ou identificação do cidadão. A lista de requisições exibe somente o identificador técnico, o uso do provedor e os serviços que a Amanda identificou. O painel não apresenta estimativas financeiras.
