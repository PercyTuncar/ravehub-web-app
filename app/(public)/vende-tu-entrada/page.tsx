import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Ticket, DollarSign, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUpcomingEventsForResale } from './actions';
import SellTicketClient from './SellTicketClient';

// ISR: Regenerate every 10 minutes
export const revalidate = 600;

export default async function SellTicketPage() {
    // Cargar eventos en el servidor
    const events = await getUpcomingEventsForResale();

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
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
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                            💰 Recupera tu dinero
                        </Badge>

                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            ¿Ya no puedes ir?
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                Vende tu Entrada
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-8">
                            Recupera hasta el <strong className="text-green-400">90%</strong> del valor de tu ticket.
                            Cuanto más pronto vendas, más recuperas.
                        </p>

                        {/* Cómo funciona - Rápido */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Ticket className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">1. Selecciona</h3>
                                    <p className="text-sm text-gray-400">Elige el evento que no podrás asistir</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <DollarSign className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">2. Ve tu oferta</h3>
                                    <p className="text-sm text-gray-400">Calculamos cuánto pagaremos por tu entrada</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">3. Finaliza</h3>
                                    <p className="text-sm text-gray-400">Completa por WhatsApp y recibe tu pago</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Client Component con lista de eventos */}
            <SellTicketClient events={events} />
        </div>
    );
}
