import { serviceEditFields, serviceEditGroups, sameAttendanceUnit, type ServiceEditField } from "../service-edit-fields";

export type ServiceFieldOrder = "central" | "bagov";
export type EditorFieldBlock = { key: string; legend?: string; fields: ServiceEditField[]; hidden?: boolean };
export type EditorFieldGroup = { key: string; label: string; blocks: EditorFieldBlock[] };
const fieldBlock = (fields: ServiceEditField[]): EditorFieldBlock => ({ key: "fields", fields });
const stageBlock = (stage: 1 | 2, fields: ServiceEditField[]): EditorFieldBlock => ({ key: `stage-${stage}`, legend: stage === 1 ? "Etapa 1 - solicitação" : "Etapa 2 - análise e conclusão", fields });

/** Presentation only. Both arrangements contain the same canonical editorial fields. */
export function editorFieldGroups(order: ServiceFieldOrder, { mainLegislation = false, attendanceMode = "", workbookSource = true } = {}): EditorFieldGroup[] {
  void workbookSource;
  const sharedUnit = attendanceMode === sameAttendanceUnit;
  const channelBlocks: EditorFieldBlock[] = [
    { key: "attendance-choice", fields: ["attendanceUnitMode"] },
    { key: "attendance", legend: sharedUnit ? "Atendimento e unidade responsável" : "Local de atendimento", fields: sharedUnit ? ["department", "secretariat", "address", "hours", "phone", "attendanceWhatsapp", "email", "platform"] : ["attendanceUnit", "address", "hours", "attendancePhone", "attendanceWhatsapp", "attendanceEmail"] },
    { key: "responsible", legend: "Unidade responsável", fields: sharedUnit ? ["attendanceUnit", "attendancePhone", "attendanceEmail", "responsibleAddress", "responsibleHours"] : ["department", "secretariat", "responsibleAddress", "responsibleHours", "phone", "email", "platform"], hidden: sharedUnit },
  ];
  const groupedFields = new Set(channelBlocks.flatMap((block) => block.fields));
  if (order === "bagov") return serviceEditGroups.map((label, group) => ({
    key: `bagov-${group}`, label,
    blocks: [
      ...(group === 2 ? channelBlocks.map((block) => ({ ...block, fields: block.fields.filter((key) => !["department", "secretariat"].includes(key)) })) : []),
      fieldBlock(serviceEditFields.filter((field) => field.group === group && !("stage" in field) && field.key !== "additional" && (group !== 2 || !groupedFields.has(field.key))).map((field) => field.key)),
      ...([1, 2] as const).map((stage) => stageBlock(stage, serviceEditFields.filter((field) => field.group === group && "stage" in field && field.stage.startsWith(`Etapa ${stage} `)).map((field) => field.key))).filter((block) => block.fields.length),
      ...(serviceEditFields.some((field) => field.group === group && field.key === "additional") ? [{ key: "additional", fields: ["additional"] as ServiceEditField[] }] : []),
    ].filter((block) => block.fields.length),
  }));

  const groups: EditorFieldGroup[] = [
    { key: "central-main", label: "Informações principais", blocks: [fieldBlock(["title", "audience", "summary", "accessUrl", "eligibility"])] },
    { key: "central-stages", label: "Documentos e etapas", blocks: [stageBlock(1, ["requiredDocuments", "steps"]), stageBlock(2, ["stage2Description", "stage2Documents"])] },
    { key: "central-time-cost", label: "Prazos e custos", blocks: [fieldBlock(["cost", "duration"])] },
    { key: "central-channels", label: "Canais de acesso, contato e acompanhamento", blocks: channelBlocks },
    ...(mainLegislation ? [{ key: "central-law", label: "Base legal", blocks: [fieldBlock(["legislation"])] }] : []),
    { key: "central-more", label: "Quer saber mais?", blocks: [fieldBlock(["popularNames", "category", "deliveryChannel", "status", "waitingTime", "attendanceModes", "consultation", "baGovUrl", ...(!mainLegislation ? ["legislation"] as const : []), "priorities", "procedures", "additional"])] },
    { key: "central-ombudsman", label: "Canal da ouvidoria", blocks: [fieldBlock(["ombudsman"])] },
    { key: "central-controls", label: "Controle da atualização", blocks: [fieldBlock(["filledBy", "updatedDate", "responsibleContact", "simpNotes"])] },
  ];
  return groups.map((group, index) => ({ ...group, label: `${index + 1}. ${group.label}` }));
}
