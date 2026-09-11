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
    heroSubtitle: 'Transformando Festivales de Música en Eventos Sustentables',
    heroDescription: 'Programa integral de sostenibilidad y cobertura mediática para festivales de música electrónica en todo el mundo.',
    heroButton: 'Conoce el Programa',

    // Problem Section
    problemTitle: 'El Problema',
    problemSubtitle: 'La realidad después de cada festival',
    problemDescription: 'Miles de asistentes, experiencias increíbles... y toneladas de residuos que contaminan el planeta. Es hora de cambiar esto.',

    // The Reality
    realityTitle: 'La Realidad Post-Festival',
    realityDesc: 'Cada año, los festivales de música generan miles de toneladas de residuos. Botellas plásticas, vasos, empaques de comida, y más terminan en vertederos o peor, en la naturaleza.',

    // Stats
    stat1: 'Toneladas de basura',
    stat1Value: '100+',
    stat1Desc: 'Por festival de 50K personas',
    stat2: 'Reciclado correctamente',
    stat2Value: '<15%',
    stat2Desc: 'En festivales sin programa',
    stat3: 'Botellas plásticas',
    stat3Value: '500K+',
    stat3Desc: 'Usadas en un festival promedio',

    // Solution
    solutionTitle: 'La Solución',
    solutionSubtitle: 'Un programa integral que hace la diferencia',

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
    offerTitle: 'Qué Ofrecemos a Tu Festival',
    offerSubtitle: 'Un programa completo que aporta valor real',

    // The Program
    programTitle: 'El Programa Ravehub Recycle',
    program1Title: 'Implementación de Sostenibilidad',
    program1Desc: 'Instalamos y operamos infraestructura de reciclaje durante todo el evento',
    program2Title: 'Cobertura Mediática Profesional',
    program2Desc: 'Documentamos el festival y destacamos tus iniciativas sustentables',
    program3Title: 'Educación Ambiental',
    program3Desc: 'Educamos a los asistentes sobre prácticas responsables',
    program4Title: 'Reporte de Impacto',
    program4Desc: 'Entregamos métricas y certificación de evento sustentable',

    // Initiatives
    initiativesTitle: 'Nuestras Iniciativas',
    initiativesSubtitle: 'Acciones concretas que implementamos',

    init1Title: 'Estaciones de Reciclaje Inteligentes',
    init1Desc: 'Módulos profesionales de reciclaje ubicados estratégicamente con señalización clara en múltiples idiomas. Separamos plástico, vidrio, papel, orgánico y residuos generales.',
    init1Metric: '15-20 estaciones',

    init2Title: 'Green Team - Embajadores Ambientales',
    init2Desc: 'Equipo capacitado que educa y guía a los asistentes en tiempo real sobre cómo y dónde reciclar correctamente durante todo el evento.',
    init2Metric: '5-10 personas',

    init3Title: 'Campaña Digital de Impacto',
    init3Desc: 'Difusión antes, durante y después del festival destacando las iniciativas verdes, con alcance de millones de personas en redes sociales.',
    init3Metric: '3.2M+ alcance',

    init4Title: 'Reporte Profesional de Impacto',
    init4Desc: 'Documento detallado con métricas, fotografías, análisis y certificación digital de evento sustentable que puedes usar en tu marketing.',
    init4Metric: 'Post-evento',

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

    why1Title: 'Experiencia Comprobada',
    why1Desc: '8 años cubriendo festivales en Latinoamérica',
    why2Title: 'Alcance Real',
    why2Desc: '3.2M de seguidores activos en la escena',
    why3Title: 'Equipo Profesional',
    why3Desc: '12+ personas especializadas',
    why4Title: 'Sin Costo Para Ti',
    why4Desc: 'Solo necesitamos acceso al evento',

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
    ctaTitle: '¿Tu Festival Está Listo Para el Cambio?',
    ctaDesc: 'Contáctanos para discutir cómo implementar Ravehub Recycle en tu próximo evento',
    ctaButton: 'Contactar Ahora',
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'Transformando la industria de festivales, un evento sustentable a la vez',
    footerRights: '© 2026 Ravehub. Todos los derechos reservados.',
  },
  en: {
    // Hero
    heroTitle: 'Ravehub Recycle',
    heroSubtitle: 'Transforming Music Festivals into Sustainable Events',
    heroDescription: 'Comprehensive sustainability and media coverage program for electronic music festivals worldwide.',
    heroButton: 'Learn About the Program',

    // Problem Section
    problemTitle: 'The Problem',
    problemSubtitle: 'The reality after each festival',
    problemDescription: 'Thousands of attendees, incredible experiences... and tons of waste polluting the planet. It\'s time to change this.',

    // The Reality
    realityTitle: 'Post-Festival Reality',
    realityDesc: 'Every year, music festivals generate thousands of tons of waste. Plastic bottles, cups, food packaging, and more end up in landfills or worse, in nature.',

    // Stats
    stat1: 'Tons of trash',
    stat1Value: '100+',
    stat1Desc: 'Per 50K people festival',
    stat2: 'Properly recycled',
    stat2Value: '<15%',
    stat2Desc: 'In festivals without program',
    stat3: 'Plastic bottles',
    stat3Value: '500K+',
    stat3Desc: 'Used in average festival',

    // Solution
    solutionTitle: 'The Solution',
    solutionSubtitle: 'A comprehensive program that makes a difference',

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
    offerTitle: 'What We Offer Your Festival',
    offerSubtitle: 'A complete program that brings real value',

    // The Program
    programTitle: 'The Ravehub Recycle Program',
    program1Title: 'Sustainability Implementation',
    program1Desc: 'We install and operate recycling infrastructure throughout the event',
    program2Title: 'Professional Media Coverage',
    program2Desc: 'We document the festival and highlight your sustainable initiatives',
    program3Title: 'Environmental Education',
    program3Desc: 'We educate attendees about responsible practices',
    program4Title: 'Impact Report',
    program4Desc: 'We deliver metrics and sustainable event certification',

    // Initiatives
    initiativesTitle: 'Our Initiatives',
    initiativesSubtitle: 'Concrete actions we implement',

    init1Title: 'Smart Recycling Stations',
    init1Desc: 'Professional recycling modules strategically located with clear signage in multiple languages. We separate plastic, glass, paper, organic and general waste.',
    init1Metric: '15-20 stations',

    init2Title: 'Green Team - Environmental Ambassadors',
    init2Desc: 'Trained team that educates and guides attendees in real-time on how and where to recycle correctly throughout the event.',
    init2Metric: '5-10 people',

    init3Title: 'Digital Impact Campaign',
    init3Desc: 'Dissemination before, during and after the festival highlighting green initiatives, reaching millions of people on social media.',
    init3Metric: '3.2M+ reach',

    init4Title: 'Professional Impact Report',
    init4Desc: 'Detailed document with metrics, photographs, analysis and digital sustainable event certification you can use in your marketing.',
    init4Metric: 'Post-event',

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

    why1Title: 'Proven Experience',
    why1Desc: '8 years covering festivals in Latin America',
    why2Title: 'Real Reach',
    why2Desc: '3.2M active followers in the scene',
    why3Title: 'Professional Team',
    why3Desc: '12+ specialized people',
    why4Title: 'No Cost To You',
    why4Desc: 'We only need access to the event',

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
    ctaTitle: 'Is Your Festival Ready for Change?',
    ctaDesc: 'Contact us to discuss how to implement Ravehub Recycle at your next event',
    ctaButton: 'Contact Now',
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
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8">
              <Leaf className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">{t.program1Title}</h3>
              <p className="text-zinc-300">{t.program1Desc}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8">
              <Camera className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">{t.program2Title}</h3>
              <p className="text-zinc-300">{t.program2Desc}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
              <Users className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">{t.program3Title}</h3>
              <p className="text-zinc-300">{t.program3Desc}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
              <FileText className="w-12 h-12 text-orange-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">{t.program4Title}</h3>
              <p className="text-zinc-300">{t.program4Desc}</p>
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
