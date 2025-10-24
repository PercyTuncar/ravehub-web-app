import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import EventsClient from './EventsClient';

async function getEvents(): Promise<Event[]> {
  try {
    // Only load published events
    const conditions = [{ field: 'status', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.query(conditions);
    return allEvents as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return <EventsClient initialEvents={events} />;
}