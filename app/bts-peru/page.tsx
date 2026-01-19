'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Clock,
  Smartphone
} from 'lucide-react';

export default function BTSActivationPage() {
  const whatsappNumber = "51944784488";
  const whatsappMessage = encodeURIComponent("Hola Admin! He realizado el pago de mi membresía ARMY Oficial (S/. 99.50). Solicito la activación de mi cuenta. Adjunto mi comprobante. 💜");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-[#F3E5F5] font-sans selection:bg-purple-300 relative overflow-x-hidden flex flex-col items-center">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-purple-200 via-[#E1BEE7] to-transparent opacity-50"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 py-12 flex flex-col items-center">

        {/* --- Header / Logo Removed as per user request --- */}
        {/* --- Step Indicator Removed as per user request --- */}

        <div className="mt-8 mb-4">
          {/* Simple Logo Placeholder if needed, or just spacer */}
          <div className="flex justify-center">
            <div className="bg-black text-white w-14 h-14 flex items-center justify-center font-bold tracking-widest text-sm rounded-lg shadow-xl">
              BTS
            </div>
          </div>
        </div>

        {/* --- Main Card --- */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-50 p-6 text-center border-b border-purple-100">
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">¡Pago Confirmado!</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
              Tu compra ha sido procesada exitosamente. Ahora activa tu membresía en nuestro sistema.
            </p>
          </div>

          {/* Purchase Summary */}
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">ARMY</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Membresía ARMY Oficial</h3>
                <p className="text-xs text-gray-500">Acceso Preventa Tour 2026</p>
              </div>
              <div className="text-right">
                <span className="block text-sm font-black text-gray-900">S/. 99.50</span>
                <span className="block text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full inline-block mt-1">Pagado</span>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-8 flex flex-col items-center">
            <div className="text-center mb-6">
              <Smartphone className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Envía tu comprobante</h3>
              <p className="text-xs text-gray-500 px-4">
                Haz clic abajo para abrir WhatsApp y enviar la confirmación a nuestro equipo de soporte.
              </p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group relative flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-200 transition-all duration-300 hover:-translate-y-1"
            >
              <MessageCircle className="w-6 h-6 fill-current text-white/90" />
              <span>Enviar y Activar</span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </a>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Tiempo de respuesta: ~5-10 minutos</span>
            </div>
          </div>
        </motion.div>

        {/* --- FAQ / Footer Info --- */}
        <div className="mt-10 grid gap-4 w-full text-center">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
            <h4 className="font-bold text-xs text-purple-900 mb-1">¿Por qué debo enviar el comprobante?</h4>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Verificamos manualmente cada pago para asegurar que tu membresía se vincule correctamente a tu cuenta Weverse y evitar fraudes.
            </p>
          </div>

          <p className="text-[10px] text-gray-400 mt-4">
            © 2026 BTS Official Fanclub Peru. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </div>
  );
}
