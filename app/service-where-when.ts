import type { Service } from "./service-catalog";

type ServiceLocation = Pick<Service, "accessMode" | "url" | "whereWhen" | "whereWhenItems">;

type ContactLocation = {
  name: string;
  address: string;
  phone: string;
  email?: string;
};

export type ServiceWhereWhen = {
  digital: boolean;
  presencial: boolean;
  local: string;
  address: string;
  hours: string;
  phone?: string;
  whatsapp?: string;
  emails: string[];
  note?: string;
};

const genericDigitalUrl = /^https?:\/\/acesso\.amargosa\.ba\.gov\.br\/protocolodigital\/?(?:[?#].*)?$/i;
const factPattern = /\b(Atendimento presencial(?: e virtual)?|Atendimento virtual|Telefone|E-mail|WhatsApp|Endereço|Site|Horários? de atendimento|Protocolo Digital|Canal on-line):\s*/gi;

function extractFacts(text: string) {
  const matches = [...text.matchAll(factPattern)];
  const facts = new Map<string, string[]>();
  matches.forEach((match, index) => {
    const value = text.slice(
      match.index + match[0].length,
      matches[index + 1]?.index ?? text.length,
    ).trim().replace(/\.\s*$/, "");
    if (!value) return;
    const key = match[1].toLocaleLowerCase("pt-BR");
    facts.set(key, [...(facts.get(key) || []), value]);
  });
  return facts;
}

export function serviceWhereWhen(
  service: ServiceLocation,
  contact: ContactLocation,
): ServiceWhereWhen {
  const text = service.whereWhen?.trim() || "";
  const facts = extractFacts(text);
  const genericLink = genericDigitalUrl.test(service.url || "");
  const specificLink = Boolean(service.url && !genericLink);
  const presencialMentioned = /\bpresencial(?:mente)?\b/i.test(text);
  const presencial = service.accessMode === "presencial" ||
    (presencialMentioned && (specificLink || service.accessMode !== "digital"));
  const digital = specificLink || (service.accessMode === "digital" && Boolean(service.url));
  const presencialSchedule = service.whereWhenItems?.find((item) => /presencial/i.test(item.label));
  const scheduleLocation = presencialSchedule?.description.replace(/\.\s*$/, "").match(/^(.+?)\s+[—–-]\s+(.+)$/)?.slice(1);
  const local = facts.get("atendimento presencial")?.[0] ||
    facts.get("atendimento presencial e virtual")?.[0] || scheduleLocation?.[0] || contact.name;
  const address = facts.get("endereço")?.[0] || scheduleLocation?.[1] || contact.address;
  const isSacMunicipal = /^SAC MUNICIPAL$/i.test(local) && /Valle Shopping/i.test(address);
  const rawHours = facts.get("horário de atendimento")?.[0] || facts.get("horários de atendimento")?.[0];
  const hours = presencialSchedule?.schedule || (rawHours && !rawHours.startsWith("*")
    ? rawHours
    : isSacMunicipal
      ? "Horário do SAC Municipal não informado. Confirme por telefone antes de comparecer."
      : "Confirme o horário por telefone antes de comparecer.");
  const emails = [...new Set([...(facts.get("e-mail") || []), ...(presencialSchedule && contact.email ? [contact.email] : [])])];
  const commonText = /^(?:Atendimento digital\. Inicie a solicitação pelo link desta página\.|Atendimento presencial\. Consulte o endereço do órgão responsável nos canais abaixo e confirme o horário por telefone\.|Confirme com o órgão responsável se o atendimento é digital ou presencial\.)$/i.test(text);
  const note = facts.size === 0 && text && !text.startsWith("*") && !commonText
    ? text
    : undefined;

  return {
    digital,
    presencial,
    local,
    address,
    hours,
    phone: facts.get("telefone")?.[0] || (presencial ? contact.phone : undefined),
    whatsapp: facts.get("whatsapp")?.[0],
    emails,
    note,
  };
}
