'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, TrendingUp } from 'lucide-react';

const countries = [
  {
    code: 'pe',
    name: 'Perú',
    flag: '🇵🇪',
    gradient: 'from-red-500/15 via-red-400/10 to-white/5',
    hoverGradient: 'from-red-500/25 via-red-400/15 to-white/10',
    borderGradient: 'hover:border-red-400/40',
    description: 'Lima, Arequipa, Trujillo',
    stats: '150+ eventos',
    color: 'text-red-200',
    bgGlow: 'shadow-red-500/10',
    accentColor: 'from-red-500 to-red-600'
  },
  {
    code: 'cl',
    name: 'Chile',
    flag: '🇨🇱',
    gradient: 'from-blue-600/15 via-blue-500/8 to-red-500/10',
    hoverGradient: 'from-blue-600/25 via-blue-500/15 to-red-500/20',
    borderGradient: 'hover:border-blue-400/50',
    description: 'Santiago, Valparaíso, Concepción',
    stats: '120+ eventos',
    color: 'text-blue-200',
    bgGlow: 'shadow-blue-500/10',
    accentColor: 'from-blue-600 to-red-500'
  },
  {
    code: 'ec',
    name: 'Ecuador',
    flag: '🇪🇨',
    gradient: 'from-yellow-400/15 via-yellow-300/8 to-blue-500/10',
    hoverGradient: 'from-yellow-400/25 via-yellow-300/15 to-blue-500/20',
    borderGradient: 'hover:border-yellow-400/50',
    description: 'Quito, Guayaquil, Cuenca',
    stats: '80+ eventos',
    color: 'text-yellow-200',
    bgGlow: 'shadow-yellow-500/10',
    accentColor: 'from-yellow-400 to-blue-500'
  },
  {
    code: 'co',
    name: 'Colombia',
    flag: '🇨🇴',
    gradient: 'from-yellow-400/15 via-yellow-300/8 to-blue-600/12',
    hoverGradient: 'from-yellow-400/25 via-yellow-300/15 to-blue-600/22',
    borderGradient: 'hover:border-yellow-400/50',
    description: 'Bogotá, Medellín, Cali',
    stats: '200+ eventos',
    color: 'text-yellow-200',
    bgGlow: 'shadow-yellow-500/10',
    accentColor: 'from-yellow-400 to-blue-600'
  },
  {
    code: 'mx',
    name: 'México',
    flag: '🇲🇽',
    gradient: 'from-green-500/15 via-green-400/8 to-red-500/10',
    hoverGradient: 'from-green-500/25 via-green-400/15 to-red-500/20',
    borderGradient: 'hover:border-green-400/50',
    description: 'CDMX, Guadalajara, Monterrey',
    stats: '300+ eventos',
    color: 'text-green-200',
    bgGlow: 'shadow-green-500/10',
    accentColor: 'from-green-500 to-red-500'
  },
  {
    code: 'ar',
    name: 'Argentina',
    flag: '🇦🇷',
    gradient: 'from-sky-400/15 via-blue-300/8 to-white/5',
    hoverGradient: 'from-sky-400/25 via-blue-300/15 to-white/10',
    borderGradient: 'hover:border-sky-400/50',
    description: 'Buenos Aires, Córdoba, Rosario',
    stats: '180+ eventos',
    color: 'text-sky-200',
    bgGlow: 'shadow-sky-500/10',
    accentColor: 'from-sky-400 to-blue-300'
  }
];

export default function CountrySelector() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [animationDelay, setAnimationDelay] = useState(0);

  // Staggered entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDelay(100);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Explora por País
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Encuentra eventos y tickets por país y ciudad.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center items-center gap-8 text-sm text-gray-400 mb-12">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              <span>1,030+ eventos activos</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              <span>6 países cubiertos</span>
            </div>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country, index) => (
            <Link
              key={country.code}
              href={`/${country.code}/`}
              className="group relative overflow-hidden"
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
              style={{
                animationDelay: `${index * animationDelay}ms`
              }}
            >
              <div 
                className={`
                  relative bg-gradient-to-br ${country.gradient}
                  border border-gray-700/50 backdrop-blur-sm rounded-2xl p-6 
                  transition-all duration-500 transform hover:scale-105 ${country.bgGlow}
                  animate-slide-in-up hover:shadow-2xl
                  ${country.borderGradient}
                  ${hoveredCountry === country.code ? 'shadow-2xl' : ''}
                `}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                </div>

                {/* Country Flag Background Accent */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${country.gradient}
                  opacity-30 rounded-2xl
                  ${hoveredCountry === country.code ? `bg-gradient-to-br ${country.hoverGradient}` : ''}
                  transition-all duration-500
                `} />

                {/* Content */}
                <div className="z-10">
                  {/* Flag and Country Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl transform transition-transform duration-300 group-hover:scale-110">
                      {country.flag}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${country.color} transition-colors duration-300`}>
                        {country.name}
                      </h3>
                      <p className="text-sm text-gray-400">{country.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${country.color} transition-colors duration-300`}>
                      {country.stats}
                    </span>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      bg-gradient-to-r ${country.accentColor}
                      transform transition-all duration-300 group-hover:scale-110
                      shadow-lg
                    `}>
                      <MapPin className="h-4 w-4 text-white/90" />
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent
                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                    rounded-2xl
                  `} />

                  {/* Border Glow Effect */}
                  <div className={`
                    absolute inset-0 rounded-2xl p-[1px]
                    bg-gradient-to-r ${country.accentColor}
                    opacity-0 group-hover:opacity-30 transition-opacity duration-500
                    -z-10
                  `}>
                    <div className="w-full h-full bg-gray-900 rounded-2xl" />
                  </div>
                </div>

                {/* Subtle Border Pattern */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿No encuentras tu ciudad?
            </h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Estamos constantemente agregando nuevos destinos. ¡Contáctanos para solicitar eventos en tu ciudad!
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Solicitar Eventos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}