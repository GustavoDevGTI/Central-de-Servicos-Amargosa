# Arquitetura do portal

## Visão geral

A Central de Serviços de Amargosa é um único portal React. O conteúdo municipal fica separado da apresentação para facilitar manutenção, revisão e publicação sem duplicar versões do site.

## Camadas

### Conteúdo

`content/site.json` é a fonte estruturada de identidade, páginas, segmentos, públicos, categorias e serviços.

### Interface

`app/` contém as rotas, os componentes React e os estilos. A página inicial apresenta descoberta ampla; páginas internas usam uma composição mais funcional para filtros, resultados e cartas de serviço.

### Arquivos públicos

`public/` armazena fontes, ícones e a imagem de compartilhamento social.

### Compilação e hospedagem

Vinext e Vite compilam a aplicação React para execução compatível com Cloudflare Workers/Sites. A branch `main` representa a versão publicável.

## Fluxo de dados

1. As rotas carregam `content/site.json`.
2. Públicos e categorias determinam os filtros disponíveis.
3. Serviços podem pertencer a um ou mais públicos.
4. A página interna filtra os serviços no navegador.
5. A página final apresenta as orientações e o endereço do canal oficial.

## Rotas

- `/`: página inicial;
- `/menu`: índice acessível;
- `/servicos`: diretório geral;
- `/publicos/[publico]`: filtro por público;
- `/categorias/[categoria]`: filtro por categoria;
- `/servicos/[servico]`: página explicativa.

## Princípios

- ausência de autenticação e persistência de dados pessoais;
- encaminhamento para sistemas oficiais externos;
- conteúdo estruturado e reutilizado entre rotas;
- navegação integral por teclado;
- interface responsiva;
- uma única base React como fonte do portal.
