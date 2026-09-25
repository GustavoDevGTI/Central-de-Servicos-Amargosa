import { permanentRedirect } from "next/navigation";

const officialOrganogramUrl = "https://amargosa.ba.gov.br/organograma";

export default function OrganogramPage() {
  permanentRedirect(officialOrganogramUrl);
}
