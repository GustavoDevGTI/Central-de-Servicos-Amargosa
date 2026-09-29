import { redirect } from "next/navigation";
import { categories, ServiceDirectory, slugify } from "../../internal-portal";

export function generateStaticParams() { return [...categories.map((entry) => ({ category: slugify(entry.label) })), { category: "tributos" }, { category: "impostos" }]; }

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (category === "impostos") redirect("/categorias/taxas-e-impostos");
  return <ServiceDirectory mode="category" value={category} />;
}
