'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Users, Music, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      setIsSuccess(true);
      setEmail('');
      
      // Reset success state after 5 seconds
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
    {
      icon: Music,
      title: 'Lineups exclusivos',
      description: 'Sé el primero en conocer los artistas y fechas de festivales'
    },
    {
      icon: Star,
      title: 'Preventas especiales',
      description: 'Acceso anticipado a entradas con descuentos exclusivos'
    },
    {
      icon: TrendingUp,
      title: 'Tendencias EDM',
      description: 'Mantente al día con las últimas noticias del mundo electrónico'
    }
  ];

  const stats = [
    { value: '25K+', label: 'Suscriptores activos' },
    { value: '95%', label: 'Satisfacción' },
    { value: '48h', label: 'Promedio de respuesta' }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              No te pierdas el próximo rave
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Recibe preventas, lineups y noticias exclusivas directamente en tu inbox
          </p>
          
          {/* Stats */}
          <div className="flex justify-center items-center gap-8 text-sm text-gray-400 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-orange-400 font-bold text-lg">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Newsletter Form */}
          <div className="relative">
            {/* Glass morphism container */}
            <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-3xl blur-xl" />
              
              <div className="relative z-10">
                {!isSuccess ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Suscríbete gratis
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Recibe nuestras mejores ofertas
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="email" className="sr-only">
                          Email address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Tu email"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                            required
                          />
                          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                        {error && (
                          <p className="text-red-400 text-sm mt-2">{error}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Suscribiendo...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Quiero recibir novedades</span>
                          </div>
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-xs text-gray-400">
                        Sin spam. Cancela cuando quieras. 
                        <span className="text-orange-400">Política de privacidad</span>
                      </p>
                    </div>
                  </>
                ) : (
                  /* Success State */
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      ¡Bienvenido a la familia Ravehub!
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Revisa tu email para confirmar tu suscripción y recibir nuestras últimas novedades.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Suscripción exitosa</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Por qué suscribirte?
              </h3>
              <p className="text-gray-300">
                Únete a miles de ravers que ya reciben las mejores ofertas y novedades del mundo electrónico.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <span className="text-white font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                "Las mejores ofertas de festivales y excelente atención al cliente"
              </p>
              <p className="text-gray-400 text-xs">
                - María S., Lima
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}