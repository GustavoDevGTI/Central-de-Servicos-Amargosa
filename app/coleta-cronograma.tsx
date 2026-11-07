import type { Service } from "./service-catalog";
import { workbookFieldProps } from "./workbook-service";
import { WorkbookWhereWhenIntro, workbookWhereWhenPresentationProps } from "./workbook-where-when";
import { collectionScheduleForService, collectionIntroduction } from "./collection-schedule-data";

export function CollectionScheduleSection({ service }: { service?: Service } = {}) {
  const groups = collectionScheduleForService(service);
  const introduction = service?.directEdit?.fields.collectionIntroduction;
  return (
    <section id="onde-quando" className="collection-schedule" {...(service?.workbookCells ? workbookWhereWhenPresentationProps(service.workbookCells) : {})}>
      <h2>Dias e horários da coleta</h2>
      {introduction !== undefined ? (introduction && <p style={{ whiteSpace: "pre-wrap" }}>{introduction}</p>) : service?.workbookCells ? <WorkbookWhereWhenIntro service={service} /> : <p {...(service ? workbookFieldProps(service, "Onde e quando solicitar2") : {})}>{collectionIntroduction}</p>}
      {groups.map((group) => (
        <div className="collection-schedule-group" key={group.id}>
          <h3>{group.title}</h3>
          {group.places.map((place, placeIndex) => (
            <details className="collection-schedule-place" key={`${group.id}-${placeIndex}`}>
              <summary>
                <span>{place.name}</span>
                <small>{place.routes.length} {place.routes.length === 1 ? "rota" : "rotas"}</small>
              </summary>
              <div className="collection-schedule-routes">
                {place.routes.map((route, index) => (
                  <div className="collection-schedule-route" key={`${route.name}-${index}`}>
                    <h4>{route.name}</h4>
                    <ul>
                      {route.slots.map((slot, slotIndex) => (
                        <li key={slotIndex}>
                          <span>{slot.day}</span>
                          <time dateTime={slot.time}>{slot.time}</time>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      ))}

    </section>
  );
}
