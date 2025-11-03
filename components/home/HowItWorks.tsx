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
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-300'
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
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-300'
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
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-300'
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
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-300'
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
  const [autoRotate, setAutoRotate] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || !isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRotate, isVisible]);

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

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setAutoRotate(false);
    // Resume auto-rotation after 10 seconds
    setTimeout(() => setAutoRotate(true), 10000);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-4 bg-gradient-to-b from-black to-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Cómo Funciona
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Compra fácil y segura en solo 4 pasos
          </p>
        </div>

        {/* Interactive Steps Display - Modern Timeline Design */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-start mb-16 pt-4">
          {/* Left: Step Timeline - Vertical Modern Design - Container Optimized */}
          <div className="relative max-w-full overflow-hidden">
            {/* Timeline Line */}
            <div className="absolute left-4 sm:left-6 lg:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-gray-700 to-gray-700"></div>
            
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative transition-all duration-500 ${index === activeStep ? 'opacity-100' : 'opacity-70'}`}
                >
                  {/* Timeline Node */}
                  <div className={`
                    absolute left-2 sm:left-4 lg:left-6 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 lg:border-4 transition-all duration-300 z-10
                    ${index === activeStep
                      ? 'bg-orange-500 border-orange-300 shadow-lg shadow-orange-500/50 scale-110 lg:scale-125'
                      : index < activeStep
                        ? 'bg-orange-500 border-orange-400'
                        : 'bg-gray-700 border-gray-600'
                    }
                  `} />
                  
                  {/* Step Card - Container Optimized */}
                  <div
                    className={`
                      ml-12 sm:ml-16 lg:ml-20 p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border cursor-pointer transition-all duration-300 max-w-full
                      ${index === activeStep
                        ? `${step.bgColor} ${step.borderColor} shadow-xl`
                        : 'bg-gray-900/40 border-gray-700/50 hover:bg-gray-900/60 hover:border-gray-600/70'
                      }
                    `}
                    onClick={() => handleStepClick(index)}
                  >
                    {/* Step Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                        {/* Icon */}
                        <div className={`
                          w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0
                          ${index === activeStep ? step.bgColor : 'bg-gray-800/80'}
                        `}>
                          {(() => {
                            const IconComponent = step.icon;
                            return <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${
                              index === activeStep ? step.iconColor : 'text-gray-400'
                            }`} />;
                          })()}
                        </div>
                        
                        {/* Step Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <span className={`
                              text-xs sm:text-sm font-bold px-2 py-1 rounded-full w-fit
                              ${index === activeStep
                                ? `${step.bgColor} ${step.iconColor}`
                                : 'bg-gray-800/80 text-gray-400'
                              }
                            `}>
                              Paso {step.id}
                            </span>
                            {index === activeStep && (
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <h3 className={`text-sm sm:text-base lg:text-xl font-bold break-words ${
                            index === activeStep ? 'text-white' : 'text-gray-300'
                          }`}>
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Progress Indicator - Responsive */}
                      <div className="text-right sm:text-left mt-2 sm:mt-0">
                        <div className={`text-sm sm:text-lg lg:text-xl font-bold ${
                          index === activeStep ? 'text-orange-400' : 'text-gray-500'
                        }`}>
                          {`${Math.round(((index + 1) / steps.length) * 100)}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {index < activeStep ? 'Completado' : index === activeStep ? 'En proceso' : 'Pendiente'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description - Responsive */}
                    <p className={`text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4 ${
                      index === activeStep ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                    
                    {/* Details - Only show for active step */}
                    {index === activeStep && (
                      <div className="space-y-1 sm:space-y-2 lg:space-y-3 animate-slide-in-up">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start gap-2 lg:gap-3">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm lg:text-base text-gray-300 break-words">{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Auto-rotate control - Compact */}
            <div className="flex justify-center mt-4 sm:mt-6 lg:mt-8">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 text-gray-400 hover:text-white transition-all duration-300 text-xs sm:text-sm"
              >
                {autoRotate ? (
                  <>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Pausar</span>
                    <span className="sm:hidden">Pausar</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Play</span>
                    <span className="sm:hidden">Play</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Active Step Detail - No Scroll Design */}
          <div className="lg:sticky lg:top-20">
            <div className={`
              rounded-xl lg:rounded-2xl border transition-all duration-500 max-w-full
              ${steps[activeStep].bgColor} ${steps[activeStep].borderColor} shadow-xl
            `}>
              {/* Content Container with Custom Scroll */}
              <div className="p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl border border-gray-700/30 bg-gray-900/30">
                {/* Large Icon - Responsive */}
                <div className="flex justify-center mb-3 sm:mb-4 lg:mb-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg">
                    {(() => {
                      const IconComponent = steps[activeStep].icon;
                      return <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />;
                    })()}
                  </div>
                </div>
                
                {/* Step Title - Container Optimized */}
                <div className="text-center mb-3 sm:mb-4 lg:mb-5">
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 bg-orange-500/20 rounded-full mb-2 sm:mb-3 lg:mb-4">
                    <span className="text-xs sm:text-sm font-bold text-orange-300">
                      Paso {steps[activeStep].id} de {steps.length}
                    </span>
                    <div className="w-0.5 h-0.5 lg:w-1 lg:h-1 bg-orange-400 rounded-full" />
                    <span className="text-xs text-orange-400">
                      {Math.round(((activeStep + 1) / steps.length) * 100)}%
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 lg:mb-3 break-words">
                    {steps[activeStep].title}
                  </h3>
                  <p className="text-gray-300 text-sm lg:text-base leading-relaxed break-words">
                    {steps[activeStep].description}
                  </p>
                </div>
                
                {/* Features List - Compact */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-5">
                  <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-white">
                    Características:
                  </h4>
                  <div className="space-y-2 sm:space-y-3 max-h-32 lg:max-h-40 overflow-y-auto custom-scrollbar">
                    {steps[activeStep].details.map((detail, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-200 text-xs sm:text-sm break-words leading-tight">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Navigation - Compact */}
                <div className="flex justify-between items-center pt-3 sm:pt-4 lg:pt-5 border-t border-gray-700/50 gap-2">
                  <button
                    onClick={() => handleStepClick(activeStep > 0 ? activeStep - 1 : steps.length - 1)}
                    className="flex items-center gap-1 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-300 text-xs sm:text-sm"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Ant.</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleStepClick(index)}
                        className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                          index === activeStep
                            ? 'bg-orange-500 scale-125'
                            : index < activeStep
                              ? 'bg-orange-400/60'
                              : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleStepClick(activeStep < steps.length - 1 ? activeStep + 1 : 0)}
                    className="flex items-center gap-1 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-300 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Sig.</span>
                    <span className="sm:hidden">→</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gray-900/50 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="h-6 w-6 text-green-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}