/**
 * Utilidades para generar slugs URL-friendly
 */

/**
 * Genera un slug a partir de un texto
 * @param text - Texto a convertir en slug
 * @returns Slug URL-friendly
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales y acentos
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Remover caracteres especiales excepto guiones y números
    .replace(/[^a-z0-9\s-]/g, '')
    // Reemplazar espacios múltiples con guiones simples
    .replace(/\s+/g, '-')
    // Remover guiones múltiples y al inicio/final
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Valida si un slug es válido
 * @param slug - Slug a validar
 * @returns true si es válido
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  
  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9-]+$/;
  
  // No puede empezar o terminar con guión
  const noEdgeDashes = !slug.startsWith('-') && !slug.endsWith('-');
  
  // No puede tener guiones dobles
  const noDoubleDashes = !slug.includes('--');
  
  return slugRegex.test(slug) && noEdgeDashes && noDoubleDashes;
}

/**
 * Limpia y valida un slug
 * @param slug - Slug a limpiar
 * @returns Slug limpio y válido
 */
export function cleanAndValidateSlug(slug: string): string {
  const cleaned = generateSlug(slug);
  return cleaned;
}

/**
 * Genera un slug único añadiendo un número si es necesario
 * @param baseSlug - Slug base
 * @param existingSlugs - Array de slugs existentes
 * @returns Slug único
 */
export function generateUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[] = []
): string {
  let slug = cleanAndValidateSlug(baseSlug);
  let counter = 1;
  let finalSlug = slug;

  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}