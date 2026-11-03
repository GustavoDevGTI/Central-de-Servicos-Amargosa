import type { Service } from "./service-catalog";
import { serviceEditValues } from "./direct-service-content";
import { serviceFieldLabel, serviceEditGroups, type ServiceEditField } from "./service-edit-fields";
import { serviceDisplayValue } from "./service-presentation";
import { documentTopicParts } from "./service-topics";

/** Existing sections keep their content; unmatched public fields use this drawer. */
export function ServiceMoreInformation({ service, hasHoursCard = false, hasManifestationSection = false }: { service: Service; contactAnchor?: string; hasHoursCard?: boolean; hasManifestationSection?: boolean }) {
  const values = serviceEditValues(service);
  const fields = service.directEdit?.fields;
  const text = (key: ServiceEditField, value = values[key]) => <><h4>{serviceFieldLabel(key)}</h4><p>{serviceDisplayValue(value, ["waitingTime", "duration"].includes(key) ? "Prazo" : undefined)}</p></>;
  const link = (key: "baGovUrl" | "ombudsman") => <><h4>{serviceFieldLabel(key)}</h4><p>{/^https?:\/\/\S+$/i.test(values[key]) ? <a href={values[key]} target="_blank" rel="noreferrer">{values[key]}</a> : serviceDisplayValue(values[key])}</p></>;
  const additional = fields?.additional ?? (service.directEdit && service.directEdit.schema !== "carta-1-2026" ? values.additional : service.notice || "");
  const hasLegalSection = Boolean(service.legislation?.length || service.legislationNotice);
  return <section id="quer-saber-mais" className="service-more-information">
    <details className="service-more-expansion">
      <summary>Quer saber mais?</summary>
      <div className="service-more-content">
        <details open><summary>{serviceEditGroups[0].slice(3)}</summary>
          {text("popularNames")}{text("category")}{text("deliveryChannel")}{text("status")}
        </details>
        <details open><summary>{serviceEditGroups[1].slice(3)}</summary>
          {text("waitingTime")}{text("attendanceModes")}
        </details>
        <details open><summary>{serviceEditGroups[2].slice(3)}</summary>
          {service.workbookCells && text("address")}
          {!service.workbookCells && !hasHoursCard && text("hours")}
          {text("consultation")}{link("baGovUrl")}
        </details>
        <details open><summary>Etapa 2 - análise e conclusão</summary>
          {text("stage2Description")}<h4>{serviceFieldLabel("stage2Documents")}</h4>
          <ul>{documentTopicParts(values.stage2Documents).map((part, index) => <li key={index} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{serviceDisplayValue(part.text)}</li>)}</ul>
        </details>
        <details open><summary>{serviceEditGroups[4].slice(3)}</summary>
          {!hasLegalSection && text("legislation")}{text("priorities")}
          {!hasManifestationSection && link("ombudsman")}
          {text("procedures")}
        </details>
        <details open><summary>{serviceFieldLabel("additional")}</summary><p>{serviceDisplayValue(additional)}</p></details>
      </div>
    </details>
  </section>;
}
