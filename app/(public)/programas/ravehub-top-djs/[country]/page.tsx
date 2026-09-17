import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopDjsCountryExperience from "@/components/top-djs/TopDjsCountryExperience";
import { getTopDjsCountry } from "@/lib/top-djs/config";

type CountryPageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { country } = await params;
  const data = getTopDjsCountry(country);
  if (!data) return { title: "Top DJs | Ravehub" };
  return {
    title: `Top DJs de ${data.name}`,
    description: `Sugiere, descubre y vota por los DJs que están definiendo la escena electrónica de ${data.name}. Ranking anual creado por la comunidad.`,
    alternates: { canonical: `/programas/ravehub-top-djs/${country}` },
    openGraph: {
      title: `Ravehub Top DJs ${data.name}`,
      description: `La comunidad elige a los artistas que mueven la escena electrónica de ${data.name}.`,
      type: "website",
    },
  };
}

export default async function CountryRankingPage({ params }: CountryPageProps) {
  const { country } = await params;
  if (!getTopDjsCountry(country)) notFound();
  return <TopDjsCountryExperience countrySlug={country} />;
}
