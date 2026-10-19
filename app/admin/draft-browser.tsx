"use client";

import { useState } from "react";
import { ServicePicker, useServiceSelection } from "./service-picker";
import { useCatalogServices } from "../catalog-provider";

export type PreviewService = { id: string; slug: string; title: string; sourceRow?: number; inactive: boolean };

export function DraftBrowser({ draftId, services, changedRows }: { draftId: string; services: PreviewService[]; changedRows: number[] }) {
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [compare, setCompare] = useState(false);
  const available = services.filter((service) => !onlyChanged || changedRows.includes(service.sourceRow || 0));
  const selection = useServiceSelection(available);
  const { selected, query } = selection;
  const currentService = useCatalogServices().find((service) => (service.slug || service.id) === selected?.slug && !service.inactive);
  const draftUrl = selected && `/admin/preview/${encodeURIComponent(draftId)}/${encodeURIComponent(selected.slug)}`;
  return <section className="admin-draft-browser" aria-labelledby="draft-pages-title">
    <h3 id="draft-pages-title">Prévia das páginas</h3>
    <div className="admin-preview-controls">
      <div className="admin-preview-notice">
        <p>Se editar a planilha, analise novamente.</p>
        <label className="admin-preview-filter"><input type="checkbox" checked={onlyChanged} onChange={(event) => setOnlyChanged(event.target.checked)} /> Somente serviços com alterações</label>
      </div>
      <ServicePicker id="admin-preview-service" selection={selection} totalCount={available.length} />
      <div className="admin-preview-actions">
        <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button>
        <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button>
        <label><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Comparar com a página atual</label>
        {draftUrl && !selected?.inactive && <a href={draftUrl} target="_blank" rel="noreferrer">Abrir prévia em outra aba</a>}
      </div>
    </div>
    {!selected ? <p>{query.trim() ? "Nenhum serviço encontrado. Tente outro nome, URL ou ID, ou desmarque o filtro de alterações." : "Nenhuma página neste filtro. Desmarque o filtro para conferir todos os serviços."}</p>
      : <div className={`admin-preview-pages${compare ? " admin-preview-compare" : ""}`}>
        {compare && <div><h4>Página atual</h4>{!currentService ? <p>Serviço ainda não publicado na Central.</p> : <><p><a href={`/servicos/${encodeURIComponent(selected.slug)}`} target="_blank" rel="noreferrer">Abrir página atual</a></p><div className={`admin-current-page${mobile ? " admin-frame-mobile" : ""}`}><div className="admin-preview-banner admin-preview-banner-current" role="status">Edição atual em uso</div><iframe className="admin-service-frame" src={`/servicos/${encodeURIComponent(selected.slug)}`} title={`Página atual: ${selected.title}`} /></div></>}</div>}
        <div><h4>Após a publicação</h4><p className="admin-preview-path">/servicos/{selected.slug}</p>
          {selected.inactive ? <p className="admin-blockers">Página oculta após publicar. O conteúdo será preservado.</p>
            : <iframe key={draftUrl} className={mobile ? "admin-service-frame admin-frame-mobile" : "admin-service-frame"} src={draftUrl} title={`Prévia do serviço: ${selected.title}`} />}
        </div>
      </div>}
  </section>;
}
