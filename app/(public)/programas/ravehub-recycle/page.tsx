'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Leaf,
  Users,
  BarChart3,
  Calendar,
  CheckCircle2,
  Globe,
  Camera,
  Video,
  Megaphone,
  FileText,
  Recycle,
  TrendingUp,
  Target,
  Award,
  Heart,
  Sparkles,
  Mail,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const translations = {
  es: {
    // Hero
    heroTitle: 'Ravehub Recycle',
    heroSubtitle: 'Transformamos 50,000 Asistentes en Embajadores Ambientales',
    heroDescription: 'Educación positiva + Green Teams + Cobertura mediática. Tus asistentes adoptan prácticas sustentables y el mundo ve tu compromiso ambiental real.',
    heroButton: 'Ver Cómo Funciona',

    // Problem Section
    problemTitle: 'El Desafío Real',
    problemSubtitle: 'No es solo tener contenedores',
    problemDescription: 'Puedes tener 100 contenedores de reciclaje, pero si los asistentes no los usan correctamente, no sirve. El reto es educar y cambiar comportamiento de forma positiva.',

    // The Reality
    realityTitle: 'La Realidad de los Festivales',
    realityDesc: 'Los estudios muestran que el 80% de los asistentes QUIEREN reciclar, pero solo 30% lo hace correctamente. ¿Por qué? Falta educación positiva en el momento correcto.',

    // Stats
    stat1: 'Quieren reciclar',
    stat1Value: '80%',
    stat1Desc: 'De asistentes tienen intención',
    stat2: 'Lo hacen correctamente',
    stat2Value: '30%',
    stat2Desc: 'Sin educación activa',
    stat3: 'Con Green Teams',
    stat3Value: '75%+',
    stat3Desc: 'Mejora con educación positiva',

    // Solution
    solutionTitle: 'La Solución',
    solutionSubtitle: 'Educación positiva que funciona',

    // Who We Are
    whoTitle: 'Quiénes Somos',
    whoRavehub: 'Ravehub',
    whoDesc: 'La plataforma #1 de música electrónica en Latinoamérica. Conectamos festivales, DJs y fans en 12 países con una comunidad activa de más de 3.2 millones de seguidores.',

    whoMetric1: 'Países',
    whoMetric1Value: '12',
    whoMetric2: 'Seguidores',
    whoMetric2Value: '3.2M',
    whoMetric3: 'Festivales Cubiertos',
    whoMetric3Value: '50+',
    whoMetric4: 'Años de Experiencia',
    whoMetric4Value: '8',

    // What We Offer
    offerTitle: 'Qué Aportamos a Tu Festival',
    offerSubtitle: 'Educación + Visibilidad + Impacto Real',

    // The Program
    programTitle: 'Nuestro Programa de Impacto',

    pillar1Title: '👥 Educación de Asistentes',
    pillar1Subtitle: 'Green Teams que inspiran, no predican',
    pillar1Desc: 'Equipo capacitado que educa a tus asistentes de forma positiva en tiempo real. "Celebration, not a chore" - hacemos que reciclar sea parte de la experiencia.',

    pillar2Title: '📸 Amplificación Mediática',
    pillar2Subtitle: 'Mostramos tu compromiso a 3.2M+ personas',
    pillar2Desc: 'Cobertura profesional que documenta y difunde tu iniciativa ambiental. Tu festival se posiciona como líder sustentable en la escena.',

    pillar3Title: '♻️ Infraestructura & Logística',
    pillar3Subtitle: 'Sistema completo que funciona',
    pillar3Desc: 'Estaciones de reciclaje profesionales, señalización clara, gestión completa. Nosotros manejamos toda la logística.',

    pillar4Title: '📊 Impacto Medible',
    pillar4Subtitle: 'Métricas reales para tus stakeholders',
    pillar4Desc: 'Reporte con datos concretos: toneladas recicladas, asistentes educados, alcance mediático. Perfecto para sponsors e inversionistas.',

    // Initiatives
    initiativesTitle: 'Cómo Transformamos la Experiencia',
    initiativesSubtitle: 'Educación activa que cambia comportamiento',

    init1Title: 'Green Teams en Acción',
    init1Desc: '5-10 embajadores ambientales capacitados que educan a tus asistentes de forma positiva. No sermones, conversaciones genuinas. "Hey, ¿sabías que esto va aquí?" funciona mejor que "No tires eso ahí".',
    init1Metric: '10,000+ asistentes educados',

    init2Title: 'Estaciones Intuitivas',
    init2Desc: '15-20 puntos de reciclaje con señalización clara, multilingüe y visual. Diseñadas para que reciclar sea fácil, no confuso. Colores, iconos y ubicación estratégica.',
    init2Metric: '5-10 toneladas recicladas',

    init3Title: 'Campaña Digital de Impacto',
    init3Desc: 'Contenido antes, durante y después que posiciona tu festival como líder sustentable. 50+ publicaciones alcanzando 3.2M+ personas. Tus sponsors y stakeholders lo verán.',
    init3Metric: '3.2M+ alcance',

    init4Title: 'Reporte con Métricas Reales',
    init4Desc: 'Documento profesional con números concretos: X toneladas recicladas, Y asistentes educados, Z millones de alcance. Perfecto para presentar a sponsors, inversionistas y próximas ediciones.',
    init4Metric: 'Post-evento (7 días)',

    // Media Coverage
    mediaTitle: 'Cobertura Mediática Incluida',
    mediaSubtitle: 'Equipo profesional documenta tu festival',

    media1Title: 'Fotografía Profesional',
    media1Desc: '500+ fotos editadas en alta resolución',
    media2Title: 'Video & Aftermovie',
    media2Desc: 'Aftermovie oficial 3-5 minutos',
    media3Title: 'Contenido Redes Sociales',
    media3Desc: '30+ stories y posts durante evento',
    media4Title: 'Artículos & PR',
    media4Desc: 'Artículos en ravehublatam.com',

    // Results
    resultsTitle: 'Resultados Medibles',
    resultsSubtitle: 'KPIs que entregamos',

    result1: 'Residuos Reciclados',
    result1Value: '5-10 ton',
    result2: 'Asistentes Educados',
    result2Value: '10,000+',
    result3: 'Alcance Digital',
    result3Value: '3.2M+',
    result4: 'Contenido Producido',
    result4Value: '500+',

    // Why Us
    whyTitle: 'Por Qué Trabajar Con Nosotros',

    why1Title: 'Alcance Real',
    why1Desc: '3.2M seguidores activos. Tu mensaje ambiental llega a millones.',
    why2Title: 'Educación que Funciona',
    why2Desc: 'Green Teams capacitados en engagement positivo, no sermones.',
    why3Title: 'Contenido de Alto Valor',
    why3Desc: 'Portfolio comprobable. Cobertura profesional que te posiciona.',
    why4Title: 'Experiencia en la Escena',
    why4Desc: '50+ festivales. Entendemos la cultura y el público.',

    // Benchmarks
    benchmarkTitle: 'Festivales Que Ya Lo Hacen',
    benchmarkSubtitle: 'Estándares de la industria',
    bench1: 'Ultra Music Festival - Certificación Greener Festival',
    bench2: 'Glastonbury - 175,000 personas con reciclaje integral',
    bench3: 'Tomorrowland - Sistema de waste management completo',
    bench4: 'Lollapalooza - Partnership con REVERB para sostenibilidad',

    // Timeline
    timelineTitle: 'Cómo Funciona',
    phase1Title: 'Antes del Festival',
    phase1Items: ['Reunión de coordinación', 'Diseño personalizado de estaciones', 'Capacitación del equipo', 'Campaña digital pre-evento'],
    phase2Title: 'Durante el Festival',
    phase2Items: ['Instalación de estaciones', 'Green Team operando 24/7', 'Cobertura fotográfica y video', 'Publicación en tiempo real'],
    phase3Title: 'Después del Festival',
    phase3Items: ['Análisis de datos', 'Edición de contenido', 'Reporte de impacto', 'Certificación sustentable'],

    // CTA
    ctaTitle: '¿Listo para Transformar la Experiencia de Tu Festival?',
    ctaDesc: 'Contáctanos para discutir cómo educamos a tus asistentes y amplificamos tu compromiso ambiental',
    ctaButton: 'Hablemos',
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'Transformando la industria de festivales, un evento sustentable a la vez',
    footerRights: '© 2026 Ravehub. Todos los derechos reservados.',
  },
  en: {
    // Hero
    heroTitle: 'Ravehub Recycle',
    heroSubtitle: 'Transform 50,000 Attendees into Environmental Ambassadors',
    heroDescription: 'Positive education + Green Teams + Media coverage. Your attendees adopt sustainable practices and the world sees your real environmental commitment.',
    heroButton: 'See How It Works',

    // Problem Section
    problemTitle: 'The Real Challenge',
    problemSubtitle: "It's not just having containers",
    problemDescription: 'You can have 100 recycling bins, but if attendees don\'t use them correctly, it\'s useless. The challenge is educating and changing behavior positively.',

    // The Reality
    realityTitle: 'Festival Reality',
    realityDesc: 'Studies show 80% of attendees WANT to recycle, but only 30% do it correctly. Why? Lack of positive education at the right moment.',

    // Stats
    stat1: 'Want to recycle',
    stat1Value: '80%',
    stat1Desc: 'Attendees have intention',
    stat2: 'Do it correctly',
    stat2Value: '30%',
    stat2Desc: 'Without active education',
    stat3: 'With Green Teams',
    stat3Value: '75%+',
    stat3Desc: 'Improvement with positive education',

    // Solution
    solutionTitle: 'The Solution',
    solutionSubtitle: 'Positive education that works',

    // Who We Are
    whoTitle: 'Who We Are',
    whoRavehub: 'Ravehub',
    whoDesc: 'The #1 electronic music platform in Latin America. We connect festivals, DJs and fans across 12 countries with an active community of over 3.2 million followers.',

    whoMetric1: 'Countries',
    whoMetric1Value: '12',
    whoMetric2: 'Followers',
    whoMetric2Value: '3.2M',
    whoMetric3: 'Festivals Covered',
    whoMetric3Value: '50+',
    whoMetric4: 'Years of Experience',
    whoMetric4Value: '8',

    // What We Offer
    offerTitle: 'What We Bring to Your Festival',
    offerSubtitle: 'Education + Visibility + Real Impact',

    // The Program
    programTitle: 'Our Impact Program',

    pillar1Title: '👥 Attendee Education',
    pillar1Subtitle: 'Green Teams that inspire, not preach',
    pillar1Desc: 'Trained team that educates your attendees positively in real-time. "Celebration, not a chore" - we make recycling part of the experience.',

    pillar2Title: '📸 Media Amplification',
    pillar2Subtitle: 'We show your commitment to 3.2M+ people',
    pillar2Desc: 'Professional coverage that documents and spreads your environmental initiative. Your festival positions itself as a sustainable leader in the scene.',

    pillar3Title: '♻️ Infrastructure & Logistics',
    pillar3Subtitle: 'Complete system that works',
    pillar3Desc: 'Professional recycling stations, clear signage, complete management. We handle all logistics.',

    pillar4Title: '📊 Measurable Impact',
    pillar4Subtitle: 'Real metrics for your stakeholders',
    pillar4Desc: 'Report with concrete data: tons recycled, attendees educated, media reach. Perfect for sponsors and investors.',

    // Initiatives
    initiativesTitle: 'How We Transform the Experience',
    initiativesSubtitle: 'Active education that changes behavior',

    init1Title: 'Green Teams in Action',
    init1Desc: '5-10 trained environmental ambassadors who educate your attendees positively. No sermons, genuine conversations. "Hey, did you know this goes here?" works better than "Don\'t throw that there".',
    init1Metric: '10,000+ attendees educated',

    init2Title: 'Intuitive Stations',
    init2Desc: '15-20 recycling points with clear, multilingual and visual signage. Designed to make recycling easy, not confusing. Colors, icons and strategic placement.',
    init2Metric: '5-10 tons recycled',

    init3Title: 'Digital Impact Campaign',
    init3Desc: 'Content before, during and after that positions your festival as a sustainable leader. 50+ publications reaching 3.2M+ people. Your sponsors and stakeholders will see it.',
    init3Metric: '3.2M+ reach',

    init4Title: 'Report with Real Metrics',
    init4Desc: 'Professional document with concrete numbers: X tons recycled, Y attendees educated, Z millions reached. Perfect for presenting to sponsors, investors and future editions.',
    init4Metric: 'Post-event (7 days)',

    // Media Coverage
    mediaTitle: 'Media Coverage Included',
    mediaSubtitle: 'Professional team documents your festival',

    media1Title: 'Professional Photography',
    media1Desc: '500+ edited high-resolution photos',
    media2Title: 'Video & Aftermovie',
    media2Desc: 'Official 3-5 minute aftermovie',
    media3Title: 'Social Media Content',
    media3Desc: '30+ stories and posts during event',
    media4Title: 'Articles & PR',
    media4Desc: 'Articles on ravehublatam.com',

    // Results
    resultsTitle: 'Measurable Results',
    resultsSubtitle: 'KPIs we deliver',

    result1: 'Waste Recycled',
    result1Value: '5-10 tons',
    result2: 'Attendees Educated',
    result2Value: '10,000+',
    result3: 'Digital Reach',
    result3Value: '3.2M+',
    result4: 'Content Produced',
    result4Value: '500+',

    // Why Us
    whyTitle: 'Why Work With Us',

    why1Title: 'Real Reach',
    why1Desc: '3.2M active followers. Your environmental message reaches millions.',
    why2Title: 'Education That Works',
    why2Desc: 'Green Teams trained in positive engagement, not sermons.',
    why3Title: 'High-Value Content',
    why3Desc: 'Verifiable portfolio. Professional coverage that positions you.',
    why4Title: 'Scene Experience',
    why4Desc: '50+ festivals. We understand the culture and audience.',

    // Benchmarks
    benchmarkTitle: 'Festivals Already Doing It',
    benchmarkSubtitle: 'Industry standards',
    bench1: 'Ultra Music Festival - Greener Festival Certification',
    bench2: 'Glastonbury - 175,000 people with comprehensive recycling',
    bench3: 'Tomorrowland - Complete waste management system',
    bench4: 'Lollapalooza - Partnership with REVERB for sustainability',

    // Timeline
    timelineTitle: 'How It Works',
    phase1Title: 'Before the Festival',
    phase1Items: ['Coordination meeting', 'Custom station design', 'Team training', 'Pre-event digital campaign'],
    phase2Title: 'During the Festival',
    phase2Items: ['Station installation', 'Green Team operating 24/7', 'Photo and video coverage', 'Real-time publication'],
    phase3Title: 'After the Festival',
    phase3Items: ['Data analysis', 'Content editing', 'Impact report', 'Sustainable certification'],

    // CTA
    ctaTitle: 'Ready to Transform Your Festival Experience?',
    ctaDesc: 'Contact us to discuss how we educate your attendees and amplify your environmental commitment',
    ctaButton: "Let's Talk",
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'Transforming the festival industry, one sustainable event at a time',
    footerRights: '© 2026 Ravehub. All rights reserved.',
  }
};

