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