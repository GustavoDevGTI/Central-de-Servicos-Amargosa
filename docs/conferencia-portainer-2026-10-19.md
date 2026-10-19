# Conferência para Portainer — 19/10/2026

## Entrega

Administração do catálogo com dois perfis, controle de usuários, importação, prévia, comparação, histórico limitado a 20 publicações com mudanças e diagnóstico Data Studio para os dois perfis. PostgreSQL persistente na stack; preparação do esquema e criação do primeiro administrador na inicialização, sem senha padrão.

As atualizações da `origin/main` foram incorporadas sem descartar as mudanças do catálogo. Arquivos de ambiente, planilhas de demonstração, capturas, logs, caches e saídas temporárias não entram na imagem. Os testes automatizados permanecem no código para regressão e ficam fora da imagem de execução.

As dez publicações de demonstração foram removidas do banco local de desenvolvimento. O catálogo local voltou às 161 páginas originais, com histórico vazio. Esse banco não é enviado ao Portainer: uma instalação nova usa seu próprio volume e começa com o catálogo da imagem.

## Verificações executadas

- TypeScript sem erros e lint sem erros ou avisos.
- 52 testes automatizados aprovados, incluindo busca, Amanda, permissões, importação, espelhos e apresentação literal.
- Fonte XLSX original com SHA-256 `a4202d2e236326bb7acec8ee412291d7488c1614529faa7f63035f50e2fbe61c`: 150 registros, 142 ativos, 145 espelhos e 16 exceções.
- HTML original e HTML após importação: 2.479 ocorrências de campos conferidas, zero diferenças.
- Conferência HTTP da stack Docker: 161 páginas, 145 com espelho, zero diferenças com a fonte.
- Criação do esquema e primeiro administrador em PostgreSQL vazio; login e diagnóstico acessíveis aos dois perfis; gestão de usuários restrita ao administrador geral.
- Importação e publicação do XLSX; criação de serviço; exclusão de um ID ocultando os três espelhos; conteúdo arquivado; restauração e reativação das três URLs; reenvio idêntico sem nova publicação.
- Retenção de 20 publicações em tabelas temporárias isoladas: versão ativa preservada, antigas e diferenças removidas, operação repetível.
- Publicação sem alterações rejeitada; restauração de conteúdo idêntico sem nova publicação; prévias do histórico protegidas por autenticação.
- Substituição do contêiner com preservação dos usuários, catálogo e histórico no volume; reinício sem as variáveis de criação inicial.
- Healthcheck retorna 503 quando o banco está parado e volta a responder após a recuperação.
- Execução da imagem com usuário sem privilégios; ausência de `.env`, `.env.local`, saídas temporárias e ferramentas de migração não utilizadas.

## Dependências e limites da conferência

Atualizados Next para 16.4.2, React/React DOM/React Server Components para 19.2.8, leitura de imagens para image-size 2.0.4 e UUID usado pelo ExcelJS para 11.1.1. As regressões de importação e renderização foram repetidas após as correções.

A auditoria completa ainda aponta avisos na cadeia de ferramentas Vite/Cloudflare/ESLint e na biblioteca `braces`, sem versão corrigida publicada no momento desta conferência. Não foi feita uma atualização ampla dessas ferramentas durante a preparação da stack. Os avisos e o tamanho dos chunks devem continuar sendo acompanhados na manutenção.

A comparação visual no navegador e a renderização dos gráficos do Google não foram confirmadas: a automação de navegador está desativada no Work. O relatório externo respondeu a HTTP, mas sua visualização continua sujeita à incorporação e às permissões definidas no Google.

## Implantação

Esta conferência foi feita em stack Docker isolada. O site público e a stack real do Portainer não são atualizados pelo push. É necessário usar o novo `docker-compose.yml`, preencher as variáveis obrigatórias e preservar o volume do banco, conforme [portainer.md](portainer.md). Em uma instalação existente, faça backup antes da alteração e confira as URLs públicas após implantar.
