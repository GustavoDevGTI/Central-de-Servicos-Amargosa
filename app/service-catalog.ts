import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";
import {
  cartaOnlyServices,
  cartaServiceDestination,
  cartaServiceLinks,
} from "./carta-service-catalog";
import {
  requestSystemForService,
  type ServiceRequestSystem,
} from "./service-request-system";

export type Service = {
  id: string;
  type?: string;
  role?: string;
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
  searchTerms?: string[];
  notice?: string;
  noticeAction?: string;
  requestLabel?: string;
  requestSystem?: ServiceRequestSystem;
  updatedAt?: string;
  initials?: string;
  sourceRow?: number;
};

const catalog = siteContent.pages[0]?.segments.find(
  (entry) => entry.type === "catalog",
);

const baseServices = (catalog?.items.filter(
  (item) => item.type === "service",
) || []) as unknown as Service[];

const mergedServices = [
  ...baseServices.map((service) => {
    const merged = {
      ...service,
      ...approvedServiceDetails[service.id],
    };
    const cartaUrl = cartaServiceLinks[service.id];
    return cartaUrl
      ? {
          ...merged,
          destination: cartaServiceDestination,
          url: cartaUrl,
        }
      : merged;
  }),
  ...cartaOnlyServices,
];

export const services = mergedServices.map((service) => ({
  ...service,
  requestSystem: requestSystemForService(service.id),
}));
