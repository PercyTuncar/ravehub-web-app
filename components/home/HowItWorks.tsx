'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, CreditCard, Download, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Elige tu evento',
    description: 'Explora nuestra amplia selección de festivales, conciertos y eventos de música electrónica en toda Latinoamérica.',
    details: [
      'Más de 1,030 eventos activos',
      'Filtros por género, ciudad y fecha',
      'Lineups verificados y actualizados'
    ],
  },
  {
    id: 2,
    icon: ShoppingCart,
    title: 'Selecciona tus entradas',
    description: 'Elige la zona y cantidad de entradas que mejor se adapten a tu experiencia deseada.',
    details: [
      'Zonas diferenciadas (VIP, General, Early Access)',
      'Precios transparentes sin costos ocultos',
      'Instalments disponibles hasta 6 cuotas'
    ],
  },
  {
    id: 3,
    icon: CreditCard,
    title: 'Paga en minutos',
    description: 'Proceso de pago seguro y rápido con múltiples opciones de pago locales y métodos digitales.',
    details: [
      'Pagos seguros SSL y PCI DSS',
      'Tarjetas, transferencias y billeteras digitales',
      'Yape, Mercado Pago, Nequi y más'
    ],
  },
  {
    id: 4,
    icon: Download,
    title: 'Recibe tu e-ticket',
    description: 'Obtén tu entrada digital inmediatamente y accede al evento con tu código QR único.',
    details: [
      'E-ticket instantáneo por email',
      'Código QR único anti-falsificación',
      'Guardado automático en tu perfil'
    ],
  }
];

const benefits = [
  {
    icon: CheckCircle,
    title: '100% Seguro',
    description: 'Verificamos cada evento y proteemos contra fraudes'
  },
  {
    icon: CheckCircle,
    title: 'Soporte 24/7',
    description: 'Atención al cliente en español todos los días'
  },
  {
    icon: CheckCircle,
    title: 'Sin Comisiones Ocultas',
    description: 'Precio final claro desde el primer momento'
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#141618] py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-28 bg-[#141618]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_70%,rgba(251,169,5,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_68%,rgba(0,203,255,0.07),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_92%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#141618] via-[#141618]/95 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FAFDFF] mb-4 tracking-tight">
            Cómo funciona
          </h2>
          <p className="text-lg sm:text-xl text-[#53575A] max-w-2xl">
            Compra fácil y segura en solo 4 pasos
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.id}
                className="group bg-[#141618] border border-[#DFE0E0]/20 rounded-xl p-6 hover:border-[#FBA905]/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    index === activeStep 
                      ? 'bg-[#FBA905] text-[#282D31]' 
                      : 'bg-[#282D31] text-[#53575A] group-hover:bg-[#282D31] group-hover:text-[#FBA905]'
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className={`text-sm font-medium ${
                    index === activeStep ? 'text-[#FAFDFF]' : 'text-[#53575A]'
                  }`}>
                    Paso {step.id}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#FAFDFF] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#53575A] leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Step Details */}
        <div className="bg-[#141618] border border-[#DFE0E0]/20 rounded-xl p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[#FBA905] rounded-xl flex items-center justify-center">
                {(() => {
                  const IconComponent = steps[activeStep].icon;
                  return <IconComponent className="h-7 w-7 text-[#282D31]" />;
                })()}
              </div>
              <div>
                <div className="text-sm font-medium text-[#53575A] mb-1">
                  Paso {steps[activeStep].id} de {steps.length}
                </div>
                <h3 className="text-2xl font-bold text-[#FAFDFF]">
                  {steps[activeStep].title}
                </h3>
              </div>
            </div>
            
            <p className="text-lg text-[#53575A] mb-8">
              {steps[activeStep].description}
            </p>

            {/* Details List */}
            <div className="space-y-3">
              {steps[activeStep].details.map((detail, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#FBA905] flex-shrink-0 mt-0.5" />
                  <span className="text-[#FAFDFF]">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-[#FAFDFF] mb-4">
              ¿Por qué elegir Ravehub?
            </h3>
            <p className="text-lg text-[#53575A] max-w-2xl mx-auto">
              La plataforma más confiable y segura para tus eventos de música electrónica
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-[#141618] border border-[#DFE0E0]/20 rounded-xl p-8 text-center hover:border-[#FBA905]/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-[#FBA905] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-6 w-6 text-[#282D31]" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#FAFDFF] mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-[#53575A]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
