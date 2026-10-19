import { permanentRedirect } from "next/navigation";

const officialOrganogramUrl = "https://www.amargosa.ba.gov.br/arquivos/2026-04-27-09-16-00-organograma.pdf";

export default function OrganogramPage() {
  permanentRedirect(officialOrganogramUrl);
}
