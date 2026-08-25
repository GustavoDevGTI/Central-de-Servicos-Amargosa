# Arquitetura escolhida

## Decisão

O projeto usa um portal React canônico e um editor Electron independente. O portal continua público e sem login, banco de dados ou informações do cidadão. A pasta estática é uma entrega opcional para hospedagem convencional, não uma segunda origem do projeto.

## Fluxo de atualização

1. O editor abre a pasta raiz do projeto React, identificada por `package.json`, `app/` ou `src/` e `content/site.json`. Versões estáticas antigas continuam compatíveis.
2. Cada página é formada por uma sequência ordenada de segmentos.
3. Cada segmento possui aparência, visibilidade e uma lista ordenada de itens tipados.
4. A equipe altera textos, links, logos, imagens, públicos, categorias e serviços por formulários.
5. A validação verifica a hierarquia, os vínculos entre itens e as URLs.
6. Os serviços são vinculados a públicos como Cidadão, Empresas, Servidor, Órgãos públicos e Turista.
7. Itens de referência definem manualmente a sequência dos serviços mais usados.
8. As alterações permanecem como rascunho na memória até o botão **Salvar alterações** ser pressionado.
9. O salvamento verifica conflitos, cria uma cópia de segurança, grava `content/site.json` de forma atômica e executa `npm run build`.
10. **Recarregar** traz mudanças externas e o controle de conflito impede sobrescrever conteúdo alterado por outra pessoa.
11. Componentes React, CSS e outros arquivos alterados manualmente são preservados; o construtor grava somente o conteúdo estruturado e seu manifesto.
12. A publicação é uma ação explícita posterior ao salvamento. Ela não acontece automaticamente.
13. Em versões estáticas legadas, **Gerar nova versão** cria uma cópia independente e preserva seus arquivos personalizados.

## Limites desta primeira versão

- os links iniciais apontam para o portal geral de Amargosa e precisam ser substituídos pelos canais específicos;
- novas páginas podem ser estruturadas no editor; a publicação web atual usa a página inicial como rota principal;
- a publicação institucional definitiva ainda depende da definição do ambiente e das credenciais da Prefeitura;
- imagens são incorporadas ao JSON como dados locais e por isso devem permanecer leves.
