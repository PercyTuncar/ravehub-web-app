import { safeJSONStringify } from '@/lib/seo/schema-generator';
import Script, { ScriptProps } from 'next/script';

interface JsonLdProps {
  data: unknown;
  id?: string;
  /**
   * Allow overriding strategy when needed (e.g., afterInteractive for dynamic data).
   * Default keeps it in the head before hydration so crawlers see it immediately.
   */
  strategy?: ScriptProps['strategy'];
}

export default function JsonLd({ data, id, strategy = 'beforeInteractive' }: JsonLdProps) {
  if (!data) {
    return null;
  }

  try {
    const jsonString = safeJSONStringify(data);

    return (
      <Script
        id={id || 'json-ld-schema'}
        type="application/ld+json"
        strategy={strategy}
        dangerouslySetInnerHTML={{ __html: jsonString }}
      />
    );
  } catch (error) {
    console.error('Error serializing JSON-LD schema:', error, data);
    return null;
  }
}
