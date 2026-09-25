import schedule from "./coleta-cronograma.json" with { type: "json" };

const retrievedAt = schedule.retrievedAt.split("-").reverse().join("/");

export function CollectionScheduleSection() {
  return (
    <section id="onde-quando" className="collection-schedule">
      <h2>Dias e horários da coleta</h2>
      <p>Escolha seu bairro, distrito ou localidade. Dentro de cada local, confira a rua ou rota antes de ver os horários.</p>
      <a className="collection-schedule-source" href={schedule.sourceUrl} target="_blank" rel="noreferrer">
        Consultar o cronograma oficial atualizado <span aria-hidden="true">↗</span>
      </a>
      <p className="collection-schedule-updated">Cronograma consultado em {retrievedAt}. Confira o link oficial para eventuais alterações posteriores.</p>

      {schedule.groups.map((group) => (
        <div className="collection-schedule-group" key={group.id}>
          <h3>{group.title}</h3>
          {group.places.map((place) => (
            <details className="collection-schedule-place" key={`${group.id}-${place.name}`}>
              <summary>
                <span>{place.name}</span>
                <small>{place.routes.length} {place.routes.length === 1 ? "rota" : "rotas"}</small>
              </summary>
              <div className="collection-schedule-routes">
                {place.routes.map((route, index) => (
                  <div className="collection-schedule-route" key={`${route.name}-${index}`}>
                    <h4>{route.name}</h4>
                    <ul>
                      {route.slots.map((slot) => (
                        <li key={`${slot.day}-${slot.time}`}>
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
