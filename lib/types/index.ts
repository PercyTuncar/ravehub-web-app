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
  currencySymbol?: string;
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
  timezone?: string;
  externalOrganizerName?: string;

  categories: string[];
  tags: string[];
  faqSection: Array<{ question: string; answer: string }>;
  specifications: Array<{ title: string; items: string[] }>;

  location: {
    venue: string;
    address?: string;
    city?: string;
    cityCode?: string; // City ID reference
    region?: string;
    regionCode?: string; // Region ISO code
    country: string;
    countryCode: string; // Country ISO code
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
    prices?: Array<{
      zoneId: string;
      zoneName: string;
      price: number;
    }>;
    zonesPricing?: Array<{
      zoneId: string;
      price: number;
      available: number;
      sold: number;
      phaseId: string;
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

  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  schemaType?: string;
}

// Blog types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  previousSlug?: string;
  status: 'draft' | 'scheduled' | 'published';
  content: string;
  contentFormat: 'html' | 'markdown';
  contentType: 'BlogPosting' | 'NewsArticle';
  excerpt: string;
  featured: boolean;
  featuredOrder?: number;
  featuredImageUrl: string;
  socialImageUrl?: string;
  imageAltTexts: Record<string, string>;
  imageGalleryPost?: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  focusKeyword?: string;
  canonicalUrl?: string;
  schemaType: string;
  ogType?: string;
  twitterCardType?: string;

  faq?: Array<{ question: string; answer: string }>;
  translations?: Array<{ locale: string; slug: string }>;
  relatedEvents?: string[];
  relatedPosts?: string[];
  relatedEventId?: string;
  sharedContent?: { headline: string; url: string };

  authorId: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  coAuthors?: Array<{ id: string; name: string }>;

  tags: string[];
  categories: string[];
  readTime?: number;
  isAccessibleForFree: boolean;
  averageRating?: number;
  ratingCount?: number;
  reactions?: Record<string, number>;
  socialShares?: Record<string, number>;
  likes?: number;
  viewCount?: number;
  views?: number;
  publishDate?: string;
  updatedDate?: string;
  createdAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order?: number | string;
  parentCategoryId?: string;
  postCount?: number;
  metaKeywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  featured?: boolean;
  featuredOrder?: number;
  postCount?: number;
  metaKeywords?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  content: string;
  isApproved: boolean;
  isAutoGenerated?: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  likes: number;
  likedBy: string[];
  userId?: string;
  userName: string;
  email?: string;
  userImageUrl?: string;
  createdAt: Date;
}

export interface BlogRating {
  id: string;
  postId: string;
  rating: number;
  comment?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface BlogReaction {
  id: string;
  postId: string;
  reactionType: 'crazy' | 'surprise' | 'excited' | 'hot' | 'people' | 'like' | 'heart';
  userId: string;
  userName: string;
  userImageUrl?: string;
  createdAt: Date;
}

export interface CommentReaction {
  id: string;
  commentId: string;
  reactionType: 'heart' | 'crazy' | 'hot' | 'people' | 'excited' | 'ono' | 'funny';
  userId: string;
  userName: string;
  userImageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Currency types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  region: string;
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

// Location types
export interface Country {
  id: string;
  code: string; // ISO 3166-1 alpha-2
  name: string;
  nativeName?: string;
  region: string; // Continent
  subregion?: string;
  capital?: string;
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
  languages: Array<{
    iso639_1: string;
    iso639_2: string;
    name: string;
    nativeName: string;
  }>;
  flag: string;
  population?: number;
  timezones: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Region {
  id: string;
  countryCode: string;
  code: string; // ISO 3166-2
  name: string;
  type: 'state' | 'province' | 'department' | 'region' | 'district';
  createdAt: Date;
  updatedAt: Date;
}

export interface City {
  id: string;
  countryCode: string;
  regionCode?: string;
  name: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event DJ types
export interface EventDj {
  id: string;
  name: string;
  alternateName?: string;
  description: string;
  bio: string;
  performerType: string;
  birthDate?: string;
  country: string;
  genres: string[];
  jobTitle: string[];
  famousTracks: string[];
  famousAlbums: string[];
  imageUrl: string;
  instagramHandle?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    tiktok?: string;
    website?: string;
  };
  approved: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;

