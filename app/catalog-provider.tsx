"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { services as builtInServices, type Service } from "./service-catalog";

const CatalogContext = createContext<Service[]>(builtInServices);

export function CatalogProvider({ children, initialServices = builtInServices }: { children: ReactNode; initialServices?: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  useEffect(() => {
    let active = true;
    void fetch("/api/catalog", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ services?: Service[] }> : null)
      .then((data) => { if (active && Array.isArray(data?.services)) setServices(data.services); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return <CatalogContext.Provider value={services}>{children}</CatalogContext.Provider>;
}

export function useCatalogServices() {
  return useContext(CatalogContext);
}

/** A draft must never be replaced by the public catalog during hydration. */
export function CatalogPreviewProvider({ services, children }: { services: Service[]; children: ReactNode }) {
  return <CatalogContext.Provider value={services}>{children}</CatalogContext.Provider>;
}
