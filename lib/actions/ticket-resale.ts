'use server';

import { ticketResaleRequestsCollection, customResaleQuotesCollection, eventsCollection } from '@/lib/firebase/collections';
import { getCurrentUser } from '@/lib/auth-admin';
import { TicketResaleRequest, CustomResaleQuote } from '@/lib/types/ticket-resale';
import { calculateResaleValue } from '@/lib/utils/resale-calculator';

/**
 * Crear solicitud de reventa de ticket
 * SOLO GENERA ID - No guarda en base de datos
 */
export async function createResaleRequest(data: {
  eventId: string;
  zoneId: string;
  zoneName: string;
  phaseId: string;
  phaseName: string;
  originalPrice: number;
  paymentMethod: 'yape' | 'plin' | 'interbank' | 'bcp';
  accountNumber?: string;
  phoneNumber?: string;
  cci?: string;
  accountHolderName?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No autenticado' };
    }

    // Generar ID único para tracking (sin guardar en DB)
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Solo retornar éxito con el ID
    // El cliente abrirá WhatsApp con toda la información
    return { success: true, requestId };
  } catch (error: any) {
    console.error('Error creating resale request:', error);
    return { success: false, error: error.message || 'Error al crear solicitud' };
  }
}

/**
 * Crear cotización personalizada (evento no listado)
 * SOLO GENERA ID - No guarda en base de datos
 */
export async function createCustomQuote(data: {
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  ticketZone?: string;
}): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No autenticado' };
    }

    // Generar ID único para tracking (sin guardar en DB)
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Solo retornar éxito con el ID
    // El cliente abrirá WhatsApp con toda la información
    return { success: true, quoteId };
  } catch (error: any) {
    console.error('Error creating custom quote:', error);
    return { success: false, error: error.message || 'Error al crear cotización' };
  }
}

/**
 * Obtener eventos elegibles para reventa (solo próximos)
 * ✅ PÚBLICO: No requiere autenticación para ver eventos
 */
export async function getUpcomingEventsForResale(): Promise<{
  success: boolean;
  events?: any[];
  error?: string;
}> {
  try {
    // ✅ NO verificar autenticación aquí - debe ser público
    // Los eventos son públicos, cualquiera puede verlos

    // Obtener todos los eventos publicados
    const allEvents = await eventsCollection.query([
      { field: 'eventStatus', operator: '==', value: 'published' }
    ]);

    // Filtrar solo eventos futuros
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > now;
    });

    // Ordenar por fecha (más cercanos primero)
    upcomingEvents.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return { success: true, events: upcomingEvents };
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    return { success: false, error: error.message || 'Error al cargar eventos' };
  }
}

/**
 * Obtener solicitudes de reventa del usuario
 */
export async function getMyResaleRequests(): Promise<{
  success: boolean;
  requests?: TicketResaleRequest[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No autenticado' };
    }

    const requests = await ticketResaleRequestsCollection.query([
      { field: 'userId', operator: '==', value: currentUser.id }
    ], 'createdAt', 'desc');

    return { success: true, requests: requests as TicketResaleRequest[] };
  } catch (error: any) {
    console.error('Error fetching resale requests:', error);
    return { success: false, error: error.message || 'Error al cargar solicitudes' };
  }
}
