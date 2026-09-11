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
    heroSubtitle: 'Cumple con Normativa Ambiental + Mejora tu Imagen',
    heroDescription: 'Te ayudamos a cumplir con los requisitos obligatorios de gestión de residuos para obtener permisos, mientras mejoramos la imagen sustentable de tu festival.',
    heroButton: 'Ver Cómo Te Ayudamos',

    // Problem Section
    problemTitle: 'Tu Desafío Legal',
    problemSubtitle: 'Requisitos obligatorios para obtener permisos',
    problemDescription: 'Para obtener permisos, las autoridades exigen: Plan de Gestión de Residuos, contenedores adecuados, limpieza inmediata post-evento, y reportes de cumplimiento. Sin esto, no hay festival.',

    // The Reality
    realityTitle: '¿Qué Exigen las Autoridades?',
    realityDesc: 'Los gobiernos locales requieren que los organizadores presenten un Plan de Gestión de Residuos ANTES de aprobar permisos. Eventos con 500+ personas deben incluir reciclaje/compost. El organizador es legalmente responsable del venue Y del perímetro bajo su permiso.',

    // Stats
    stat1: 'Plan de gestión',
    stat1Value: '100%',
    stat1Desc: 'Obligatorio para permisos',
    stat2: 'Limpieza post-evento',
    stat2Value: '24-48h',
    stat2Desc: 'Plazo máximo exigido',
    stat3: 'Multas por incumplimiento',
    stat3Value: '$50K+',
    stat3Desc: 'Puede llegar a esto o más',

    // Solution
    solutionTitle: 'La Solución',
    solutionSubtitle: 'Nosotros manejamos todo el cumplimiento por ti',

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
    offerTitle: 'Qué Incluye Nuestro Servicio',
    offerSubtitle: 'Cumplimiento legal + valor agregado',

    // The Program - Responsibilities
    programTitle: 'Cubrimos TUS Responsabilidades Legales',

    legal1Title: '📋 Plan de Gestión de Residuos',
    legal1Subtitle: 'Requerido para permiso del evento',
    legal1Desc: 'Elaboramos el documento técnico profesional que necesitas presentar a las autoridades para obtener tu permiso. Incluye mapeo de contenedores, protocolos, métricas esperadas y cumplimiento normativo.',

    legal2Title: '♻️ Implementación Dentro del Venue',
    legal2Subtitle: 'Tu responsabilidad contractual directa',
    legal2Desc: 'Instalamos y operamos estaciones de reciclaje profesionales dentro de tu recinto. Green Team capacitado 24/7. Cumplimos TODO lo que prometiste en tu plan de gestión.',

    legal3Title: '🧹 Limpieza del Perímetro',
    legal3Subtitle: 'Área bajo tu permiso/control',
    legal3Desc: 'Gestionamos residuos en zonas de entrada, salida, calles cerradas y todo el perímetro que está bajo tu responsabilidad legal según el permiso.',

    legal4Title: '📊 Reporte Post-Evento',
    legal4Subtitle: 'Documentación para autoridades',
    legal4Desc: 'Reporte profesional con métricas reales, fotografías y evidencia de cumplimiento que presentas al gobierno. Demuestra que cumpliste con tu plan.',

    // Bonus
    bonusTitle: '🎁 Valor Agregado (Sin Costo Extra)',
    bonusSubtitle: 'Porque nos importa el impacto total',

    bonus1: 'Gestión en filas externas (fuera de tu responsabilidad legal)',
    bonus2: 'Cobertura mediática profesional (foto, video, redes)',
    bonus3: 'Campaña digital destacando tu compromiso ambiental',
    bonus4: 'Certificación de evento sustentable para marketing',

    // Initiatives
    initiativesTitle: 'Cómo Cumplimos Por Ti',
    initiativesSubtitle: 'Paso a paso del cumplimiento normativo',

    init1Title: 'Documento para Permiso',
    init1Desc: 'Elaboramos tu Plan de Gestión de Residuos profesional con todos los requisitos técnicos que exigen las autoridades. Listo para presentar con tu solicitud de permiso.',
    init1Metric: 'Pre-evento',

    init2Title: 'Implementación en Venue',
    init2Desc: '15-20 estaciones de reciclaje dentro del recinto con señalización clara. Green Team capacitado operando 24/7. Cumplimos exactamente lo prometido en tu plan.',
    init2Metric: 'Durante evento',

    init3Title: 'Gestión de Perímetro',
    init3Desc: 'Limpieza y gestión de residuos en zonas de entrada, salida, calles cerradas y todo el perímetro bajo tu responsabilidad contractual según permiso.',
    init3Metric: 'Durante evento',

    init4Title: 'Reporte de Cumplimiento',
    init4Desc: 'Documento con métricas reales, fotografías y evidencia que demuestran a las autoridades que cumpliste con tu plan de gestión. Evita multas y problemas legales.',
    init4Metric: 'Post-evento (48h)',

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
    whyTitle: 'Por Qué Elegirnos',

    why1Title: 'Evita Multas y Problemas Legales',
    why1Desc: 'Cumplimos 100% con normativa. Tu permiso aprobado sin rechazos.',
    why2Title: 'Ahorra Tiempo y Headaches',
    why2Desc: 'Nos encargamos de todo: documentos, implementación, reportes.',
    why3Title: 'Experiencia Comprobada',
    why3Desc: '50+ festivales sin incumplimientos ni multas.',
    why4Title: 'Bonus: Mejora tu Imagen',
    why4Desc: 'Cobertura mediática y certificación sustentable incluidas.',

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
    ctaTitle: '¿Necesitas Obtener Tus Permisos?',
    ctaDesc: 'Contáctanos para manejar todo tu cumplimiento ambiental y obtener tus permisos sin problemas',
    ctaButton: 'Solicitar Cotización',
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'Transformando la industria de festivales, un evento sustentable a la vez',
    footerRights: '© 2026 Ravehub. Todos los derechos reservados.',
  },
  en: {
    // Hero
    heroTitle: 'Ravehub Recycle',
    heroSubtitle: 'Comply with Environmental Regulations + Improve Your Image',
    heroDescription: 'We help you meet mandatory waste management requirements to obtain permits, while improving your festival\'s sustainable image.',
    heroButton: 'See How We Help',

    // Problem Section
    problemTitle: 'Your Legal Challenge',
    problemSubtitle: 'Mandatory requirements to obtain permits',
    problemDescription: 'To obtain permits, authorities require: Waste Management Plan, adequate containers, immediate post-event cleanup, and compliance reports. Without this, no festival.',

    // The Reality
    realityTitle: 'What Do Authorities Require?',
    realityDesc: 'Local governments require organizers to submit a Waste Management Plan BEFORE approving permits. Events with 500+ people must include recycling/composting. The organizer is legally responsible for the venue AND the perimeter under their permit.',

    // Stats
    stat1: 'Management plan',
    stat1Value: '100%',
    stat1Desc: 'Mandatory for permits',
    stat2: 'Post-event cleanup',
    stat2Value: '24-48h',
    stat2Desc: 'Maximum deadline required',
    stat3: 'Non-compliance fines',
    stat3Value: '$50K+',
    stat3Desc: 'Can reach this or more',

    // Solution
    solutionTitle: 'The Solution',
    solutionSubtitle: 'We handle all compliance for you',

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
    offerTitle: 'What Our Service Includes',
    offerSubtitle: 'Legal compliance + added value',

    // The Program - Responsibilities
    programTitle: 'We Cover YOUR Legal Responsibilities',

    legal1Title: '📋 Waste Management Plan',
    legal1Subtitle: 'Required for event permit',
    legal1Desc: 'We prepare the professional technical document you need to submit to authorities to obtain your permit. Includes container mapping, protocols, expected metrics and regulatory compliance.',

    legal2Title: '♻️ Venue Implementation',
    legal2Subtitle: 'Your direct contractual responsibility',
    legal2Desc: 'We install and operate professional recycling stations inside your venue. Trained Green Team 24/7. We fulfill EVERYTHING you promised in your management plan.',

    legal3Title: '🧹 Perimeter Cleanup',
    legal3Subtitle: 'Area under your permit/control',
    legal3Desc: 'We manage waste in entry, exit zones, closed streets and the entire perimeter that is under your legal responsibility according to the permit.',

    legal4Title: '📊 Post-Event Report',
    legal4Subtitle: 'Documentation for authorities',
    legal4Desc: 'Professional report with real metrics, photographs and evidence of compliance that you submit to the government. Proves you fulfilled your plan.',

    // Bonus
    bonusTitle: '🎁 Added Value (No Extra Cost)',
    bonusSubtitle: 'Because we care about total impact',

    bonus1: 'Management in external queues (outside your legal responsibility)',
    bonus2: 'Professional media coverage (photo, video, social media)',
    bonus3: 'Digital campaign highlighting your environmental commitment',
    bonus4: 'Sustainable event certification for marketing',

    // Initiatives
    initiativesTitle: 'How We Comply For You',
    initiativesSubtitle: 'Step by step regulatory compliance',

    init1Title: 'Permit Document',
    init1Desc: 'We prepare your professional Waste Management Plan with all technical requirements demanded by authorities. Ready to submit with your permit application.',
    init1Metric: 'Pre-event',

    init2Title: 'Venue Implementation',
    init2Desc: '15-20 recycling stations inside the venue with clear signage. Trained Green Team operating 24/7. We fulfill exactly what was promised in your plan.',
    init2Metric: 'During event',

    init3Title: 'Perimeter Management',
    init3Desc: 'Cleanup and waste management in entry, exit zones, closed streets and entire perimeter under your contractual responsibility according to permit.',
    init3Metric: 'During event',

    init4Title: 'Compliance Report',
    init4Desc: 'Document with real metrics, photographs and evidence proving to authorities you fulfilled your management plan. Avoid fines and legal problems.',
    init4Metric: 'Post-event (48h)',

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
    whyTitle: 'Why Choose Us',

    why1Title: 'Avoid Fines and Legal Problems',
    why1Desc: '100% regulatory compliance. Your permit approved without rejections.',
    why2Title: 'Save Time and Headaches',
    why2Desc: 'We handle everything: documents, implementation, reports.',
    why3Title: 'Proven Experience',
    why3Desc: '50+ festivals without non-compliance or fines.',
    why4Title: 'Bonus: Improve Your Image',
    why4Desc: 'Media coverage and sustainable certification included.',

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
    phase1Items: ['Coordination meeting', 'Professional Waste Management Plan', 'Team training', 'Pre-event digital campaign'],
    phase2Title: 'During the Festival',
    phase2Items: ['Station installation', 'Green Team operating 24/7', 'Photo and video coverage', 'Real-time compliance monitoring'],
    phase3Title: 'After the Festival',
    phase3Items: ['Data collection', 'Content editing', 'Compliance report for authorities', 'Sustainable certification'],

    // CTA
    ctaTitle: 'Need to Obtain Your Permits?',
    ctaDesc: 'Contact us to handle all your environmental compliance and obtain your permits without problems',
    ctaButton: 'Request Quote',
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

      {/* The Program - Legal Responsibilities */}
      <div className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.programTitle}
            </h2>
            <p className="text-xl text-zinc-400">{t.offerSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Legal 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.legal1Title}</h3>
              <p className="text-sm text-blue-400 font-semibold mb-4">{t.legal1Subtitle}</p>
              <p className="text-zinc-300">{t.legal1Desc}</p>
            </div>

            {/* Legal 2 */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-8">
              <div className="text-4xl mb-4">♻️</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.legal2Title}</h3>
              <p className="text-sm text-green-400 font-semibold mb-4">{t.legal2Subtitle}</p>
              <p className="text-zinc-300">{t.legal2Desc}</p>
            </div>

            {/* Legal 3 */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-8">
              <div className="text-4xl mb-4">🧹</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.legal3Title}</h3>
              <p className="text-sm text-purple-400 font-semibold mb-4">{t.legal3Subtitle}</p>
              <p className="text-zinc-300">{t.legal3Desc}</p>
            </div>

            {/* Legal 4 */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.legal4Title}</h3>
              <p className="text-sm text-orange-400 font-semibold mb-4">{t.legal4Subtitle}</p>
              <p className="text-zinc-300">{t.legal4Desc}</p>
            </div>
          </div>

          {/* Bonus Section */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/30 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white mb-2">{t.bonusTitle}</h3>
            <p className="text-lg text-yellow-400 mb-6">{t.bonusSubtitle}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{t.bonus1}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{t.bonus2}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{t.bonus3}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{t.bonus4}</span>
              </div>
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
