'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Ticket, UserPlus } from 'lucide-react';

export default function PurchaseSuccessPage() {
    const searchParams = useSearchParams();
    const email = searchParams?.get('email');
    const ticketId = searchParams?.get('ticketId');

    return (
        <div className="min-h-screen bg-[#141618] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#1e2022] border border-white/5 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-[50px]" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">¡Pedido Recibido!</h1>
                    <p className="text-zinc-400 mb-6">
                        Hemos registrado tu solicitud de compra.
                    </p>

                    {email && (
                        <div className="bg-white/5 rounded-lg p-4 mb-6 w-full text-sm">
                            <span className="text-zinc-500 block mb-1">Enviaremos las instrucciones a:</span>
                            <span className="text-white font-mono">{email}</span>
                        </div>
                    )}

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 mb-8 w-full text-left">
                        <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Importante
                        </h3>
                        <p className="text-sm text-zinc-300">
                            Para hacer seguimiento a tu ticket, pagos en cuotas y evitar perder el acceso, te recomendamos crear una cuenta usando este mismo correo.
                        </p>
                    </div>

                    <div className="space-y-3 w-full">
                        <Link href={`/login?email=${email || ''}`} className="w-full block">
                            <Button className="w-full bg-white text-black hover:bg-zinc-200">
                                Crear Cuenta / Iniciar Sesión
                            </Button>
                        </Link>

                        <Link href="/" className="w-full block">
                            <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                                Volver al Inicio
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
