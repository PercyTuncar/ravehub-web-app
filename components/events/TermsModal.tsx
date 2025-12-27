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
}

export function TermsModal({ isOpen, onOpenChange }: TermsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col">
                <div className="p-6 pb-2 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-orange-500">
                            TÉRMINOS Y CONDICIONES DE VENTA, USO Y SISTEMA DE CUOTAS
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-6 text-sm text-zinc-300 pr-4">
                        <div>
                            <p className="font-bold text-white mb-2">VIGENCIA: A partir del 01 de Enero de 2025.</p>
                            <p className="italic bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 text-orange-200">
                                <span className="font-bold">LEA ATENTAMENTE ESTOS TÉRMINOS.</span> AL HACER CLIC EN "ACEPTAR" O AL COMPRAR CUALQUIER PRODUCTO EN RAVEHUBLATAM.COM, USTED ACEPTA VINCULARSE JURÍDICAMENTE POR ESTAS CONDICIONES, LAS CUALES INCLUYEN <span className="font-bold">CLÁUSULAS DE NO REEMBOLSO, AUMENTO DE PRECIO POR MORA, PENALIDADES POR IMPAGO Y EXCLUSIÓN DEL DERECHO A RETRACTO.</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">TÍTULO I: ASPECTOS GENERALES Y MANDATO</h3>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 1: INTERMEDIACIÓN Y MANDATO</h4>
                                <p><span className="font-bold text-white">Ravehub Latam</span> ("Ravehub") opera esta plataforma en calidad de <span className="font-bold">mandatario mercantil con representación</span> de los Organizadores, Productoras y Promotores de eventos ("El Organizador").</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">1.1.</span> Ravehub no es el organizador, productor, ni responsable de la ejecución del evento. Su rol se limita estrictamente a la comercialización y distribución de tickets y recaudación de fondos por cuenta y orden del Organizador.</li>
                                    <li><span className="font-bold text-white">1.2.</span> Cualquier reclamo relacionado con la seguridad, producción, visibilidad, acústica, o suspensión del evento es responsabilidad exclusiva del Organizador, cuyos datos legales se informan en el proceso de compra.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 2: EXCLUSIÓN DEL DERECHO A RETRACTO</h4>
                                <p>De conformidad con lo dispuesto en el <span className="font-bold">Artículo 3 bis letra b) de la Ley N° 19.496</span> (y legislaciones homologables en LatAm sobre comercio electrónico de espectáculos), se declara expresamente que las compras de tickets realizadas en Ravehub <span className="font-bold text-red-400">NO ESTÁN SUJETAS AL DERECHO DE RETRACTO</span>.</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">2.1.</span> El Usuario no podrá anular la compra, desistir del contrato ni solicitar devolución de dinero por arrepentimiento una vez confirmado el pago, sea este total o parcial (cuotas).</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">TÍTULO II: SISTEMA DE VENTA EN CUOTAS ("ABONO RAVEHUB")</h3>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 3: NATURALEZA DE LA VENTA EN CUOTAS</h4>
                                <p>La modalidad de pago fraccionado ofrecida por Ravehub no constituye un crédito de consumo bancario, sino una <span className="font-bold">"Reserva de Cupo Condicional"</span>.</p>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">3.1. Reserva de Dominio:</span> El Ticket (derecho de acceso) permanece en propiedad del Organizador/Ravehub hasta el pago íntegro (100%) del precio acordado. No se emitirán códigos QR ni e-tickets válidos hasta la cancelación total de la deuda.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 4: PAGOS Y PLAZOS</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">4.1. Cuota Inicial (Pie):</span> El Usuario deberá pagar una cuota inicial no reembolsable que incluye el 100% del Cargo por Servicio más un porcentaje del valor del ticket.</li>
                                    <li><span className="font-bold text-white">4.2. Calendario de Pagos:</span> Es obligación esencial del Usuario cumplir con las fechas de pago estipuladas en su panel de usuario. Ravehub no está obligado a enviar recordatorios de cobro; el seguimiento es responsabilidad exclusiva del comprador.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 5: MORA, ACTUALIZACIÓN DE PRECIO Y ABANDONO (CLÁUSULA ESPECIAL)</h4>
                                <p>Para proteger la integridad del inventario de tickets y compensar el bloqueo de stock, se establecen las siguientes consecuencias escalonadas en caso de impago:</p>

                                <div className="bg-zinc-900/50 p-4 rounded-lg space-y-3 border border-white/5">
                                    <p><span className="font-bold text-white">5.1. Mora y Pérdida del Precio Congelado (Regla de los 3 Días):</span></p>
                                    <p>Si el Usuario no realiza el pago de una cuota en la fecha pactada, dispondrá de un <span className="font-bold">plazo de gracia improrrogable de tres (3) días corridos</span> para regularizar su situación manteniendo el precio original.</p>
                                    <p>Si vencido este plazo de 3 días el pago no se ha acreditado, <span className="font-bold text-red-400">el Usuario perderá automáticamente el beneficio del precio promocional</span> (Early Bird, Tier 1, Preventa, etc.).</p>
                                    <p className="text-zinc-400 text-xs border-l-2 border-orange-500 pl-3">
                                        <span className="font-bold text-orange-400">Consecuencia:</span> El saldo pendiente de la entrada se recalculará automáticamente al <span className="font-bold">valor de la FASE DE VENTA VIGENTE</span> (Precio Actual) al momento del recálculo. El Usuario acepta expresamente esta actualización de precio como condición para mantener su reserva.
                                    </p>
                                </div>

                                <div className="pl-4 border-l border-zinc-800">
                                    <p><span className="font-bold text-white">5.2. Plazo Final de Regularización (Regla de los 10 Días):</span></p>
                                    <p>Una vez actualizado el precio a la fase vigente, el Usuario dispondrá de un plazo final y perentorio de <span className="font-bold">diez (10) días corridos</span> para abonar el nuevo saldo ajustado.</p>
                                </div>

                                <div className="bg-red-500/5 p-4 rounded-lg space-y-2 border border-red-500/10">
                                    <p><span className="font-bold text-white">5.3. Presunción de Desistimiento y Daño Patrimonial:</span></p>
                                    <p>Si transcurridos los diez (10) días mencionados en el punto 5.2 el Usuario no ha completado el pago del nuevo monto, se asumirá de pleno derecho que el Usuario <span className="font-bold text-red-400">desiste de la compra</span>.</p>

                                    <p><span className="font-bold text-white">Reconocimiento de Daño:</span> El Usuario reconoce que su incumplimiento genera un <span className="font-bold">daño patrimonial directo a Ravehub</span>, consistente en:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-xs marker:text-red-500/50">
                                        <li>(i) <span className="font-bold">Bloqueo de Stock:</span> Haber retirado una entrada del mercado durante la fase de alta demanda, impidiendo su venta a otro cliente.</li>
                                        <li>(ii) <span className="font-bold">Gastos Administrativos:</span> Costos de gestión de la reserva y procesamiento de pagos fallidos.</li>
                                        <li>(iii) <span className="font-bold">Lucro Cesante:</span> La pérdida de oportunidad de venta en la fase original.</li>
                                    </ul>
                                </div>

                                <p><span className="font-bold text-white">5.4. Ejecución de la Penalidad (No Reembolso):</span></p>
                                <p>En virtud del daño reconocido en la cláusula 5.3, Ravehub procederá a cancelar la reserva y <span className="font-bold">retendrá el 100% de los montos abonados previamente</span> (incluyendo Cuota Inicial y cuotas parciales) en concepto de indemnización compensatoria por los perjuicios causados. <span className="font-bold text-red-400">No habrá derecho a reembolso ni restitución en créditos.</span></p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">TÍTULO III: POLÍTICA DE CAMBIOS, UPGRADES Y CANCELACIONES</h3>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 6: REGLA DE "SOLO UPGRADES"</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">6.1. No Cambios:</span> No se permiten cambios de fecha, lugar o asiento a solicitud del Usuario, salvo lo dispuesto en este artículo.</li>
                                    <li><span className="font-bold text-white">6.2. Upgrades (Mejora de Ticket):</span> Ravehub fomenta la mejora de la experiencia. El Usuario podrá solicitar cambiar su ticket a una categoría superior (ej. de General a VIP) sujeto a disponibilidad. Para ello deberá:
                                        <ul className="list-[circle] pl-5 mt-1 space-y-1 text-zinc-400">
                                            <li>a) Pagar la diferencia de precio vigente al momento de la solicitud.</li>
                                            <li>b) Abonar un Cargo Administrativo por Re-emisión.</li>
                                        </ul>
                                    </li>
                                    <li><span className="font-bold text-white">6.3. Prohibición de Downgrades:</span> No se aceptarán solicitudes de cambio a localidades de menor valor que impliquen devoluciones parciales de dinero.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 7: MODIFICACIONES SUSTANCIALES Y LINEUP</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">7.1. Concepto de Festival:</span> En eventos tipo "Festival" o fiestas electrónicas masivas, el Usuario adquiere una <span className="font-bold">experiencia integral</span>. La grilla de artistas (Lineup) es referencial y dinámica.</li>
                                    <li><span className="font-bold text-white">7.2.</span> La cancelación, retraso, modificación de horarios o reemplazo de artistas (DJs) no faculta al Usuario para solicitar la devolución del ticket, salvo que la cancelación afecte a más del 60% de la programación total anunciada o desnaturalice completamente el evento.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 8: CANCELACIÓN Y FUERZA MAYOR</h4>
                                <ul className="list-disc pl-5 space-y-1 marker:text-zinc-500">
                                    <li><span className="font-bold text-white">8.1. Suspensión por Fuerza Mayor:</span> En caso de que el evento no pueda realizarse por actos de autoridad, pandemias, desastres naturales o clima adverso que ponga en riesgo la seguridad, el evento será reprogramado.</li>
                                    <li><span className="font-bold text-white">8.2. Validez del Ticket:</span> El Ticket será automáticamente válido para la nueva fecha. Si el Usuario no puede asistir, tendrá un plazo fatal de <span className="font-bold">7 días corridos</span> desde el anuncio para solicitar devolución. Transcurrido dicho plazo, se entenderá aceptada la reprogramación sin derecho a reembolso posterior.</li>
                                    <li><span className="font-bold text-white">8.3. Devolución de Dinero:</span> En caso de cancelación definitiva y total del evento, Ravehub gestionará la devolución del <span className="font-bold">Valor Nominal del Ticket</span>.</li>
                                    <li><span className="font-bold text-white">8.4. Protección del Cargo por Servicio:</span> El Usuario acepta que el Cargo por Servicio (Service Fee) remunera el servicio de intermediación tecnológica y reserva digital prestado por Ravehub, el cual se entiende <span className="font-bold">completamente ejecutado</span> al momento de confirmar la compra. Por tanto, <span className="font-bold text-red-500">el Cargo por Servicio no será reembolsado</span> en caso de cancelación del evento, salvo disposición legal imperativa en contrario.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-zinc-100">ARTÍCULO 9: LIMITACIÓN DE RESPONSABILIDAD</h4>
                                <p>Ravehub no será responsable en ningún caso por daños indirectos, lucro cesante, daño moral, o gastos conexos incurridos por el Usuario (pasajes aéreos, reservas de hotel, transporte) derivados de la cancelación, reprogramación o modificación del evento. La responsabilidad máxima de Ravehub se limita estrictamente al valor nominal del ticket pagado.</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
