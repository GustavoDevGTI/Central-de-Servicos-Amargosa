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

No editor, use **Salvar alterações** para atualizar `content/site.json`, **Validar** para conferir a estrutura e **Gerar portal** para exportar uma pasta estática pronta para hospedagem convencional. Cada página contém segmentos ordenáveis; cada segmento contém itens também ordenáveis. Textos, links, logos, imagens, públicos, categorias, serviços e referências de “mais usados” são editáveis. Imagens de até 2 MB são incorporadas ao projeto, sem servidor ou banco de dados.

## Gerar o instalador do Windows

```bash
npm run editor:package
```

O instalador atual será criado em `release-desktop-v3-10/`.

## Publicação

O portal criado pelo botão **Gerar portal** contém apenas HTML, CSS, JavaScript e o conteúdo configurado. Ele pode ser enviado para qualquer hospedagem de arquivos estáticos. Antes de publicar, substitua os endereços de exemplo pelos links oficiais de cada serviço.
