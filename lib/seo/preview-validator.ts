'use client';

import { Event } from '@/lib/types';

export interface PreviewValidationResult {
  isValid: boolean;
  score: number;
  issues: PreviewIssue[];
  recommendations: string[];
}

export interface PreviewIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  current?: string | number;
  expected?: string | number;
}

export class PreviewValidator {
  static validateEventForPreview(eventData: Partial<Event>): PreviewValidationResult {
    const issues: PreviewIssue[] = [];
    let score = 0;
    const maxScore = 100;

    // Essential fields validation (50 points total)
    const essentialChecks = [
      {
        field: 'name',
        value: eventData.name,
        required: true,
        points: 10,
        message: 'El nombre del evento es requerido para la vista previa',
        maxLength: 60
      },
      {
        field: 'slug',
        value: eventData.slug,
        required: true,
        points: 10,
        message: 'El slug es requerido para generar la URL pública',
        pattern: /^[a-z0-9-]+$/,
        patternMessage: 'El slug solo puede contener letras minúsculas, números y guiones'
      },
      {
        field: 'shortDescription',
        value: eventData.seoDescription || eventData.shortDescription,
        required: true,
        points: 10,
        message: 'La descripción SEO es requerida para redes sociales',
        maxLength: 160,
        minLength: 50
      },
      {
        field: 'mainImageUrl',
        value: eventData.mainImageUrl,
        required: true,
        points: 10,
        message: 'La imagen principal es requerida para vista previa en redes sociales',
        urlCheck: true
      },
      {
        field: 'startDate',
        value: eventData.startDate,
        required: true,
        points: 10,
        message: 'La fecha de inicio es requerida para la información del evento'
      }
    ];

    // SEO optimization checks (30 points total)
    const seoChecks = [
      {
        field: 'seoTitle',
        value: eventData.seoTitle || eventData.name,
        points: 8,
        message: 'Título SEO optimizado mejora el CTR',
        maxLength: 60,
        minLength: 30
      },
      {
        field: 'seoDescription',
        value: eventData.seoDescription || eventData.shortDescription,
        points: 8,
        message: 'Descripción SEO optimizada mejora el CTR en Google',
        maxLength: 160,
        minLength: 120
      },
      {
        field: 'seoKeywords',
        value: eventData.seoKeywords,
        points: 7,
        message: 'Keywords SEO ayudan en el posicionamiento',
        arrayMinLength: 3
      },
      {
        field: 'schemaType',
        value: eventData.schemaType,
        points: 7,
        message: 'Tipo de Schema ayuda a Google a entender el contenido',
        allowedValues: ['MusicFestival', 'MusicEvent']
      }
    ];

    // Location and organizer validation (20 points total)
    const locationChecks = [
      {
        field: 'location.venue',
        value: eventData.location?.venue,
        points: 8,
        message: 'El recinto es importante para la vista previa'
      },
      {
        field: 'location.city',
        value: eventData.location?.city,
        points: 6,
        message: 'La ciudad es importante para la ubicación'
      },
      {
        field: 'organizer.name',
        value: eventData.organizer?.name,
        points: 6,
        message: 'El nombre del organizador añade credibilidad'
      }
    ];

    // Run all validations
    [...essentialChecks, ...seoChecks, ...locationChecks].forEach(check => {
      const issue = this.validateField(check, eventData);
      if (issue) {
        issues.push(issue);
      } else {
        score += check.points;
      }
    });

    // Additional real-time update validation
    const realTimeChecks = this.validateRealTimeUpdates(eventData);
    issues.push(...realTimeChecks.issues);
    score += realTimeChecks.points;

    // Generate recommendations
    const recommendations = this.generateRecommendations(eventData, issues);

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score: Math.min(score, maxScore),
      issues,
      recommendations
    };
  }

  private static validateField(check: any, eventData: Partial<Event>): PreviewIssue | null {
    const { field, value, required, maxLength, minLength, pattern, patternMessage, urlCheck, arrayMinLength, allowedValues } = check;

    // Required field check
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        severity: 'error',
        field,
        message: check.message,
        current: value || '',
        expected: 'Requerido'
      };
    }

    if (!value) return null; // Optional field with no value

    // String length validation
    if (typeof value === 'string') {
      if (maxLength && value.length > maxLength) {
        return {
          severity: 'warning',
          field,
          message: `${field} es demasiado largo (${value.length} caracteres). Máximo recomendado: ${maxLength}`,
          current: value.length,
          expected: `<= ${maxLength}`
        };
      }

      if (minLength && value.length < minLength) {
        return {
          severity: 'warning',
          field,
          message: `${field} es demasiado corto (${value.length} caracteres). Mínimo recomendado: ${minLength}`,
          current: value.length,
          expected: `>= ${minLength}`
        };
      }
    }

    // Pattern validation
    if (pattern && typeof value === 'string' && !pattern.test(value)) {
      return {
        severity: 'error',
        field,
        message: patternMessage || `${field} no cumple con el formato requerido`,
        current: value,
        expected: 'Formato válido'
      };
    }

    // URL validation
    if (urlCheck && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        return {
          severity: 'error',
          field,
          message: `${field} debe ser una URL válida`,
          current: value,
          expected: 'URL válida'
        };
      }
    }

    // Array validation
    if (Array.isArray(value) && arrayMinLength && value.length < arrayMinLength) {
      return {
        severity: 'warning',
        field,
        message: `${field} debería tener al menos ${arrayMinLength} elementos`,
        current: value.length,
        expected: `>= ${arrayMinLength}`
      };
    }

    // Allowed values validation
    if (allowedValues && !allowedValues.includes(value)) {
      return {
        severity: 'warning',
        field,
        message: `${field} debería ser uno de: ${allowedValues.join(', ')}`,
        current: value,
        expected: allowedValues.join(' o ')
      };
    }

    return null;
  }

  private static validateRealTimeUpdates(eventData: Partial<Event>) {
    const issues: PreviewIssue[] = [];
    let points = 0;

    // Check if preview would update in real-time
    if (eventData.name && eventData.slug) {
      points += 5;
    }

    if (eventData.mainImageUrl) {
      points += 5;
    }

    if (eventData.seoDescription || eventData.shortDescription) {
      points += 5;
    }

    // Check for issues that would prevent real-time updates
    if (!eventData.slug) {
      issues.push({
        severity: 'error',
        field: 'realTimeUpdates',
        message: 'Sin slug, la URL no se puede actualizar en tiempo real'
      });
    }

    return { issues, points };
  }

  private static generateRecommendations(eventData: Partial<Event>, issues: PreviewIssue[]): string[] {
    const recommendations: string[] = [];

    // Check for missing SEO fields
    if (!eventData.seoTitle && eventData.name) {
      recommendations.push('Considera agregar un título SEO personalizado para mejorar el CTR');
    }

    if (!eventData.seoDescription && eventData.shortDescription) {
      recommendations.push('Considera agregar una descripción SEO personalizada');
    }

    if (!eventData.seoKeywords || eventData.seoKeywords.length === 0) {
      recommendations.push('Agrega palabras clave relevantes para mejorar el SEO');
    }

    // Check for image recommendations
    if (eventData.mainImageUrl) {
      recommendations.push('Asegúrate de que la imagen tenga al menos 1200x630 píxeles para redes sociales');
    }

    // Check for organizer recommendations
    if (!eventData.organizer?.name) {
      recommendations.push('Agregar información del organizador mejora la credibilidad');
    }

    // Check for location recommendations
    if (!eventData.location?.venue) {
      recommendations.push('Agregar el recinto del evento es importante para los asistentes');
    }

    // Platform-specific recommendations
    recommendations.push('Prueba la vista previa en diferentes dispositivos para asegurar compatibilidad');
    recommendations.push('Verifica que todos los enlaces funcionen correctamente en la página pública');

    return recommendations;
  }

  static getPreviewUrl(eventData: Partial<Event>): string {
    if (!eventData.slug) {
      return '#';
    }

    // Use localhost for development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}/eventos/${eventData.slug}`;
    }

    return `https://www.ravehublatam.com/eventos/${eventData.slug}`;
  }

  static getMetaTags(eventData: Partial<Event>) {
    const title = eventData.seoTitle || eventData.name || 'Evento';
    const description = eventData.seoDescription || eventData.shortDescription || 'Descripción del evento';
    const image = eventData.mainImageUrl || '/images/default-event.jpg';
    const url = this.getPreviewUrl(eventData);

    return {
      og: {
        'og:title': title,
        'og:description': description,
        'og:image': image,
        'og:url': url,
        'og:type': 'website',
        'og:site_name': 'Ravehub'
      },
      twitter: {
        'twitter:card': 'summary_large_image',
        'twitter:title': title,
        'twitter:description': description,
        'twitter:image': image,
        'twitter:site': '@ravehub'
      },
      basic: {
        'description': description,
        'keywords': (eventData.seoKeywords || eventData.tags || []).join(', '),
        'canonical': url
      }
    };
  }
}