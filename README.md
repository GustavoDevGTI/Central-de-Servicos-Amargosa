# Central de Serviços de Amargosa

Portal municipal de direcionamento para serviços públicos e construtor desktop específico para sua manutenção. O cidadão pesquisa um serviço e segue para o canal oficial responsável; a Central não exige login, não possui banco de dados e não armazena dados pessoais.

- Portal publicado: [central-servicos-amargosa.gustavoborges132.chatgpt.site](https://central-servicos-amargosa.gustavoborges132.chatgpt.site/)
- Menu Acessibilidade: [`/menu`](https://central-servicos-amargosa.gustavoborges132.chatgpt.site/menu)
- Versão atual do construtor: **0.8.2**
- Instalador Windows: [baixar a versão mais recente pelo GitHub Releases](https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa/releases/latest)

## O que existe neste repositório

O projeto possui três entregas que compartilham o mesmo catálogo:

1. **Portal web:** aplicação React responsiva usada na publicação atual.
2. **Construtor desktop:** aplicativo Electron para editar páginas, segmentos e itens sem alterar código.
3. **Portal estático:** versão formada apenas por HTML, CSS, JavaScript, fontes e conteúdo, pronta para hospedagem convencional.

```text
Projeto React canônico
├── app/                     interface e comportamento
├── content/site.json        conteúdo editável
├── desktop/                 construtor independente
└── portal-estatico/         exportação legada opcional
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

## Instalação completa

### Opção 1 — instalar somente o construtor no Windows

1. Abra a página do [Release mais recente](https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa/releases/latest).
2. Em **Assets**, baixe o instalador `Editor Central de Serviços Amargosa Setup 0.8.2.exe`.
3. Execute o instalador e abra **Editor — Central de Serviços de Amargosa**.
4. Clique em **Abrir portal** e selecione a pasta raiz deste projeto React. Não selecione `index.html`.

O instalador contém apenas o aplicativo editor. O portal continua sendo um projeto independente, versionado neste repositório.

### Opção 2 — instalar portal React e construtor pelo código-fonte

```bash
git clone https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa.git
cd Central-de-Servicos-Amargosa
npm install
```

Depois da instalação, use `npm run dev` para o portal ou `npm run editor` para o construtor.

### Opção 3 — usar somente o portal estático

Baixe o repositório e abra `portal-estatico/index.html`, ou publique todo o conteúdo dessa pasta em um servidor web convencional. Essa opção não exige Node.js.

## Executar o portal web

Ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Rotas úteis:

- [http://localhost:3000/publicos/cidadao](http://localhost:3000/publicos/cidadao) — serviços do cidadão;
- [http://localhost:3000/categorias/tributos](http://localhost:3000/categorias/tributos) — serviços tributários;
- [http://localhost:3000/servicos/isencao-de-iptu](http://localhost:3000/servicos/isencao-de-iptu) — página explicativa;
- [http://localhost:3000/menu](http://localhost:3000/menu) — Menu Acessibilidade.

Compilação de produção:

```bash
npm run build
```

Executar a compilação local de produção:

```bash
npm run start
```

O comando `npm run start` deve ser executado depois de `npm run build`. Por padrão, o portal fica disponível em `http://localhost:3000`.

## Mudanças da versão 0.8.2

- a prévia do construtor agora executa os próprios componentes React e os mesmos arquivos CSS do portal;
- remoção da segunda implementação visual baseada em `desktop/templates/app.js` para projetos React;
- rascunho React isolado em pasta temporária: mudanças aparecem na prévia sem alterar `content/site.json` antes de salvar;
- seleção, destaque, redimensionamento, arraste e guias continuam disponíveis sobre a renderização React real;
- páginas inicial, internas e explicativas são abertas no mesmo runtime visual usado pelo portal;
- o processo de prévia é encerrado e seus arquivos temporários são removidos ao fechar normalmente o construtor.

## Mudanças da versão 0.8.1

- nova identidade baseada na bandeira de Amargosa, aplicada ao portal, à prévia e ao construtor;
- paleta verde e branca compartilhada entre todas as páginas;
- cabeçalho da página inicial sem marca duplicada e com navegação centralizada;
- páginas internas simplificadas, independentes do desenho da página inicial;
- remoção da barra superior de modos de navegação;
- busca, categoria, público, órgão responsável e inicial reunidos em um único painel de filtros;
- serviços internos exibidos em grade de cartões lado a lado, com quatro colunas no desktop e adaptação responsiva;
- prévia e portal React usando o mesmo conteúdo, estilos e regras de identidade;
- construtor modularizado em estado, edição, prévia, comunicação, arquivos, backups, validação e compilação;
- exportação estática atualizada com as mesmas páginas internas e identidade visual.

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
- cinco modelos visuais próprios para cada tipo de segmento;
- ajustes de cor, largura, espaçamento, cantos, imagem de fundo e fontes de títulos e textos;
- modelos de busca com degradê, geometria, composição compacta, imagem principal ou carrossel de até seis imagens;
- lista de itens editáveis.

Os principais tipos de item são texto, link, imagem, busca, público, categoria, serviço e referência de serviço. As referências determinam manualmente a ordem dos serviços mais usados sem duplicar o cadastro do serviço.

## O que o construtor faz

O construtor foi criado especificamente para a Central de Serviços de Amargosa. Ele permite:

- criar e editar páginas;
- adicionar, remover, ocultar e reordenar segmentos;
- editar separadamente cada item de um segmento;
- redimensionar segmentos e itens diretamente na prévia por oito alças laterais e de canto;
- mesclar visualmente segmentos consecutivos sem perder a edição individual de cada um;
- cadastrar textos, links, logos e imagens;
- organizar públicos, categorias e serviços;
- escolher modelos visuais diferentes para cada segmento;
- selecionar **Site completo** para aplicar um tema estrutural coerente a todos os segmentos;
- trocar a paleta global, redistribuindo fundos, textos, superfícies e destaques por todo o portal;
- definir famílias de títulos e textos e uma escala tipográfica geral para o site inteiro;
- escolher separadamente os efeitos de hover e clique dos botões, inclusive a opção sem efeito;
- visualizar Desktop, Tablet e Celular em modo Legível, ajustado à largura disponível e com rolagem até o rodapé, ou em 100% para inspeção do tamanho real;
- escolher por segmento a família e o tamanho das fontes, mantendo a adaptação responsiva no portal gerado;
- visualizar o portal em desktop, tablet e celular;
- validar hierarquia, referências e URLs;
- gerar cópias de segurança locais do conteúdo;
- criar uma nova pasta estática publicável;
- abrir diretamente a pasta raiz do projeto React canônico;
- abrir e continuar editando versões estáticas existentes;
- preservar personalizações feitas manualmente fora do aplicativo.

Os tamanhos personalizados ficam registrados no conteúdo do portal. O botão **Restaurar automático**, disponível na aba Design, devolve o elemento ao comportamento responsivo padrão.

Na aba **Design**, a opção **Mesclar com o segmento anterior** remove a linha de separação e une os cantos dos dois blocos. A estrutura continua separada no construtor para que cada segmento e seus itens possam ser selecionados e editados normalmente.

### Abrir o construtor durante o desenvolvimento

```bash
npm run editor
```

Também é possível baixar e instalar a versão distribuída na página [Releases](https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa/releases/latest).

## Como usar o construtor

### Editar o portal React canônico

1. Abra o construtor.
2. Clique em **Abrir portal** e selecione a pasta raiz que contém `package.json`, `app/` e `content/site.json`. Durante o desenvolvimento deste repositório, essa pasta é reconhecida automaticamente.
3. Escolha **Site completo** para temas, paletas e tipografia geral, ou selecione um segmento para ajustes locais.
4. Use **Conteúdo** para editar itens e **Design** para escolher o modelo e ajustar a aparência.
5. Confira a prévia central em desktop, tablet ou celular e use **Validar**.
6. Enquanto você edita, as mudanças ficam somente na memória do construtor.
7. Pressione **Salvar alterações**. Só nesse momento o aplicativo cria o backup, grava `content/site.json` e executa `npm run build`.

O construtor e o portal têm ciclos independentes. Atualizar o aplicativo não cria outro portal e editar o portal não cria outro instalador. Existe um único projeto React, incrementado dentro ou fora do construtor.

Se `npm run dev` estiver aberto, o servidor de desenvolvimento perceberá a gravação feita pelo botão **Salvar alterações** e atualizará a página. Em produção nada é publicado automaticamente: ainda é necessário fazer commit e executar o fluxo explícito de publicação.

### Abrir um projeto React ou uma versão estática existente

1. Clique em **Abrir portal**.
2. Selecione a **pasta principal** do portal. Não selecione o arquivo `index.html` e não escolha a subpasta `menu/`.
3. Para React, a pasta correta contém `package.json`, `app/` ou `src/`, e `content/site.json`. Não selecione um arquivo interno.
4. Para uma versão estática legada, a pasta deve conter `index.html` e `content.js` ou `content.json`.
5. Em versões estáticas, o construtor procura a representação de conteúdo mais recente entre `content.js` e `content.json`. Versões antigas com `content/site.json` ou `site.json` também são aceitas.
6. O nome da pasta, o tipo e a versão aparecem no construtor.

Ao abrir um projeto React, o construtor inicia uma cópia temporária e isolada do próprio portal. A prévia executa os componentes de `app/` e os mesmos arquivos CSS usados no navegador. As alterações em edição são gravadas somente nessa cópia temporária; a pasta real muda apenas ao pressionar **Salvar alterações**. Para versões estáticas antigas, permanece disponível a prévia compatível baseada nos arquivos do próprio portal estático.

### Trazer alterações feitas fora do construtor

Se um colega modificar o portal manualmente:

1. Abra novamente a pasta com **Abrir portal**, ou clique em **Recarregar** se ela já estiver aberta.
2. O construtor lê novamente o conteúdo externo. Arquivos React, CSS e demais arquivos de código continuam intactos.
3. Continue a edição normalmente.
4. Use **Salvar alterações** no projeto React ou **Atualizar portal aberto** na versão estática.

Se o arquivo de conteúdo mudar externamente enquanto há uma edição aberta, o construtor avisa ao recuperar o foco e bloqueia o salvamento conflitante. Use **Recarregar** antes de salvar, evitando a perda do trabalho do colega. Não existe consulta periódica nem sincronização silenciosa.

### Compilar e gerar versões estáticas

Em um projeto React aberto, **Salvar alterações** grava e compila o mesmo projeto. **Compilar portal** repete apenas a compilação, sem criar cópias com data e hora. Em uma versão estática aberta, **Gerar nova versão** cria uma cópia independente e preserva os arquivos personalizados da origem.

O construtor não converte automaticamente código React, HTML ou JavaScript arbitrário em controles visuais. Para continuar editável como segmento ou item, o conteúdo precisa permanecer representado em `content/site.json` no React ou em `content.js`/`content.json` no estático. Alterações manuais nos componentes e estilos são preservadas e podem complementar o conteúdo estruturado.

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

A busca grande da página inicial filtra serviços por título, secretaria, categoria e destino. Ao escolher um público ou uma categoria, o portal abre uma página interna sem o destaque de busca da página inicial: permanecem o cabeçalho e uma busca contextual compacta acima da lista de serviços.

- `/publicos/cidadao`: exibe todos os serviços relacionados ao público escolhido e permite filtrar por nome, categoria, público, órgão responsável e inicial.
- `/categorias/tributos`: exibe os serviços da categoria escolhida com o mesmo conjunto de filtros contextuais.
- `/servicos/isencao-de-iptu`: abre a página explicativa do serviço, com público atendido, órgão responsável, documentos, etapas, custo, prazo e acesso ao canal oficial.

Na exportação estática, o mesmo fluxo usa endereços compatíveis com abertura direta da pasta: `?publico=cidadao`, `?categoria=tributos` e `?servico=isencao-de-iptu`.

Um mesmo serviço pode estar relacionado a mais de um público. Essa relação é editável no construtor e é usada automaticamente pelos filtros das páginas internas.

### Modelos das páginas internas no construtor

As páginas internas não são estruturas fixas separadas do editor. No seletor **Página**, o construtor oferece:

- **Listagem por público ou categoria**, formada pelos segmentos Introdução da página interna, Busca específica e filtros e Serviços relacionados;
- **Página explicativa de serviço**, formada pelos segmentos Apresentação do serviço e Orientações do serviço.

Cada um desses segmentos possui cinco modelos próprios na aba **Design**. Tema, paleta, tipografia, imagens, espaçamento e ajustes globais do nível **Site completo** também alcançam essas páginas. Os textos de interface e os dados de cada serviço permanecem editáveis na aba **Conteúdo**.

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
| `npm test` | Executa os testes automatizados do portal e do construtor |
| `npm run lint` | Verifica o código web |
| `npm run editor` | Abre o construtor Electron |
| `npm run editor:package` | Gera o instalador Windows |
| `npm run portal:export` | Recria `portal-estatico/` |
| `node --test tests/*.test.mjs` | Testa abertura, salvamento e compilação de projetos React e estáticos |

## Gerar o instalador Windows

```bash
npm run editor:package
```

O instalador é criado localmente em `release-desktop/`, que permanece ignorada pelo Git. O executável não é armazenado no histórico do repositório porque ultrapassa o limite recomendado do GitHub; ele é distribuído como arquivo de um [GitHub Release](https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa/releases).

### Como baixar uma versão pronta

1. Abra a página [Releases](https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa/releases/latest).
2. Na versão marcada como **Latest**, abra a seção **Assets**.
3. Baixe o arquivo `.exe` identificado como instalador Windows.

Não é necessário clonar o projeto nem conhecer comandos Git para instalar o construtor.

## Fluxo recomendado de manutenção

1. Abra a pasta raiz do projeto React canônico no construtor.
2. Recarregue possíveis alterações externas antes de editar.
3. Edite e valide o conteúdo; nada é gravado durante essa etapa.
4. Pressione **Salvar alterações** para criar backup, gravar o JSON e compilar o portal.
5. Teste links, busca, teclado e visualização móvel.
6. Faça alterações avançadas diretamente nos componentes React ou estilos quando necessário; depois use **Recarregar** no construtor.
7. Regenere `portal-estatico/` somente quando a entrega estática também for necessária.
8. Gere o instalador somente quando o próprio construtor mudar e anexe-o a um novo GitHub Release.
9. Execute testes, lint e build.
10. Faça commit e push somente do código, conteúdo, documentação e exportação estática aprovada. Instaladores ficam fora do histórico Git e a publicação do portal continua sendo uma etapa explícita.

## Estrutura do código-fonte

```text
app/                         Portal React e rota /menu
content/site.json            Fonte de conteúdo do portal React canônico
desktop/main.cjs             Janela e registro dos canais de comunicação
desktop/portal-contract.cjs  Contrato e versões de portal-project.json
desktop/portal-project.cjs   Leitura e gravação de projetos React e estáticos
desktop/services/            Arquivos, backups, validação, migração e compilação
desktop/renderer/state.js    Estado e catálogo de tipos/modelos da interface
desktop/renderer/editing.js  Formulários e operações de edição
desktop/renderer/preview.js  Prévia, escala real e redimensionamento visual
desktop/renderer/communication.js  Ponte de salvamento e comunicação segura
desktop/templates/           Modelo usado nas exportações estáticas
portal-estatico/             Portal pronto para hospedagem
public/                      Fontes, favicon e imagem social
release-desktop/             Saída local ignorada do empacotamento
scripts/export-static.mjs    Exportação reproduzível para o repositório
tests/                       Testes do formato portátil
```

O empacotamento usa uma lista explícita de arquivos do construtor e ignora as dependências do portal React. Assim, mudar a stack web não aumenta automaticamente o aplicativo desktop.

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
