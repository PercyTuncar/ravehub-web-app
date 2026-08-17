import type { Event, SalesPhase } from '@/lib/types';

export type ReservationMode = 'global' | 'perZone';

export interface ZonePricingLike {
  zoneId: string;
  price: number;
  available?: number;
  sold?: number;
  phaseId?: string;
  reservationAmount?: number;
}

export interface SelectedTicketLike {
  zoneId: string;
  zoneName: string;
  quantity: number;
  price: number;
  phaseId?: string;
}

export interface ReservationBreakdownItem {
  zoneId: string;
  zoneName: string;
  quantity: number;
  unitReservationAmount: number;
  subtotalReservationAmount: number;
}

export function getReservationMode(event: Partial<Event>): ReservationMode {
  const mode = (event as any).installmentReservationMode ?? (event as any).reservationAmountMode;
  return mode === 'perZone' ? 'perZone' : 'global';
}

export function getZoneReservationAmount(
  event: Partial<Event>,
  zonePricing?: ZonePricingLike | null
): number {
  if (getReservationMode(event) === 'perZone') {
    const zoneReservation = zonePricing?.reservationAmount;
    if (typeof zoneReservation === 'number' && Number.isFinite(zoneReservation) && zoneReservation >= 0) {
      return zoneReservation;
    }
  }

  const globalReservation = event.reservationAmount;
  if (typeof globalReservation === 'number' && Number.isFinite(globalReservation) && globalReservation >= 0) {
    return globalReservation;
  }

  return 50;
}

export function calculateReservationBreakdown(
  event: Partial<Event>,
  selectedTickets: SelectedTicketLike[],
  phase?: Pick<SalesPhase, 'zonesPricing'> | null
): {
  breakdown: ReservationBreakdownItem[];
  totalReservationAmount: number;
} {
  const breakdown = selectedTickets.map((ticket) => {
    const zonePricing = phase?.zonesPricing?.find((zp) => zp.zoneId === ticket.zoneId);
    const unitReservationAmount = getZoneReservationAmount(event, zonePricing || undefined);
    const subtotalReservationAmount = unitReservationAmount * ticket.quantity;

    return {
      zoneId: ticket.zoneId,
      zoneName: ticket.zoneName,
      quantity: ticket.quantity,
      unitReservationAmount,
      subtotalReservationAmount,
    };
  });

  return {
    breakdown,
    totalReservationAmount: breakdown.reduce((sum, item) => sum + item.subtotalReservationAmount, 0),
  };
}

export function buildTicketItemsWithReservation(
  selectedTickets: SelectedTicketLike[],
  event: Partial<Event>,
  phase?: Pick<SalesPhase, 'zonesPricing'> | null
) {
  return selectedTickets.map((ticket) => {
    const zonePricing = phase?.zonesPricing?.find((zp) => zp.zoneId === ticket.zoneId);
    const unitReservationAmount = getZoneReservationAmount(event, zonePricing || undefined);
    const reservationSubtotal = unitReservationAmount * ticket.quantity;

    return {
      zoneId: ticket.zoneId,
      zoneName: ticket.zoneName,
      phaseId: ticket.phaseId,
      quantity: ticket.quantity,
      pricePerTicket: ticket.price,
      totalAmount: ticket.price * ticket.quantity,
      reservationAmountPerTicket: unitReservationAmount,
      reservationSubtotal,
    };
  });
}