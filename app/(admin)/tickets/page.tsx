'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Upload, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ticketTransactionsCollection, eventsCollection, usersCollection } from '@/lib/firebase/collections';
import { TicketTransaction, Event, User } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TicketsAdminPage() {
  const [transactions, setTransactions] = useState<TicketTransaction[]>([]);
  const [events, setEvents] = useState<Record<string, Event>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<TicketTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all transactions
      const allTransactions = await ticketTransactionsCollection.getAll();
      setTransactions(allTransactions as TicketTransaction[]);

      // Load events and users for display
      const eventPromises = allTransactions.map(t => eventsCollection.get(t.eventId));
      const userPromises = allTransactions.map(t => usersCollection.get(t.userId));

      const [eventsData, usersData] = await Promise.all([
        Promise.all(eventPromises),
        Promise.all(userPromises)
      ]);

      const eventsMap: Record<string, Event> = {};
      const usersMap: Record<string, User> = {};

      eventsData.forEach((event, index) => {
        if (event) eventsMap[allTransactions[index].eventId] = event as Event;
      });

      usersData.forEach((user, index) => {
        if (user) usersMap[allTransactions[index].userId] = user as User;
      });

      setEvents(eventsMap);
      setUsers(usersMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const event = events[transaction.eventId];
    const user = users[transaction.userId];

    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.paymentStatus === statusFilter;
    const matchesDelivery = deliveryFilter === 'all' || transaction.ticketDeliveryMode === deliveryFilter;

    return matchesSearch && matchesStatus && matchesDelivery;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'scheduled': return 'Programado';
      case 'available': return 'Disponible';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    setProcessingAction(transactionId);
    try {
      const response = await fetch('/api/tickets/approve-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, adminNotes }),
      });

      if (response.ok) {
        await loadData();
        setSelectedTransaction(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    setProcessingAction(transactionId);
    try {
      const response = await fetch('/api/tickets/approve-offline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, adminNotes }),
      });

      if (response.ok) {
        await loadData();
        setSelectedTransaction(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUploadTickets = async (transactionId: string, files: FileList) => {
    setProcessingAction(transactionId);
    try {
      const formData = new FormData();
      formData.append('transactionId', transactionId);
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/tickets/upload-manual', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error uploading tickets:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-muted-foreground">Administra transacciones y entregas de tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por ID, evento o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Estado de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Modo de entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los modos</SelectItem>
            <SelectItem value="automatic">Automático</SelectItem>
            <SelectItem value="manualUpload">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const event = events[transaction.eventId];
          const user = users[transaction.userId];

          return (
            <Card key={transaction.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">Transacción #{transaction.id.slice(-8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event?.name} • {user?.firstName} {user?.lastName} ({user?.email})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusBadgeVariant(transaction.paymentStatus)}>
                      {getStatusLabel(transaction.paymentStatus)}
                    </Badge>
                    <Badge variant="outline">
                      {transaction.ticketDeliveryMode === 'automatic' ? 'Auto' : 'Manual'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(transaction.createdAt), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">${transaction.totalAmount.toLocaleString()} {transaction.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método</p>
                    <p className="font-medium capitalize">{transaction.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado entrega</p>
                    <p className="font-medium">{getDeliveryStatusLabel(transaction.ticketDeliveryStatus || 'pending')}</p>
                  </div>
                </div>

                {/* Tickets Summary */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Tickets:</p>
                  <div className="flex flex-wrap gap-2">
                    {transaction.ticketItems.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item.quantity}x {item.zoneName}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {transaction.paymentStatus === 'pending' && transaction.paymentMethod === 'offline' && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Revisar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revisar Pago Offline</DialogTitle>
                          </DialogHeader>
                          {selectedTransaction && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Comprobante de pago:</p>
                                {selectedTransaction.paymentProofUrl ? (
                                  <a
                                    href={selectedTransaction.paymentProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Ver comprobante
                                  </a>
                                ) : (
                                  <p className="text-sm">No hay comprobante adjunto</p>
                                )}
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notas del administrador:</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Agregar notas sobre la aprobación..."
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApproveTransaction(selectedTransaction.id)}
                                  disabled={processingAction === selectedTransaction.id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Aprobar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRejectTransaction(selectedTransaction.id)}
                                  disabled={processingAction === selectedTransaction.id}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {transaction.ticketDeliveryMode === 'manualUpload' &&
                   transaction.paymentStatus === 'approved' &&
                   transaction.ticketDeliveryStatus !== 'delivered' && (
                    <div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleUploadTickets(transaction.id, e.target.files);
                          }
                        }}
                        className="hidden"
                        id={`upload-${transaction.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${transaction.id}`)?.click()}
                        disabled={processingAction === transaction.id}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Tickets
                      </Button>
                    </div>
                  )}

                  {transaction.ticketsFiles && transaction.ticketsFiles.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {transactions.length === 0 ? 'No hay transacciones aún.' : 'No se encontraron transacciones con los filtros aplicados.'}
          </div>
        </div>
      )}
    </div>
  );
}