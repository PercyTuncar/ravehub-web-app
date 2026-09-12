'use server';

import { ticketResaleRequestsCollection, customResaleQuotesCollection, eventsCollection } from '@/lib/firebase/collections';
import { getCurrentUser } from '@/lib/auth-admin';
import { TicketResaleRequest, CustomResaleQuote } from '@/lib/types/ticket-resale';
import { calculateResaleValue } from '@/lib/utils/resale-calculator';

/**
 * Crear solicitud de reventa de ticket
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

    // Obtener datos del evento
    const event = await eventsCollection.get(data.eventId);
    if (!event) {
      return { success: false, error: 'Evento no encontrado' };
    }

    // Calcular valor de reventa
    const resaleCalc = calculateResaleValue(
      data.originalPrice,
      event.startDate,
      event.createdAt || event.startDate // Fallback si no tiene createdAt
    );

    // Crear solicitud
    const request: Omit<TicketResaleRequest, 'id'> = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userPhone: `${currentUser.phonePrefix}${currentUser.phone}`,

      eventId: data.eventId,
      eventName: event.name,
      eventDate: event.startDate,
      eventSlug: event.slug,

      zoneId: data.zoneId,
      zoneName: data.zoneName,
      phaseId: data.phaseId,
      phaseName: data.phaseName,
      originalPrice: data.originalPrice,
      offerPrice: resaleCalc.currentValue,
      depreciation: resaleCalc.depreciation,
      daysUntilEvent: resaleCalc.daysUntilEvent,

      paymentMethod: data.paymentMethod,
      accountNumber: data.accountNumber,
      phoneNumber: data.phoneNumber,
      cci: data.cci,
      accountHolderName: data.accountHolderName,

      status: 'pending',
      createdAt: new Date(),
    };

    const requestId = await ticketResaleRequestsCollection.create(request as any);

    // Enviar a WhatsApp (se hará en el cliente con el link de WhatsApp)
    return { success: true, requestId };
  } catch (error: any) {
    console.error('Error creating resale request:', error);
    return { success: false, error: error.message || 'Error al crear solicitud' };
  }
}

/**
 * Crear cotización personalizada (evento no listado)
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

    const quote: Omit<CustomResaleQuote, 'id'> = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userPhone: `${currentUser.phonePrefix}${currentUser.phone}`,

      eventName: data.eventName,
      eventDate: data.eventDate,
      eventLocation: data.eventLocation,
      ticketZone: data.ticketZone,

      status: 'pending',
      createdAt: new Date(),
    };

    const quoteId = await customResaleQuotesCollection.create(quote as any);

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
