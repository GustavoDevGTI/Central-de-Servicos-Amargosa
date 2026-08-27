# Central de Serviços de Amargosa

Portal municipal em React para localizar serviços públicos e encaminhar cada pessoa ao canal oficial responsável. O portal não exige login, não possui banco de dados e não armazena dados pessoais.

## Funcionalidades

- busca principal com atalhos para serviços procurados com frequência;
- navegação por público e por categoria;
- filtros por nome, categoria, público, órgão responsável e inicial;
- páginas explicativas para serviços selecionados;
- Menu Acessibilidade em `/menu`, com estrutura hierárquica aberta;
- navegação por teclado e marcação semântica compatível com leitores de tela;
- layout responsivo para desktop, tablet e celular;
- agente virtual Amanda preparado como interface visual, ainda sem integração de IA.

## Stack

- React 19;
- Next.js 16;
- Vinext e Vite;
- TypeScript;
- CSS responsivo;
- Cloudflare Workers/Sites para hospedagem.

## Instalação

Requisitos: Node.js 22.13 ou superior e npm.

```bash
git clone https://github.com/GustavoDevGTI/Central-de-Servicos-Amargosa.git
cd Central-de-Servicos-Amargosa
npm install
```

## Desenvolvimento local

```bash
npm run dev
```

Acesse `http://localhost:3000`.

Para testar a versão de produção:

```bash
npm run build
npm run start
```

## Comandos

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Compila o portal para produção |
| `npm run start` | Inicia a compilação de produção na porta 3000 |
| `npm run lint` | Verifica a qualidade do código |

## Organização do projeto

```text
app/                 componentes, rotas e estilos
content/site.json    conteúdo estruturado do portal
public/              fontes, ícones e imagem de compartilhamento
scripts/             utilitários pontuais de identidade visual
```

## Rotas principais

| Rota | Conteúdo |
| --- | --- |
| `/` | Página inicial |
| `/menu` | Menu Acessibilidade |
| `/servicos` | Diretório de serviços |
| `/publicos/[publico]` | Serviços filtrados por público |
| `/categorias/[categoria]` | Serviços filtrados por categoria |
| `/servicos/[servico]` | Página explicativa do serviço |

## Conteúdo

O arquivo `content/site.json` reúne identidade, segmentos, públicos, categorias e serviços. Cada serviço pode informar título, órgão, públicos atendidos, categoria, URL oficial e, quando disponível, resumo, requisitos, documentos, etapas, prazo, canais, legislação e serviços relacionados.

Mudanças em componentes e estilos ficam em `app/`. Depois de qualquer atualização, execute `npm run build` antes de publicar.

## Acessibilidade

O portal oferece links de salto, foco visível, navegação integral por teclado, hierarquia de títulos e controles identificados. A rota `/menu` apresenta todos os serviços em uma estrutura direta para tecnologias assistivas.

## Publicação

A branch `main` contém a versão atual do portal. O fluxo recomendado é:

1. atualizar o conteúdo ou a interface;
2. executar `npm run lint` e `npm run build`;
3. revisar o portal localmente;
4. criar um commit e enviar para `main`.

## Licença e fontes

As fontes Lora e Source Sans 3 usam a SIL Open Font License. Os respectivos arquivos de licença estão em `public/fonts/`.
