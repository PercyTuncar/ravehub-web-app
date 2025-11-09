import { safeJSONStringify } from '@/lib/seo/schema-generator';

interface JsonLdProps {
  data: unknown;
  id?: string;
}

/**
 * Renders JSON-LD in the server response so crawlers (and schema.org validator)
 * can read the full graph without executing client-side scripts.
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  if (!data) {
    return null;
  }

  try {
    const jsonString = safeJSONStringify(data);

    return (
      <script
        id={id || 'json-ld-schema'}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonString }}
      />
    );
  } catch (error) {
    console.error('Error serializing JSON-LD schema:', error, data);
    return null;
  }
}

/**
 * Renders multiple JSON-LD schemas as separate script tags
 */
export function JsonLdArray({ data, id }: { data: unknown[]; id?: string }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <>
      {data.map((schema, index) => (
        <JsonLd
          key={`${id || 'json-ld-schema'}-${index}`}
          data={schema}
          id={`${id || 'json-ld-schema'}-${index}`}
        />
      ))}
    </>
  );
}
