'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { ArrowLeft, Ticket, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ticketTransactionsCollection, eventsCollection } from '@/lib/firebase/collections';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, formatPrice } from '@/lib/utils/currency-converter';
import { getTicketInstallments } from '@/lib/actions';
import { TicketCard } from '@/components/tickets/TicketCard';
import { getValidDate } from '@/lib/utils/date';

export default function TicketsPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const router = useRouter();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installmentsStatus, setInstallmentsStatus] = useState<Record<string, { total: number, paid: number, isFullyPaid: boolean }>>({});

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const transactions = await ticketTransactionsCollection.query([
          { field: 'userId', operator: '==', value: user.id }
        ]);

        const ticketsWithDetails = await Promise.all(transactions.map(async (t) => {
          let eventData: any = {};
          if (t.eventId) {
            try {
              const event = await eventsCollection.get(t.eventId);
              if (event) {
                eventData = {
                  eventName: event.name,
                  eventDate: event.startDate,
                  eventLocation: (event.location?.venue || '') + (event.location?.city || ''),
                  eventId: event.id,
                  eventCurrency: event.currency,
                  mainImageUrl: event.mainImageUrl,
                };
              }
            } catch (err) {
              console.error(`Error fetching event ${t.eventId}`, err);
            }
          }
          return { ...t, ...eventData, ticketItems: t.ticketItems || [] };
        }));

        // Sort by date (newest first)
        // Sort by date (newest first)
        ticketsWithDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Filter out expired offline tickets older than 10 days
        const validTickets = ticketsWithDetails.filter(t => {
          const expiry = getValidDate(t.expiresAt);
          if (t.paymentMethod === 'offline' && t.paymentStatus === 'pending' && expiry) {
            const tenDaysAfterExpiry = new Date(expiry.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days window
            if (new Date() > tenDaysAfterExpiry) {
              return false;
            }
          }
          return true;
        });

        setTickets(validTickets);

        // Load installment status for each ticket
        const statusMap: Record<string, any> = {};
        for (const ticket of validTickets) {
          if (ticket.paymentType === 'installment') {
            const result = await getTicketInstallments(ticket.id);
            if (result.success && result.installments) {
              const total = result.installments.length;
              const paid = result.installments.filter((i: any) => i.status === 'paid' && i.adminApproved).length;
              statusMap[ticket.id] = {
                total,
                paid,
                isFullyPaid: paid === total
              };
            }
          } else {
            // Full payment
            statusMap[ticket.id] = {
              total: 1,
              paid: ticket.paymentStatus === 'approved' ? 1 : 0,
              isFullyPaid: ticket.paymentStatus === 'approved'
            };
          }
        }
        setInstallmentsStatus(statusMap);

      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(0,203,255,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(251,169,5,0.1), transparent 40%)' }}
      />

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Mis Entradas</h1>
            <p className="text-white/60 text-sm mt-1">Gestiona tus eventos, pagos y descargas.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tienes entradas aún</h2>
            <p className="text-white/40 mb-8">Explora los eventos disponibles y vive la experiencia.</p>
            <Link href="/eventos">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                Explorar Eventos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {tickets.map((ticket) => {
              const status = installmentsStatus[ticket.id];
              const isFullyPaid = status?.isFullyPaid;

              return (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  status={status}
                  isFullyPaid={isFullyPaid}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}