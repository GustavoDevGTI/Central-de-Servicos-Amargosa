export function whatsappHref(value: string): string | undefined {
  const number = value.match(/(?:\+?55[\s().-]*)?\(?\d{2}\)?[\s.-]*\d(?:[\s.-]?\d){3,4}[\s.-]*\d{4}/)?.[0];
  if (!number) return undefined;
  const digits = number.replace(/\D/g, "");
  const local = (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
    ? digits.slice(2)
    : digits;
  return local.length === 10 || local.length === 11 ? `https://wa.me/55${local}` : undefined;
}
