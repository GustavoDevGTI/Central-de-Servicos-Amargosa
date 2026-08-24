# Arquitetura escolhida

## Decisão

O projeto usa uma central pública estática e um editor Electron local. Essa combinação atende ao requisito de não manter login, banco de dados ou informações do cidadão e, ao mesmo tempo, permite que a Prefeitura atualize os direcionamentos sem editar código.

## Fluxo de atualização

1. O editor abre o conteúdo local em `content/site.json` ou uma pasta estática compatível escolhida em **Abrir portal**.
2. Cada página é formada por uma sequência ordenada de segmentos.
3. Cada segmento possui aparência, visibilidade e uma lista ordenada de itens tipados.
4. A equipe altera textos, links, logos, imagens, públicos, categorias e serviços por formulários.
5. A validação verifica a hierarquia, os vínculos entre itens e as URLs.
6. Os serviços são vinculados a públicos como Cidadão, Empresas, Servidor, Órgãos públicos e Turista.
7. Itens de referência definem manualmente a sequência dos serviços mais usados.
8. Cada salvamento cria uma cópia de segurança local.
9. Em um portal aberto, **Recarregar** traz mudanças externas e o controle de conflito impede sobrescrever conteúdo alterado por outra pessoa.
10. **Gerar portal** cria uma nova pasta estática com data e hora, sem sobrescrever exportações anteriores.
11. **Gerar nova versão** copia também os arquivos personalizados da pasta aberta.
12. A pasta gerada é publicada no servidor da Prefeitura.

## Limites desta primeira versão

- os links iniciais apontam para o portal geral de Amargosa e precisam ser substituídos pelos canais específicos;
- novas páginas podem ser estruturadas no editor; a publicação web atual usa a página inicial como rota principal;
- a publicação institucional definitiva ainda depende da definição do ambiente e das credenciais da Prefeitura;
- imagens são incorporadas ao JSON como dados locais e por isso devem permanecer leves.
