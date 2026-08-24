/**
 * Google Analytics 4 Tracking
 *
 * Complete implementation of GA4 Enhanced Ecommerce and Custom Events
 *
 * Official Docs: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

/**
 * Track PageView with custom page title
 */
export function trackGA4PageView(params: {
  pageTitle: string;
  pagePath: string;
  pageLocation?: string;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_title: params.pageTitle,
    page_path: params.pagePath,
    page_location: params.pageLocation || window.location.href,
  });

  console.log('[GA4] PageView:', params.pageTitle);
}

/**
 * Set User ID for cross-device tracking
 */
export function setGA4UserId(userId: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    user_id: userId,
  });

  console.log('[GA4] User ID set:', userId);
}

/**
 * Set User Properties
 */
export function setGA4UserProperties(properties: {
  user_type?: 'registered' | 'guest';
  user_country?: string;
  user_city?: string;
  total_purchases?: number;
  lifetime_value?: number;
  [key: string]: string | number | undefined;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('set', 'user_properties', properties);

  console.log('[GA4] User Properties set:', properties);
}

/**
 * Track view_item (Ver producto/evento)
 */
export function trackGA4ViewItem(params: {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    price: number;
    quantity?: number;
  }>;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'view_item', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });

  console.log('[GA4] view_item:', params.items[0]?.item_name);
}

/**
 * Track add_to_cart
 */
export function trackGA4AddToCart(params: {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'add_to_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });

  console.log('[GA4] add_to_cart:', params.items[0]?.item_name, 'x', params.items[0]?.quantity);
}

/**
 * Track remove_from_cart
 */
export function trackGA4RemoveFromCart(params: {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'remove_from_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });

  console.log('[GA4] remove_from_cart:', params.items[0]?.item_name);
}

/**
 * Track begin_checkout
 */
export function trackGA4BeginCheckout(params: {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    price: number;
    quantity: number;
  }>;
  coupon?: string;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'begin_checkout', {
    currency: params.currency,
    value: params.value,
    items: params.items,
    coupon: params.coupon,
  });

  console.log('[GA4] begin_checkout:', params.value, params.currency);
}

/**
 * Track purchase (Compra exitosa)
 */
export function trackGA4Purchase(params: {
  transaction_id: string;
  currency: string;
  value: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: params.transaction_id,
    currency: params.currency,
    value: params.value,
    tax: params.tax,
    shipping: params.shipping,
    coupon: params.coupon,
    items: params.items,
  });

  console.log('[GA4] purchase:', params.transaction_id, params.value, params.currency);
}

/**
 * Track sign_up (Registro de usuario)
 */
export function trackGA4SignUp(method: 'email' | 'google' | 'facebook') {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'sign_up', {
    method,
  });

  console.log('[GA4] sign_up:', method);
}

/**
 * Track login
 */
export function trackGA4Login(method: 'email' | 'google' | 'facebook') {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'login', {
    method,
  });

  console.log('[GA4] login:', method);
}

/**
 * Track search (Búsqueda)
 */
export function trackGA4Search(searchTerm: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'search', {
    search_term: searchTerm,
  });

  console.log('[GA4] search:', searchTerm);
}

/**
 * Track select_content (Click en elemento)
 */
export function trackGA4SelectContent(params: {
  content_type: string;
  content_id: string;
  content_name?: string;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'select_content', {
    content_type: params.content_type,
    content_id: params.content_id,
    item_id: params.content_id,
  });

  console.log('[GA4] select_content:', params.content_type, params.content_id);
}

/**
 * Track share (Compartir)
 */
export function trackGA4Share(params: {
  method: 'whatsapp' | 'facebook' | 'twitter' | 'link';
  content_type: 'event' | 'product' | 'article';
  content_id: string;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'share', {
    method: params.method,
    content_type: params.content_type,
    content_id: params.content_id,
  });

  console.log('[GA4] share:', params.method, params.content_id);
}

/**
 * Track custom event
 */
export function trackGA4CustomEvent(params: {
  eventName: string;
  eventParams?: Record<string, any>;
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', params.eventName, params.eventParams);

  console.log('[GA4] custom event:', params.eventName, params.eventParams);
}
