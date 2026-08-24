# Arquitetura escolhida

## Decisão

O projeto usa uma central pública estática e um editor Electron local. Essa combinação atende ao requisito de não manter login, banco de dados ou informações do cidadão e, ao mesmo tempo, permite que a Prefeitura atualize os direcionamentos sem editar código.

## Fluxo de atualização

1. O editor abre o conteúdo local em `content/site.json`.
2. A equipe altera identidade, textos e serviços por formulários.
3. A validação verifica campos obrigatórios e URLs.
4. Os serviços são vinculados a públicos como Cidadão, Empresas, Servidor, Órgãos públicos e Turista.
5. A ordem do arquivo define manualmente a sequência dos serviços mais usados.
6. Cada salvamento cria uma cópia de segurança local.
7. **Gerar portal** cria uma nova pasta estática com data e hora, sem sobrescrever exportações anteriores.
8. A pasta gerada é publicada no servidor da Prefeitura.

## Limites desta primeira versão

- os links iniciais apontam para o portal geral de Amargosa e precisam ser substituídos pelos canais específicos;
- o editor cobre identidade, apresentação, ajuda e cadastro de serviços;
- publicação automática via servidor pode ser adicionada depois, caso a Prefeitura defina o ambiente e as credenciais;
- imagens e modelos visuais adicionais podem ser incluídos sem mudar a arquitetura.
