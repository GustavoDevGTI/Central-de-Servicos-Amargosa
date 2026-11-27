import { tutorialSectionId } from "./service-tutorial";

type MunicipalManual = { label: string; description: string; href: string; iconSrc: string; cardFragment?: string };

export const municipalManuals: readonly MunicipalManual[] = [
  {
    label: "Manual do SEI",
    description: "Abra e acompanhe processos no Sistema Eletrônico de Informações (SEI).",
    href: "/manual-sei",
    iconSrc: "/municipal-manuals/sei.png",
  },
  {
    label: "Manual de Transferência de Bens",
    description: "Solicite e acompanhe transferências de bens patrimoniais no SIM.",
    href: "/manuais-municipais/transferencia-de-bens",
    iconSrc: "/municipal-manuals/sim.png",
  },
  {
    label: "Férias – marcação ou alteração",
    description: "Consulte as orientações para marcar ou alterar suas férias.",
    href: "/servicos/ferias-marcacao-e-alteracao",
    iconSrc: "/municipal-manuals/sim.png",
    cardFragment: `#${tutorialSectionId}`,
  },
];
