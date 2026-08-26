import { categories, ServiceDirectory, slugify } from "../../internal-portal";

export function generateStaticParams() { return categories.map((entry) => ({ category: slugify(entry.label) })); }

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <ServiceDirectory mode="category" value={category} />;
}
