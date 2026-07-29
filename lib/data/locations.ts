
export const STATIC_LOCATIONS: Record<string, { regions: string[]; cities: Record<string, string[]> }> = {
    PE: {
        regions: [
            "Amazonas", "Ancash", "Apurimac", "Arequipa", "Ayacucho", "Cajamarca", "Callao",
            "Cusco", "Huancavelica", "Huanuco", "Ica", "Junin", "La Libertad", "Lambayeque",
            "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno",
            "San Martin", "Tacna", "Tumbes", "Ucayali"
        ],
        cities: {
            "Lima": ["Lima", "Miraflores", "San Isidro", "Barranco", "Santiago de Surco", "La Molina", "San Borja", "Magdalena del Mar", "Jesus Maria", "Lince", "Pueblo Libre", "San Miguel", "Callao"],
            "Cusco": ["Cusco", "Urubamba", "Ollantaytambo", "Pisac", "Machu Picchu"],
            "Arequipa": ["Arequipa", "Yanahuara", "Cayma"],
            "La Libertad": ["Trujillo", "Huanchaco"],
            "Piura": ["Piura", "Mancora", "Talara", "Paita"],
            "Ica": ["Ica", "Paracas", "Nazca", "Chincha Alta"],
            "Lambayeque": ["Chiclayo"],
            "Junin": ["Huancayo"],
            "Ancash": ["Huaraz"],
            "San Martin": ["Tarapoto", "Moyobamba"],
            "Loreto": ["Iquitos"],
            "Ucayali": ["Pucallpa"],
            "Tacna": ["Tacna"],
            "Cajamarca": ["Cajamarca"],
            "Puno": ["Puno", "Juliaca"],
            "Ayacucho": ["Ayacucho"],
            "Huanuco": ["Huanuco"],
            "Moquegua": ["Moquegua", "Ilo"],
            "Tumbes": ["Tumbes", "Punta Sal"],
            "Madre de Dios": ["Puerto Maldonado"],
            "Amazonas": ["Chachapoyas"],
            "Apurimac": ["Abancay"],
            "Huancavelica": ["Huancavelica"],
            "Pasco": ["Cerro de Pasco"]
        }
    },
    CL: {
        regions: [
            "Arica y Parinacota", "Tarapaca", "Antofagasta", "Atacama", "Coquimbo", "Valparaiso",
            "Metropolitana de Santiago", "Libertador General Bernardo O'Higgins", "Maule", "Nuble",
            "Biobio", "Araucania", "Los Rios", "Los Lagos", "Aysen", "Magallanes"
        ],
        cities: {
            "Metropolitana de Santiago": ["Santiago", "Providencia", "Las Condes", "Vitacura", "Lo Barnechea", "Nunoa", "La Reina"],
            "Valparaiso": ["Valparaiso", "Vina del Mar", "Concon", "Quilpue", "Villa Alemana"],
            "Biobio": ["Concepcion", "Talcahuano"],
            "Antofagasta": ["Antofagasta", "Calama"],
            "Coquimbo": ["La Serena", "Coquimbo"]
        }
    },
    CO: {
        regions: [
            "Amazonas", "Antioquia", "Arauca", "Atlantico", "Bolivar", "Boyaca", "Caldas", "Caqueta",
            "Casanare", "Cauca", "Cesar", "Choco", "Cordoba", "Cundinamarca", "Guainia", "Guaviare",
            "Huila", "La Guajira", "Magdalena", "Meta", "Narino", "Norte de Santander", "Putumayo",
            "Quindio", "Risaralda", "San Andres y Providencia", "Santander", "Sucre", "Tolima",
            "Valle del Cauca", "Vaupes", "Vichada"
        ],
        cities: {
            "Cundinamarca": ["Bogota", "Soacha", "Chia"],
            "Antioquia": ["Medellin", "Envigado", "Itagui", "Bello"],
            "Valle del Cauca": ["Cali", "Palmira", "Buenaventura"],
            "Atlantico": ["Barranquilla", "Soledad"],
            "Bolivar": ["Cartagena"],
            "Santander": ["Bucaramanga", "Floridablanca"],
            "Norte de Santander": ["Cucuta"],
            "Risaralda": ["Pereira"],
            "Magdalena": ["Santa Marta"]
        }
    },
    AR: {
        regions: [
            "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Cordoba", "Corrientes", "Entre Rios",
            "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquen", "Rio Negro",
            "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
            "Tierra del Fuego", "Tucuman"
        ],
        cities: {
            "Buenos Aires": ["Buenos Aires", "La Plata", "Mar del Plata", "Bahia Blanca"],
            "Cordoba": ["Cordoba", "Villa Carlos Paz"],
            "Santa Fe": ["Rosario", "Santa Fe"],
            "Mendoza": ["Mendoza"],
            "Tucuman": ["San Miguel de Tucuman"],
            "Salta": ["Salta"]
        }
    },
    MX: {
        regions: [
            "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
            "Chihuahua", "Ciudad de Mexico", "Coahuila", "Colima", "Durango", "Guanajuato",
            "Guerrero", "Hidalgo", "Jalisco", "Mexico", "Michoacan", "Morelos", "Nayarit",
            "Nuevo Leon", "Oaxaca", "Puebla", "Queretaro", "Quintana Roo", "San Luis Potosi",
            "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatan", "Zacatecas"
        ],
        cities: {
            "Ciudad de Mexico": ["Ciudad de Mexico", "Coyoacan", "Polanco", "Condesa"],
            "Jalisco": ["Guadalajara", "Zapopan", "Puerto Vallarta"],
            "Nuevo Leon": ["Monterrey", "San Pedro Garza Garcia"],
            "Puebla": ["Puebla"],
            "Guanajuato": ["Leon", "Guanajuato", "San Miguel de Allende"],
            "Yucatan": ["Merida"],
            "Quintana Roo": ["Cancun", "Playa del Carmen", "Tulum"],
            "Baja California": ["Tijuana", "Mexicali", "Ensenada"]
        }
    }
};

