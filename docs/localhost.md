# Executar a branch de edição direta em outra máquina

Requisitos: Git, Node.js 22.13 ou superior e Docker com Docker Compose v2. No Windows, inicie o Docker Desktop. Salve o checkout em uma pasta local da máquina.

## Baixar a versão

No repositório existente:

```sh
git fetch origin
git switch --track origin/admin-edicao-direta
```

Se a branch local já existir, use `git switch admin-edicao-direta` e `git pull --ff-only`. Para incorporar esta versão a uma branch pessoal, com o trabalho local salvo em commits, execute `git rebase origin/admin-edicao-direta` na branch pessoal e resolva eventuais conflitos preservando as duas funcionalidades.

## Preparar e iniciar

Na raiz do projeto:

```sh
node scripts/setup-local.mjs
docker compose --env-file .env.docker-local -f compose.local.yml up -d --build
```

O primeiro comando gera `.env.docker-local`, ignorado pelo Git, com segredos aleatórios e a conta inicial **GTI**. Consulte a senha em `BOOTSTRAP_ADMIN_PASSWORD` nesse arquivo; ela tem 12 caracteres. Se preferir outra senha, defina de 6 a 12 caracteres antes da primeira inicialização. Executar o preparador novamente preserva o arquivo existente. Cada máquina tem suas próprias credenciais.

Abra [o admin local](http://127.0.0.1:3100/admin/login) ou [a Central local](http://127.0.0.1:3100). Use exatamente `127.0.0.1` no endereço, conforme a origem configurada. Se a porta estiver ocupada, altere `LOCAL_PORT` no arquivo e use a nova porta no navegador.

O Compose compila o checkout atual, sem depender da imagem `latest` de produção. O portal fica acessível apenas na máquina local e o PostgreSQL não publica uma porta. O projeto Docker se chama `central-servicos-local`, com seu próprio volume de dados. O primeiro início cria as tabelas e o administrador geral automaticamente.

As contas, senhas, sessões, publicações e edições salvas em outro banco não são transferidas pelo Git. Um banco vazio inicia com o catálogo incluído no código e histórico vazio. O formulário oferece busca, edição direta e comparação antes de salvar. Para reproduzir também dados administrativos de outra instalação, é necessário um backup autorizado desse banco.

As páginas e prévias mantêm Amanda e VLibras. Respostas de IA exigem uma chave própria configurada no arquivo local; a pesquisa de serviços continua disponível sem essa chave. O relatório externo do Diagnóstico continua sujeito às permissões do Google.

## Atualizar, conferir e parar

Depois de atualizar ou fazer rebase do código, execute novamente o comando `up -d --build`. Ele recompila a versão atual e preserva o banco. Recarregue a página do navegador.

```sh
docker compose --env-file .env.docker-local -f compose.local.yml ps
docker compose --env-file .env.docker-local -f compose.local.yml logs --tail=60 portal
docker compose --env-file .env.docker-local -f compose.local.yml stop
```

O estado saudável do portal pode ser conferido em `/api/health`. `stop` encerra os contêineres preservando os dados. As variáveis `BOOTSTRAP_ADMIN_*` só criam a primeira conta em um banco vazio: trocar a senha no arquivo depois disso não redefine uma conta existente. Use o gerenciamento de usuários com outro administrador geral para redefinições.
