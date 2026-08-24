# Central de Serviços de Amargosa

Projeto composto por duas partes que usam o mesmo conteúdo:

- portal público responsivo, sem login, banco de dados ou coleta de dados pessoais;
- aplicativo desktop para editar textos, identidade e direcionamentos sem alterar código.

## Usar o portal durante o desenvolvimento

```bash
npm install
npm run dev
```

## Abrir o editor desktop

```bash
npm run editor
```

No editor, use **Salvar alterações** para atualizar `content/site.json`, **Validar** para conferir os campos obrigatórios e **Gerar portal** para exportar uma pasta estática pronta para hospedagem convencional.

## Gerar o instalador do Windows

```bash
npm run editor:package
```

O instalador será criado em `release-desktop/`.

## Publicação

O portal criado pelo botão **Gerar portal** contém apenas HTML, CSS, JavaScript e o conteúdo configurado. Ele pode ser enviado para qualquer hospedagem de arquivos estáticos. Antes de publicar, substitua os endereços de exemplo pelos links oficiais de cada serviço.
