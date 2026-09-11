import type { Metadata } from 'next'
import { Trophy, TrendingUp, Users, Award } from 'lucide-react'

type CountryPageProps = {
  params: Promise<{
    country: string
  }>
}

const countryData: Record<string, { name: string; flag: string }> = {
  peru: { name: 'Perú', flag: '🇵🇪' },
  chile: { name: 'Chile', flag: '🇨🇱' },
  colombia: { name: 'Colombia', flag: '🇨🇴' },
  argentina: { name: 'Argentina', flag: '🇦🇷' },
  mexico: { name: 'México', flag: '🇲🇽' },
  brasil: { name: 'Brasil', flag: '🇧🇷' },
  ecuador: { name: 'Ecuador', flag: '🇪🇨' },
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country } = await params
  const data = countryData[country] || { name: country, flag: '' }

  return {
    title: `Top DJs de ${data.name} | Ravehub Top Djs`,
    description: `Descubre los mejores DJs de música electrónica de ${data.name}. Vota por tus artistas favoritos y sigue el ranking de talentos locales.`,
    alternates: { canonical: `/programas/ravehub-top-djs/${country}` },
  }
}

export default async function CountryRankingPage({ params }: CountryPageProps) {
  const { country } = await params
  const data = countryData[country] || { name: country, flag: '🌎' }

  return (
    <div className="min-h-screen bg-[#141618]">
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBA905]/10 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FBA905] to-[#F1A000] mb-8">
              <Trophy className="w-10 h-10 text-[#282D31]" />
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-6xl">{data.flag}</span>
              <h1 className="text-4xl md:text-6xl font-bold text-[#FAFDFF]">
                Top DJs {data.name}
              </h1>
            </div>

            <p className="text-xl text-[#53575A] max-w-3xl mx-auto mb-8">
              Los mejores DJs de la escena electrónica en {data.name}
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#282D31] rounded-full border border-[#FBA905]/30">
              <div className="w-2 h-2 rounded-full bg-[#FBA905] animate-pulse" />
              <span className="text-[#FAFDFF] text-sm font-medium">Próximamente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#282D31] rounded-xl p-6 border border-[#DFE0E0]/10">
            <TrendingUp className="w-10 h-10 text-[#FBA905] mb-4" />
            <h3 className="text-lg font-bold text-[#FAFDFF] mb-2">Rankings Actualizados</h3>
            <p className="text-sm text-[#53575A]">
              Sistema de votación en tiempo real para reconocer a los mejores talentos
            </p>
          </div>

          <div className="bg-[#282D31] rounded-xl p-6 border border-[#DFE0E0]/10">
            <Users className="w-10 h-10 text-[#FBA905] mb-4" />
            <h3 className="text-lg font-bold text-[#FAFDFF] mb-2">Voto Comunitario</h3>
            <p className="text-sm text-[#53575A]">
              La comunidad decide quiénes son los artistas más destacados
            </p>
          </div>

          <div className="bg-[#282D31] rounded-xl p-6 border border-[#DFE0E0]/10">
            <Award className="w-10 h-10 text-[#FBA905] mb-4" />
            <h3 className="text-lg font-bold text-[#FAFDFF] mb-2">Visibilidad Local</h3>
            <p className="text-sm text-[#53575A]">
              Plataforma para que los DJs locales ganen exposición
            </p>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-[#282D31] rounded-2xl p-8 md:p-12 border border-[#DFE0E0]/10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#FAFDFF] mb-4">
            Estamos Preparando el Ranking de {data.name}
          </h2>
          <p className="text-[#53575A] mb-6 max-w-2xl mx-auto">
            Pronto podrás votar por tus DJs favoritos y seguir el ranking de los mejores
            talentos de la escena electrónica en {data.name}.
          </p>
          <p className="text-[#FBA905] font-medium">
            Sé el primero en enterarte cuando lancemos el sistema de votación.
          </p>
        </div>
      </div>
    </div>
  )
}
