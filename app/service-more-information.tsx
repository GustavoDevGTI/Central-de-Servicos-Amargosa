import type { Service } from "./service-catalog";
import { contactForService } from "./service-contacts";
import { isPendingServiceValue, serviceDisplayValue } from "./service-presentation";

/** BA.GOV section names, answered exclusively with this service's own data. */
export function ServiceMoreInformation({ service, contactAnchor }: { service: Service; contactAnchor: string }) {
  const edited = service.directEdit?.fields;
  const cells = service.workbookCells;
  const contact = cells ? null : contactForService(service);
  const phone = cells ? cells.Telefone : contact?.phone;
  const email = cells ? cells["E-mail do setor/unidade"] : contact?.email;
  const platform = cells ? cells.Plataforma : service.destination;
  const link = cells ? cells["Link de acesso"] : service.url;
  const local = cells ? cells["Setor/Unidade responsável no SEI"] : contact?.address;
  const communication = [phone, email].filter((text) => !isPendingServiceValue(text)).join("\n");
  const means = [local, phone, email].filter((text) => !isPendingServiceValue(text)).join("\n");
  return <section id="quer-saber-mais" className="service-more-information">
    <details className="service-more-expansion">
      <summary>Quer saber mais?</summary>
      <div className="service-more-content">
        <details open>
          <summary>Mecanismos de consulta e comunicação</summary>
          <h4>Consulta ou acesso</h4>
          {edited?.consultation !== undefined ? <p>{serviceDisplayValue(edited.consultation)}</p> : <p>{serviceDisplayValue(platform)}{link && !isPendingServiceValue(link) && <><br />{/^https?:\/\//i.test(link) ? <a href={link} target="_blank" rel="noreferrer">{link}</a> : link}</>}</p>}
          <h4>Comunicação</h4><p>{serviceDisplayValue(edited?.communication ?? communication)}</p>
        </details>
        <details open>
          <summary>Tempos de espera e máximo estimado</summary>
          <h4>Previsão de espera</h4><p>{serviceDisplayValue(edited?.waitingTime, "Prazo")}</p>
          <h4>Prazo máximo estimado</h4><p>{serviceDisplayValue(edited?.maximumTime ?? service.duration, "Prazo")}</p>
        </details>
        <details open>
          <summary>Meios de Contato e legislação pertinente</summary>
          <h4>Meios de Contato</h4><p>{serviceDisplayValue(edited?.contactMeans ?? means)}</p>
          <p><a href={contactAnchor}>Consultar os canais de atendimento</a></p>
          <h4>Procedimentos</h4>{edited?.procedures !== undefined ? <p>{serviceDisplayValue(edited.procedures)}</p> : <p><a href="#manifestar-se">Consultar as orientações para manifestações e pedidos de informação</a></p>}
          <h4>Prioridades de atendimento</h4><p>{serviceDisplayValue(edited?.priorities)}</p>
          <h4>Legislações Pertinente</h4>
          {edited?.legislation !== undefined ? <p>{serviceDisplayValue(edited.legislation)}</p> : service.legislation?.length ? <ul>{service.legislation.map((law) => <li key={law.url}><a href={law.url} target="_blank" rel="noreferrer">{law.label}</a></li>)}</ul> : <p>{serviceDisplayValue(service.legislationNotice)}</p>}
        </details>
        <details open>
          <summary>Informações adicionais</summary>
          <p>{serviceDisplayValue(edited?.additional ?? service.notice)}</p>
        </details>
      </div>
    </details>
  </section>;
}
