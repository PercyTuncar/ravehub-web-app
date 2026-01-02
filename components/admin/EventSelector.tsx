'use client';

import { useState, useEffect } from 'react';
import { getEventsList } from '@/lib/actions/event-actions';
import { Combobox } from '@/components/ui/combobox';
import { Loader2 } from 'lucide-react';

interface EventSelectorProps {
    value?: string;
    onChange: (value: string) => void;
}

export function EventSelector({ value, onChange }: EventSelectorProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getEventsList();
                setEvents(data);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center text-sm text-muted-foreground p-2 border rounded-md">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando eventos...
            </div>
        );
    }

    const options = events.map(event => ({
        value: event.id,
        label: event.name + (event.startDate ? ` (${new Date(event.startDate).getFullYear()})` : ''),
    }));

    return (
        <Combobox
            options={options}
            value={value}
            onValueChange={onChange}
            placeholder="Seleccionar evento..."
            searchPlaceholder="Buscar evento..."
            loading={loading}
        />
    );
}
