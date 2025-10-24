import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { reportWebVitals, sendToGoogleAnalytics } from '@/lib/web-vitals';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Report all web vitals to Google Analytics
    reportWebVitals(sendToGoogleAnalytics);
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;