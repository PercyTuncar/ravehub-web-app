import type { Metadata } from 'next'
import { Recycle, Leaf, Heart, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ravehub Recycle | Sustentabilidad en Festivales',
  description: 'Iniciativa de Ravehub para promover el reciclaje y la sostenibilidad en festivales y eventos de música electrónica en Latinoamérica.',
  alternates: { canonical: '/programas/ravehub-recycle' },
}

export default function RaveHubRecyclePage() {
  const initiatives = [
    {
      icon: Recycle,
      title: 'Reciclaje en Eventos',
      description: 'Implementación de sistemas de reciclaje en festivales y eventos de música electrónica',
    },
    {
      icon: Leaf,
      title: 'Educación Ambiental',
      description: 'Campañas de concientización sobre el impacto ambiental de los eventos masivos',
    },
    {
      icon: Heart,
      title: 'Alianzas Verdes',
      description: 'Colaboración con organizaciones ambientales y festivales comprometidos',
    },
    {
      icon: Calendar,
      title: 'Eventos Sostenibles',
      description: 'Promoción y certificación de eventos con prácticas sustentables',
    },
  ]

  return (
    <div className="min-h-screen bg-[#141618]">
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-8">
              <Recycle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-[#FAFDFF] mb-6">
              Ravehub Recycle
            </h1>

            <p className="text-xl text-[#53575A] max-w-3xl mx-auto mb-8">
              Impulsando una escena de música electrónica más sostenible y responsable
              con el medio ambiente en toda Latinoamérica
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#282D31] rounded-full border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[#FAFDFF] text-sm font-medium">Próximamente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 md:p-12 border border-green-500/20 mb-16">
          <h2 className="text-3xl font-bold text-[#FAFDFF] mb-4 text-center">
            Nuestra Misión
          </h2>
          <p className="text-lg text-[#FAFDFF]/80 text-center max-w-3xl mx-auto">
            Transformar la industria de eventos de música electrónica en Latinoamérica,
            promoviendo prácticas sustentables que protejan nuestro planeta mientras
            disfrutamos de la música que amamos.
          </p>
        </div>

        {/* Initiatives Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {initiatives.map((initiative, index) => {
            const Icon = initiative.icon
            return (
              <div
                key={index}
                className="bg-[#282D31] rounded-xl p-8 border border-[#DFE0E0]/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#FAFDFF] mb-2">
                      {initiative.title}
                    </h3>
                    <p className="text-[#53575A]">
                      {initiative.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-[#282D31] rounded-2xl p-8 md:p-12 border border-[#DFE0E0]/10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#FAFDFF] mb-4">
            Únete al Cambio
          </h2>
          <p className="text-[#53575A] mb-6 max-w-2xl mx-auto">
            Estamos trabajando en alianzas con festivales, artistas y organizaciones
            para hacer realidad una escena electrónica más sostenible.
          </p>
          <p className="text-[#FBA905] font-medium">
            ¿Organizas eventos? ¿Tienes ideas para colaborar? Pronto podrás contactarnos.
          </p>
        </div>
      </div>
    </div>
  )
}
