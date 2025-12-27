import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAccept: () => void;
}

export function TermsModal({ isOpen, onOpenChange, onAccept }: TermsModalProps) {
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
                            Términos y Condiciones de Venta, Uso y Sistema de Cuotas
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6 pt-4">
                    <div className="space-y-8 text-sm leading-relaxed text-zinc-400 pr-4 font-light">
                        {/* Header Section */}
                        <div className="space-y-4">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider">Vigencia: A partir del 01 de Enero de 2025</p>
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                <p className="text-zinc-300">
                                    <span className="font-medium text-zinc-200">Aviso Importante:</span> Al hacer clic en "Aceptar" o al comprar cualquier producto en ravehublatam.com, usted acepta vincularse jurídicamente por estas condiciones, las cuales incluyen de manera integral las políticas de reembolso, mora y retracto detalladas a continuación.
                                </p>
                            </div>
                        </div>

                        {/* Title I */}
                        <section className="space-y-4">
                            <h3 className="text-base font-medium text-white/80 border-b border-zinc-800 pb-2">Título I: Aspectos Generales y Mandato</h3>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 1: Intermediación y Mandato</h4>
                                <p>Ravehub Latam ("Ravehub") opera esta plataforma en calidad de mandatario mercantil con representación de los Organizadores, Productoras y Promotores de eventos ("El Organizador").</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">1.1.</span> Ravehub no es el organizador, productor, ni responsable de la ejecución del evento. Su rol se limita estrictamente a la comercialización y distribución de tickets y recaudación de fondos por cuenta y orden del Organizador.</li>
                                    <li><span className="text-zinc-300">1.2.</span> Cualquier reclamo relacionado con la seguridad, producción, visibilidad, acústica, o suspensión del evento es responsabilidad exclusiva del Organizador, cuyos datos legales se informan en el proceso de compra.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 2: Exclusión del Derecho a Retracto</h4>
                                <p>De conformidad con lo dispuesto en el Artículo 3 bis letra b) de la Ley N° 19.496 (y legislaciones homologables en LatAm sobre comercio electrónico de espectáculos), se declara que las compras de tickets realizadas en Ravehub no están sujetas al derecho de retracto.</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">2.1.</span> El Usuario no podrá anular la compra, desistir del contrato ni solicitar devolución de dinero por arrepentimiento una vez confirmado el pago, sea este total o parcial (cuotas).</li>
                                </ul>
                            </div>
                        </section>

                        {/* Title II */}
                        <section className="space-y-4">
                            <h3 className="text-base font-medium text-white/80 border-b border-zinc-800 pb-2">Título II: Sistema de Venta en Cuotas ("Abono Ravehub")</h3>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 3: Naturaleza de la Venta en Cuotas</h4>
                                <p>La modalidad de pago fraccionado ofrecida por Ravehub no constituye un crédito de consumo bancario, sino una "Reserva de Cupo Condicional".</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">3.1. Reserva de Dominio:</span> El Ticket (derecho de acceso) permanece en propiedad del Organizador/Ravehub hasta el pago íntegro (100%) del precio acordado. No se emitirán códigos QR ni e-tickets válidos hasta la cancelación total de la deuda.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 4: Pagos y Plazos</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">4.1. Cuota Inicial (Pie):</span> El Usuario deberá pagar una cuota inicial no reembolsable que incluye el 100% del Cargo por Servicio más un porcentaje del valor del ticket.</li>
                                    <li><span className="text-zinc-300">4.2. Calendario de Pagos:</span> Es obligación esencial del Usuario cumplir con las fechas de pago estipuladas en su panel de usuario. El seguimiento es responsabilidad exclusiva del comprador.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 5: Mora, Actualización de Precio y Abandono (Cláusula Especial)</h4>
                                <p>Para proteger la integridad del inventario de tickets y compensar el bloqueo de stock, se establecen las siguientes consecuencias escalonadas en caso de impago:</p>

                                <div className="mt-2 space-y-4 pl-4 border-l border-zinc-800">
                                    <div>
                                        <p className="text-zinc-300 mb-1">5.1. Mora y Pérdida del Precio Congelado (Regla de los 3 Días)</p>
                                        <p className="text-zinc-500">Si el Usuario no realiza el pago de una cuota en la fecha pactada, dispondrá de un plazo de gracia de tres (3) días corridos para regularizar su situación manteniendo el precio original. Si vencido este plazo el pago no se ha acreditado, el Usuario perderá el beneficio del precio promocional.</p>
                                        <p className="text-zinc-500 mt-1 italic">Consecuencia: El saldo pendiente se recalculará al valor de la fase de venta vigente.</p>
                                    </div>

                                    <div>
                                        <p className="text-zinc-300 mb-1">5.2. Plazo Final de Regularización (Regla de los 10 Días)</p>
                                        <p className="text-zinc-500">Una vez actualizado el precio, el Usuario dispondrá de un plazo final de diez (10) días corridos para abonar el nuevo saldo ajustado.</p>
                                    </div>

                                    <div>
                                        <p className="text-zinc-300 mb-1">5.3. Presunción de Desistimiento y Daño Patrimonial</p>
                                        <p className="text-zinc-500">Si transcurridos los diez (10) días el Usuario no ha completado el pago, se asumirá que desiste de la compra. El Usuario reconoce que su incumplimiento genera un daño patrimonial directo a Ravehub (bloqueo de stock, gastos administrativos y lucro cesante).</p>
                                    </div>

                                    <div>
                                        <p className="text-zinc-300 mb-1">5.4. Ejecución de la Penalidad</p>
                                        <p className="text-zinc-500">En virtud del daño reconocido, Ravehub procederá a cancelar la reserva y retendrá los montos abonados previamente en concepto de indemnización. No habrá derecho a reembolso.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Title III */}
                        <section className="space-y-4">
                            <h3 className="text-base font-medium text-white/80 border-b border-zinc-800 pb-2">Título III: Política de Cambios, Upgrades y Cancelaciones</h3>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 6: Regla de "Solo Upgrades"</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">6.1. No Cambios:</span> No se permiten cambios de fecha, lugar o asiento a solicitud del Usuario, salvo lo dispuesto en este artículo.</li>
                                    <li><span className="text-zinc-300">6.2. Upgrades (Mejora de Ticket):</span> Ravehub fomenta la mejora de la experiencia. El Usuario podrá solicitar cambiar su ticket a una categoría superior (ej. de General a VIP) sujeto a disponibilidad, pagando la diferencia de precio y el cargo administrativo correspondiente.</li>
                                    <li><span className="text-zinc-300">6.3. Prohibición de Downgrades:</span> No se aceptarán solicitudes de cambio a localidades de menor valor.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 7: Modificaciones Sustanciales y Lineup</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">7.1. Concepto de Festival:</span> En eventos masivos, el Usuario adquiere una experiencia integral. La grilla de artistas es referencial y dinámica.</li>
                                    <li><span className="text-zinc-300">7.2.</span> La cancelación, retraso o modificación de artistas no faculta al Usuario para solicitar la devolución, salvo que la cancelación afecte a más del 60% de la programación total.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 8: Cancelación y Fuerza Mayor</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-600">
                                    <li><span className="text-zinc-300">8.1. Suspensión por Fuerza Mayor:</span> En caso de que el evento no pueda realizarse por fuerza mayor, será reprogramado.</li>
                                    <li><span className="text-zinc-300">8.2. Validez del Ticket:</span> El Ticket será válido para la nueva fecha. Si el Usuario no puede asistir, tendrá un plazo de 7 días desde el anuncio para solicitar devolución.</li>
                                    <li><span className="text-zinc-300">8.3. Devolución de Dinero:</span> En caso de cancelación definitiva, se devolverá el Valor Nominal del Ticket.</li>
                                    <li><span className="text-zinc-300">8.4. Protección del Cargo por Servicio:</span> El Cargo por Servicio no será reembolsado en caso de cancelación, ya que remunera el servicio de intermediación tecnológica ya ejecutado.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-zinc-200">Artículo 9: Limitación de Responsabilidad</h4>
                                <p>Ravehub no será responsable por daños indirectos, lucro cesante o gastos conexos incurridos por el Usuario derivados de la cancelación o modificación del evento. La responsabilidad máxima se limita al valor nominal del ticket pagado.</p>
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-6 pt-4 border-t border-zinc-900/50 bg-[#0A0A0A] shrink-0 sticky bottom-0 z-20">
                    <button
                        onClick={handleAccept}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:scale-[1.01] active:scale-[0.99] tracking-wide"
                    >
                        ACEPTAR TÉRMINOS Y CONDICIONES
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 mt-2 uppercase tracking-wide">
                        Al hacer clic en aceptar, confirmas haber leído y entendido las condiciones.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
