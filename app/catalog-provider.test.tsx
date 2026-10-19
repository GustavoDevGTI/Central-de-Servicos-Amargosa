import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CatalogProvider, CatalogPreviewProvider, useCatalogServices } from './catalog-provider';
import { ServiceDirectory } from './internal-portal';
import type { Service } from './service-catalog';

const published:Service={id:'planilha-999',slug:'novo-catalogo-publicado',title:'Novo catálogo publicado',category:'Obras Públicas',department:'Unidade de teste',destination:'Central',url:'',audienceId:'cidadao'};
const draft:Service={...published,title:'Conteúdo exclusivo do rascunho'};
function Titles(){return <p>{useCatalogServices().map(service=>service.title).join('|')}</p>;}

test('a primeira renderização usa o catálogo publicado no servidor',()=>{
  const html=renderToStaticMarkup(<CatalogProvider initialServices={[published]}><ServiceDirectory mode="audience" value="todos"/></CatalogProvider>);
  assert.match(html,/Novo catálogo publicado/);
  assert.match(html,/\/servicos\/novo-catalogo-publicado/);
  assert.doesNotMatch(html,/Abastecimento de Água/);
});

test('o catálogo público fornecido pelo servidor não substitui uma prévia privada',()=>{
  const html=renderToStaticMarkup(<CatalogProvider initialServices={[published]}><CatalogPreviewProvider services={[draft]}><Titles/></CatalogPreviewProvider></CatalogProvider>);
  assert.match(html,/Conteúdo exclusivo do rascunho/);
  assert.doesNotMatch(html,/Novo catálogo publicado/);
});
