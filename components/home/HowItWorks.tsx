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

        {/* Interactive Steps Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Active Step Details */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`transition-all duration-500 ${
                  index === activeStep
                    ? 'opacity-100 transform translate-x-0'
                    : 'opacity-50 transform translate-x-4'
                }`}
              >
                <div 
                  className={`
                    p-6 rounded-2xl border cursor-pointer transition-all duration-300
                    ${index === activeStep 
                      ? `${step.bgColor} ${step.borderColor} shadow-lg` 
                      : 'bg-gray-900/30 border-gray-700/50 hover:border-gray-600'
                    }
                  `}
                  onClick={() => handleStepClick(index)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${index === activeStep ? step.bgColor : 'bg-gray-800'}
                    `}>
                      <step.icon className={`h-6 w-6 ${index === activeStep ? step.iconColor : 'text-gray-400'}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`
                          text-sm font-bold px-2 py-1 rounded-full
                          ${index === activeStep ? step.bgColor : 'bg-gray-800'}
                          ${index === activeStep ? step.iconColor : 'text-gray-400'}
                        `}>
                          Paso {step.id}
                        </span>
                        {index === activeStep && (
                          <ArrowRight className="h-4 w-4 text-orange-400 animate-pulse" />
                        )}
                      </div>
                      
                      <h3 className={`text-xl font-bold mb-2 ${
                        index === activeStep ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </h3>
                      
                      <p className={`text-sm mb-4 ${
                        index === activeStep ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                      
                      {index === activeStep && (
                        <div className="space-y-2 animate-slide-in-up">
                          {step.details.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center gap-2 text-sm text-gray-400">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Visual Step Indicator */}
          <div className="relative">
            {/* Circular Step Indicator */}
            <div className="relative w-80 h-80 mx-auto">
              {/* Background Circle */}
              <div className="absolute inset-0 rounded-full border border-gray-700/50" />
              
              {/* Steps positioned around circle */}
              {steps.map((step, index) => {
                const angle = (index * 90) - 90; // Start from top
                const radius = 140;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <div
                    key={step.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                    onClick={() => handleStepClick(index)}
                  >
                    {/* Step Circle */}
                    <div className={`
                      w-16 h-16 rounded-full border-2 flex items-center justify-center
                      transition-all duration-300 hover:scale-110
                      ${index === activeStep
                        ? `${step.bgColor} ${step.borderColor} shadow-lg`
                        : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
                      }
                    `}>
                      <step.icon className={`h-6 w-6 ${
                        index === activeStep ? step.iconColor : 'text-gray-400'
                      }`} />
                    </div>
                    
                    {/* Step Number */}
                    <div className={`
                      absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold
                      flex items-center justify-center transition-all duration-300
                      ${index === activeStep
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                      }
                    `}>
                      {step.id}
                    </div>
                  </div>
                );
              })}
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    {(() => {
                      const IconComponent = steps[activeStep].icon;
                      return <IconComponent className="h-8 w-8 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {steps[activeStep].title}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-48">
                    {steps[activeStep].description}
                  </p>
                </div>
              </div>
              
              {/* Connection Lines */}
              {steps.map((_, index) => {
                const angle = (index * 90) - 90;
                const radius = 140;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    <div className={`
                      w-12 h-0.5 origin-left transition-all duration-300
                      ${index <= activeStep ? 'bg-orange-500' : 'bg-gray-600'}
                    `} />
                  </div>
                );
              })}
            </div>
            
            {/* Auto-rotate control */}
            <div className="text-center mt-8">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {autoRotate ? '⏸️ Pausar' : '▶️ Reproducir'} auto-rotación
              </button>
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