import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAccept: () => void;
}

export function PrivacyModal({ isOpen, onOpenChange, onAccept }: PrivacyModalProps) {
    const handleAccept = () => {
        onAccept();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] bg-[#0A0A0A] border-zinc-800/50 text-zinc-300 p-0 overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 pb-2 shrink-0 border-b border-zinc-900/50">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-medium tracking-tight text-white/90">
                            Política de Privacidad y Protección de Datos
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6 pt-4">
                    <div className="space-y-8 text-sm leading-relaxed text-zinc-400 pr-4 font-light">
                        {/* Header Section */}
                        <div className="space-y-4">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider">Última actualización: Diciembre 2025</p>
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                <p className="text-zinc-300">
                                    En <span className="font-medium text-zinc-200">Ravehub Latam</span> ("Nosotros", "La Plataforma"), valoramos su privacidad tanto como su experiencia en el evento. Esta Política describe cómo recopilamos, utilizamos y compartimos su información personal al utilizar nuestro sitio web <code>ravehublatam.com</code>.
                                </p>
                                <p className="text-zinc-300 mt-2">
                                    Al comprar una entrada o registrarse en nuestra plataforma, usted <span className="font-medium text-white">autoriza expresamente</span> el tratamiento de sus datos según los términos aquí descritos.
                                </p>
                            </div>
                        </div>

                        {/* Section 1 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">1. Información que Recopilamos</h4>
                            <p>Para gestionar la venta de entradas y garantizar la seguridad de los eventos, recopilamos los siguientes datos:</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                <li><span className="text-zinc-300">Datos de Identificación:</span> Nombre completo, número de documento de identidad (DNI, RUT, Pasaporte), fecha de nacimiento y nacionalidad.</li>
                                <li><span className="text-zinc-300">Datos de Contacto:</span> Correo electrónico, número de teléfono móvil (para envío de tickets y notificaciones vía WhatsApp/SMS) y domicilio.</li>
                                <li><span className="text-zinc-300">Datos Transaccionales:</span> Historial de compras, método de pago utilizado y detalles de facturación. <span className="italic text-zinc-500">(Nota: Ravehub NO almacena números completos de tarjetas de crédito; estos son procesados por pasarelas de pago certificadas PCI-DSS).</span></li>
                                <li><span className="text-zinc-300">Datos de Navegación:</span> Dirección IP, tipo de dispositivo, navegador y comportamiento en el sitio (a través de Cookies y Píxeles).</li>
                            </ul>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">2. Finalidad del Tratamiento (¿Para qué usamos sus datos?)</h4>
                            <p>Usted autoriza a Ravehub a utilizar sus datos para las siguientes finalidades:</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                <li><span className="text-zinc-300">Gestión del Servicio:</span> Procesar la compra, emitir el E-Ticket nominativo y controlar el acceso al evento (validación QR).</li>
                                <li><span className="text-zinc-300">Comunicación Transaccional:</span> Enviarle sus entradas, notificaciones de cambios de horario, o avisos de pago de cuotas pendientes.</li>
                                <li><span className="text-zinc-300">Marketing y Publicidad:</span> Enviarle novedades, preventas exclusivas, ofertas de futuros eventos y promociones de terceros aliados, a través de correo electrónico, mensajería instantánea (WhatsApp Business API, Bots) y SMS.</li>
                                <li><span className="text-zinc-300">Perfilamiento Comercial:</span> Analizar sus preferencias musicales y de compra para personalizar la publicidad que ve en nuestras redes y sitio web.</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">3. Compartición de Datos con Terceros</h4>
                            <p>Para la ejecución del servicio, sus datos serán compartidos obligatoriamente con:</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                <li><span className="text-zinc-300">Organizadores y Productoras:</span> El Organizador del evento (ej. Productora del Festival) recibirá su nombre, DNI y correo para gestionar la seguridad, el ingreso y cumplir con normativas legales locales.</li>
                                <li><span className="text-zinc-300">Autoridades:</span> En caso de requerimiento legal o por razones de seguridad sanitaria/pública.</li>
                                <li><span className="text-zinc-300">Proveedores de Servicios:</span> Servidores de hosting (AWS/Vercel), herramientas de mailing y plataformas de atención al cliente.</li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">4. Política de Cookies y Rastreo</h4>
                            <p>Nuestro sitio utiliza cookies propias y de terceros (como Google Analytics, Meta Pixel, TikTok Pixel) para:</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                <li>Recordar su sesión y carrito de compras.</li>
                                <li>Mostrarle anuncios relevantes en otras páginas web y redes sociales (Retargeting).</li>
                                <li>Analizar el tráfico del sitio para mejorar nuestra plataforma.</li>
                            </ul>
                            <p className="text-zinc-500 mt-1">Al navegar en Ravehub, usted acepta el uso de estas tecnologías de rastreo.</p>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">5. Seguridad de la Información</h4>
                            <p>Implementamos medidas de seguridad técnicas (cifrado SSL, firewalls) para proteger sus datos. Sin embargo, ninguna transmisión por Internet es 100% segura. Ravehub no se hace responsable por interceptaciones ilegales o violación de sus sistemas por parte de terceros no autorizados (hackers), siempre que hayamos actuado con la diligencia debida.</p>
                        </section>

                        {/* Section 6 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">6. Derechos ARCO</h4>
                            <p>Dependiendo de su país de residencia, usted tiene derecho a acceder, corregir o solicitar la eliminación de sus datos personales de nuestra base de marketing.</p>
                            <p>Para ejercer estos derechos, debe enviar una solicitud formal a: <a href="mailto:contacto@ravehublatam.com" className="text-orange-400 hover:underline">contacto@ravehublatam.com</a>.</p>
                            <p className="text-zinc-500 italic text-xs mt-1">Nota: No es posible eliminar datos fiscales o transaccionales de compras activas o pasadas si la ley nos obliga a conservarlos por un periodo determinado.</p>
                        </section>

                        {/* Section 7 */}
                        <section className="space-y-2">
                            <h4 className="font-medium text-zinc-200 border-b border-zinc-800 pb-2">7. Cambios en la Política</h4>
                            <p>Ravehub se reserva el derecho de modificar esta política en cualquier momento para adaptarla a nuevas prácticas comerciales o legislativas. Las modificaciones serán efectivas inmediatamente tras su publicación en el sitio.</p>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-6 pt-4 border-t border-zinc-900/50 bg-[#0A0A0A] shrink-0 sticky bottom-0 z-20">
                    <button
                        onClick={handleAccept}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg transform hover:scale-[1.01] active:scale-[0.99] tracking-wide"
                    >
                        LEÍDO Y ACEPTO LA POLÍTICA
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 mt-2 uppercase tracking-wide">
                        Al hacer clic en aceptar, confirmas haber leído nuestra política de datos.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
