export interface CountryAbout {
  title: string
  intro: string
  scene: {
    title: string
    content: string
  }
  venues: {
    title: string
    content: string
    highlights: string[]
  }
  culture: {
    title: string
    content: string
  }
}

export const COUNTRY_ABOUT: Record<string, CountryAbout> = {
  PE: {
    title: 'La Escena Electrónica en Perú',
    intro: 'Perú ha experimentado un crecimiento exponencial en su escena de música electrónica, consolidándose como uno de los epicentros del techno y house en Sudamérica.',
    scene: {
      title: 'Una Escena en Evolución',
      content: 'Desde los primeros raves underground en Lima hasta los festivales masivos actuales, la escena electrónica peruana ha evolucionado constantemente. Lima se ha convertido en un hub regional que atrae a artistas internacionales de primer nivel, mientras que ciudades como Cusco y Arequipa desarrollan sus propias comunidades vibrantes de música electrónica.'
    },
    venues: {
      title: 'Espacios Emblemáticos',
      content: 'La capital cuenta con una variedad de espacios dedicados a la música electrónica, desde clubes íntimos hasta venues de gran capacidad:',
      highlights: [
        'Clubes underground en Barranco y Miraflores',
        'Festivales al aire libre en la Costa Verde',
        'Eventos en espacios industriales reconvertidos',
        'Fiestas en azoteas con vista al Pacífico'
      ]
    },
    culture: {
      title: 'Cultura y Comunidad',
      content: 'La comunidad raver peruana se caracteriza por su energía, diversidad y apertura. Los eventos combinan la pasión por la música electrónica con la rica cultura local, creando experiencias únicas que van desde techno marathon sessions hasta sunrise sets con vista al océano.'
    }
  },
  CL: {
    title: 'La Escena Electrónica en Chile',
    intro: 'Chile es pionero de la música electrónica en Latinoamérica, con una escena madura y diversa que abarca desde el techno más experimental hasta el house melódico.',
    scene: {
      title: 'Tradición y Vanguardia',
      content: 'Santiago ha sido cuna de la música electrónica latinoamericana desde los años 90. La escena chilena se distingue por su sofisticación técnica, la calidad de sus producciones locales y una audiencia conocedora que valora tanto a las leyendas internacionales como al talento emergente nacional.'
    },
    venues: {
      title: 'Espacios Únicos',
      content: 'Chile ofrece una diversidad impresionante de venues para música electrónica:',
      highlights: [
        'Clubes icónicos en el barrio Bellavista de Santiago',
        'Festivales en viñedos del Valle de Casablanca',
        'Raves en la costa de Valparaíso y Viña del Mar',
        'Eventos en locaciones de montaña cerca de la cordillera'
      ]
    },
    culture: {
      title: 'Identidad Musical',
      content: 'La escena chilena se caracteriza por su eclecticismo y profesionalismo. Los promotores locales han construido una industria sólida que combina eventos underground con festivales de clase mundial, manteniendo siempre un alto estándar de calidad en producción y selección musical.'
    }
  },
  CO: {
    title: 'La Escena Electrónica en Colombia',
    intro: 'Colombia vive un boom de música electrónica sin precedentes, fusionando ritmos locales con beats globales para crear una identidad sonora única en el continente.',
    scene: {
      title: 'Explosión Creativa',
      content: 'Bogotá, Medellín y Cali lideran una revolución electrónica que combina techno, house y sonidos experimentales con la rica herencia musical colombiana. La escena se caracteriza por su energía desbordante, creatividad sin límites y una creciente comunidad de productores y DJs locales que están ganando reconocimiento internacional.'
    },
    venues: {
      title: 'De los Andes al Caribe',
      content: 'Colombia ofrece escenarios diversos para la música electrónica:',
      highlights: [
        'Clubes de alta tecnología en Bogotá y Medellín',
        'Festivales en fincas cafeteras',
        'Beach parties en la costa caribeña',
        'Eventos en espacios culturales del centro histórico'
      ]
    },
    culture: {
      title: 'Sabor y Ritmo',
      content: 'La escena colombiana se distingue por su calidez y energía contagiosa. Los eventos mezclan la pasión latina con la cultura global del club, creando experiencias únicas donde el techno se encuentra con la cumbia, y donde cada fiesta es una celebración de la vida y la música.'
    }
  },
  EC: {
    title: 'La Escena Electrónica en Ecuador',
    intro: 'Ecuador emerge como un destino prometedor para la música electrónica, con Quito y Guayaquil liderando el desarrollo de una escena vibrante y auténtica.',
    scene: {
      title: 'Nueva Energía Andina',
      content: 'La escena electrónica ecuatoriana está en pleno auge, impulsada por una nueva generación de DJs y productores locales. Quito, con su altitud única, ofrece experiencias de clubbing incomparables, mientras que Guayaquil aporta la energía costera a la ecuación. Festivales y eventos regulares están construyendo una comunidad cada vez más sólida.'
    },
    venues: {
      title: 'Entre Montañas y Mar',
      content: 'Ecuador ofrece locaciones únicas para eventos electrónicos:',
      highlights: [
        'Clubes en la zona Rosa de Quito',
        'Eventos al aire libre con vista a los volcanes',
        'Beach clubs en las playas de Guayaquil',
        'Fiestas en haciendas coloniales'
      ]
    },
    culture: {
      title: 'Comunidad Emergente',
      content: 'La comunidad electrónica ecuatoriana se caracteriza por su entusiasmo y apertura. Aunque más pequeña que otras escenas regionales, compensa con dedicación y autenticidad. Los eventos combinan la hospitalidad ecuatoriana con sonidos globales, creando una atmósfera acogedora pero energética.'
    }
  },
  MX: {
    title: 'La Escena Electrónica en México',
    intro: 'México es una potencia indiscutible de la música electrónica en Latinoamérica, con una industria madura que combina tradición con innovación constante.',
    scene: {
      title: 'Gigante Electrónico',
      content: 'Desde la Ciudad de México hasta Playa del Carmen, pasando por Guadalajara y Monterrey, México ofrece una de las escenas más ricas y diversas del continente. Con décadas de historia en música electrónica, el país ha desarrollado una industria profesional que incluye festivales de clase mundial, clubes legendarios y una generación de productores mexicanos con proyección internacional.'
    },
    venues: {
      title: 'Diversidad de Espacios',
      content: 'México ofrece una variedad incomparable de venues:',
      highlights: [
        'Megaclubes en Polanco y Condesa (CDMX)',
        'Festivales masivos en Quintana Roo',
        'Underground parties en bodegas de la Roma',
        'Beach clubs en Tulum y Playa del Carmen',
        'Eventos en zonas arqueológicas'
      ]
    },
    culture: {
      title: 'Tradición y Modernidad',
      content: 'La escena mexicana combina la calidez y hospitalidad características del país con estándares internacionales de producción. Los mexicanos han abrazado la música electrónica como parte de su identidad cultural contemporánea, creando una fusión única entre tradiciones locales y cultura global del club.'
    }
  },
  AR: {
    title: 'La Escena Electrónica en Argentina',
    intro: 'Argentina, especialmente Buenos Aires, es considerada la capital del techno en Sudamérica, con una escena legendaria que ha influenciado a todo el continente.',
    scene: {
      title: 'La Capital del Techno Sudamericano',
      content: 'Buenos Aires respira música electrónica las 24 horas. Con una cultura de clubbing profundamente arraigada, la ciudad ofrece desde after hours que duran hasta el lunes, hasta festivales masivos que atraen a las mejores figuras del panorama internacional. La escena argentina se caracteriza por su exigencia musical, su pasión desbordante y una identidad sonora propia que mezcla techno oscuro con melodías emotivas.'
    },
    venues: {
      title: 'Templos del Techno',
      content: 'Buenos Aires cuenta con algunos de los clubs más emblemáticos de Latinoamérica:',
      highlights: [
        'Clubes icónicos en Palermo y Colegiales',
        'Fiestas clandestinas en galpones industriales',
        'Eventos masivos en el Hipódromo de Palermo',
        'After hours legendarios que terminan al anochecer',
        'Festivales en el Delta del Tigre'
      ]
    },
    culture: {
      title: 'Pasión sin Límites',
      content: 'La cultura del clubbing argentino es única en el mundo. Los porteños viven la música electrónica con una intensidad emocional particular, creando atmósferas cargadas de energía donde el público y el DJ forman una comunión perfecta. La noche argentina no tiene horarios: la fiesta empieza tarde y termina cuando el cuerpo aguante.'
    }
  }
}