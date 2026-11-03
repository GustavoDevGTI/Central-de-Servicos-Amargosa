import type { Service } from "./service-catalog";
import { documentTopicParts } from "./service-topics";
import { workbookDocumentColumns, workbookFieldProps } from "./workbook-service";
import { serviceValue } from "./service-value";

/** Reuse the existing list in both page templates, previews and restored publications. */
export function ServiceDocumentItems({ service }: { service: Service }) {
  const sources = service.workbookCells
    ? workbookDocumentColumns(service.workbookCells).map((column) => ({ column, value: service.workbookCells![column] }))
    : (service.documents || []).map((value) => ({ column: undefined, value }));
  if (!sources.length) return <li>{serviceValue(undefined)}</li>;
  return <>{sources.flatMap(({ column, value }, sourceIndex) => documentTopicParts(value).map((part, index) => (
    <li key={`${sourceIndex}:${index}`} {...(column ? { ...workbookFieldProps(service, column), "data-workbook-topic-start": part.start, "data-workbook-topic-end": part.end } : {})}
      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }} className={part.text.startsWith("*") ? "service-pending-information" : undefined}>{serviceValue(part.text, column)}</li>
  )))}</>;
}
