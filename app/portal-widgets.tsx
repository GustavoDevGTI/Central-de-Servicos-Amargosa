"use client";

import { usePathname } from "next/navigation";
import AmandaWidget from "./amanda-widget";
import VlibrasWidget from "./vlibras-widget";

export default function PortalWidgets() {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isServicePreview = /^\/admin\/(preview|history)\/[^/]+\/[^/]+(?:\/before)?\/?$/.test(pathname);
  const showWidgets = !isAdmin || isServicePreview;

  return <>
    <VlibrasWidget enabled={showWidgets} />
    {showWidgets && <AmandaWidget />}
  </>;
}
