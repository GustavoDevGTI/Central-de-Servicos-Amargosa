# Central de Serviços de Amargosa

Portal municipal de direcionamento para serviços públicos e construtor desktop específico para sua manutenção. O cidadão pesquisa um serviço e segue para o canal oficial responsável; a Central não exige login, não possui banco de dados e não armazena dados pessoais.

- Portal publicado: [central-servicos-amargosa.gustavoborges132.chatgpt.site](https://central-servicos-amargosa.gustavoborges132.chatgpt.site/)
- Menu Acessibilidade: [`/menu`](https://central-servicos-amargosa.gustavoborges132.chatgpt.site/menu)
- Versão atual do construtor: **0.7.0**
- Instalador Windows: [`release-desktop/Editor Central de Serviços Amargosa Setup 0.7.0.exe`](release-desktop/Editor%20Central%20de%20Serviços%20Amargosa%20Setup%200.7.0.exe)

## O que existe neste repositório

O projeto possui três entregas que compartilham o mesmo catálogo:

1. **Portal web:** aplicação React responsiva usada na publicação atual.
2. **Construtor desktop:** aplicativo Electron para editar páginas, segmentos e itens sem alterar código.
3. **Portal estático:** versão formada apenas por HTML, CSS, JavaScript, fontes e conteúdo, pronta para hospedagem convencional.

```text
content/site.json
        │
        ├── portal web em app/
        ├── construtor desktop em desktop/
        └── exportação em portal-estatico/
```

## Objetivo e princípios

- Centralizar a descoberta dos serviços municipais.
- Direcionar para os sistemas e canais oficiais já existentes.
- Separar conteúdo, estrutura e apresentação em elementos editáveis.
- Permitir manutenção por pessoas que não programam.
- Manter uma alternativa estática, portátil e sem dependência de servidor de aplicação.
- Não receber cadastros, solicitações ou documentos do cidadão.
- Não manter autenticação, banco de dados ou histórico de pesquisa.

## Stack

| Camada | Tecnologias | Função |
|---|---|---|
| Portal web | React 19, Next.js 16, TypeScript | Componentes, estado da busca e renderização das páginas |
| Build e execução web | Vinext, Vite 8, Cloudflare Workers | Desenvolvimento, compilação e publicação do portal |
| Estilos | CSS responsivo e fontes locais Source Sans 3 e Lora | Identidade visual, modelos de segmentos e acessibilidade |
| Construtor | Electron 43, HTML, CSS e JavaScript | Editor desktop local |
| Instalador | electron-builder e NSIS | Geração do instalador para Windows |
| Conteúdo | JSON, sem banco de dados | Páginas, segmentos, itens, públicos, categorias e serviços |
| Testes e qualidade | Node Test Runner e ESLint | Validação do formato portátil e do código |

O portal web é publicado como uma aplicação compatível com Cloudflare Workers. A pasta `portal-estatico/` não usa React em produção: ela funciona diretamente com os arquivos exportados.

## Requisitos para desenvolvimento

- Node.js **22.13.0 ou superior**.
- npm.
- Windows para executar ou empacotar o construtor Electron.

Instale as dependências:

```bash
npm install
```

## Executar o portal web

Ambiente de desenvolvimento:

```bash
npm run dev
```

Compilação de produção:

```bash
npm run build
```

Executar a compilação local:

```bash
npm run start
```

## Como o conteúdo é organizado

O arquivo principal é `content/site.json`. A estrutura atual usa `schemaVersion: 3` e segue esta hierarquia:

```text
Site
└── Páginas
    └── Segmentos ordenados
        └── Itens ordenados e tipados
```

Uma página possui nome, endereço e segmentos. Cada segmento possui:

- identificador e nome;
- tipo, como cabeçalho, busca, públicos, destaques, categorias ou catálogo;
- estado visível ou oculto;
- modelo visual e ajustes de cor, largura, espaçamento, cantos e imagem de fundo;
- lista de itens editáveis.

Os principais tipos de item são texto, link, imagem, busca, público, categoria, serviço e referência de serviço. As referências determinam manualmente a ordem dos serviços mais usados sem duplicar o cadastro do serviço.

## O que o construtor faz

O construtor foi criado especificamente para a Central de Serviços de Amargosa. Ele permite:

- criar e editar páginas;
- adicionar, remover, ocultar e reordenar segmentos;
- editar separadamente cada item de um segmento;
- redimensionar segmentos e itens diretamente na prévia por oito alças laterais e de canto;
- cadastrar textos, links, logos e imagens;
- organizar públicos, categorias e serviços;
- escolher modelos visuais diferentes para cada segmento;
- visualizar o portal em desktop, tablet e celular;
- validar hierarquia, referências e URLs;
- gerar cópias de segurança locais do conteúdo;
- criar uma nova pasta estática publicável;
- abrir e continuar editando versões estáticas existentes;
- preservar personalizações feitas manualmente fora do aplicativo.

Os tamanhos personalizados ficam registrados no conteúdo do portal. O botão **Restaurar automático**, disponível na aba Design, devolve o elemento ao comportamento responsivo padrão.

### Abrir o construtor durante o desenvolvimento

```bash
npm run editor
```

Também é possível instalar e abrir a versão distribuída na pasta `release-desktop/`.

## Como usar o construtor

### Editar o projeto interno

1. Abra o construtor.
2. Escolha a página e o segmento na coluna esquerda.
3. Use **Conteúdo** para editar itens e **Design** para escolher o modelo e ajustar a aparência.
4. Confira a prévia central em desktop, tablet ou celular.
5. Use **Validar**.
6. Use **Salvar alterações**.
7. Use **Gerar portal** para criar uma pasta estática com data e hora.

### Abrir uma versão estática existente

1. Clique em **Abrir portal**.
2. Selecione a **pasta principal** do portal. Não selecione o arquivo `index.html` e não escolha a subpasta `menu/`.
3. A pasta correta deve conter `index.html` e ao menos um arquivo de conteúdo compatível.
4. O construtor procura, nesta ordem, a representação de conteúdo mais recente entre `content.js` e `content.json`. Versões antigas com `content/site.json` ou `site.json` também são aceitas.
5. O nome da pasta e a versão aparecem abaixo do título do construtor.

Ao abrir um portal, seus arquivos CSS são usados na prévia. O aplicativo utiliza o modelo estruturado para apresentar páginas, segmentos e itens editáveis.

### Trazer alterações feitas fora do construtor

Se um colega modificar o portal manualmente:

1. Abra novamente a pasta com **Abrir portal**, ou clique em **Recarregar** se ela já estiver aberta.
2. O construtor lê novamente o conteúdo e os estilos externos.
3. Continue a edição normalmente.
4. Use **Atualizar portal aberto** para sincronizar o conteúdo na mesma pasta.

Se `content.js` ou `content.json` mudar externamente enquanto há uma edição aberta, o salvamento é bloqueado. É necessário usar **Recarregar** antes de salvar, evitando a perda do trabalho do colega.

### Gerar outra versão a partir de um portal aberto

Use **Gerar nova versão**. Nesse caso, o construtor copia a pasta aberta inteira antes de atualizar o conteúdo. Alterações manuais em HTML, CSS, JavaScript, fontes e outros arquivos acompanham a nova versão.

O construtor não converte código HTML ou JavaScript arbitrário em novos controles visuais. Para que um conteúdo continue editável como segmento ou item, ele deve permanecer representado em `content.js` ou `content.json`.

## Como funciona o portal estático

A versão estática atual está em `portal-estatico/` e contém:

```text
portal-estatico/
├── index.html                 Página principal
├── content.js                Conteúdo usado diretamente pelo navegador
├── content.json              Representação portátil para edição
├── portal-project.json       Formato e versão do construtor
├── app.js                    Busca, filtros e interações
├── styles.css                Estilos-base
├── dynamic.css               Modelos e variações dos segmentos
├── accessibility.css         Teclado, foco e leitores de tela
├── fonts.css e fonts/        Fontes locais
└── menu/                     Menu Acessibilidade
```

O navegador carrega `content.js`, monta os segmentos e conecta busca, filtros, públicos, categorias, serviços e Amanda. O conteúdo final permanece separado do HTML principal.

Para visualizar, abra `portal-estatico/index.html`. Para publicar, envie todo o conteúdo da pasta sem alterar sua estrutura relativa.

### Editar a versão estática manualmente

- Edite `content.js` quando a mudança precisar aparecer imediatamente no navegador.
- Edite `content.json` quando preferir trabalhar em JSON puro; depois abra ou recarregue a pasta no construtor e salve para sincronizar `content.js`.
- Alterações de apresentação podem ser feitas em `styles.css`, `dynamic.css` e `accessibility.css`.
- Alterações estruturais avançadas podem ser feitas em `index.html` e `app.js`, sabendo que código arbitrário será preservado, mas não convertido em campos do construtor.

### Regenerar a pasta estática do repositório

```bash
npm run portal:export
```

Esse comando recria `portal-estatico/` usando os modelos atuais e `content/site.json`. Ele substitui a pasta gerada; não deve ser usado sobre uma versão que contenha personalizações manuais ainda não incorporadas aos modelos em `desktop/templates/`.

## Busca e direcionamento

A busca filtra serviços por título, secretaria, categoria e destino. Os públicos e as categorias também funcionam como filtros. Ao selecionar um serviço, o usuário segue para a URL oficial cadastrada.

Os links existentes no conteúdo inicial ainda devem ser revisados e substituídos pelos endereços oficiais específicos de cada serviço antes da publicação institucional definitiva.

## Menu Acessibilidade

A rota `/menu` é um subsite simplificado com todos os blocos abertos e hierarquia vertical:

```text
Público → Categoria → Serviço
```

Exemplo: `Cidadão → Tributos → Consultar IPTU`. O último nível direciona diretamente ao canal configurado. Na exportação estática, a mesma interface fica em `menu/index.html`.

## Acessibilidade

O portal e a exportação estática incluem:

- estrutura semântica de títulos, regiões, listas, formulários e navegação;
- atalhos para conteúdo, busca, públicos e serviços;
- navegação integral por teclado;
- foco visível com alto contraste;
- controles com nomes e estados anunciáveis;
- resultados da busca em região viva;
- diálogo da Amanda com contenção e restauração de foco;
- suporte a preferência de movimento reduzido e modo de cores forçadas;
- layout responsivo e busca adaptada para telas pequenas;
- estrutura preparada para NVDA, TalkBack e VoiceOver.

O Menu Acessibilidade complementa a experiência, mas não substitui a compatibilidade do portal principal com leitores de tela e teclado.

## Amanda

Amanda é o espaço reservado para a futura agente de IA da Central. A interface atual demonstra a conversa e as sugestões iniciais, mas não está conectada a um modelo de inteligência artificial. As mensagens da demonstração não são enviadas para servidor nem armazenadas.

## Comandos disponíveis

| Comando | Resultado |
|---|---|
| `npm run dev` | Inicia o portal web em desenvolvimento |
| `npm run build` | Compila o portal para produção |
| `npm run start` | Executa a compilação local |
| `npm run lint` | Verifica o código web |
| `npm run editor` | Abre o construtor Electron |
| `npm run editor:package` | Gera o instalador Windows |
| `npm run portal:export` | Recria `portal-estatico/` |
| `node --test tests/portal-project.test.mjs` | Testa abertura e atualização de portais estáticos |

## Gerar o instalador Windows

```bash
npm run editor:package
```

O instalador é criado em `release-desktop/`. A distribuição deste repositório mantém somente o instalador mais recente; diretórios temporários, mapas de atualização e instaladores anteriores não devem ser versionados.

## Fluxo recomendado de manutenção

1. Abra no construtor a versão atualmente usada pela equipe.
2. Recarregue possíveis alterações externas.
3. Edite e valide o conteúdo.
4. Gere uma nova versão estática.
5. Teste links, busca, teclado e visualização móvel.
6. Atualize `portal-estatico/` com a versão aprovada.
7. Gere o novo instalador do construtor quando houver mudanças no aplicativo ou nos modelos.
8. Mantenha apenas o instalador mais recente.
9. Execute testes, lint e build.
10. Faça commit e push do código, portal estático, documentação e instalador atual.

## Estrutura do código-fonte

```text
app/                         Portal React e rota /menu
content/site.json            Fonte de conteúdo do projeto interno
desktop/main.cjs             Janela, arquivos, validação, importação e exportação
desktop/portal-project.cjs   Formato portátil e leitura de versões estáticas
desktop/renderer/            Interface do construtor
desktop/templates/           Modelo usado nas exportações estáticas
portal-estatico/             Portal pronto para hospedagem
public/                      Fontes, favicon e imagem social
release-desktop/             Instalador Windows atual
scripts/export-static.mjs    Exportação reproduzível para o repositório
tests/                       Testes do formato portátil
```

## Segurança e privacidade

- Não há contas de usuário ou autenticação no portal.
- Não há banco de dados.
- A pesquisa acontece na memória do navegador.
- O portal não recebe formulários de solicitação de serviço.
- Serviços externos abrem os canais oficiais configurados.
- Credenciais de publicação e arquivos `.env` não devem ser enviados ao repositório.

## Fontes e licenças

As fontes Source Sans 3 e Lora são distribuídas localmente. Os respectivos arquivos de licença OFL estão em `public/fonts/`, `desktop/templates/fonts/` e `desktop/licenses/`.

Para detalhes adicionais sobre decisões do projeto, consulte [ARQUITETURA.md](ARQUITETURA.md).
