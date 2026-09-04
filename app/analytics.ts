type DataLayerEntry = {
  event?: string;
  search_term?: string;
  results_count?: number;
  service_id?: string;
  service_name?: string;
};

export type AnalyticsService = {
  id: string;
  title: string;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
  }
}

export function trackSearchResults(term: string, resultsCount: number) {
  const searchTerm = term.trim().toLocaleLowerCase("pt-BR");
  if (!searchTerm || typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.dataLayer.push({ event: "view_search_results", search_term: searchTerm, results_count: resultsCount });
}

function getAnalyticsService(service: AnalyticsService) {
  return {
    service_id: String(service.id),
    service_name: String(service.title).trim(),
  };
}

export function trackServiceClick(service: AnalyticsService) {
  if (typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.dataLayer.push({ event: "service_click", ...getAnalyticsService(service) });
}

export function trackServiceStart(service: AnalyticsService) {
  if (typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.dataLayer.push({ event: "service_start", ...getAnalyticsService(service) });
}