export function getStaticRegions(countryCode: string) {
    return STATIC_LOCATIONS[countryCode]?.regions || [];
}

export function getStaticCities(countryCode: string, regionName?: string) {
    const countryData = STATIC_LOCATIONS[countryCode];
    if (!countryData) return [];

    if (regionName && countryData.cities[regionName]) {
        return countryData.cities[regionName];
    }

    // Return all cities if no region specified or region not found in static map
    return Object.values(countryData.cities).flat();
}

// Zona horaria principal (IANA) por país, usada como fallback cuando la API externa falla
export const STATIC_TIMEZONES: Record<string, string> = {
    PE: "America/Lima",
    CL: "America/Santiago",
    CO: "America/Bogota",
    MX: "America/Mexico_City",
    AR: "America/Argentina/Buenos_Aires",
    BR: "America/Sao_Paulo",
    PY: "America/Asuncion",
    UY: "America/Montevideo",
    US: "America/New_York",
    EC: "America/Guayaquil",
    SV: "America/El_Salvador",
    BO: "America/La_Paz",
    VE: "America/Caracas",
    PA: "America/Panama",
    CR: "America/Costa_Rica",
    GT: "America/Guatemala",
    HN: "America/Tegucigalpa",
    NI: "America/Managua",
    DO: "America/Santo_Domingo",
    CU: "America/Havana",
    PR: "America/Puerto_Rico",
    ES: "Europe/Madrid",
    CA: "America/Toronto",
};

export function getStaticTimezone(countryCode: string) {
    return STATIC_TIMEZONES[countryCode.toUpperCase()] || "";
}

