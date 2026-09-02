'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEventDateTime } from '@/lib/utils/date-timezone';

interface CountdownTimerProps {
  targetDate: string;
  targetTime?: string;
  timezone?: string;
  className?: string;
}

export function CountdownTimer({ targetDate, targetTime, timezone, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Usar getEventDateTime para obtener la fecha/hora exacta considerando timezone
        const targetDateTime = getEventDateTime({
          startDate: targetDate,
          startTime: targetTime || '23:59',
          timezone
        });

        const now = new Date();
        const difference = targetDateTime.getTime() - now.getTime();

        if (difference <= 0) {
          setHasPassed(true);
          return null;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      } catch (error) {
        console.error('Error calculating countdown:', error);
        return null;
      }
    };

    // Calculate initial time
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, targetTime, timezone]);

  if (hasPassed) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">El evento ya comenzó</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid grid-cols-4 gap-4">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">días</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">horas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">min</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">seg</div>
        </div>
      </div>
    </div>
  );
}
