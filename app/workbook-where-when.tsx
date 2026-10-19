import type { Service } from "./service-catalog";
import { workbookFieldProps, type WorkbookCells } from "./workbook-service";

export const whereWhenColumn = "Onde e quando solicitar2";
export type WhereWhenPart = {
  start: number;
  end: number;
  placement: "intro" | "hours" | "duplicate";
  column?: string;
};

const columns: Record<string, string> = {
  telefone: "Telefone", "e-mail": "E-mail do setor/unidade", ramal: "Ramal",
  canal: "Plataforma", plataforma: "Plataforma",
};

/** Presentation only: the original cell and catalog properties remain unchanged. */
export function workbookWhereWhenParts(cells: WorkbookCells): WhereWhenPart[] {
  const source = cells[whereWhenColumn] || "";
  const markers = [...source.matchAll(/(?:^|(?<=\s))(Telefone|E-mail|Ramal|Canal|Plataforma|Horários?(?: de atendimento)?):\s*|(?:^|(?<=\s))Horário e atendimento presencial devem ser confirmados com a unidade responsável\./gi)];
  const parts: WhereWhenPart[] = [];
  let cursor = 0;
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const start = marker.index!;
    const end = markers[i + 1]?.index ?? source.length;
    if (start > cursor) parts.push({ start: cursor, end: start, placement: "intro" });
    const label = marker[1]?.toLocaleLowerCase("pt-BR");
    if (!label || /^horário/.test(label)) {
      // Preserve any separate instruction after the schedule in the introduction.
      const rest = source.slice(start, end);
      const instruction = rest.search(/(?<=[.!?])\s+(?=(?:Leve|Apresente|Compareça|Antes de|Após|Para solicitar)\b)/i);
      const hoursEnd = instruction < 0 ? end : start + instruction;
      parts.push({ start, end: hoursEnd, placement: "hours" });
      if (hoursEnd < end) parts.push({ start: hoursEnd, end, placement: "intro" });
    } else {
      const column = columns[label];
      const value = source.slice(start + marker[0].length, end).trim().replace(/[.;]$/, "").trimEnd();
      // A disagreement or an unrecognized extra instruction must stay visible.
      const duplicate = Boolean(cells[column]?.trim()) && value === cells[column].trim();
      parts.push({ start, end, placement: duplicate ? "duplicate" : "intro", ...(duplicate ? { column } : {}) });
    }
    cursor = end;
  }
  if (cursor < source.length) parts.push({ start: cursor, end: source.length, placement: "intro" });
  return parts;
}

export function workbookWhereWhenPresentationProps(cells: WorkbookCells) {
  return { "data-workbook-where-when-parts": JSON.stringify(workbookWhereWhenParts(cells)) };
}

function SourceParts({ service, placement }: { service: Service; placement: "intro" | "hours" }) {
  const cells = service.workbookCells!;
  return <>{workbookWhereWhenParts(cells).filter(part => part.placement === placement).map(part => (
    <span key={part.start} {...workbookFieldProps(service, whereWhenColumn)}
      data-workbook-start={part.start} data-workbook-end={part.end}>
      {cells[whereWhenColumn].slice(part.start, part.end)}
    </span>
  ))}</>;
}

export function WorkbookWhereWhenIntro({ service, className }: { service: Service; className?: string }) {
  const source = service.workbookCells![whereWhenColumn];
  const hasIntro = workbookWhereWhenParts(service.workbookCells!).some(part => part.placement === "intro" && source.slice(part.start, part.end).trim());
  return hasIntro ? <p className={className}><SourceParts service={service} placement="intro" /></p> : null;
}

export function WorkbookWhereWhenHours({ service }: { service: Service }) {
  return <SourceParts service={service} placement="hours" />;
}

export function workbookHasHours(service: Service) {
  return Boolean(service.workbookCells && workbookWhereWhenParts(service.workbookCells).some(part => part.placement === "hours"));
}
