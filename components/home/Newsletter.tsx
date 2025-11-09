'use client';

import { useState } from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSuccess(true);
      setEmail('');
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      setError('Error al suscribirse. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    'Lineups exclusivos antes que nadie',
    'Preventas especiales con descuentos',
    'Tendencias EDM y noticias del mundo electrónico'
  ];

  const stats = [
    { value: '25K+', label: 'Suscriptores activos' },
    { value: '95%', label: 'Satisfacción' },
    { value: '48h', label: 'Promedio de respuesta' }
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#141618] py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-28 bg-[#141618]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_68%,rgba(251,169,5,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_62%,rgba(0,203,255,0.07),transparent_48%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_88%,rgba(255,255,255,0.05),transparent_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#141618] via-[#141618]/95 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FAFDFF] mb-4 tracking-tight">
            No te pierdas el próximo rave
          </h2>
          <p className="text-lg sm:text-xl text-[#53575A] max-w-2xl mx-auto">
            Recibe preventas, lineups y noticias exclusivas directamente en tu inbox
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Newsletter Form */}
          <div>
            {!isSuccess ? (
              <div className="bg-[#282D31] border border-[#DFE0E0]/20 rounded-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#FAFDFF] mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 bg-[#141618] border border-[#DFE0E0]/30 rounded-lg text-[#FAFDFF] placeholder-[#53575A] focus:outline-none focus:ring-2 focus:ring-[#FBA905] focus:border-transparent transition-all"
                        required
                      />
                      <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#53575A]" />
                    </div>
                    {error && (
                      <p className="text-sm text-[#FF3C32] mt-2">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#FBA905] text-[#282D31] font-medium rounded-lg hover:bg-[#F1A000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#282D31]/30 border-t-[#282D31] rounded-full animate-spin" />
                        <span>Suscribiendo...</span>
                      </div>
                    ) : (
                      <>
                        Suscribirse
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-sm text-[#53575A] mt-6 text-center">
                  Sin spam. Cancela cuando quieras.
                </p>
              </div>
            ) : (
              <div className="bg-[#282D31] border border-[#DFE0E0]/20 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-[#FBA905] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-[#282D31]" />
                </div>
                <h3 className="text-2xl font-bold text-[#FAFDFF] mb-2">
                  ¡Bienvenido a la familia Ravehub!
                </h3>
                <p className="text-[#53575A]">
                  Revisa tu email para confirmar tu suscripción.
                </p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-[#FAFDFF] mb-6">
                ¿Por qué suscribirte?
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#FBA905] flex-shrink-0 mt-0.5" />
                    <span className="text-[#FAFDFF]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#DFE0E0]/20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-[#FAFDFF] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#53575A]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
