# Central de Serviços de Amargosa

Projeto composto por duas partes que usam o mesmo conteúdo:

- portal público responsivo, sem login, banco de dados ou coleta de dados pessoais;
- aplicativo desktop para editar páginas, segmentos e todos os itens sem alterar código.

## Usar o portal durante o desenvolvimento

```bash
npm install
npm run dev
```

## Abrir o editor desktop

```bash
npm run editor
```

No editor, use **Salvar alterações** para atualizar o projeto interno, **Validar** para conferir a estrutura e **Gerar portal** para exportar uma pasta estática pronta para hospedagem convencional. Cada página contém segmentos ordenáveis; cada segmento contém itens também ordenáveis. Textos, links, logos, imagens, públicos, categorias, serviços e referências de “mais usados” são editáveis. Imagens de até 2 MB são incorporadas ao projeto, sem servidor ou banco de dados.

O botão **Abrir portal** permite escolher qualquer versão estática anteriormente exportada. O construtor lê `content.js` — com compatibilidade para `content.json` e versões antigas com `site.json` — e usa os estilos dessa pasta na prévia. **Recarregar** traz alterações de conteúdo ou CSS feitas fora do aplicativo. Ao salvar um portal aberto, somente `content.js`, `content.json` e o manifesto portátil são atualizados; mudanças manuais em HTML, CSS, JavaScript, fontes e demais arquivos são preservadas. Se o conteúdo for alterado externamente enquanto o construtor estiver aberto, a gravação é bloqueada até que a pasta seja recarregada, evitando perda de trabalho.

Ao usar **Gerar nova versão** com um portal aberto, a pasta inteira dessa versão é copiada antes da atualização do conteúdo. Assim, personalizações feitas fora do construtor também acompanham a próxima versão. Cada exportação inclui `portal-project.json` para identificar a versão do construtor e `content.json` como representação portátil do catálogo.

Na aba **Design**, cada tipo de segmento oferece quatro modelos próprios. A troca do modelo reorganiza somente a apresentação daquele segmento; os itens, textos, links, imagens e ajustes de cor permanecem editáveis. A biblioteca inicial reúne composições de busca editorial ou panorâmica, diretório aberto, acesso rápido e painel modular.

O portal principal e o portal estático gerado incluem atalhos de salto, foco de alta visibilidade, operação integral por teclado, regiões e controles nomeados para leitores de tela, filtros com estado anunciado, resultados em região viva e contenção de foco na conversa com Amanda. A estrutura foi preparada para uso com NVDA, TalkBack e VoiceOver.

A rota **`/menu`** apresenta o Menu Acessibilidade: uma interface vertical, sem blocos recolhidos, gerada automaticamente na hierarquia público → categoria → serviço. Os serviços finais levam diretamente ao canal oficial configurado no catálogo. O mesmo subsite é incluído na pasta estática criada pelo botão **Gerar portal**.

## Gerar o instalador do Windows

```bash
npm run editor:package
```

O instalador atual será criado em `release-desktop/`. A pasta é reutilizada a cada compilação para manter somente a distribuição mais recente.

## Publicação

O portal criado pelo botão **Gerar portal** contém apenas HTML, CSS, JavaScript e o conteúdo configurado. Ele pode ser enviado para qualquer hospedagem de arquivos estáticos. Antes de publicar, substitua os endereços de exemplo pelos links oficiais de cada serviço.
