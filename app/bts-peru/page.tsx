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
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#F3E5F5]">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-[#D1C4E9] via-[#E1BEE7] to-transparent opacity-60"></div>
        {/* Formas orgánicas de fondo */}
        <div className="absolute top-[-150px] right-[-100px] w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute top-[30%] left-[-100px] w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#F3E5F5] via-white/50 to-transparent"></div>
        
        {/* Destellos sutiles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-ping opacity-50"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700 opacity-50"></div>
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
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight drop-shadow-sm flex flex-col items-center gap-2"
          >
            <span>BTS LIMA</span>
            <span className="text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-extrabold flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6 md:w-8 md:h-8" />
              GRUPO DE WHATSAPP
            </span>
          </motion.h1>
          <div className="h-1.5 w-32 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 mx-auto rounded-full mb-4 animate-gradient-x"></div>
           
          <p className="text-lg font-bold text-gray-700 max-w-sm mx-auto leading-relaxed">
            Únete a la comunidad más grande y segura de ARMY en Perú.
            <br/>
            <span className="text-sm font-medium text-gray-500 mt-1 block">
              💜 Conciertos • Proyectos • Amistad 💜
            </span>
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
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col relative group hover:shadow-lg hover:border-purple-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Anti-Catfish
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-700 font-black text-xl shadow-inner border border-purple-100 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Nota de Voz</h3>
              </div>
              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-50 flex items-start gap-3">
                <Mic className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  Envía un audio de <strong className="text-purple-700">10 segundos</strong> diciendo tu nombre, edad y quién es tu bias de BTS.
                </p>
              </div>
            </motion.div>

            {/* Paso 2 */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100 flex flex-col relative group hover:shadow-lg hover:border-pink-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 bg-pink-100 text-pink-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Prueba Real
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center text-pink-700 font-black text-xl shadow-inner border border-pink-100 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Video Check</h3>
              </div>
              <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-50 flex items-start gap-3">
                <Video className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  Graba un video corto mostrando un papel con <strong className="text-pink-700">fecha y hora actual</strong> junto a tu merch o dibujo.
                </p>
              </div>
            </motion.div>

            {/* Paso 3 */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-blue-100 flex flex-col relative group hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
            >
               <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Identidad
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-black text-xl shadow-inner border border-blue-100 group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Tu Perfil Fan</h3>
              </div>
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-50 flex items-start gap-3">
                <Instagram className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  Comparte el link de tu Instagram, TikTok o Twitter fan para verificar que eres <strong className="text-blue-700">ARMY real</strong>.
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
            className="mt-8 mb-6 sticky bottom-6 z-50 w-full"
        >
          {/* Sombra Glow animada color WhatsApp */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-3xl blur-lg opacity-60 animate-pulse"></div>
           
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white py-5 px-6 rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-300 group overflow-hidden border-2 border-[#4ade80]"
          >
             {/* Shine effect */}
             <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:animate-shine"></div>
              
             <div className="flex flex-col items-start z-10">
               <span className="text-xs font-black text-green-100 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                 <Zap className="w-4 h-4 fill-current text-yellow-300" /> ¡ÚNETE AHORA!
               </span>
               <span className="text-2xl font-black tracking-tight leading-none drop-shadow-md">
                 INICIAR FILTRO
               </span>
             </div>
              
             <div className="bg-white/20 p-2 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors shadow-inner z-10 ring-2 ring-white/20">
               <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
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
