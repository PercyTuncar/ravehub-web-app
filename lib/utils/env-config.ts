// Environment configuration for external services
export interface APIConfig {
  mapTiler: {
    enabled: boolean;
    key?: string;
    freeQuota: number;
    usedQuota: number;
  };
  openRouteService: {
    enabled: boolean;
    key?: string;
    freeQuota: number;
    usedQuota: number;
  };
  hereAPI: {
    enabled: boolean;
    key?: string;
    freeQuota: number;
    usedQuota: number;
  };
  cloudinary: {
    enabled: boolean;
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    freeQuota?: number;
    usedQuota?: number;
  };
  googleMaps: {
    enabled: boolean;
    urlsEnabled: boolean;
    freeQuota?: number;
    usedQuota?: number;
  };
}

/**
 * Get API configuration from environment variables
 */
export function getAPIConfig(): APIConfig {
  const config: APIConfig = {
    mapTiler: {
      enabled: !!process.env.NEXT_PUBLIC_MAPTILER_KEY,
      key: process.env.NEXT_PUBLIC_MAPTILER_KEY,
      freeQuota: 100000, // 100K requests/month
      usedQuota: 0,
    },
    openRouteService: {
      enabled: !!process.env.NEXT_PUBLIC_ORS_KEY,
      key: process.env.NEXT_PUBLIC_ORS_KEY,
      freeQuota: 2000, // 2K requests/day
      usedQuota: 0,
    },
    hereAPI: {
      enabled: !!process.env.NEXT_PUBLIC_HERE_API_KEY,
      key: process.env.NEXT_PUBLIC_HERE_API_KEY,
      freeQuota: 250000, // 250K transactions/month
      usedQuota: 0,
    },
    cloudinary: {
      enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                  process.env.CLOUDINARY_API_KEY && 
                  process.env.CLOUDINARY_API_SECRET),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    googleMaps: {
      enabled: true,
      urlsEnabled: process.env.NEXT_PUBLIC_MAPS_URLS_ENABLED === 'true',
    },
  };

  return config;
}

/**
 * Check if a service is available and within quota
 */
export function isServiceAvailable(service: keyof APIConfig): boolean {
  const config = getAPIConfig();
  const serviceConfig = config[service];
  
  if (!serviceConfig.enabled) {
    return false;
  }

  // Only check quota for services that have quota tracking
  const hasQuota = 'usedQuota' in serviceConfig && 'freeQuota' in serviceConfig;
  if (!hasQuota) {
    return true; // Services without quota tracking are always available
  }

  return (serviceConfig.usedQuota || 0) < (serviceConfig.freeQuota || 0);
}

/**
 * Update service usage quota
 */
export function updateServiceUsage(service: keyof APIConfig, usage: number = 1): void {
  // In a real implementation, this would track usage in a database
  // For now, it's just a placeholder
  console.log(`Updated usage for ${service}: +${usage}`);
}

/**
 * Get fallback service for a given service type
 */
export function getServiceFallback(service: keyof APIConfig): keyof APIConfig | null {
  const fallbacks: Record<keyof APIConfig, keyof APIConfig | null> = {
    mapTiler: 'openRouteService', // Not really a fallback, but could fall back to OSM tiles
    openRouteService: 'hereAPI',
    hereAPI: 'googleMaps',
    cloudinary: null, // No fallback needed
    googleMaps: null, // Always available
  };

  const fallback = fallbacks[service];
  if (fallback && isServiceAvailable(fallback)) {
    return fallback;
  }

  return null;
}

/**
 * Check quota status and return warning level
 */
export function getQuotaStatus(service: keyof APIConfig): 'ok' | 'warning' | 'critical' {
  const config = getAPIConfig();
  const serviceConfig = config[service];
  
  if (!serviceConfig.enabled) {
    return 'critical';
  }

  // Only check quota for services that have quota tracking
  const hasQuota = 'usedQuota' in serviceConfig && 'freeQuota' in serviceConfig;
  if (!hasQuota) {
    return 'ok'; // Services without quota tracking are always OK
  }

  const usedQuota = serviceConfig.usedQuota || 0;
  const freeQuota = serviceConfig.freeQuota || 0;
  const usagePercentage = (usedQuota / freeQuota) * 100;
  
  if (usagePercentage >= 90) {
    return 'critical';
  } else if (usagePercentage >= 75) {
    return 'warning';
  } else {
    return 'ok';
  }
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getAPIConfig();

  // Check for critical missing variables
  if (!config.mapTiler.enabled && !config.googleMaps.enabled) {
    errors.push('At least one map service (MapTiler or Google Maps URLs) must be configured');
  }

  if (!config.openRouteService.enabled && !config.hereAPI.enabled && !config.googleMaps.enabled) {
    errors.push('At least one routing service (OpenRouteService, HERE API, or Google Maps) must be configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate debug information for environment setup
 */
export function generateEnvDebugInfo(): {
  services: Record<string, { enabled: boolean; hasKey: boolean; quota: string }>;
  recommendations: string[];
} {
  const config = getAPIConfig();
  const services: Record<string, { enabled: boolean; hasKey: boolean; quota: string }> = {};

  Object.entries(config).forEach(([key, value]) => {
    services[key] = {
      enabled: value.enabled,
      hasKey: !!value.key || !!value.cloudName,
      quota: `${value.usedQuota}/${value.freeQuota}`,
    };
  });

  const recommendations: string[] = [];

  if (!config.mapTiler.enabled) {
    recommendations.push('Configure NEXT_PUBLIC_MAPTILER_KEY for map tiles (recommended: https://www.maptiler.com/cloud/)');
  }

  if (!config.openRouteService.enabled && !config.hereAPI.enabled) {
    recommendations.push('Configure NEXT_PUBLIC_ORS_KEY or NEXT_PUBLIC_HERE_API_KEY for routing (recommended: https://openrouteservice.org/ or https://platform.here.com/)');
  }

  if (!config.googleMaps.urlsEnabled) {
    recommendations.push('Set NEXT_PUBLIC_MAPS_URLS_ENABLED=true for free Google Maps deep links');
  }

  return {
    services,
    recommendations,
  };
}