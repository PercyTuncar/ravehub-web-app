'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeRemainingProps {
  targetDate: Date | string;
  className?: string;
  showIcon?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

function calculateTimeLeft(targetDate: Date | string): TimeLeft {
  const target = new Date(targetDate);
  const now = new Date();
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isOverdue: false };
}

export function TimeRemaining({ targetDate, className = '', showIcon = true }: TimeRemainingProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isOverdue) {
    return (
      <span className={`text-red-400 font-medium ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 inline mr-1" />}
        Vencido
      </span>
    );
  }

  // Formato según tiempo restante
  let displayText = '';
  let urgencyClass = '';

  if (timeLeft.days > 7) {
    // Más de 7 días: mostrar solo días
    displayText = `Vence en ${timeLeft.days} días`;
    urgencyClass = 'text-white/60';
  } else if (timeLeft.days > 2) {
    // 3-7 días: mostrar días y horas
    displayText = `Vence en ${timeLeft.days}d ${timeLeft.hours}h`;
    urgencyClass = 'text-blue-400';
  } else if (timeLeft.days >= 1) {
    // 1-2 días: mostrar días, horas, minutos
    displayText = `Vence en ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    urgencyClass = 'text-yellow-400';
  } else if (timeLeft.hours > 0) {
    // Menos de 1 día: mostrar horas y minutos
    displayText = `Vence en ${timeLeft.hours}h ${timeLeft.minutes}m`;
    urgencyClass = 'text-orange-400 animate-pulse';
  } else {
    // Menos de 1 hora: mostrar minutos y segundos
    displayText = `Vence en ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    urgencyClass = 'text-red-400 animate-pulse font-bold';
  }

  return (
    <span className={`${urgencyClass} ${className}`}>
      {showIcon && <Clock className="w-3.5 h-3.5 inline mr-1" />}
      {displayText}
    </span>
  );
}
