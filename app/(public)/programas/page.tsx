import type { Metadata } from 'next'
import Link from 'next/link'
import { Headphones, Trophy, Recycle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Programas | Ravehub',
  description: 'Descubre los programas e iniciativas de Ravehub para impulsar la escena electrónica en Latinoamérica.',
  alternates: { canonical: '/programas' },
}

export default function ProgramasPage() {
  const programs = [
    {
      icon: Headphones,
      title: 'DJs',
      description: 'Descubre artistas y DJs de la escena electrónica.',
      href: '/djs',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Trophy,
      title: 'Ravehub Top Djs',
      description: 'Rankings y reconocimiento de DJs por país en Latinoamérica.',
      href: '/programas/ravehub-top-djs',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Recycle,
      title: 'Ravehub Recycle',
      description: 'Impulsamos una escena electrónica más sostenible.',
      href: '/programas/ravehub-recycle',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="min-h-screen bg-[#141618] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#FAFDFF] mb-4">
            Programas Ravehub
          </h1>
          <p className="text-lg text-[#53575A] max-w-2xl mx-auto">
            Iniciativas y proyectos para impulsar la escena de música electrónica en Latinoamérica
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {programs.map((program) => {
            const Icon = program.icon
            return (
              <Link
                key={program.href}
                href={program.href}
                className="group relative bg-[#282D31] rounded-2xl p-8 border border-[#DFE0E0]/10 hover:border-[#FBA905]/50 transition-all duration-300 overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FBA905] to-[#F1A000] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-[#282D31]" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-[#FAFDFF] mb-3 group-hover:text-[#FBA905] transition-colors">
                    {program.title}
                  </h2>

                  <p className="text-[#53575A] group-hover:text-[#FAFDFF] transition-colors">
                    {program.description}
                  </p>

                  <div className="mt-6 flex items-center text-[#FBA905] text-sm font-medium">
                    Ver más
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
