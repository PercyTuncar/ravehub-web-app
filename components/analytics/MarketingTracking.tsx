'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getConsentDecision,
  setConsentDecision,
} from '@/lib/analytics/client';

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

export function MarketingTracking() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [pixelInitialized, setPixelInitialized] = useState(false);

  useEffect(() => {
    const current = getConsentDecision();
    setConsent(current);

    // Auto-accept consent for testing (REMOVE IN PRODUCTION IF GDPR REQUIRED)
    if (current === null) {
      setConsentDecision('accepted');
      setConsent('accepted');
    }

    setShowBanner(false); // Hide banner for testing

    const handleChange = (event: Event) => {
      const decision = (event as CustomEvent<'accepted' | 'rejected'>).detail;
      setConsent(decision);
      setShowBanner(false);
    };

    window.addEventListener('ravehub:consent-changed', handleChange);
    return () => window.removeEventListener('ravehub:consent-changed', handleChange);
  }, []);

  // Initialize Meta Pixel with Advanced Matching when user is available
  useEffect(() => {
    if (consent !== 'accepted' || !window.fbq || pixelInitialized) return;

    // Build Advanced Matching object
    const advancedMatching: Record<string, string> = {};

    if (user) {
      if (user.email) {
        advancedMatching.em = user.email.toLowerCase().trim();
      }
      if (user.firstName) {
        advancedMatching.fn = user.firstName.toLowerCase().replace(/[^a-z]/g, '');
      }
      if (user.lastName) {
        advancedMatching.ln = user.lastName.toLowerCase().replace(/[^a-z]/g, '');
      }
      if (user.phone && user.phonePrefix) {
        // Remove all non-digits and combine with prefix
        const cleanPhone = (user.phonePrefix + user.phone).replace(/\D/g, '');
        advancedMatching.ph = cleanPhone;
      }
      if (user.country) {
        advancedMatching.country = user.country.toLowerCase();
      }
      if (user.id) {
        advancedMatching.external_id = user.id;
      }
      // Optional: add more fields if available
      // ge: gender, db: birthdate (YYYYMMDD), ct: city, st: state, zp: postal code
    }

    // Re-initialize pixel with Advanced Matching
    if (Object.keys(advancedMatching).length > 0) {
      console.log('[Meta Pixel] Initializing with Advanced Matching for user:', user?.id);
      window.fbq('init', metaPixelId!, advancedMatching);
      setPixelInitialized(true);
    }
  }, [consent, user, pixelInitialized]);

  // Initialize TikTok Pixel with Advanced Matching
  useEffect(() => {
    // ALWAYS initialize for testing - no consent check
    if (!tiktokPixelId || !user) return;

    // Build TikTok Advanced Matching object
    const advancedMatching: any = {};

    if (user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(cleanEmail) && !cleanEmail.includes('example.com')) {
        advancedMatching.email = cleanEmail;
      } else {
        console.warn('[TikTok Pixel] Invalid email format, skipping:', user.email);
      }
    }

    if (user.phone && user.phonePrefix) {
      // TikTok requires phone in E.164 format: +[country code][number]
      const phone = (user.phonePrefix + user.phone).replace(/\D/g, '');
      if (phone.length >= 10) {
        advancedMatching.phone_number = '+' + phone;
      } else {
        console.warn('[TikTok Pixel] Invalid phone format, skipping');
      }
    }

    if (user.id) {
      advancedMatching.external_id = user.id;
    }

    // Re-identify user with Advanced Matching
    if (Object.keys(advancedMatching).length > 0 && window.ttq) {
      console.log('[TikTok Pixel] Identifying user with Advanced Matching:', user?.id, {
        hasEmail: !!advancedMatching.email,
        hasPhone: !!advancedMatching.phone_number,
        hasExternalId: !!advancedMatching.external_id,
      });
      window.ttq.identify(advancedMatching);
    }
  }, [user, tiktokPixelId]); // Removed consent dependency

  // Configure GA4 User ID when user is logged in
  useEffect(() => {
    if (!gaId || !user || !window.gtag) return;

    // Set User ID for cross-device tracking
    window.gtag('config', gaId, {
      user_id: user.id,
    });

    // Set User Properties
    window.gtag('set', 'user_properties', {
      user_type: 'registered',
      user_country: user.country || 'unknown',
    });

    console.log('[GA4] User configured:', user.id);
  }, [user, gaId]);

  const accept = () => setConsentDecision('accepted');

  return (
    <>
      {/* Google Analytics - Always load for testing */}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ravehub-google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${gaId}', {
  send_page_view: false,
  cookie_flags: 'SameSite=None;Secure'
});`}
          </Script>
        </>
      )}

      {/* Meta Pixel - Always load for testing */}
      {metaPixelId && (
        <Script id="ravehub-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
        </Script>
      )}

      {/* TikTok Pixel - Always load for testing */}
      {tiktokPixelId && (
        <Script id="ravehub-tiktok-pixel" strategy="afterInteractive">
          {`!function (w,d,t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=d.createElement('script');n.type='text/javascript';n.async=!0;n.src=r+'?sdkid='+e+'&lib='+t; e=d.getElementsByTagName('script')[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixelId}');ttq.page();}(window, document, 'ttq');`}
        </Script>
      )}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Usamos analítica y publicidad personalizada</p>
              <p className="mt-1 text-sm text-zinc-300">
                Medimos el uso del sitio y campañas para mejorar Ravehub y mostrarte contenido relevante. Puedes aceptar o rechazar estas tecnologías.
              </p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={accept} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Aceptar todo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
