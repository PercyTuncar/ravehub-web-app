import { CountryAbout as CountryAboutType } from '@/lib/seo/country-about'
import { Music, MapPin, Users, Heart } from 'lucide-react'

interface CountryAboutProps {
  data: CountryAboutType
}

export function CountryAbout({ data }: CountryAboutProps) {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Music className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-gray-400 uppercase tracking-wider">Sobre la Escena</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {data.title}
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {data.intro}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Scene Evolution */}
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <Music className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{data.scene.title}</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {data.scene.content}
            </p>
          </div>

          {/* Venues */}
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{data.venues.title}</h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              {data.venues.content}
            </p>
            <ul className="space-y-2">
              {data.venues.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-400">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Culture - Full Width */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{data.culture.title}</h3>
          </div>
          <p className="text-gray-300 leading-relaxed text-lg">
            {data.culture.content}
          </p>
        </div>
      </div>
    </section>
  )
}