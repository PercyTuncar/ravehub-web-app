'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        // Parse target date and time
        const dateStr = targetDate;
        const timeStr = targetTime || '00:00';
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Create date in the specified timezone or local timezone
        const target = new Date(dateStr);
        target.setHours(hours, minutes || 0, 0, 0);
        
        // Adjust for timezone if provided
        if (timezone) {
          // Simple timezone offset handling (can be improved)
          const offsetMatch = timezone.match(/UTC([+-])(\d+):(\d+)/);
          if (offsetMatch) {
            const sign = offsetMatch[1] === '+' ? 1 : -1;
            const offsetHours = parseInt(offsetMatch[2]);
            const offsetMinutes = parseInt(offsetMatch[3]);
            const offsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
            const localOffset = target.getTimezoneOffset() * 60 * 1000;
            target.setTime(target.getTime() - localOffset - offsetMs);
          }
        }

        const now = new Date();
        const difference = target.getTime() - now.getTime();

        if (difference <= 0) {
          setHasPassed(true);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }

        setHasPassed(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } catch (error) {
        console.error('Error calculating countdown:', error);
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, targetTime, timezone]);

  if (!timeLeft) {
    return null;
  }

  if (hasPassed) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" />
        <span className="text-sm">El evento ya comenzó</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Falta:</span>
      </div>
      <div className="flex gap-2">
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

