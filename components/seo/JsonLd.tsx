import { safeJSONStringify } from '@/lib/seo/schema-generator';

export default function JsonLd({ data, id }: { data: unknown; id?: string }) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // evita warnings de hidratación si el orden cambia
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJSONStringify(data) }}
    />
  );
}