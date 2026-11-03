import type { Service } from "./service-catalog";
import { isPendingServiceValue } from "./service-presentation";
import { documentTopicParts, readTopics } from "./service-topics";
import { serviceFieldLabel } from "./service-edit-fields";

export const secondStageTitle = "Etapa 2 - análise e conclusão";
function hasAnswer(value: string | undefined) {
  return !isPendingServiceValue(value) && !/^não informado[.!]?$/i.test(value!.trim());
}
export function hasServiceSecondStage(service: Service) {
  return hasAnswer(service.directEdit?.fields.stage2Description) || hasAnswer(service.directEdit?.fields.stage2Documents);
}

/** The optional second stage uses the same section and numbered-list design as stage one. */
export function ServiceSecondStage({ service }: { service: Service }) {
  if (!hasServiceSecondStage(service)) return null;
  const description = service.directEdit?.fields.stage2Description;
  const documents = service.directEdit?.fields.stage2Documents;
  const topics = readTopics(description || "", "numbered");
  return <section id="etapa-2">
    <h2>{secondStageTitle}</h2>
    {hasAnswer(description) && <ol className="service-steps">
      {topics.items.map((text, index) => <li key={index}>
        <b>{topics.numbered ? (index === 0 ? topics.prefix : topics.separators[index - 1]).trim() : `${index + 1}.`}</b>
        <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</span>
      </li>)}
    </ol>}
    {hasAnswer(documents) && <><h3>{serviceFieldLabel("stage2Documents")}</h3><ul>
      {documentTopicParts(documents!).map((part, index) => <li key={index} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{part.text}</li>)}
    </ul></>}
  </section>;
}
