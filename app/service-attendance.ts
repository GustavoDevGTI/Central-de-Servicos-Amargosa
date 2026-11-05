import type { Service } from "./service-catalog";
import { sameAttendanceUnit, otherAttendanceUnit } from "./service-edit-fields";
import { sameInPersonServiceOffice, type ServiceWhereWhen } from "./service-where-when";

/** Historical matching is only a default; an explicit editorial choice takes precedence. */
export function initialAttendanceUnitMode(service: Service, location: ServiceWhereWhen, responsible: string) {
  const merged = service.directEdit?.layout.mergeContact ?? (Boolean(service.whereWhen) && location.presencial && (!service.whereWhenItems?.length || location.digital) && sameInPersonServiceOffice(location.local, responsible) && !(service.workbookCells && service.id === "1doc-limpeza-publica"));
  return merged ? sameAttendanceUnit : otherAttendanceUnit;
}

export const attendanceFieldKeys = ["attendanceUnitMode", "attendanceUnit", "attendancePhone", "attendanceWhatsapp", "attendanceEmail", "responsibleAddress", "responsibleHours", "department", "secretariat", "address", "hours", "phone", "email", "platform"] as const;
