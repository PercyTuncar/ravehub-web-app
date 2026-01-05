'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string | Date;
    onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                return {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            } else {
                return null;
            }
        };

        // Initial calculation
        const initialTime = calculateTimeLeft();
        if (!initialTime) {
            if (onExpire) onExpire();
        }
        setTimeLeft(initialTime);

        const timer = setInterval(() => {
            const timeLeft = calculateTimeLeft();

            if (timeLeft) {
                setTimeLeft(timeLeft);
            } else {
                clearInterval(timer);
                setTimeLeft(null);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onExpire]);

    if (!timeLeft) {
        return <span className="text-red-500 font-bold">EXPIRADO</span>;
    }

    return (
        <div className="font-mono font-bold text-red-500">
            {timeLeft.hours > 0 && <span>{timeLeft.hours.toString().padStart(2, '0')}:</span>}
            <span>{timeLeft.minutes.toString().padStart(2, '0')}:</span>
            <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
        </div>
    );
}
