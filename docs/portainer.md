# Implantação no Portainer

## Antes de atualizar

Use a imagem publicada pelo workflow **Publicar imagem Docker**. A tag `sha-<commit>` permite fixar uma versão, e `latest` aponta para a publicação mais recente. Guarde a tag anterior para retorno. O push não atualiza a stack do Portainer automaticamente.

A stack agora precisa de PostgreSQL, além do portal. Substitua o YAML antigo pelo conteúdo de `docker-compose.yml`, mantendo o mesmo nome da stack e a porta pública usada pelo proxy. Não remova o volume `catalog-data` ao recriar ou atualizar contêineres. Os dados administrativos não ficam dentro da imagem.

## Variáveis no Portainer

| Variável | Configuração |
| --- | --- |
| `BETTER_AUTH_URL` | Origem HTTPS exata do portal, por exemplo `https://servicos.amargosa.ba.gov.br`, sem caminho |
| `BETTER_AUTH_SECRET` | Segredo aleatório com pelo menos 32 caracteres; mantenha-o nas atualizações |
| `POSTGRES_PASSWORD` | Senha aleatória hexadecimal, sem senha padrão; mantenha-a para reutilizar o volume |
| `BOOTSTRAP_ADMIN_NAME` | Nome do primeiro administrador geral |
| `BOOTSTRAP_ADMIN_EMAIL` | E-mail do primeiro administrador |
| `BOOTSTRAP_ADMIN_USERNAME` | Usuário inicial `GTI`; o login não diferencia maiúsculas e minúsculas |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha inicial de 12 a 128 caracteres |
| `PORTAL_PORT` | Porta do host encaminhada pelo proxy para a porta 3000 do portal |
| `IMAGE_NAME` | Imagem GHCR com a tag desejada |

Gere dois valores distintos com `openssl rand -hex 32`, um para o segredo de autenticação e outro para a senha do PostgreSQL. Nunca adicione os valores reais ao repositório. Após o primeiro acesso, remova as variáveis `BOOTSTRAP_ADMIN_*`: elas só são usadas quando não existe nenhuma conta no banco e não redefinem senhas em reinicializações.

Configure também as variáveis `AI_*` e a chave do provedor já utilizada pela Amanda. Sem chave, a busca tradicional continua disponível. O domínio do proxy e `BETTER_AUTH_URL` precisam coincidir; a sessão administrativa usa cookies seguros em HTTPS. O proxy deve encaminhar `Host` e os cabeçalhos de protocolo adequados.

## Atualização e conferência

1. Faça backup do banco existente e guarde o YAML/variáveis atuais.
2. Aguarde o workflow da imagem terminar com sucesso.
3. Atualize o YAML e as variáveis na stack do Portainer.
4. Habilite **Re-pull image** e atualize a stack.
5. Aguarde `catalog-db` ficar saudável e confira os logs de inicialização do portal.
6. Confira `/api/health`, `/`, `/servicos` e uma página de serviço; depois entre em `/admin/login`.
7. Confira catálogo e diagnóstico com os dois perfis. Apenas o administrador geral deve ver Usuários.
8. Antes de publicar conteúdo, importe a planilha oficial, confira as diferenças e as prévias. O banco novo começa com o catálogo original da imagem e histórico vazio.

A inicialização prepara o esquema da mesma versão do Better Auth utilizada pelo portal. A migração é coordenada por trava do PostgreSQL e recusa alterações classificadas como inseguras. O primeiro administrador só é criado em banco sem contas. As tabelas do catálogo são preparadas automaticamente; o healthcheck falha se o catálogo não estiver acessível.

## Persistência, backup e retorno

O PostgreSQL mantém usuários, sessões, arquivos XLSX, snapshots, rascunhos e relatórios no volume. Não publique a porta 5432 do banco. Faça backups regulares, além da retenção de 20 publicações, pois o histórico não substitui um backup.

No console do contêiner PostgreSQL, use `pg_dump -U central -d central_catalog -Fc -f /tmp/central_catalog.dump` e copie o arquivo para armazenamento externo ao contêiner. Para restaurar, interrompa o portal e use `pg_restore` com o backup verificado em um banco de destino adequado. Preserve o segredo de autenticação e a senha do banco junto à configuração protegida da implantação.

Para retornar o código, fixe `IMAGE_NAME` na tag `sha-<commit>` anterior e atualize sem remover o volume. Se também for necessário reverter uma migração de esquema, restaure o backup correspondente em vez de presumir compatibilidade com uma imagem antiga. Para desfazer apenas uma publicação do catálogo, use uma versão retida no histórico do admin.