export default function RaveHubRecyclePage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Language Selector - Fixed top right */}
      <div className="fixed top-24 right-6 z-50">
        <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden shadow-xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang('es')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'es'
                  ? 'bg-green-500 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-green-500 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Hero Background Image - Placeholder */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-zinc-950 z-10" />
          {/* Placeholder for hero image */}
          <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-emerald-900/20 flex items-center justify-center">
            <div className="text-center text-zinc-700">
              <Camera className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Hero Image: Festival crowd from above</p>
              <p className="text-xs">Sustainable, green, vibrant</p>
            </div>
          </div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-8">
            <Leaf className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            {t.heroTitle}
          </h1>

          <p className="text-2xl md:text-3xl font-semibold text-green-400 mb-6">
            {t.heroSubtitle}
          </p>

          <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-12">
            {t.heroDescription}
          </p>

          <a
            href="#programa"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-500/30"
          >
            {t.heroButton}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Problem Section - WITH IMPACT IMAGES */}
      <div className="py-20 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold text-sm uppercase">{t.problemTitle}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.problemSubtitle}
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              {t.problemDescription}
            </p>
          </div>

          {/* Problem Images Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Image placeholder 1 - Post festival trash */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <AlertTriangle className="w-16 h-16 mb-3 text-red-400/30" />
                <p className="text-sm font-semibold text-center px-4">Imagen: Campo post-festival<br/>lleno de basura</p>
              </div>
            </div>

            {/* Image placeholder 2 - Plastic bottles */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <AlertTriangle className="w-16 h-16 mb-3 text-red-400/30" />
                <p className="text-sm font-semibold text-center px-4">Imagen: Montañas de<br/>botellas plásticas</p>
              </div>
            </div>

            {/* Image placeholder 3 - Volunteers cleaning */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <AlertTriangle className="w-16 h-16 mb-3 text-red-400/30" />
                <p className="text-sm font-semibold text-center px-4">Imagen: Terreno<br/>contaminado</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">{t.stat1Value}</div>
              <div className="text-xl font-semibold text-white mb-2">{t.stat1}</div>
              <div className="text-sm text-zinc-500">{t.stat1Desc}</div>
            </div>

            <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">{t.stat2Value}</div>
              <div className="text-xl font-semibold text-white mb-2">{t.stat2}</div>
              <div className="text-sm text-zinc-500">{t.stat2Desc}</div>
            </div>

            <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">{t.stat3Value}</div>
              <div className="text-xl font-semibold text-white mb-2">{t.stat3}</div>
              <div className="text-sm text-zinc-500">{t.stat3Desc}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="py-20 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold text-sm uppercase">{t.solutionTitle}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.solutionSubtitle}
            </h2>
          </div>

          {/* Solution Image - Before/After */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border-2 border-red-500/30">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <p className="text-sm font-semibold text-red-400 mb-2">ANTES</p>
                <AlertTriangle className="w-16 h-16 mb-3 text-red-400/30" />
                <p className="text-sm text-center px-4">Festival sin programa<br/>de reciclaje</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border-2 border-green-500/30">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <p className="text-sm font-semibold text-green-400 mb-2">DESPUÉS</p>
                <Sparkles className="w-16 h-16 mb-3 text-green-400/30" />
                <p className="text-sm text-center px-4">Con Ravehub Recycle<br/>limpio y organizado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Who We Are */}
      <div id="programa" className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.whoTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Ravehub Logo/Image Placeholder */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <Megaphone className="w-20 h-20 mb-4 text-purple-400/30" />
                <p className="text-sm font-semibold">Imagen: Ravehub branding</p>
                <p className="text-xs">Logo, team, o festival coverage</p>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white mb-6">{t.whoRavehub}</h3>
              <p className="text-lg text-zinc-300 leading-relaxed mb-8">
                {t.whoDesc}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{t.whoMetric1Value}</div>
                  <div className="text-sm text-zinc-400">{t.whoMetric1}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{t.whoMetric2Value}</div>
                  <div className="text-sm text-zinc-400">{t.whoMetric2}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{t.whoMetric3Value}</div>
                  <div className="text-sm text-zinc-400">{t.whoMetric3}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{t.whoMetric4Value}</div>
                  <div className="text-sm text-zinc-400">{t.whoMetric4}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Program - 4 Pillars */}
      <div className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.programTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.offerSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-8">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.pillar1Title}</h3>
              <p className="text-sm text-green-400 font-semibold mb-4">{t.pillar1Subtitle}</p>
              <p className="text-zinc-300">{t.pillar1Desc}</p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-8">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.pillar2Title}</h3>
              <p className="text-sm text-blue-400 font-semibold mb-4">{t.pillar2Subtitle}</p>
              <p className="text-zinc-300">{t.pillar2Desc}</p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-8">
              <div className="text-5xl mb-4">♻️</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.pillar3Title}</h3>
              <p className="text-sm text-purple-400 font-semibold mb-4">{t.pillar3Subtitle}</p>
              <p className="text-zinc-300">{t.pillar3Desc}</p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-8">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.pillar4Title}</h3>
              <p className="text-sm text-orange-400 font-semibold mb-4">{t.pillar4Subtitle}</p>
              <p className="text-zinc-300">{t.pillar4Desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Initiatives - WITH MOCKUP IMAGES */}
      <div className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.initiativesTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.initiativesSubtitle}</p>
          </div>

          <div className="space-y-12">
            {/* Initiative 1 - WITH IMAGE */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <Recycle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{t.init1Title}</h3>
                    <p className="text-sm text-green-400 font-semibold">{t.init1Metric}</p>
                  </div>
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  {t.init1Desc}
                </p>
              </div>
              <div className="order-1 md:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                  <Recycle className="w-20 h-20 mb-4 text-green-400/30" />
                  <p className="text-sm font-semibold text-center px-4">Mockup: Estación de reciclaje<br/>con señalización clara</p>
                </div>
              </div>
            </div>

            {/* Initiative 2 - WITH IMAGE */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                  <Users className="w-20 h-20 mb-4 text-blue-400/30" />
                  <p className="text-sm font-semibold text-center px-4">Foto: Green Team<br/>educando asistentes</p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{t.init2Title}</h3>
                    <p className="text-sm text-blue-400 font-semibold">{t.init2Metric}</p>
                  </div>
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  {t.init2Desc}
                </p>
              </div>
            </div>

            {/* Initiative 3 - WITH SOCIAL MEDIA MOCKUP */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{t.init3Title}</h3>
                    <p className="text-sm text-purple-400 font-semibold">{t.init3Metric}</p>
                  </div>
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  {t.init3Desc}
                </p>
              </div>
              <div className="order-1 md:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                  <Megaphone className="w-20 h-20 mb-4 text-purple-400/30" />
                  <p className="text-sm font-semibold text-center px-4">Mockup: Posts en redes<br/>sociales del festival</p>
                </div>
              </div>
            </div>

            {/* Initiative 4 - WITH REPORT MOCKUP */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                  <FileText className="w-20 h-20 mb-4 text-orange-400/30" />
                  <p className="text-sm font-semibold text-center px-4">Mockup: Reporte de impacto<br/>con gráficas y métricas</p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{t.init4Title}</h3>
                    <p className="text-sm text-orange-400 font-semibold">{t.init4Metric}</p>
                  </div>
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  {t.init4Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Coverage */}
      <div className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.mediaTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.mediaSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
              <Camera className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{t.media1Title}</h3>
              <p className="text-sm text-zinc-400">{t.media1Desc}</p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
              <Video className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{t.media2Title}</h3>
              <p className="text-sm text-zinc-400">{t.media2Desc}</p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
              <Megaphone className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{t.media3Title}</h3>
              <p className="text-sm text-zinc-400">{t.media3Desc}</p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
              <FileText className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{t.media4Title}</h3>
              <p className="text-sm text-zinc-400">{t.media4Desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.resultsTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.resultsSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-green-400 mb-3">{t.result1Value}</div>
              <div className="text-lg font-semibold text-white">{t.result1}</div>
            </div>

            <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-blue-400 mb-3">{t.result2Value}</div>
              <div className="text-lg font-semibold text-white">{t.result2}</div>
            </div>

            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-3">{t.result3Value}</div>
              <div className="text-lg font-semibold text-white">{t.result3}</div>
            </div>

            <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-orange-400 mb-3">{t.result4Value}</div>
              <div className="text-lg font-semibold text-white">{t.result4}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Us */}
      <div className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.whyTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: t.why1Title, desc: t.why1Desc, icon: Award },
              { title: t.why2Title, desc: t.why2Desc, icon: TrendingUp },
              { title: t.why3Title, desc: t.why3Desc, icon: Users },
              { title: t.why4Title, desc: t.why4Desc, icon: Heart },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.benchmarkTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.benchmarkSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[t.bench1, t.bench2, t.bench3, t.bench4].map((bench, idx) => (
              <div key={idx} className="bg-zinc-900 border border-white/10 rounded-xl p-6 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <p className="text-zinc-300">{bench}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.timelineTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Phase 1 */}
            <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">{t.phase1Title}</h3>
              <ul className="space-y-3">
                {t.phase1Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">{t.phase2Title}</h3>
              <ul className="space-y-3">
                {t.phase2Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">{t.phase3Title}</h3>
              <ul className="space-y-3">
                {t.phase3Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-y border-green-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            {t.ctaDesc}
          </p>
          <a
            href={`mailto:${t.ctaEmail}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-500/30"
          >
            <Mail className="w-5 h-5" />
            {t.ctaButton}
          </a>
          <p className="text-zinc-400 mt-6 text-lg">{t.ctaEmail}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 bg-zinc-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500 mb-4">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <p className="text-zinc-400 mb-2">{t.footerText}</p>
            <p className="text-zinc-600 text-sm">{t.footerRights}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
