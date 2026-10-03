import { getCatalog } from "@/lib/repository";
import { CatalogView } from "@/components/catalog";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  return <CatalogView catalog={await getCatalog()} />;
}
