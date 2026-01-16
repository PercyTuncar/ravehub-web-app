'use client';

import React, { useState } from 'react';
import { Mic, Video, Instagram, MessageCircle, Copy, Lock, Music, CheckCircle2, Zap, Flame, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BTSLandingPage() {
  const [copied, setCopied] = useState(false);
  const phoneNumber = "56973018634";
  
  const whatsappLink = `https://wa.me/56973018634?text=Hola%20Admin%21%20Vengo%20de%20la%20web%20y%20quiero%20iniciar%20el%20filtro%20de%20seguridad%20para%20unirme.%20%F0%9F%92%9C`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText("+" + phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F3E5F5] font-sans text-gray-800 selection:bg-purple-300 overflow-x-hidden relative flex flex-col items-center pt-20">
       
      {/* --- Fondo Mágico (Mejorado) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#E1BEE7] to-transparent opacity-80"></div>
        {/* Formas orgánicas de fondo */}
        <div className="absolute top-[-100px] right-[-50px] w-72 h-72 bg-purple-400 rounded-full blur-[80px] opacity-20 animate-pulse"></div>
        <div className="absolute top-[200px] left-[-50px] w-60 h-60 bg-pink-400 rounded-full blur-[80px] opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#F3E5F5] to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8 flex flex-col min-h-screen">
         
        {/* --- Header: Impacto Visual --- */}
        <div className="text-center mb-8 animate-fade-in-up">
          {/* Badge de Estado */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-purple-100 mb-6 transform hover:scale-105 transition-transform"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-extrabold text-purple-900 tracking-widest uppercase">
              Proceso de Verificación Activo
            </span>
          </motion.div>
           
          {/* Título Principal */}
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-black text-gray-900 mb-2 leading-none tracking-tight drop-shadow-sm"
          >
            BTS <span className="text-purple-600">LIMA</span>
          </motion.h1>
          <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-3"></div>
           
          <p className="text-base font-semibold text-gray-600 max-w-xs mx-auto">
            Fanclub Oficial & Seguro <br/>
            <span className="text-sm font-normal text-gray-500">Preparándonos para el concierto del reencuentro</span>
          </p>
        </div>

        {/* --- Alerta de Seguridad (UX: Importancia) --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border-l-4 border-purple-600 shadow-md mb-8 relative overflow-hidden"
        >
           <div className="flex items-start gap-4">
             <div className="bg-purple-100 p-2 rounded-full shrink-0">
               <Lock className="w-5 h-5 text-purple-700" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Link Protegido</h2>
               <p className="text-xs text-gray-600 leading-relaxed">
                 Para evitar estafadores de entradas y acoso, el acceso es <strong>solo con filtro</strong>. Tu seguridad es nuestra prioridad.
               </p>
             </div>
           </div>
        </motion.div>

        {/* --- Pasos (UX: Claridad y Legibilidad) --- */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-6 px-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              3 Pasos Obligatorios
            </span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
           
          <div className="space-y-4">
            {/* Paso 1 */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-all"
            >
              <div className="absolute top-4 right-4 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-purple-100">
                Anti-Catfish
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg shadow-inner">
                  1
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Nota de Voz</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-start gap-3">
                <Mic className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-snug">
                  Envía un audio de <strong>10 segundos</strong>. Di tu nombre, edad y quién es tu bias.
                </p>
              </div>
            </motion.div>

            {/* Paso 2 */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-all"
            >
              <div className="absolute top-4 right-4 bg-pink-50 text-pink-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-pink-100">
                Prueba Real
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg shadow-inner">
                  2
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Video Check</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-start gap-3">
                <Video className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-snug">
                  Graba un video mostrando un papel con <strong>fecha y hora actual</strong> + tu merch, foto o un dibujo de BTS.
                </p>
              </div>
            </motion.div>

            {/* Paso 3 */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-all"
            >
               <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-blue-100">
                Identidad
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-inner">
                  3
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Tu Perfil Fan</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-start gap-3">
                <Instagram className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-snug">
                  Envía el link de tu Instagram/Facebook/TikTok fan para verificar tu actividad.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- Footer CTA (Botón Definitivo MEJORADO) --- */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 mb-6 sticky bottom-4 z-50 w-full"
        >
          {/* Sombra Glow animada color WhatsApp */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-3xl blur opacity-40 animate-pulse"></div>
           
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white py-5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all duration-200 group overflow-hidden border border-white/20"
          >
             {/* Shine effect */}
             <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine"></div>
              
             <div className="flex flex-col items-start z-10">
               <span className="text-[11px] font-bold text-green-100 uppercase tracking-widest mb-1 flex items-center gap-1">
                 <Zap className="w-3 h-3 fill-current" /> ¡Quiero Unirme!
               </span>
               <span className="text-2xl font-black tracking-tighter leading-none drop-shadow-sm">INICIAR FILTRO</span>
             </div>
              
             <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors shadow-inner z-10">
               <MessageCircle className="w-8 h-8 text-white fill-current" />
             </div>
          </a>
        </motion.div>

        {/* Opción Manual (Clarificada y Mejorada) */}
        <div className="flex flex-col items-center pb-8 space-y-3 w-full">
          <p className="text-[11px] text-gray-500 font-medium text-center max-w-[220px] leading-tight opacity-80">
            ¿El botón no te funciona? <br/> 
            Copia el número y escríbenos manualmente:
          </p>
           
          <button 
            onClick={copyToClipboard}
            className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all active:scale-95 w-full justify-center max-w-xs"
          >
            {copied ? (
               <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
               <Copy className="w-5 h-5 text-purple-400 group-hover:text-purple-600" />
            )}
            <span className={`text-base font-bold font-mono tracking-wide ${copied ? "text-green-600" : "text-gray-600 group-hover:text-purple-700"}`}>
              {copied ? "¡COPIADO!" : "+" + phoneNumber}
            </span>
          </button>
           
           <div className="mt-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
             <Music size={14} className="text-purple-600 animate-bounce" />
             <span className="text-[10px] font-black text-purple-900 tracking-[0.3em]">BORAHAE 💜 PERÚ</span>
           </div>
        </div>

      </div>
    </div>
  );
}