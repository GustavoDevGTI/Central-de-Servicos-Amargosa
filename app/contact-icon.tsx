type ContactIconKind = "phone" | "whatsapp" | "email";

export default function ContactIcon({ kind }: { kind: ContactIconKind }) {
  if (kind === "whatsapp") {
    return (
      <svg className="contact-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.2 11.7a8.2 8.2 0 0 1-12 7.3L4 20l1.1-4a8.2 8.2 0 1 1 15.1-4.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8.5 8.6c.2-.3.4-.4.7-.4h.6c.2 0 .4.1.5.4l.8 1.6c.1.2.1.4-.1.6l-.6.7a6.4 6.4 0 0 0 2.4 2.4l.7-.6c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5v.6c0 .3-.1.5-.4.7-.4.3-.9.5-1.5.5-2.5-.2-5.4-3.1-5.6-5.6 0-.6.2-1.1.5-1.5Z" fill="currentColor" />
      </svg>
    );
  }

  return kind === "email" ? (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.1 3.5 8.4 3l2.1 4.8-2.2 1.8a15.6 15.6 0 0 0 6.1 6.1l1.8-2.2 4.8 2.1-.5 3.3a2 2 0 0 1-2 1.7A17.5 17.5 0 0 1 3.4 5.5a2 2 0 0 1 1.7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
