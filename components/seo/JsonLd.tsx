import { safeJSONStringify } from '@/lib/seo/schema-generator';

export default function JsonLd({ data, id }: { data: unknown; id?: string }) {
  // Ensure data is valid
  if (!data) {
    return null;
  }

  try {
    // Validate and stringify the JSON
    const jsonString = safeJSONStringify(data);
    
    // Double-check it's valid JSON
    JSON.parse(jsonString);
    
    return (
      <script
        type="application/ld+json"
        id={id || 'json-ld-schema'}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: jsonString,
        }}
      />
    );
  } catch (error) {
    console.error('Error serializing JSON-LD schema:', error, data);
    return null;
  }
}