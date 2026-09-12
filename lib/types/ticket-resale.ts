// Ticket Resale types
export interface TicketResaleRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;

  // Event Info
  eventId: string;
  eventName: string;
  eventDate: string;
  eventSlug?: string;

  // Ticket Info
  zoneId: string;
  zoneName: string;
  phaseId: string;
  phaseName: string;
  originalPrice: number;
  offerPrice: number; // Precio calculado según depreciación
  depreciation: number; // Porcentaje de depreciación
  daysUntilEvent: number;

  // Payment Method
  paymentMethod: 'yape' | 'plin' | 'interbank' | 'bcp';
  accountNumber?: string; // Para cuentas bancarias
  phoneNumber?: string; // Para Yape/Plin
  cci?: string; // Para transferencias interbancarias
  accountHolderName?: string;

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

  // Metadata
  createdAt: Date | string;
  updatedAt?: Date | string;
  reviewedBy?: string; // Admin ID
  reviewedAt?: Date | string;
  completedAt?: Date | string;
  notes?: string; // Notas del admin
}

// Custom Quote Request (para eventos no listados)
export interface CustomResaleQuote {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;

  // Event Info (ingresado por usuario)
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  ticketZone?: string;

  // Status
  status: 'pending' | 'quoted' | 'rejected';
  quotedPrice?: number;

  createdAt: Date | string;
  quotedAt?: Date | string;
  quotedBy?: string;
  notes?: string;
}