  upcomingEvents?: Array<{
    eventId: string;
    eventName: string;
    startDate: string;
    stage?: string;
    isHeadliner?: boolean;
  }>;
  pastEvents?: Array<{
    eventId: string;
    eventName: string;
    startDate: string;
    endDate?: string;
    stage?: string;
  }>;
}

// Event CTA types
export interface EventCTA {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  contactType: string;
  contactValue: string;
  hasCountdown: boolean;
  countdownEndDate?: string;
  styles?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// Ticket Transaction types
export interface TicketTransaction {
  id: string;
  userId: string;
  eventId: string;
  ticketItems: Array<{
    zoneId: string;
    zoneName: string;
    phaseId?: string;
    phaseName?: string;
    quantity: number;
    pricePerTicket: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'online' | 'offline';
  paymentType: 'full' | 'installment';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  offlinePaymentMethod?: string;
  paymentProofUrl?: string;
  adminNotes?: string;
  ticketDeliveryMode?: 'automatic' | 'manualUpload';
  ticketDeliveryStatus?: 'pending' | 'scheduled' | 'available' | 'delivered';
  ticketsDownloadAvailableDate?: string;
  ticketsFiles?: string[];
  deliveredAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  isCourtesy: boolean;
  createdAt: Date | string;
  updatedAt?: Date;
}

// Payment Installment types
export interface PaymentInstallment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  installmentNumber: number;
  status: 'pending' | 'paid' | 'rejected' | 'overdue';
  paymentProofUrl?: string;
  paymentDate?: Date;
  adminApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  dueDate: Date | string;
}

// Order types (for e-commerce)
export interface Order {
  id: string;
  userId: string;
  orderItems: Array<{
    productId: string;
    variantId?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'online' | 'offline';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  offlinePaymentMethod?: string;
  paymentProofUrl?: string;
  status: string;
  notes?: string;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  };
  shippingCost?: number;
  orderDate?: Date | string;
  reviewedBy?: string;
  reviewedAt?: Date;
  updatedAt?: Date | string;
}

// Product types (for e-commerce)
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  discountPercentage?: number;
  stock: number;
  hasVariants: boolean;
  categoryId: string;
  artist?: string;
  brand?: string;
  gender?: string;
  eligibleRegions?: string[];
  shippingDetails?: {
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
  };
  images: string[];
  imageAltTexts: Record<string, string>;
  mediaOrder?: string[];
  videos?: string[];
  videoUrl?: string;
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: Date | string;
}

// Product Category types
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imageAltText?: string;
  isActive: boolean;
  isSubcategory?: boolean;
  parentCategoryId?: string;
  order?: number;
  subcategories?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Product Variant types
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  type: string;
  sku: string;
  stock: number;
  additionalPrice?: number;
  isActive: boolean;
}

// Product Review types
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  rating: number;
  title?: string;
  comment?: string;
  approved: boolean;
  purchaseVerified: boolean;
  isVerified?: boolean;
  helpfulCount?: number;
  reportCount?: number;
  createdAt: Date;
}

// Store Banner types
export interface StoreBanner {
  id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoProvider?: string;
  videoId?: string;
  linkUrl?: string;
  hasDiscount: boolean;
  discountPercentage?: number;
  price?: number;
  isActive: boolean;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  message?: string;
  imageUrl?: string;
  redirectUrl?: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: Date | null;
  sentAt?: Date;
  sentToCount?: number;
  createdAt: Date;
  createdBy: string;
}

// Newsletter Subscriber types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  fingerprint?: string;
  createdAt: Date;
}

// Newsletter Fingerprint types
export interface NewsletterFingerprint {
  id: string;
  count: number;
  firstSubmission: Date;
  lastSubmission: Date;
}

// Slug Redirect types
export interface SlugRedirect {
  id: string;
  oldSlug: string;
  newSlug: string;
  createdAt: Date;
}

// Visitor Profile types
export interface VisitorProfile {
  id: string;
  firstSeen: Date;
  lastActive: Date;
  platform?: string;
  userAgent?: string;
  productViews?: number;
  likedReviews?: string[];
}

// DJ Suggestion types
export interface DjSuggestion {
  id: string;
  name: string;
  country: string;
  instagram?: string;
  popularity?: number;
  suggestedBy: string[];
  djId?: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DJ types (for rankings)
export interface Dj {
  id: string;
  name: string;
  country: string;
  instagram?: string;
  approved: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
}