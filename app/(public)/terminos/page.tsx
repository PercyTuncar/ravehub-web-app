import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
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
            Términos y Condiciones de Venta, Uso y Sistema de Cuotas
          </h1>
          <p className="text-gray-400">
            Vigencia: A partir del 01 de Enero de 2025
          </p>
        </div>

        {/* Content Card */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="p-8">
            <div className="space-y-8 text-sm leading-relaxed text-gray-400">
              {/* Header Section */}
              <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                <p className="text-gray-300">
                  <span className="font-medium text-white">Aviso Importante:</span> Al
                  hacer clic en "Aceptar" o al comprar cualquier producto en
                  ravehublatam.com, usted acepta vincularse jurídicamente por estas
                  condiciones, las cuales incluyen de manera integral las políticas de
                  reembolso, mora y retracto detalladas a continuación.
                </p>
              </div>

              {/* Title I */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  Título I: Aspectos Generales y Mandato
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 1: Intermediación y Mandato
                    </h3>
                    <p className="mb-2">
                      Ravehub Latam ("Ravehub") opera esta plataforma en calidad de
                      mandatario mercantil con representación de los Organizadores,
                      Productoras y Promotores de eventos ("El Organizador").
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">1.1.</span> Ravehub no es el
                        organizador, productor, ni responsable de la ejecución del evento.
                        Su rol se limita estrictamente a la comercialización y distribución
                        de tickets y recaudación de fondos por cuenta y orden del
                        Organizador.
                      </li>
                      <li>
                        <span className="font-medium">1.2.</span> Cualquier reclamo
                        relacionado con la seguridad, producción, visibilidad, acústica, o
                        suspensión del evento es responsabilidad exclusiva del Organizador,
                        cuyos datos legales se informan en el proceso de compra.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 2: Exclusión del Derecho a Retracto
                    </h3>
                    <p className="mb-2">
                      De conformidad con lo dispuesto en el Artículo 3 bis letra b) de la
                      Ley N° 19.496 (y legislaciones homologables en LatAm sobre comercio
                      electrónico de espectáculos), se declara que las compras de tickets
                      realizadas en Ravehub no están sujetas al derecho de retracto.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">2.1.</span> El Usuario no podrá
                        anular la compra, desistir del contrato ni solicitar devolución de
                        dinero por arrepentimiento una vez confirmado el pago, sea este
                        total o parcial (cuotas).
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Title II */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  Título II: Sistema de Venta en Cuotas ("Abono Ravehub")
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 3: Naturaleza de la Venta en Cuotas
                    </h3>
                    <p className="mb-2">
                      La modalidad de pago fraccionado ofrecida por Ravehub no constituye
                      un crédito de consumo bancario, sino una "Reserva de Cupo
                      Condicional".
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">3.1. Reserva de Dominio:</span> El
                        Ticket (derecho de acceso) permanece en propiedad del
                        Organizador/Ravehub hasta el pago íntegro (100%) del precio
                        acordado. No se emitirán códigos QR ni e-tickets válidos hasta la
                        cancelación total de la deuda.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 4: Pagos y Plazos
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">4.1. Cuota Inicial (Pie):</span> El
                        Usuario deberá pagar una cuota inicial no reembolsable que incluye
                        el 100% del Cargo por Servicio más un porcentaje del valor del
                        ticket.
                      </li>
                      <li>
                        <span className="font-medium">4.2. Calendario de Pagos:</span> Es
                        obligación esencial del Usuario cumplir con las fechas de pago
                        estipuladas en su panel de usuario. El seguimiento es
                        responsabilidad exclusiva del comprador.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 5: Tarifas Regulares, Cuotas y Beneficios Externos
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-300">
                      <li>
                        <span className="font-medium">
                          5.1. Tarifa regular y comisión de ticketera:
                        </span>{' '}
                        Ravehub comercializa los tickets tomando como referencia la tarifa
                        regular informada para la fase de venta correspondiente. En algunos
                        eventos, Ravehub puede ofrecer entradas a esa misma tarifa regular
                        sin añadir comisión de ticketera; por esta razón, el precio final
                        publicado en Ravehub puede ser inferior al precio ofrecido en otros
                        canales que sí incorporen dicha comisión.
                      </li>
                      <li>
                        <span className="font-medium">
                          5.2. Pago en cuotas sin intereses:
                        </span>{' '}
                        El pago en cuotas ofrecido por Ravehub no incorpora intereses
                        financieros sobre el precio regular. Sin perjuicio de lo anterior,
                        los pagos realizados fuera de plazo pueden estar sujetos a las
                        medidas, recargos o penalidades por mora indicados en estos
                        términos y condiciones.
                      </li>
                      <li>
                        <span className="font-medium">5.3. Descuentos de terceros:</span>{' '}
                        Ravehub opera de forma independiente de bancos, emisores de
                        tarjetas y otras entidades. Por ello, los descuentos, promociones,
                        cuotas sin interés o beneficios que dichas entidades ofrezcan no se
                        aplican automáticamente a las compras realizadas en Ravehub, salvo
                        que se anuncien expresamente en la plataforma.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 6: Mora, Actualización de Precio y Abandono (Cláusula
                      Especial)
                    </h3>
                    <p className="mb-3">
                      Para proteger la integridad del inventario de tickets y compensar el
                      bloqueo de stock, se establecen las siguientes consecuencias
                      escalonadas en caso de impago:
                    </p>

                    <div className="space-y-4 pl-4 border-l-2 border-white/10">
                      <div>
                        <p className="font-medium text-white mb-1">
                          6.1. Mora y Pérdida del Precio Congelado (Regla de los 3 Días)
                        </p>
                        <p className="text-gray-400">
                          Si el Usuario no realiza el pago de una cuota en la fecha
                          pactada, dispondrá de un plazo de gracia de tres (3) días
                          corridos para regularizar su situación manteniendo el precio
                          original. Si vencido este plazo el pago no se ha acreditado, el
                          Usuario perderá el beneficio del precio promocional.
                        </p>
                        <p className="text-gray-500 mt-1 italic">
                          Consecuencia: El saldo pendiente se recalculará al valor de la
                          fase de venta vigente.
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-white mb-1">
                          6.2. Plazo Final de Regularización (Regla de los 10 Días)
                        </p>
                        <p className="text-gray-400">
                          Una vez actualizado el precio, el Usuario dispondrá de un plazo
                          final de diez (10) días corridos para abonar el nuevo saldo
                          ajustado.
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-white mb-1">
                          6.3. Presunción de Desistimiento y Daño Patrimonial
                        </p>
                        <p className="text-gray-400">
                          Si transcurridos los diez (10) días el Usuario no ha completado
                          el pago, se asumirá que desiste de la compra. El Usuario reconoce
                          que su incumplimiento genera un daño patrimonial directo a
                          Ravehub (bloqueo de stock, gastos administrativos y lucro
                          cesante).
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-white mb-1">
                          6.4. Ejecución de la Penalidad
                        </p>
                        <p className="text-gray-400">
                          En virtud del daño reconocido, Ravehub procederá a cancelar la
                          reserva y retendrá los montos abonados previamente en concepto de
                          indemnización. No habrá derecho a reembolso.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Title III */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                  Título III: Política de Cambios, Upgrades y Cancelaciones
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 7: Regla de "Solo Upgrades"
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">7.1. No Cambios:</span> No se
                        permiten cambios de fecha, lugar o asiento a solicitud del Usuario,
                        salvo lo dispuesto en este artículo.
                      </li>
                      <li>
                        <span className="font-medium">7.2. Upgrades (Mejora de Ticket):</span>{' '}
                        Ravehub fomenta la mejora de la experiencia. El Usuario podrá
                        solicitar cambiar su ticket a una categoría superior (ej. de
                        General a VIP) sujeto a disponibilidad, pagando la diferencia de
                        precio y el cargo administrativo correspondiente.
                      </li>
                      <li>
                        <span className="font-medium">7.3. Prohibición de Downgrades:</span>{' '}
                        No se aceptarán solicitudes de cambio a localidades de menor valor.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 8: Modificaciones Sustanciales y Lineup
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">8.1. Concepto de Festival:</span> En
                        eventos masivos, el Usuario adquiere una experiencia integral. La
                        grilla de artistas es referencial y dinámica.
                      </li>
                      <li>
                        <span className="font-medium">8.2.</span> La cancelación, retraso o
                        modificación de artistas no faculta al Usuario para solicitar la
                        devolución, salvo que la cancelación afecte a más del 60% de la
                        programación total.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 9: Cancelación y Fuerza Mayor
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>
                        <span className="font-medium">
                          9.1. Suspensión por Fuerza Mayor:
                        </span>{' '}
                        En caso de que el evento no pueda realizarse por fuerza mayor, será
                        reprogramado.
                      </li>
                      <li>
                        <span className="font-medium">9.2. Validez del Ticket:</span> El
                        Ticket será válido para la nueva fecha. Si el Usuario no puede
                        asistir, tendrá un plazo de 7 días desde el anuncio para solicitar
                        devolución.
                      </li>
                      <li>
                        <span className="font-medium">9.3. Devolución de Dinero:</span> En
                        caso de cancelación definitiva, se devolverá el Valor Nominal del
                        Ticket.
                      </li>
                      <li>
                        <span className="font-medium">
                          9.4. Protección del Cargo por Servicio:
                        </span>{' '}
                        El Cargo por Servicio no será reembolsado en caso de cancelación,
                        ya que remunera el servicio de intermediación tecnológica ya
                        ejecutado.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">
                      Artículo 10: Limitación de Responsabilidad
                    </h3>
                    <p>
                      Ravehub no será responsable por daños indirectos, lucro cesante o
                      gastos conexos incurridos por el Usuario derivados de la cancelación
                      o modificación del evento. La responsabilidad máxima se limita al
                      valor nominal del ticket pagado.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <div className="mt-8 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                <p className="text-gray-300">
                  Para cualquier consulta sobre estos términos y condiciones, puede
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
