import type { Metadata } from "next";
import { PortalHeader } from "../internal-portal";
import PortalFooter from "../portal-footer";

export const metadata: Metadata = {
  title: "Telefones úteis | Central de Serviços de Amargosa",
  description:
    "Contatos telefônicos de órgãos e serviços públicos de Amargosa.",
};

const publicContacts = [
  {
    group: "Atendimento municipal",
    contacts: [
      {
        name: "Central da Prefeitura de Amargosa",
        address: "Praça Lourival Monte, nº 001, Centro, Amargosa – BA, CEP 45300-000",
        phones: [{ label: "(75) 3512-7811", href: "tel:+557535127811" }],
      },
      {
        name: "Serviços de Infraestrutura",
        phones: [{ label: "156", href: "tel:156" }],
      },
      {
        name: "Conselho Tutelar",
        phones: [{ label: "125", href: "tel:125" }],
      },
    ],
  },
  {
    group: "Segurança pública",
    contacts: [
      {
        name: "Corpo de Bombeiros",
        detail: "Emergência",
        phones: [{ label: "193", href: "tel:193" }],
      },
      {
        name: "Guarda Civil Municipal",
        phones: [{ label: "153", href: "tel:153" }],
      },
      {
        name: "Polícia Militar",
        detail: "Emergência",
        phones: [{ label: "190", href: "tel:190" }],
      },
      {
        name: "Delegacia / DISEP",
        detail: "Distrito Integrado de Segurança Pública",
        address: "Travessa Almiro Vaz Sampaio, 30, Amargosa – BA, CEP 45300-000",
        phones: [{ label: "(75) 3634-1200", href: "tel:+557536341200" }],
      },
      {
        name: "Defesa Civil",
        detail: "Emergência",
        phones: [{ label: "199", href: "tel:199" }],
      },
    ],
  },
  {
    group: "Saúde pública",
    contacts: [
      {
        name: "SAMU",
        detail: "Serviço de Atendimento Móvel de Urgência",
        phones: [{ label: "192", href: "tel:192" }],
      },
      {
        name: "Hospital Municipal de Amargosa",
        detail: "Atendimento 24 horas",
        address: "Avenida Dr. Aloísio Borges, s/n, Santa Rita, Amargosa – BA",
        phones: [{ label: "(75) 3512-7811", href: "tel:+557535127811" }],
      },
      {
        name: "Vigilância Sanitária",
        phones: [{ label: "150", href: "tel:150" }],
      },
    ],
  },
  {
    group: "Justiça",
    contacts: [
      {
        name: "Fórum da Comarca de Amargosa",
        address: "Praça Tiradentes, nº 366, Centro, Amargosa – BA, CEP 45300-000",
        phones: [
          { label: "(75) 3634-1171", href: "tel:+557536341171" },
          { label: "(75) 3634-1296", href: "tel:+557536341296" },
        ],
      },
    ],
  },
];

export default function UsefulPhonesPage() {
  return (
    <main className="site-root internal-site useful-phones-page">
      <a className="skip" href="#telefones-uteis-conteudo">
        Ir para o conteúdo
      </a>
      <PortalHeader />

      <section
        id="telefones-uteis-conteudo"
        className="useful-phones-content"
        aria-labelledby="useful-phones-title"
      >
        <header className="useful-phones-heading">
          <span>CONTATOS PÚBLICOS</span>
          <h1 id="useful-phones-title">Telefones úteis</h1>
        </header>

        <div className="useful-phones-groups">
          {publicContacts.map((section) => (
            <section key={section.group} className="useful-phones-group">
              <h2>{section.group}</h2>
              <div className="useful-phones-list">
                {section.contacts.map((contact) => (
                  <article key={contact.name} className="useful-phone-card">
                    <div>
                      <h3>{contact.name}</h3>
                      {contact.detail && <p>{contact.detail}</p>}
                      {contact.address && <address>{contact.address}</address>}
                    </div>
                    <div className="useful-phone-links">
                      {contact.phones.map((phone) => (
                        <a
                          key={phone.href}
                          href={phone.href}
                          aria-label={`Ligar para ${contact.name}: ${phone.label}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path d="M7.1 3.5 4.8 5.8c-.7.7-.8 1.8-.3 2.7 2.5 4.8 6.3 8.6 11.1 11.1.9.5 2 .4 2.7-.3l2.3-2.3-4.2-3.1-1.8 1.8c-2.7-1.5-4.9-3.7-6.4-6.4L10 7.6 7.1 3.5Z" />
                          </svg>
                          <span>Ligar</span>
                          <strong>{phone.label}</strong>
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
