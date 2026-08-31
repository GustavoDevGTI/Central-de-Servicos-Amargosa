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
- Docker e Portainer para hospedagem própria.

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

## Imagem Docker

O servidor não precisa compilar o projeto. Cada push na branch `main` aciona o GitHub Actions, que executa o `Dockerfile` e publica uma imagem pronta no GitHub Container Registry:

```text
ghcr.io/gustavodevgti/central-de-servicos-amargosa:latest
```

Também é criada uma tag imutável com o SHA do commit. A variável de repositório `NEXT_PUBLIC_SITE_URL` pode ser configurada em **Settings → Secrets and variables → Actions → Variables**. Sem ela, a compilação usa `https://servicos.amargosa.ba.gov.br`.

Para executar com Docker Compose:

```bash
cp .env.example .env
docker compose pull
docker compose up -d
```

O healthcheck consulta `GET /api/health`. O contêiner é executado sem privilégios, com reinício automático e sem banco de dados ou volume persistente.

## Portainer

O Portainer utiliza somente a imagem pronta. Ele não clona o código, não executa `npm ci` e não compila o React.

1. acesse **Stacks** e selecione **Add stack**;
2. escolha **Web editor**;
3. cole o conteúdo de `docker-compose.yml`;
4. defina `PORTAL_PORT=3000` ou outra porta livre;
5. selecione **Deploy the stack**.

Se o pacote GHCR estiver privado, cadastre `ghcr.io` em **Registries** usando o usuário GitHub e um token com permissão `read:packages`. Para uma imagem pública, não é necessária autenticação.

### Atualização do portal

1. envie as alterações para `main`;
2. aguarde o workflow **Publicar imagem Docker** terminar no GitHub Actions;
3. abra a Stack no Portainer;
4. selecione **Update the stack**;
5. habilite **Re-pull image** e confirme a atualização.

O Portainer baixa a nova tag `latest`, substitui o contêiner e publica a versão atualizada. Não é necessário reconstruir a imagem no servidor.

Em produção, recomenda-se colocar o serviço atrás de um proxy reverso com HTTPS, como Nginx Proxy Manager, Traefik ou Caddy. O proxy deve encaminhar o domínio para a porta definida em `PORTAL_PORT` ou compartilhar uma rede Docker com a Stack.

## Licença e fontes

As fontes Lora e Source Sans 3 usam a SIL Open Font License. Os respectivos arquivos de licença estão em `public/fonts/`.
