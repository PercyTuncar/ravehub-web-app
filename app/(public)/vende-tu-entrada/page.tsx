import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, CircleDollarSign, ShieldCheck, Ticket } from 'lucide-react';
import { getUpcomingEventsForResale } from './actions';
import SellTicketClient from './SellTicketClient';

// ISR: Regenerate every 10 minutes
export const revalidate = 600;

export default async function SellTicketPage() {
    // Cargar eventos en el servidor
    const events = await getUpcomingEventsForResale();

    console.log('📊 [Page] Eventos recibidos:', events.length);
    console.log('📊 [Page] Eventos:', events.map(e => e.name));

    return (
        <div className="min-h-screen bg-[#0b0d0c] text-white">
            {/* Schema.org JSON-LD para SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "Vende tu Entrada - RaveHub",
                        "description": "Vende tus entradas de conciertos, festivales y eventos. Recupera hasta el 90% del valor de tu ticket. Proceso rápido y seguro.",
                        "provider": {
                            "@type": "Organization",
                            "name": "RaveHub",
                            "url": "https://ravehub.pe"
                        },
                        "serviceType": "Ticket Resale",
                        "areaServed": "PE",
                        "availableChannel": {
                            "@type": "ServiceChannel",
                            "serviceUrl": "https://ravehub.pe/vende-tu-entrada",
                            "servicePhone": "+51944784488"
                        },
                        "offers": {
                            "@type": "Offer",
                            "description": "Recupera entre 10% y 90% del valor de tu entrada según los días que falten para el evento"
                        }
                    })
                }}
            />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-white/[0.08] bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,0.14),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(16,185,129,0.10),transparent_30%)]">
                <div className="container relative z-10 mx-auto px-4 py-8 sm:py-12 lg:py-24">
                    <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-sm font-medium text-amber-300">
                                <Ticket className="h-4 w-4" aria-hidden="true" />
                                Vende tu entrada
                            </div>

                            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                                ¿No puedes ir? Vende tu entrada.
                            </h1>

                            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:mt-6 sm:text-lg">
                                Elige tu evento para ver las zonas, conocer tu oferta y enviar tu solicitud.
                                Mientras más pronto vendas, más puedes recuperar.
                            </p>

                            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                                <Link
                                    href="#eventos-disponibles"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-amber-400 px-5 font-semibold text-zinc-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0c]"
                                >
                                    Elegir un evento
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="#como-funciona"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/15 px-5 font-medium text-white transition-colors hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                                >
                                    Ver cómo funciona
                                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400 sm:mt-8">
                                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />Oferta visible antes de enviar</span>
                                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Acompañamiento por WhatsApp</span>
                            </div>
                        </div>

                        <div id="como-funciona" className="border border-white/[0.12] bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-8">
                            <div className="mb-7 flex items-center justify-between border-b border-white/[0.10] pb-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Es muy simple</p>
                                    <h2 className="mt-2 text-xl font-semibold text-white">Tres pasos para vender</h2>
                                </div>
                                <CircleDollarSign className="h-9 w-9 text-emerald-400" aria-hidden="true" />
                            </div>
                            <ol className="space-y-6">
                                <li className="flex gap-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">1</span>
                                    <div><h3 className="font-semibold text-white">Elige un evento</h3><p className="mt-1 text-sm leading-6 text-zinc-400">Busca el evento al que ya no podrás ir.</p></div>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-zinc-950">2</span>
                                    <div><h3 className="font-semibold text-white">Mira las zonas y el precio</h3><p className="mt-1 text-sm leading-6 text-zinc-400">Verás cuánto puedes recuperar por tu entrada.</p></div>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-400 text-sm font-bold text-zinc-950">3</span>
                                    <div><h3 className="font-semibold text-white">Envía tu solicitud</h3><p className="mt-1 text-sm leading-6 text-zinc-400">Completa tus datos y te contactaremos por WhatsApp.</p></div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* Client Component con lista de eventos */}
            <SellTicketClient events={events} />
        </div>
    );
}
