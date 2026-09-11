'use client';

import { useState } from 'react';
import {
  Globe,
  Download,
  CheckCircle2,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Camera,
  Video,
  Megaphone,
  Award,
  TrendingUp,
  Target,
  Clock,
  MapPin,
  Mail,
  ArrowRight,
  Leaf,
  Recycle,
  Heart,
  Shield,
  Zap,
  Package
} from 'lucide-react';

// Translations
const translations = {
  es: {
    // Meta
    lang: 'es',
    langName: 'Español',

    // Header
    proposalFor: 'Propuesta para',
    subtitle: 'Programa Profesional de Sostenibilidad y Cobertura Mediática',
    downloadPdf: 'Descargar PDF',

    // Executive Summary
    execTitle: 'Resumen Ejecutivo',
    execIntro: 'Ravehub, la plataforma líder de música electrónica en Latinoamérica, solicita acreditación de medios para implementar un programa integral de sostenibilidad en su festival.',

    // Who We Are
    whoTitle: '¿Quiénes Somos?',
    whoRavehub: 'Ravehub',
    whoRavehubDesc: 'Plataforma #1 de música electrónica en Latinoamérica con presencia consolidada en 12 países. Conectamos más de 500 DJs con una audiencia comprometida de 3.2M de seguidores.',
    whoMetric1: 'Países',
    whoMetric2: 'DJs en plataforma',
    whoMetric3: 'Seguidores totales',
    whoMetric4: 'Alcance mensual',

    // Track Record
    trackTitle: 'Nuestro Historial',
    trackSubtitle: 'Experiencia comprobada en eventos de música electrónica',
    track1: 'Festivales cubiertos en Latinoamérica',
    track2: 'Años de experiencia en la industria',
    track3: 'Profesionales en nuestro equipo',
    track4: 'Artículos publicados',

    // What We Offer
    offerTitle: 'Qué Ofrecemos',
    offerSubtitle: 'Dos pilares que aportan valor real a su festival',

    pillar1Title: 'Programa de Sostenibilidad',
    pillar1Desc: 'Implementación física de iniciativas ambientales durante el festival',
    pillar2Title: 'Cobertura Mediática Profesional',
    pillar2Desc: 'Documentación y difusión del evento y sus prácticas sustentables',

    // Sustainability Program
    sustainTitle: 'Programa de Sostenibilidad',
    sustainSubtitle: 'Iniciativas concretas que implementaremos',

    init1Title: 'Estaciones de Reciclaje',
    init1Metric: '15-20 estaciones',
    init1Desc: 'Módulos de reciclaje profesionales con señalética multilingüe. Separación de plástico, vidrio, papel, orgánico y general.',
    init1Item1: 'Diseño consistente con branding del festival',
    init1Item2: 'Señalización clara e intuitiva',
    init1Item3: 'Ubicación estratégica estudiada',
    init1Item4: 'Monitoreo y reporte de KPIs',

    init2Title: 'Green Team',
    init2Metric: '5 embajadores',
    init2Desc: 'Equipo capacitado en gestión de residuos que educa y guía a los asistentes durante todo el evento.',
    init2Item1: 'Personal con formación certificada',
    init2Item2: 'Uniformes identificables',
    init2Item3: 'Protocolos de interacción establecidos',
    init2Item4: 'Sistema de turnos 24/7',

    init3Title: 'Campaña Digital',
    init3Metric: '50+ publicaciones',
    init3Desc: 'Campaña educativa en redes sociales antes, durante y después del festival con alcance medido.',
    init3Item1: 'Contenido pre-evento educativo',
    init3Item2: 'Cobertura en vivo de iniciativas',
    init3Item3: 'Post-evento con resultados',
    init3Item4: 'Hashtags y tracking analytics',

    init4Title: 'Reporte de Impacto',
    init4Metric: 'Documento profesional',
    init4Desc: 'Informe post-evento con métricas, fotografías, análisis comparativo y certificación de evento sustentable.',
    init4Item1: 'Métricas cuantificables',
    init4Item2: 'Comparativa con benchmarks',
    init4Item3: 'Fotografías y evidencia',
    init4Item4: 'Certificación digital',

    // Media Coverage
    mediaTitle: 'Cobertura Mediática',
    mediaSubtitle: 'Equipo profesional para documentar el festival',

    media1Title: 'Fotografía Profesional',
    media1Desc: '2 fotógrafos con equipamiento profesional',
    media1Deliver: 'Entregables',
    media1Item1: '500+ fotos editadas en alta resolución',
    media1Item2: 'Cobertura artistas, público, backstage',
    media1Item3: 'Enfoque especial en sostenibilidad',
    media1Item4: 'Entrega 48h post-evento',

    media2Title: 'Video & Aftermovie',
    media2Desc: '1 videógrafo + editor',
    media2Deliver: 'Entregables',
    media2Item1: 'Aftermovie oficial 3-5 minutos',
    media2Item2: 'Clips cortos para redes sociales',
    media2Item3: 'B-roll de iniciativas sustentables',
    media2Item4: 'Entrega 7 días post-evento',

    media3Title: 'Redes Sociales',
    media3Desc: '2 especialistas en contenido digital',
    media3Deliver: 'Entregables',
    media3Item1: '30+ stories durante el evento',
    media3Item2: '10+ posts en feed principal',
    media3Item3: 'Reels/TikToks virales',
    media3Item4: 'Engagement y analytics',

    media4Title: 'Artículos & PR',
    media4Desc: '1 periodista / redactor',
    media4Deliver: 'Entregables',
    media4Item1: 'Artículo pre-evento (anuncio)',
    media4Item2: 'Review completa post-evento',
    media4Item3: 'Destacados de sostenibilidad',
    media4Item4: 'Publicación en ravehublatam.com',

    // Timeline
    timelineTitle: 'Timeline de Ejecución',
    timelineSubtitle: 'Plan de trabajo estructurado en 3 fases',

    phase1: 'Pre-Evento (30 días antes)',
    phase1Item1: 'Reunión de coordinación con organizadores',
    phase1Item2: 'Diseño de estaciones de reciclaje personalizadas',
    phase1Item3: 'Capacitación de Green Team',
    phase1Item4: 'Campaña digital educativa',
    phase1Item5: 'Logística y permisos',

    phase2: 'Durante el Evento',
    phase2Item1: 'Instalación de estaciones de reciclaje',
    phase2Item2: 'Green Team operando 24/7',
    phase2Item3: 'Cobertura fotográfica y video',
    phase2Item4: 'Publicación en tiempo real',
    phase2Item5: 'Monitoreo de métricas',

    phase3: 'Post-Evento (7-14 días)',
    phase3Item1: 'Recolección y análisis de datos',
    phase3Item2: 'Edición de contenido multimedia',
    phase3Item3: 'Elaboración de reporte de impacto',
    phase3Item4: 'Publicación de resultados',
    phase3Item5: 'Certificación de evento sustentable',

    // Team
    teamTitle: 'Nuestro Equipo',
    teamSubtitle: 'Profesionales con experiencia verificable',

    role1: 'Coordinador General',
    role1Desc: '1 persona con experiencia en gestión de eventos sustentables',

    role2: 'Fotógrafos',
    role2Desc: '2 profesionales con portfolio comprobable y equipo propio',

    role3: 'Videógrafo',
    role3Desc: '1 profesional especializado en aftermovies de festivales',

    role4: 'Social Media',
    role4Desc: '2 especialistas en creación de contenido para plataformas digitales',

    role5: 'Redactor',
    role5Desc: '1 periodista con experiencia en cobertura de eventos musicales',

    role6: 'Green Team',
    role6Desc: '5 embajadores con capacitación en gestión de residuos',

    teamTotal: 'Total: 12 personas',
    teamNote: 'Cada miembro cuenta con portafolio verificable, cobertura previa de eventos, equipo profesional y compromiso con código de conducta.',

    // Accreditation
    accredTitle: 'Solicitud de Acreditación',
    accredSubtitle: 'Necesitamos 12 acreditaciones de prensa para ejecutar este programa',
    accredNote: 'Nota Importante',
    accredNoteText: 'Entendemos que las acreditaciones de medios son un recurso limitado y valioso. Por eso, este no es simplemente una solicitud de "entradas gratis". Cada persona acreditada tiene un rol específico, entregables concretos y contribuye activamente al valor ambiental y de visibilidad del festival.',

    // Expected Results
    resultsTitle: 'Resultados Esperados',
    resultsSubtitle: 'KPIs medibles que entregaremos',

    result1: 'Toneladas de residuos reciclados',
    result1Value: '5-10 ton',
    result2: 'Asistentes educados por Green Team',
    result2Value: '10,000+',
    result3: 'Alcance digital total',
    result3Value: '3.2M+',
    result4: 'Contenido multimedia producido',
    result4Value: '500+',

    // Why Partner
    whyTitle: '¿Por Qué Esta Alianza Tiene Sentido?',

    why1Title: 'Credibilidad Establecida',
    why1Desc: 'Somos la voz reconocida de la escena electrónica en Latinoamérica desde hace años',

    why2Title: 'Alineación con Tendencias',
    why2Desc: 'Ultra, Tomorrowland, Glastonbury ya tienen programas similares. Es el estándar de la industria',

    why3Title: 'Valor Sin Costo',
    why3Desc: 'Implementamos el programa completo. El festival solo proporciona acreditaciones y coordina espacios',

    why4Title: 'ROI Tangible',
    why4Desc: 'Contenido profesional, mejor imagen ambiental, potencial certificación greener festival',

    // References
    referencesTitle: 'Festivales de Referencia',
    referencesSubtitle: 'Benchmarks de la industria que ya implementan programas similares',

    ref1: 'Ultra Music Festival',
    ref1Desc: 'Certificación Greener Festival. Programas de reciclaje y reducción de huella',
    ref2: 'Glastonbury',
    ref2Desc: '175,000 personas. Sistema completo de reciclaje y compostaje',
    ref3: 'Tomorrowland',
    ref3Desc: 'Waste management integral. Objetivo: 155g residuos/persona/día',
    ref4: 'Lollapalooza',
    ref4Desc: 'Partnership con REVERB. Reporte anual de impacto ambiental',

    // Contact CTA
    ctaTitle: '¿Listo para Discutir Esta Propuesta?',
    ctaDesc: 'Contáctenos para agendar una reunión y revisar los detalles específicos para su festival',
    ctaButton: 'Contactar Ahora',
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'Esta es una propuesta profesional basada en investigación de mejores prácticas de la industria.',
    footerRights: '© 2026 Ravehub. Documento confidencial.',

    // Sources
    sourcesTitle: 'Fuentes y Referencias',
    sourcesDesc: 'Esta propuesta está basada en investigación de las siguientes fuentes:',
  },
  en: {
    // Meta
    lang: 'en',
    langName: 'English',

    // Header
    proposalFor: 'Proposal for',
    subtitle: 'Professional Sustainability & Media Coverage Program',
    downloadPdf: 'Download PDF',

    // Executive Summary
    execTitle: 'Executive Summary',
    execIntro: 'Ravehub, the leading electronic music platform in Latin America, requests media accreditation to implement a comprehensive sustainability program at your festival.',

    // Who We Are
    whoTitle: 'Who We Are',
    whoRavehub: 'Ravehub',
    whoRavehubDesc: '#1 electronic music platform in Latin America with established presence in 12 countries. We connect 500+ DJs with an engaged audience of 3.2M followers.',
    whoMetric1: 'Countries',
    whoMetric2: 'DJs on platform',
    whoMetric3: 'Total followers',
    whoMetric4: 'Monthly reach',

    // Track Record
    trackTitle: 'Our Track Record',
    trackSubtitle: 'Proven experience in electronic music events',
    track1: 'Festivals covered in Latin America',
    track2: 'Years of industry experience',
    track3: 'Professionals on our team',
    track4: 'Articles published',

    // What We Offer
    offerTitle: 'What We Offer',
    offerSubtitle: 'Two pillars that bring real value to your festival',

    pillar1Title: 'Sustainability Program',
    pillar1Desc: 'Physical implementation of environmental initiatives during the festival',
    pillar2Title: 'Professional Media Coverage',
    pillar2Desc: 'Documentation and dissemination of the event and its sustainable practices',

    // Sustainability Program
    sustainTitle: 'Sustainability Program',
    sustainSubtitle: 'Concrete initiatives we will implement',

    init1Title: 'Recycling Stations',
    init1Metric: '15-20 stations',
    init1Desc: 'Professional recycling modules with multilingual signage. Separation of plastic, glass, paper, organic and general waste.',
    init1Item1: 'Design consistent with festival branding',
    init1Item2: 'Clear and intuitive signage',
    init1Item3: 'Strategic studied placement',
    init1Item4: 'Monitoring and KPI reporting',

    init2Title: 'Green Team',
    init2Metric: '5 ambassadors',
    init2Desc: 'Team trained in waste management that educates and guides attendees throughout the event.',
    init2Item1: 'Staff with certified training',
    init2Item2: 'Identifiable uniforms',
    init2Item3: 'Established interaction protocols',
    init2Item4: '24/7 shift system',

    init3Title: 'Digital Campaign',
    init3Metric: '50+ publications',
    init3Desc: 'Educational social media campaign before, during and after the festival with measured reach.',
    init3Item1: 'Pre-event educational content',
    init3Item2: 'Live coverage of initiatives',
    init3Item3: 'Post-event with results',
    init3Item4: 'Hashtags and analytics tracking',

    init4Title: 'Impact Report',
    init4Metric: 'Professional document',
    init4Desc: 'Post-event report with metrics, photographs, comparative analysis and sustainable event certification.',
    init4Item1: 'Quantifiable metrics',
    init4Item2: 'Comparative with benchmarks',
    init4Item3: 'Photographs and evidence',
    init4Item4: 'Digital certification',

    // Media Coverage
    mediaTitle: 'Media Coverage',
    mediaSubtitle: 'Professional team to document the festival',

    media1Title: 'Professional Photography',
    media1Desc: '2 photographers with professional equipment',
    media1Deliver: 'Deliverables',
    media1Item1: '500+ edited high-resolution photos',
    media1Item2: 'Coverage of artists, audience, backstage',
    media1Item3: 'Special focus on sustainability',
    media1Item4: 'Delivery 48h post-event',

    media2Title: 'Video & Aftermovie',
    media2Desc: '1 videographer + editor',
    media2Deliver: 'Deliverables',
    media2Item1: 'Official 3-5 minute aftermovie',
    media2Item2: 'Short clips for social media',
    media2Item3: 'B-roll of sustainable initiatives',
    media2Item4: 'Delivery 7 days post-event',

    media3Title: 'Social Media',
    media3Desc: '2 digital content specialists',
    media3Deliver: 'Deliverables',
    media3Item1: '30+ stories during the event',
    media3Item2: '10+ posts on main feed',
    media3Item3: 'Viral Reels/TikToks',
    media3Item4: 'Engagement and analytics',

    media4Title: 'Articles & PR',
    media4Desc: '1 journalist / writer',
    media4Deliver: 'Deliverables',
    media4Item1: 'Pre-event article (announcement)',
    media4Item2: 'Complete post-event review',
    media4Item3: 'Sustainability highlights',
    media4Item4: 'Publication on ravehublatam.com',

    // Timeline
    timelineTitle: 'Execution Timeline',
    timelineSubtitle: 'Structured work plan in 3 phases',

    phase1: 'Pre-Event (30 days before)',
    phase1Item1: 'Coordination meeting with organizers',
    phase1Item2: 'Design of customized recycling stations',
    phase1Item3: 'Green Team training',
    phase1Item4: 'Educational digital campaign',
    phase1Item5: 'Logistics and permits',

    phase2: 'During the Event',
    phase2Item1: 'Installation of recycling stations',
    phase2Item2: 'Green Team operating 24/7',
    phase2Item3: 'Photographic and video coverage',
    phase2Item4: 'Real-time publication',
    phase2Item5: 'Metrics monitoring',

    phase3: 'Post-Event (7-14 days)',
    phase3Item1: 'Data collection and analysis',
    phase3Item2: 'Multimedia content editing',
    phase3Item3: 'Impact report preparation',
    phase3Item4: 'Results publication',
    phase3Item5: 'Sustainable event certification',

    // Team
    teamTitle: 'Our Team',
    teamSubtitle: 'Professionals with verifiable experience',

    role1: 'General Coordinator',
    role1Desc: '1 person with experience in sustainable event management',

    role2: 'Photographers',
    role2Desc: '2 professionals with verifiable portfolio and own equipment',

    role3: 'Videographer',
    role3Desc: '1 professional specialized in festival aftermovies',

    role4: 'Social Media',
    role4Desc: '2 specialists in content creation for digital platforms',

    role5: 'Writer',
    role5Desc: '1 journalist with experience covering music events',

    role6: 'Green Team',
    role6Desc: '5 ambassadors with training in waste management',

    teamTotal: 'Total: 12 people',
    teamNote: 'Each member has verifiable portfolio, previous event coverage, professional equipment and commitment to code of conduct.',

    // Accreditation
    accredTitle: 'Accreditation Request',
    accredSubtitle: 'We need 12 press accreditations to execute this program',
    accredNote: 'Important Note',
    accredNoteText: 'We understand that media accreditations are a limited and valuable resource. Therefore, this is not simply a request for "free tickets". Each accredited person has a specific role, concrete deliverables and actively contributes to the environmental value and visibility of the festival.',

    // Expected Results
    resultsTitle: 'Expected Results',
    resultsSubtitle: 'Measurable KPIs we will deliver',

    result1: 'Tons of waste recycled',
    result1Value: '5-10 tons',
    result2: 'Attendees educated by Green Team',
    result2Value: '10,000+',
    result3: 'Total digital reach',
    result3Value: '3.2M+',
    result4: 'Multimedia content produced',
    result4Value: '500+',

    // Why Partner
    whyTitle: 'Why This Partnership Makes Sense?',

    why1Title: 'Established Credibility',
    why1Desc: 'We are the recognized voice of the electronic scene in Latin America for years',

    why2Title: 'Alignment with Trends',
    why2Desc: 'Ultra, Tomorrowland, Glastonbury already have similar programs. It\'s the industry standard',

    why3Title: 'Value Without Cost',
    why3Desc: 'We implement the complete program. The festival only provides accreditations and coordinates spaces',

    why4Title: 'Tangible ROI',
    why4Desc: 'Professional content, better environmental image, potential greener festival certification',

    // References
    referencesTitle: 'Reference Festivals',
    referencesSubtitle: 'Industry benchmarks already implementing similar programs',

    ref1: 'Ultra Music Festival',
    ref1Desc: 'Greener Festival Certification. Recycling and footprint reduction programs',
    ref2: 'Glastonbury',
    ref2Desc: '175,000 people. Complete recycling and composting system',
    ref3: 'Tomorrowland',
    ref3Desc: 'Comprehensive waste management. Target: 155g waste/person/day',
    ref4: 'Lollapalooza',
    ref4Desc: 'Partnership with REVERB. Annual environmental impact report',

    // Contact CTA
    ctaTitle: 'Ready to Discuss This Proposal?',
    ctaDesc: 'Contact us to schedule a meeting and review the specific details for your festival',
    ctaButton: 'Contact Now',
    ctaEmail: 'recycle@ravehublatam.com',

    // Footer
    footerText: 'This is a professional proposal based on research of industry best practices.',
    footerRights: '© 2026 Ravehub. Confidential document.',

    // Sources
    sourcesTitle: 'Sources and References',
    sourcesDesc: 'This proposal is based on research from the following sources:',
  }
};

