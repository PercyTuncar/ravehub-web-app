import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-gray-400">Última actualización: Diciembre 2025</p>
        </div>

        {/* Content Card */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-8">
            <div className="space-y-8 text-sm leading-relaxed text-gray-400">
              {/* Header Section */}
              <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                <p className="text-gray-300">
                  En <span className="font-medium text-white">Ravehub Latam</span>{' '}
                  ("Nosotros", "La Plataforma"), valoramos su privacidad tanto como su
                  experiencia en el evento. Esta Política describe cómo recopilamos,
                  utilizamos y compartimos su información personal al utilizar nuestro sitio
                  web <code className="bg-black px-2 py-1 rounded">ravehublatam.com</code>.
                </p>
                <p className="text-gray-300 mt-2">
                  Al comprar una entrada o registrarse en nuestra plataforma, usted{' '}
                  <span className="font-medium text-white">autoriza expresamente</span> el
                  tratamiento de sus datos según los términos aquí descritos.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  1. Información que Recopilamos
                </h2>
                <p>
                  Para gestionar la venta de entradas y garantizar la seguridad de los
                  eventos, recopilamos los siguientes datos:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <span className="font-medium text-white">
                      Datos de Identificación:
                    </span>{' '}
                    Nombre completo, número de documento de identidad (DNI, RUT, Pasaporte),
                    fecha de nacimiento y nacionalidad.
                  </li>
                  <li>
                    <span className="font-medium text-white">Datos de Contacto:</span>{' '}
                    Correo electrónico, número de teléfono móvil (para envío de tickets y
                    notificaciones vía WhatsApp/SMS) y domicilio.
                  </li>
                  <li>
                    <span className="font-medium text-white">Datos Transaccionales:</span>{' '}
                    Historial de compras, método de pago utilizado y detalles de
                    facturación.{' '}
                    <span className="italic text-gray-500">
                      (Nota: Ravehub NO almacena números completos de tarjetas de crédito;
                      estos son procesados por pasarelas de pago certificadas PCI-DSS).
                    </span>
                  </li>
                  <li>
                    <span className="font-medium text-white">Datos de Navegación:</span>{' '}
                    Dirección IP, tipo de dispositivo, navegador y comportamiento en el sitio
                    (a través de Cookies y Píxeles).
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  2. Finalidad del Tratamiento
                </h2>
                <p className="mb-2">
                  Usted autoriza a Ravehub a utilizar sus datos para las siguientes
                  finalidades:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <span className="font-medium text-white">Gestión del Servicio:</span>{' '}
                    Procesar la compra, emitir el E-Ticket nominativo y controlar el acceso
                    al evento (validación QR).
                  </li>
                  <li>
                    <span className="font-medium text-white">
                      Comunicación Transaccional:
                    </span>{' '}
                    Enviarle sus entradas, notificaciones de cambios de horario, o avisos de
                    pago de cuotas pendientes.
                  </li>
                  <li>
                    <span className="font-medium text-white">Marketing y Publicidad:</span>{' '}
                    Enviarle novedades, preventas exclusivas, ofertas de futuros eventos y
                    promociones de terceros aliados, a través de correo electrónico,
                    mensajería instantánea (WhatsApp Business API, Bots) y SMS.
                  </li>
                  <li>
                    <span className="font-medium text-white">
                      Perfilamiento Comercial:
                    </span>{' '}
                    Analizar sus preferencias musicales y de compra para personalizar la
                    publicidad que ve en nuestras redes y sitio web.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  3. Compartición de Datos con Terceros
                </h2>
                <p className="mb-2">
                  Para la ejecución del servicio, sus datos serán compartidos obligatoriamente
                  con:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <span className="font-medium text-white">
                      Organizadores y Productoras:
                    </span>{' '}
                    El Organizador del evento (ej. Productora del Festival) recibirá su
                    nombre, DNI y correo para gestionar la seguridad, el ingreso y cumplir
                    con normativas legales locales.
                  </li>
                  <li>
                    <span className="font-medium text-white">Autoridades:</span> En caso de
                    requerimiento legal o por razones de seguridad sanitaria/pública.
                  </li>
                  <li>
                    <span className="font-medium text-white">
                      Proveedores de Servicios:
                    </span>{' '}
                    Servidores de hosting (AWS/Vercel), herramientas de mailing y plataformas
                    de atención al cliente.
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  4. Política de Cookies y Rastreo
                </h2>
                <p className="mb-2">
                  Nuestro sitio utiliza cookies propias y de terceros (como Google Analytics,
                  Meta Pixel, TikTok Pixel) para:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>Recordar su sesión y carrito de compras.</li>
                  <li>
                    Mostrarle anuncios relevantes en otras páginas web y redes sociales
                    (Retargeting).
                  </li>
                  <li>Analizar el tráfico del sitio para mejorar nuestra plataforma.</li>
                </ul>
                <p className="text-gray-500 mt-3">
                  Al navegar en Ravehub, usted acepta el uso de estas tecnologías de rastreo.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  5. Seguridad de la Información
                </h2>
                <p>
                  Implementamos medidas de seguridad técnicas (cifrado SSL, firewalls) para
                  proteger sus datos. Sin embargo, ninguna transmisión por Internet es 100%
                  segura. Ravehub no se hace responsable por interceptaciones ilegales o
                  violación de sus sistemas por parte de terceros no autorizados (hackers),
                  siempre que hayamos actuado con la diligencia debida.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  6. Derechos ARCO
                </h2>
                <p>
                  Dependiendo de su país de residencia, usted tiene derecho a acceder,
                  corregir o solicitar la eliminación de sus datos personales de nuestra base
                  de marketing.
                </p>
                <p className="mt-2">
                  Para ejercer estos derechos, debe enviar una solicitud formal a:{' '}
                  <a
                    href="mailto:contacto@ravehublatam.com"
                    className="text-[#FBA905] hover:underline font-medium"
                  >
                    contacto@ravehublatam.com
                  </a>
                </p>
                <p className="text-gray-500 italic text-xs mt-3">
                  Nota: No es posible eliminar datos fiscales o transaccionales de compras
                  activas o pasadas si la ley nos obliga a conservarlos por un periodo
                  determinado.
                </p>
              </section>

              {/* Section 7 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  7. Retención de Datos
                </h2>
                <p>
                  Conservaremos sus datos personales durante el tiempo necesario para cumplir
                  con las finalidades descritas en esta política, o según lo requiera la ley
                  aplicable. Los datos de transacciones se conservan por un mínimo de 5 años
                  para fines fiscales y contables.
                </p>
              </section>

              {/* Section 8 */}
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  8. Cambios en la Política
                </h2>
                <p>
                  Ravehub se reserva el derecho de modificar esta política en cualquier
                  momento para adaptarla a nuevas prácticas comerciales o legislativas. Las
                  modificaciones serán efectivas inmediatamente tras su publicación en el
                  sitio.
                </p>
              </section>

              {/* Contact */}
              <div className="mt-8 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                <h3 className="font-medium text-white mb-2">Contacto</h3>
                <p className="text-gray-300">
                  Para cualquier consulta sobre el tratamiento de sus datos personales, puede
                  contactarnos en:{' '}
                  <a
                    href="mailto:contacto@ravehublatam.com"
                    className="text-[#FBA905] hover:underline"
                  >
                    contacto@ravehublatam.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
