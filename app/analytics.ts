type DataLayerEntry = {
  event?: string;
  search_term?: string;
  results_count?: number;
  service_id?: string;
  service_name?: string;
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

export function trackServiceClick(serviceId: string, serviceName: string) {
  if (typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.dataLayer.push({ event: "service_click", service_id: serviceId, service_name: serviceName });
}

export function trackServiceStart(serviceId: string, serviceName: string) {
  if (typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.dataLayer.push({ event: "service_start", service_id: serviceId, service_name: serviceName });
}
