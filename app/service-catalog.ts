import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";

export type Service = {
  id: string;
  slug?: string;
  title: string;
  category: string;
  subject?: string;
  audienceId?: string;
  audienceIds?: string[];
  department: string;
  destination: string;
  url: string;
  summary?: string;
  eligibility?: string;
  documents?: string[];
  steps?: string[];
  whereWhen?: string;
  whereWhenItems?: {
    label: string;
    schedule?: string;
    description: string;
    wide?: boolean;
  }[];
  cost?: string;
  duration?: string;
  channels?: { label: string; value: string; url?: string }[];
  legislation?: { label: string; url: string }[];
  relatedServiceIds?: string[];
  notice?: string;
  noticeAction?: string;
  requestLabel?: string;
  updatedAt?: string;
};

const catalog = siteContent.pages[0]?.segments.find(
  (entry) => entry.type === "catalog",
);

export const services = ((catalog?.items.filter(
  (item) => item.type === "service",
) || []) as unknown as Service[]).map((service) => ({
  ...service,
  ...approvedServiceDetails[service.id],
}));
