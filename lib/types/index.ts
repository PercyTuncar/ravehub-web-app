// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phonePrefix: string;
  documentType: 'dni' | 'passport' | 'rut';
  documentNumber: string;
  country: string;
  preferredCurrency: string;
  role: 'user' | 'admin' | 'moderator';
  photoURL: string;

  authProvider: 'email' | 'google' | 'email+google';
  googleLinked?: boolean;
  googleUID?: string;
  emailVerified?: boolean;
  lastLoginInfo?: {
    device?: string;
    browser?: string;
    ip?: string;
  };

  failedLoginAttempts: number;
  lastFailedLoginAttempt?: Date | null;
  lastLogin?: Date;
  lastLoginAt?: Date;
  lastLoginDevice?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Event types
export interface Event {
  id: string;
  name: string;
  slug: string;
  previousSlug?: string;
  shortDescription: string;
  description: string;
  descriptionText: string;

  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  doorTime?: string;

  eventType: 'festival' | 'concert' | 'club';
  eventStatus: string;
  eventAttendanceMode: string;
  inLanguage: string;
  country: string;
  currency: string;
  isMultiDay: boolean;
  isAccessibleForFree: boolean;
  isHighlighted: boolean;
  sellTicketsOnPlatform: boolean;
  allowOfflinePayments: boolean;
  allowInstallmentPayments: boolean;
  maxInstallments?: number;
  externalTicketUrl?: string;
  audienceType?: string;
  typicalAgeRange?: string;
  ticketDeliveryMode?: 'automatic' | 'manualUpload';
  ticketDownloadAvailableDate?: string;

  categories: string[];
  tags: string[];
  faqSection: Array<{ question: string; answer: string }>;
  specifications: Array<{ title: string; items: string[] }>;

  location: {
    venue: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    geo?: { lat: number; lng: number };
  };

  organizer: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
  };

  mainImageUrl: string;
  bannerImageUrl?: string;

  artistLineup: Array<{
    eventDjId?: string;
    name: string;
    order: number;
    performanceDate?: string;
    performanceTime?: string;
    stage?: string;
    imageUrl?: string;
    isHeadliner?: boolean;
  }>;

  subEvents: Array<{
    name: string;
    startDate: string;
    endDate?: string;
    stage?: string;
  }>;

  salesPhases: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    prices: Array<{
      zoneId: string;
      zoneName: string;
      price: number;
    }>;
  }>;

  zones: Array<{
    id: string;
    name: string;
    capacity: number;
    description?: string;
    features?: string[];
    category?: string;
  }>;

  createdAt: string;
  createdBy: string;
  updatedAt: Date | string;
}

// Config types
export interface Config {
  id: string;
  availableCurrencies: string[];
  rates: Record<string, number>;
  currencyApiKey?: string;
  exchangeRateApiKey?: string;
  openExchangeRatesApiKey?: string;
  timestamp?: Date;
  lastUpdated?: Date;
  updatedAt?: Date;
}

// Country types
export interface Country {
  id: string;
  code: string;
  name: string;
  region?: string;
  flag?: string;
  createdAt: Date;
  updatedAt: Date;
}