'use client';

import { useEffect } from 'react';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

/**
 * Track user interactions on ticket purchase flow
 *
 * Events tracked:
 * - AddToCart: When user increases ticket quantity
 * - RemoveFromCart: When user decreases ticket quantity
 * - SelectInstallments: When user enables installment payment
 * - SelectPaymentMethod: When user selects payment method
 * - ClickWhatsApp: When user clicks WhatsApp button
 */

interface TicketInteractionTrackerProps {
  eventId: string;
  eventName: string;
  currency: string;
}

let lastTrackedQuantities: Record<string, number> = {};

export function trackAddToCart(params: {
  eventId: string;
  eventName: string;
  zoneName: string;
  quantity: number;
  price: number;
  currency: string;
}) {
  const marketingEventId = createEventId();

  trackMarketingEvent({
    eventId: marketingEventId,
    name: 'add_to_cart',
    title: `Añadir al Carrito — ${params.eventName}`,
    contentType: 'product',
    contentIds: [params.eventId],
    contentName: `${params.eventName} - ${params.zoneName}`,
    value: params.price * params.quantity,
    currency: params.currency,
    metadata: {
      zone_name: params.zoneName,
      quantity: params.quantity,
      unit_price: params.price,
    },
  });

  console.log('[Analytics] AddToCart tracked:', {
    event: params.eventName,
    zone: params.zoneName,
    quantity: params.quantity,
    value: params.price * params.quantity,
  });
}

export function trackRemoveFromCart(params: {
  eventId: string;
  eventName: string;
  zoneName: string;
  quantity: number;
  price: number;
  currency: string;
}) {
  const marketingEventId = createEventId();

  trackMarketingEvent({
    eventId: marketingEventId,
    name: 'remove_from_cart',
    title: `Remover del Carrito — ${params.eventName}`,
    contentType: 'product',
    contentIds: [params.eventId],
    contentName: `${params.eventName} - ${params.zoneName}`,
    value: params.price * params.quantity,
    currency: params.currency,
    metadata: {
      zone_name: params.zoneName,
      quantity: params.quantity,
      unit_price: params.price,
    },
  });

  console.log('[Analytics] RemoveFromCart tracked:', {
    event: params.eventName,
    zone: params.zoneName,
    quantity: params.quantity,
  });
}

export function trackSelectInstallments(params: {
  eventId: string;
  eventName: string;
  installments: number;
  enabled: boolean;
}) {
  const marketingEventId = createEventId();

  trackMarketingEvent({
    eventId: marketingEventId,
    name: 'select_installments',
    title: `${params.enabled ? 'Activar' : 'Desactivar'} Cuotas — ${params.eventName}`,
    contentType: 'product',
    contentIds: [params.eventId],
    metadata: {
      installments: params.installments,
      enabled: params.enabled,
    },
  });

  console.log('[Analytics] SelectInstallments tracked:', {
    event: params.eventName,
    installments: params.installments,
    enabled: params.enabled,
  });
}

export function trackSelectPaymentMethod(params: {
  eventId: string;
  eventName: string;
  paymentMethod: 'online' | 'offline';
}) {
  const marketingEventId = createEventId();

  trackMarketingEvent({
    eventId: marketingEventId,
    name: 'select_payment_method',
    title: `Seleccionar Pago ${params.paymentMethod === 'online' ? 'Online' : 'Offline'} — ${params.eventName}`,
    contentType: 'product',
    contentIds: [params.eventId],
    metadata: {
      payment_method: params.paymentMethod,
    },
  });

  console.log('[Analytics] SelectPaymentMethod tracked:', {
    event: params.eventName,
    paymentMethod: params.paymentMethod,
  });
}

export function trackClickWhatsApp(params: {
  eventId: string;
  eventName: string;
  action: 'open_groups' | 'request_tickets';
}) {
  const marketingEventId = createEventId();

  trackMarketingEvent({
    eventId: marketingEventId,
    name: 'click_whatsapp',
    title: `Click WhatsApp — ${params.action === 'open_groups' ? 'Ver Grupos' : 'Pedir Tickets'} — ${params.eventName}`,
    contentType: 'product',
    contentIds: [params.eventId],
    metadata: {
      action: params.action,
    },
  });

  console.log('[Analytics] ClickWhatsApp tracked:', {
    event: params.eventName,
    action: params.action,
  });
}

export function trackQuantityChange(params: {
  eventId: string;
  eventName: string;
  zoneName: string;
  zoneId: string;
  newQuantity: number;
  oldQuantity: number;
  price: number;
  currency: string;
}) {
  const key = `${params.eventId}-${params.zoneId}`;

  // Initialize if first time
  if (lastTrackedQuantities[key] === undefined) {
    lastTrackedQuantities[key] = params.oldQuantity;
  }

  // Track only if quantity actually changed
  if (params.newQuantity > lastTrackedQuantities[key]) {
    // User added tickets
    const addedQuantity = params.newQuantity - lastTrackedQuantities[key];
    trackAddToCart({
      eventId: params.eventId,
      eventName: params.eventName,
      zoneName: params.zoneName,
      quantity: addedQuantity,
      price: params.price,
      currency: params.currency,
    });
  } else if (params.newQuantity < lastTrackedQuantities[key]) {
    // User removed tickets
    const removedQuantity = lastTrackedQuantities[key] - params.newQuantity;
    trackRemoveFromCart({
      eventId: params.eventId,
      eventName: params.eventName,
      zoneName: params.zoneName,
      quantity: removedQuantity,
      price: params.price,
      currency: params.currency,
    });
  }

  // Update last tracked quantity
  lastTrackedQuantities[key] = params.newQuantity;
}
