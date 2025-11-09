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
    <section className="relative isolate overflow-hidden bg-[#141618] py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-36 bg-[#141618]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#141618] via-[#141618]/96 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_78%,rgba(251,169,5,0.08),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_80%,rgba(0,203,255,0.07),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_96%,rgba(255,255,255,0.05),transparent_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-[#141618] via-[#141618]/95 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FAFDFF] mb-4 tracking-tight">
            Explora por país
          </h2>
          <p className="text-lg sm:text-xl text-[#53575A] max-w-2xl">
            Encuentra eventos y tickets por país y ciudad.
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/${country.code}/`}
              className="group bg-[#282D31] border border-[#DFE0E0]/20 rounded-xl p-6 hover:border-[#FBA905]/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#FAFDFF] group-hover:text-[#FBA905] transition-colors">
                      {country.name}
                    </h3>
                    <p className="text-sm text-[#53575A] mt-1">{country.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#53575A] group-hover:text-[#FBA905] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#53575A]">
                <MapPin className="h-4 w-4" />
                <span>{country.stats}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-[#282D31] border border-[#DFE0E0]/20 rounded-xl p-8 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-[#FAFDFF] mb-2">1,030+</div>
              <div className="text-sm text-[#53575A]">Eventos activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FAFDFF] mb-2">6</div>
              <div className="text-sm text-[#53575A]">Países cubiertos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FAFDFF] mb-2">25K+</div>
              <div className="text-sm text-[#53575A]">Usuarios activos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
