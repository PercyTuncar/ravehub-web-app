
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