// Datos básicos de países, usados como fallback cuando la API externa (restcountries.com) falla
export const STATIC_COUNTRIES: {
    code: string;
    name: string;
    flag: string;
    currency: { code: string; name: string; symbol: string };
}[] = [
    { code: "PE", name: "Perú", flag: "https://flagcdn.com/pe.svg", currency: { code: "PEN", name: "Sol peruano", symbol: "S/" } },
    { code: "CL", name: "Chile", flag: "https://flagcdn.com/cl.svg", currency: { code: "CLP", name: "Peso chileno", symbol: "$" } },
    { code: "CO", name: "Colombia", flag: "https://flagcdn.com/co.svg", currency: { code: "COP", name: "Peso colombiano", symbol: "$" } },
    { code: "MX", name: "México", flag: "https://flagcdn.com/mx.svg", currency: { code: "MXN", name: "Peso mexicano", symbol: "$" } },
    { code: "AR", name: "Argentina", flag: "https://flagcdn.com/ar.svg", currency: { code: "ARS", name: "Peso argentino", symbol: "$" } },
    { code: "BR", name: "Brasil", flag: "https://flagcdn.com/br.svg", currency: { code: "BRL", name: "Real brasileño", symbol: "R$" } },
    { code: "PY", name: "Paraguay", flag: "https://flagcdn.com/py.svg", currency: { code: "PYG", name: "Guaraní", symbol: "₲" } },
    { code: "UY", name: "Uruguay", flag: "https://flagcdn.com/uy.svg", currency: { code: "UYU", name: "Peso uruguayo", symbol: "$" } },
    { code: "US", name: "Estados Unidos", flag: "https://flagcdn.com/us.svg", currency: { code: "USD", name: "Dólar estadounidense", symbol: "$" } },
    { code: "EC", name: "Ecuador", flag: "https://flagcdn.com/ec.svg", currency: { code: "USD", name: "Dólar estadounidense", symbol: "$" } },
    { code: "SV", name: "El Salvador", flag: "https://flagcdn.com/sv.svg", currency: { code: "USD", name: "Dólar estadounidense", symbol: "$" } },
    { code: "BO", name: "Bolivia", flag: "https://flagcdn.com/bo.svg", currency: { code: "BOB", name: "Boliviano", symbol: "Bs" } },
    { code: "VE", name: "Venezuela", flag: "https://flagcdn.com/ve.svg", currency: { code: "VES", name: "Bolívar", symbol: "Bs" } },
    { code: "PA", name: "Panamá", flag: "https://flagcdn.com/pa.svg", currency: { code: "PAB", name: "Balboa", symbol: "B/." } },
    { code: "CR", name: "Costa Rica", flag: "https://flagcdn.com/cr.svg", currency: { code: "CRC", name: "Colón costarricense", symbol: "₡" } },
    { code: "GT", name: "Guatemala", flag: "https://flagcdn.com/gt.svg", currency: { code: "GTQ", name: "Quetzal", symbol: "Q" } },
    { code: "HN", name: "Honduras", flag: "https://flagcdn.com/hn.svg", currency: { code: "HNL", name: "Lempira", symbol: "L" } },
    { code: "NI", name: "Nicaragua", flag: "https://flagcdn.com/ni.svg", currency: { code: "NIO", name: "Córdoba", symbol: "C$" } },
    { code: "DO", name: "República Dominicana", flag: "https://flagcdn.com/do.svg", currency: { code: "DOP", name: "Peso dominicano", symbol: "$" } },
    { code: "CU", name: "Cuba", flag: "https://flagcdn.com/cu.svg", currency: { code: "CUP", name: "Peso cubano", symbol: "$" } },
    { code: "PR", name: "Puerto Rico", flag: "https://flagcdn.com/pr.svg", currency: { code: "USD", name: "Dólar estadounidense", symbol: "$" } },
    { code: "ES", name: "España", flag: "https://flagcdn.com/es.svg", currency: { code: "EUR", name: "Euro", symbol: "€" } },
    { code: "CA", name: "Canadá", flag: "https://flagcdn.com/ca.svg", currency: { code: "CAD", name: "Dólar canadiense", symbol: "$" } },
];

export function getStaticCountries() {
    return STATIC_COUNTRIES.map((country) => ({
        id: country.code,
        code: country.code,
        name: country.name,
        nativeName: country.name,
        region: "",
        subregion: "",
        capital: undefined,
        currencies: [country.currency],
        languages: [],
        flag: country.flag,
        population: 0,
        timezones: STATIC_TIMEZONES[country.code] ? [STATIC_TIMEZONES[country.code]] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
}