export default function RaveHubRecyclePage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-white">
      {/* Language Selector - More Professional */}
      <div className="fixed top-24 right-6 z-50">
        <div className="bg-white border-2 border-zinc-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center">
            <button
              onClick={() => setLang('es')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'es'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Professional Header */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">{t.proposalFor}</p>
              <p className="text-xl font-bold">Ultra / Tomorrowland / EDC / Glastonbury</p>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Ravehub Recycle
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-3xl">
            {t.subtitle}
          </p>

          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors">
            <Download className="w-5 h-5" />
            {t.downloadPdf}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="py-16 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6">
            {t.execTitle}
          </h2>
          <p className="text-lg text-zinc-700 leading-relaxed max-w-4xl">
            {t.execIntro}
          </p>
        </div>
      </div>

      {/* Who We Are - With Metrics */}
      <div className="py-20 bg-white border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-12">
            {t.whoTitle}
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.whoRavehub}</h3>
              <p className="text-lg text-zinc-700 leading-relaxed">
                {t.whoRavehubDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="text-4xl font-bold text-green-600 mb-2">12</div>
                <div className="text-sm text-zinc-600 uppercase tracking-wide">{t.whoMetric1}</div>
              </div>
              <div className="text-center p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-sm text-zinc-600 uppercase tracking-wide">{t.whoMetric2}</div>
              </div>
              <div className="text-center p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="text-4xl font-bold text-green-600 mb-2">3.2M</div>
                <div className="text-sm text-zinc-600 uppercase tracking-wide">{t.whoMetric3}</div>
              </div>
              <div className="text-center p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="text-4xl font-bold text-green-600 mb-2">10M+</div>
                <div className="text-sm text-zinc-600 uppercase tracking-wide">{t.whoMetric4}</div>
              </div>
            </div>
          </div>

          {/* Track Record */}
          <div className="bg-zinc-900 text-white rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold mb-2">{t.trackTitle}</h3>
            <p className="text-zinc-400 mb-8">{t.trackSubtitle}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">50+</div>
                <div className="text-sm text-zinc-400">{t.track1}</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">8</div>
                <div className="text-sm text-zinc-400">{t.track2}</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">25+</div>
                <div className="text-sm text-zinc-400">{t.track3}</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">1,000+</div>
                <div className="text-sm text-zinc-400">{t.track4}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What We Offer - Two Pillars */}
      <div className="py-20 bg-zinc-50 border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.offerTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.offerSubtitle}</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-green-500 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center mb-6">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.pillar1Title}</h3>
              <p className="text-zinc-700">{t.pillar1Desc}</p>
            </div>

            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.pillar2Title}</h3>
              <p className="text-zinc-700">{t.pillar2Desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Program - Detailed */}
      <div className="py-20 bg-white border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.sustainTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.sustainSubtitle}</p>

          <div className="space-y-8">
            {/* Initiative 1 */}
            <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-8 hover:border-green-500 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Recycle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-zinc-900">{t.init1Title}</h3>
                    <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg text-sm">
                      {t.init1Metric}
                    </span>
                  </div>
                  <p className="text-zinc-700 mb-6">{t.init1Desc}</p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {[t.init1Item1, t.init1Item2, t.init1Item3, t.init1Item4].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Initiative 2 */}
            <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-8 hover:border-green-500 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-zinc-900">{t.init2Title}</h3>
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm">
                      {t.init2Metric}
                    </span>
                  </div>
                  <p className="text-zinc-700 mb-6">{t.init2Desc}</p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {[t.init2Item1, t.init2Item2, t.init2Item3, t.init2Item4].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Initiative 3 */}
            <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-8 hover:border-green-500 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-zinc-900">{t.init3Title}</h3>
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg text-sm">
                      {t.init3Metric}
                    </span>
                  </div>
                  <p className="text-zinc-700 mb-6">{t.init3Desc}</p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {[t.init3Item1, t.init3Item2, t.init3Item3, t.init3Item4].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Initiative 4 */}
            <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-8 hover:border-green-500 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-zinc-900">{t.init4Title}</h3>
                    <span className="px-4 py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg text-sm">
                      {t.init4Metric}
                    </span>
                  </div>
                  <p className="text-zinc-700 mb-6">{t.init4Desc}</p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {[t.init4Item1, t.init4Item2, t.init4Item3, t.init4Item4].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Coverage */}
      <div className="py-20 bg-zinc-50 border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.mediaTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.mediaSubtitle}</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Media 1 */}
            <div className="bg-white border-2 border-zinc-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <Camera className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{t.media1Title}</h3>
                  <p className="text-sm text-zinc-600">{t.media1Desc}</p>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <p className="text-sm font-semibold text-zinc-900 mb-3">{t.media1Deliver}:</p>
                <ul className="space-y-2">
                  {[t.media1Item1, t.media1Item2, t.media1Item3, t.media1Item4].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Media 2 */}
            <div className="bg-white border-2 border-zinc-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <Video className="w-8 h-8 text-purple-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{t.media2Title}</h3>
                  <p className="text-sm text-zinc-600">{t.media2Desc}</p>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <p className="text-sm font-semibold text-zinc-900 mb-3">{t.media2Deliver}:</p>
                <ul className="space-y-2">
                  {[t.media2Item1, t.media2Item2, t.media2Item3, t.media2Item4].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Media 3 */}
            <div className="bg-white border-2 border-zinc-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <Megaphone className="w-8 h-8 text-pink-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{t.media3Title}</h3>
                  <p className="text-sm text-zinc-600">{t.media3Desc}</p>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <p className="text-sm font-semibold text-zinc-900 mb-3">{t.media3Deliver}:</p>
                <ul className="space-y-2">
                  {[t.media3Item1, t.media3Item2, t.media3Item3, t.media3Item4].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Media 4 */}
            <div className="bg-white border-2 border-zinc-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{t.media4Title}</h3>
                  <p className="text-sm text-zinc-600">{t.media4Desc}</p>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <p className="text-sm font-semibold text-zinc-900 mb-3">{t.media4Deliver}:</p>
                <ul className="space-y-2">
                  {[t.media4Item1, t.media4Item2, t.media4Item3, t.media4Item4].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 bg-white border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.timelineTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.timelineSubtitle}</p>

          <div className="space-y-8">
            {/* Phase 1 */}
            <div className="relative pl-12 border-l-4 border-blue-500 pb-8">
              <div className="absolute left-0 top-0 w-8 h-8 -ml-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.phase1}</h3>
              <ul className="space-y-2">
                {[t.phase1Item1, t.phase1Item2, t.phase1Item3, t.phase1Item4, t.phase1Item5].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="relative pl-12 border-l-4 border-green-500 pb-8">
              <div className="absolute left-0 top-0 w-8 h-8 -ml-4 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.phase2}</h3>
              <ul className="space-y-2">
                {[t.phase2Item1, t.phase2Item2, t.phase2Item3, t.phase2Item4, t.phase2Item5].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="relative pl-12 border-l-4 border-purple-500">
              <div className="absolute left-0 top-0 w-8 h-8 -ml-4 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{t.phase3}</h3>
              <ul className="space-y-2">
                {[t.phase3Item1, t.phase3Item2, t.phase3Item3, t.phase3Item4, t.phase3Item5].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-20 bg-zinc-50 border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.teamTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.teamSubtitle}</p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { title: t.role1, desc: t.role1Desc, count: '1', icon: Target },
              { title: t.role2, desc: t.role2Desc, count: '2', icon: Camera },
              { title: t.role3, desc: t.role3Desc, count: '1', icon: Video },
              { title: t.role4, desc: t.role4Desc, count: '2', icon: Megaphone },
              { title: t.role5, desc: t.role5Desc, count: '1', icon: FileText },
              { title: t.role6, desc: t.role6Desc, count: '5', icon: Users },
            ].map((role, idx) => {
              const Icon = role.icon;
              return (
                <div key={idx} className="bg-white border-2 border-zinc-200 rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900">{role.title}</h3>
                      <p className="text-sm text-green-600 font-semibold">{role.count} {lang === 'es' ? 'persona(s)' : 'person(s)'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600">{role.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-900 text-white rounded-xl p-6">
            <p className="text-lg font-bold mb-2">{t.teamTotal}</p>
            <p className="text-zinc-400">{t.teamNote}</p>
          </div>
        </div>
      </div>

      {/* Accreditation Request */}
      <div className="py-20 bg-white border-t-2 border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-2">
                  {t.accredTitle}
                </h2>
                <p className="text-lg text-zinc-700">
                  {t.accredSubtitle}
                </p>
              </div>
            </div>

            <div className="bg-white border border-yellow-300 rounded-xl p-6">
              <p className="font-bold text-zinc-900 mb-2">{t.accredNote}:</p>
              <p className="text-zinc-700 leading-relaxed">
                {t.accredNoteText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Results */}
      <div className="py-20 bg-zinc-50 border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.resultsTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-16">{t.resultsSubtitle}</p>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white border-2 border-green-500 rounded-xl">
              <div className="text-5xl font-bold text-green-600 mb-2">{t.result1Value}</div>
              <div className="text-sm text-zinc-700">{t.result1}</div>
            </div>
            <div className="text-center p-6 bg-white border-2 border-blue-500 rounded-xl">
              <div className="text-5xl font-bold text-blue-600 mb-2">{t.result2Value}</div>
              <div className="text-sm text-zinc-700">{t.result2}</div>
            </div>
            <div className="text-center p-6 bg-white border-2 border-purple-500 rounded-xl">
              <div className="text-5xl font-bold text-purple-600 mb-2">{t.result3Value}</div>
              <div className="text-sm text-zinc-700">{t.result3}</div>
            </div>
            <div className="text-center p-6 bg-white border-2 border-orange-500 rounded-xl">
              <div className="text-5xl font-bold text-orange-600 mb-2">{t.result4Value}</div>
              <div className="text-sm text-zinc-700">{t.result4}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Partner */}
      <div className="py-20 bg-white border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-16">
            {t.whyTitle}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: t.why1Title, desc: t.why1Desc, icon: Award },
              { title: t.why2Title, desc: t.why2Desc, icon: TrendingUp },
              { title: t.why3Title, desc: t.why3Desc, icon: Zap },
              { title: t.why4Title, desc: t.why4Desc, icon: BarChart3 },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-zinc-700">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* References */}
      <div className="py-20 bg-zinc-50 border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t.referencesTitle}
          </h2>
          <p className="text-lg text-zinc-600 mb-12">{t.referencesSubtitle}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: t.ref1, desc: t.ref1Desc },
              { title: t.ref2, desc: t.ref2Desc },
              { title: t.ref3, desc: t.ref3Desc },
              { title: t.ref4, desc: t.ref4Desc },
            ].map((ref, idx) => (
              <div key={idx} className="bg-white border-2 border-zinc-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{ref.title}</h3>
                <p className="text-sm text-zinc-600">{ref.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-zinc-900 text-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-xl text-zinc-300 mb-10">
            {t.ctaDesc}
          </p>
          <a
            href={`mailto:${t.ctaEmail}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            <Mail className="w-5 h-5" />
            {t.ctaButton}
          </a>
          <p className="text-zinc-400 mt-6">{t.ctaEmail}</p>
        </div>
      </div>

      {/* Sources */}
      <div className="py-12 bg-white border-t-2 border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.sourcesTitle}</h3>
          <p className="text-sm text-zinc-600 mb-4">{t.sourcesDesc}</p>
          <div className="space-y-2 text-xs text-zinc-500">
            <p>• <a href="https://ultramusicfestival.com/" target="_blank" rel="noopener" className="hover:text-green-600">Ultra Music Festival</a></p>
            <p>• <a href="https://glastonburyfestivals.co.uk/" target="_blank" rel="noopener" className="hover:text-green-600">Glastonbury Sustainability</a></p>
            <p>• <a href="https://reverb.org/" target="_blank" rel="noopener" className="hover:text-green-600">REVERB - Music Sustainability</a></p>
            <p>• <a href="https://burningman.org/event/preparation/leaving-no-trace/" target="_blank" rel="noopener" className="hover:text-green-600">Burning Man - Leave No Trace</a></p>
            <p>• <a href="https://www.workiva.com/blog/best-sustainability-report-examples-and-designs" target="_blank" rel="noopener" className="hover:text-green-600">Sustainability Report Design Examples</a></p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-zinc-900 text-white border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <p className="text-sm text-zinc-400 mb-2">{t.footerText}</p>
          <p className="text-xs text-zinc-600">{t.footerRights}</p>
        </div>
      </div>
    </div>
  );
}
