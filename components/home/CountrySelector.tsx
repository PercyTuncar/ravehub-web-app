'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

const countries = [
  {
    code: 'pe',
    name: 'Perú',
    flag: '🇵🇪',
    description: 'Lima, Arequipa, Trujillo',
    stats: '150+ eventos',
  },
  {
    code: 'cl',
    name: 'Chile',
    flag: '🇨🇱',
    description: 'Santiago, Valparaíso, Concepción',
    stats: '120+ eventos',
  },
  {
    code: 'ec',
    name: 'Ecuador',
    flag: '🇪🇨',
    description: 'Quito, Guayaquil, Cuenca',
    stats: '80+ eventos',
  },
  {
    code: 'co',
    name: 'Colombia',
    flag: '🇨🇴',
    description: 'Bogotá, Medellín, Cali',
    stats: '200+ eventos',
  },
  {
    code: 'mx',
    name: 'México',
    flag: '🇲🇽',
    description: 'CDMX, Guadalajara, Monterrey',
    stats: '300+ eventos',
  },
  {
    code: 'ar',
    name: 'Argentina',
    flag: '🇦🇷',
    description: 'Buenos Aires, Córdoba, Rosario',
    stats: '180+ eventos',
  }
];

export default function CountrySelector() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Explora por país
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
            Encuentra eventos y tickets por país y ciudad.
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/${country.code}/`}
              className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {country.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{country.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{country.stats}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1,030+</div>
              <div className="text-sm text-gray-600">Eventos activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">6</div>
              <div className="text-sm text-gray-600">Países cubiertos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">25K+</div>
              <div className="text-sm text-gray-600">Usuarios activos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
