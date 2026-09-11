import type { Metadata } from 'next'
import { Trophy, Star, TrendingUp, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ravehub Top Djs | Rankings de DJs de Latinoamérica',
  description: 'Descubre y vota por los mejores DJs de la escena electrónica en Latinoamérica. Rankings por país y reconocimiento a talentos locales.',
  alternates: { canonical: '/programas/ravehub-top-djs' },
}

export default function RaveHubTopPage() {
  const features = [
    {
      icon: Trophy,
      title: 'Rankings por País',
      description: 'Sistema de votación y reconocimiento organizado por países de Latinoamérica',
    },
    {
      icon: Star,
      title: 'Reconocimiento Local',
      description: 'Visibilidad para talentos emergentes y establecidos de cada escena local',
    },
    {
      icon: TrendingUp,
      title: 'Impulso a Carreras',
      description: 'Plataforma para que DJs locales ganen exposición internacional',
    },
    {
      icon: Users,
      title: 'Votación Comunitaria',
      description: 'La comunidad decide quiénes son los artistas más destacados',
    },
  ]

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

            <h1 className="text-4xl md:text-6xl font-bold text-[#FAFDFF] mb-6">
              Ravehub Top Djs
            </h1>

            <p className="text-xl text-[#53575A] max-w-3xl mx-auto mb-8">
              El primer sistema de rankings dedicado a reconocer y dar visibilidad a los DJs
              de la escena electrónica en Latinoamérica
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
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-[#282D31] rounded-xl p-8 border border-[#DFE0E0]/10 hover:border-[#FBA905]/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FBA905] to-[#F1A000] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[#282D31]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#FAFDFF] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-[#53575A]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Countries Coming Soon */}
        <div className="mt-16 bg-[#282D31] rounded-2xl p-8 border border-[#DFE0E0]/10">
          <h2 className="text-2xl font-bold text-[#FAFDFF] mb-4 text-center">
            Rankings por País
          </h2>
          <p className="text-[#53575A] text-center mb-8">
            Estamos preparando el sistema de votación para cada país de Latinoamérica
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Perú', 'Chile', 'Colombia', 'Argentina', 'México', 'Brasil', 'Ecuador', 'Más países'].map((country) => (
              <div
                key={country}
                className="px-4 py-3 bg-[#141618] rounded-lg text-center text-[#FAFDFF] text-sm font-medium border border-[#DFE0E0]/10"
              >
                {country}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
