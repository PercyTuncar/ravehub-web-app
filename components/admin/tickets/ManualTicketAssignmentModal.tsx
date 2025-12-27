'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    CreditCard,
    CheckCircle,
    AlertCircle,
    Calculator,
    Search,
    User,
    Layers,
    MapPin,
    Ticket,
    Gift,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';

import { eventsCollection, usersCollection } from '@/lib/firebase/collections';
import { createManualTicketTransaction } from '@/lib/actions';
import { calculateInstallmentPlan, CalculationResult } from '@/lib/utils/admin-ticket-calculator';

interface ManualTicketAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ManualTicketAssignmentModal({ isOpen, onClose, onSuccess }: ManualTicketAssignmentModalProps) {
    // Data
    const [users, setUsers] = useState<any[]>([]);
    const [userOptions, setUserOptions] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Selection
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedPhaseId, setSelectedPhaseId] = useState('');
    const [selectedZoneId, setSelectedZoneId] = useState('');

    // Configuration
    const [step, setStep] = useState(1);
    const [quantity, setQuantity] = useState(1);

    // Payment Config
    const [assignmentType, setAssignmentType] = useState<'sale' | 'courtesy'>('sale');
    const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');

    // Status Flags
    const [isPaid, setIsPaid] = useState(false); // For Full Payment
    const [paidInstallments, setPaidInstallments] = useState<number[]>([]); // Indices of paid installments

    // Installments Config
    const [reservationAmount, setReservationAmount] = useState(50);
    const [installmentsCount, setInstallmentsCount] = useState(3);
    const [firstPaymentDate, setFirstPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [installmentPlan, setInstallmentPlan] = useState<CalculationResult | null>(null);

    // Status
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Computed / Derived
    const selectedUser = users.find(u => u.id === selectedUserId);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const selectedPhase = selectedEvent?.salesPhases?.find((p: any) => p.id === selectedPhaseId);

    // Find Zone Pricing
    const selectedZonePrice = selectedPhase?.zonesPricing?.find((zp: any) => zp.zoneId === selectedZoneId);
    const selectedZone = selectedEvent?.zones?.find((z: any) => z.id === selectedZoneId);

    const unitPrice = selectedZonePrice?.price || 0;
    const baseTotalAmount = unitPrice * quantity;

    // Effective Total Amount based on Assignment Type
    const totalAmount = assignmentType === 'courtesy' ? 0 : baseTotalAmount;

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        // Reset dependant fields when event changes
        setSelectedPhaseId('');
        setSelectedZoneId('');
        setPaymentType('full');
        setAssignmentType('sale');
        setIsPaid(false);
        setPaidInstallments([]);
    }, [selectedEventId]);

    useEffect(() => {
        // Reset zone when phase changes
        setSelectedZoneId('');
    }, [selectedPhaseId]);

    useEffect(() => {
        // Recalculate installments when relevant fields change
        if (paymentType === 'installment' && baseTotalAmount > 0) {
            const result = calculateInstallmentPlan(
                baseTotalAmount,
                reservationAmount,
                installmentsCount,
                new Date(firstPaymentDate)
            );
            setInstallmentPlan(result);
            // Reset paid installments selection on recalcc
            setPaidInstallments([]);
        } else {
            setInstallmentPlan(null);
        }
    }, [paymentType, baseTotalAmount, reservationAmount, installmentsCount, firstPaymentDate]);

    const loadInitialData = async () => {
        setLoadingUsers(true);
        try {
            const [allUsers, allEvents] = await Promise.all([
                usersCollection.getAll(),
                eventsCollection.getAll()
            ]);
            setUsers(allUsers);
            setUserOptions(allUsers.map((u: any) => ({
                value: u.id,
                label: `${u.firstName || ''} ${u.lastName || ''} - ${u.email} - ${u.documentNumber || 'S/D'}`,
                data: u
            })));
            setEvents(allEvents.filter((e: any) => e.eventStatus === 'published' || e.eventStatus === 'active'));
        } catch (error) {
            toast.error('Error cargando datos iniciales');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleToggleInstallmentPaid = (index: number) => {
        if (paidInstallments.includes(index)) {
            setPaidInstallments(paidInstallments.filter(i => i !== index));
        } else {
            setPaidInstallments([...paidInstallments, index]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedUserId || !selectedEventId || !selectedPhaseId || !selectedZoneId) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        if (assignmentType === 'sale' && paymentType === 'installment' && (!installmentPlan || !installmentPlan.success)) {
            toast.error('Configuración de cuotas inválida');
            return;
        }

        setIsSubmitting(true);
        try {
            // Determine Status and Payment Method
            let finalStatus: 'pending' | 'approved' = 'pending';
            let finalPaymentMethod = 'offline';

            if (assignmentType === 'courtesy') {
                finalStatus = 'approved';
                finalPaymentMethod = 'courtesy';
            } else if (paymentType === 'full' && isPaid) {
                finalStatus = 'approved';
                finalPaymentMethod = 'offline'; // Or 'cash' if we add that option
            }
            // For installments, main status is pending unless all paid? No, usually active/pending.

            const result = await createManualTicketTransaction({
                userId: selectedUserId,
                eventId: selectedEventId,
                phaseId: selectedPhaseId,
                phaseName: selectedPhase?.name || 'Unknown Phase',
                zoneId: selectedZoneId,
                zoneName: selectedZone?.name || 'Unknown Zone',
                quantity,
                totalAmount, // 0 for courtesy
                unitPrice,
                paymentType: assignmentType === 'courtesy' ? 'full' : paymentType, // Courtesy is technically a full "payment" of 0
                paymentMethod: finalPaymentMethod,
                reservationAmount: (assignmentType === 'sale' && paymentType === 'installment') ? reservationAmount : undefined,
                installmentsCount: (assignmentType === 'sale' && paymentType === 'installment') ? installmentsCount : undefined,
                firstInstallmentDate: (assignmentType === 'sale' && paymentType === 'installment') ? firstPaymentDate : undefined,
                paymentStatus: finalStatus,

                // Pass new flags
                paidInstallmentsIndices: (assignmentType === 'sale' && paymentType === 'installment') ? paidInstallments : undefined
            });

            if (result.success) {
                toast.success('Ticket asignado correctamente');
                onSuccess();
                onClose();
                // Reset form
                setStep(1);
                setSelectedUserId('');
                setSelectedEventId('');
                setAssignmentType('sale');
                setIsPaid(false);
            } else {
                toast.error('Error al asignar ticket');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Asignación Manual de Ticket</DialogTitle>
                    <DialogDescription>
                        Crea una orden manual para un usuario existente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-8 py-4">
                    {/* Steps Indicator (Improved) */}
                    <div className="w-1/4 space-y-6 border-r pr-6 hidden md:block">
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted -z-10" />
                            <div className="space-y-6">
                                <div className={`flex items-center gap-3 ${step === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background ${step === 1 ? 'border-primary text-primary' : step > 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'}`}>
                                        {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                                    </div>
                                    <span className="text-sm">Usuario y Evento</span>
                                </div>
                                <div className={`flex items-center gap-3 ${step === 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background ${step === 2 ? 'border-primary text-primary' : step > 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'}`}>
                                        {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                                    </div>
                                    <span className="text-sm">Configuración</span>
                                </div>
                                <div className={`flex items-center gap-3 ${step === 3 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background ${step === 3 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                                        {'3'}
                                    </div>
                                    <span className="text-sm">Pago y Confirmación</span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Context Summary (Sidebar) */}
                        {(selectedUser || selectedEvent) && (
                            <div className="pt-4 space-y-4">
                                <Separator />
                                {selectedUser && (
                                    <div className="text-xs space-y-1">
                                        <span className="text-muted-foreground font-medium block mb-1">Usuario Seleccionado</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-semibold truncate">{selectedUser.firstName} {selectedUser.lastName}</p>
                                                <p className="text-muted-foreground truncate">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedEvent && (
                                    <div className="text-xs space-y-1">
                                        <span className="text-muted-foreground font-medium block mb-1">Evento Seleccionado</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <p className="font-medium truncate flex-1">{selectedEvent.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 space-y-6 pl-2">

                        {/* Step 1: User & Event */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">1. Buscar Usuario</Label>
                                    <Combobox
                                        options={userOptions}
                                        value={selectedUserId}
                                        onValueChange={setSelectedUserId}
                                        placeholder="Seleccionar usuario..."
                                        searchPlaceholder="Buscar por nombre, DNI, email o teléfono..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">2. Seleccionar Evento</Label>
                                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                        <SelectTrigger className="w-full h-11">
                                            <SelectValue placeholder="Seleccionar evento..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map(event => (
                                                <SelectItem key={event.id} value={event.id}>
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedUserId || !selectedEventId}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Phase & Zone */}
                        {step === 2 && selectedEvent && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fase de Venta</Label>
                                        <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar fase..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedEvent.salesPhases?.map((phase: any) => (
                                                    <SelectItem key={phase.id} value={phase.id}>
                                                        {phase.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Zona / Categoría</Label>
                                        <Select value={selectedZoneId} onValueChange={setSelectedZoneId} disabled={!selectedPhaseId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar zona..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedPhase?.zonesPricing?.map((zp: any) => {
                                                    const zone = selectedEvent.zones?.find((z: any) => z.id === zp.zoneId);
                                                    return (
                                                        <SelectItem key={zp.zoneId} value={zp.zoneId}>
                                                            {zone?.name || 'Desconocida'} - {selectedEvent.currency} {zp.price}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cantidad</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                {unitPrice > 0 && (
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <span className="font-medium">Subtotal Estimado:</span>
                                            <span className="text-xl font-bold">{selectedEvent.currency} {baseTotalAmount.toLocaleString()}</span>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="pt-4 flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedPhaseId || !selectedZoneId || quantity < 1}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment & Schedule */}
                        {step === 3 && selectedEvent && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">

                                {/* Assignment Type Selector */}
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Tipo de Asignación</Label>
                                    <div className="flex gap-4">
                                        <div
                                            className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors flex items-center gap-3 ${assignmentType === 'sale' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                            onClick={() => setAssignmentType('sale')}
                                        >
                                            <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">Venta</p>
                                                <p className="text-xs text-muted-foreground">Ticket regular con pago</p>
                                            </div>
                                        </div>
                                        <div
                                            className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors flex items-center gap-3 ${assignmentType === 'courtesy' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                            onClick={() => setAssignmentType('courtesy')}
                                        >
                                            <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
                                                <Gift className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">Cortesía</p>
                                                <p className="text-xs text-muted-foreground">Sin costo (Gratuito)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {assignmentType === 'sale' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Modalidad de Pago</Label>
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant={paymentType === 'full' ? 'default' : 'outline'}
                                                    className="flex-1"
                                                    onClick={() => setPaymentType('full')}
                                                >
                                                    Pago Completo
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={paymentType === 'installment' ? 'default' : 'outline'}
                                                    className="flex-1"
                                                    onClick={() => setPaymentType('installment')}
                                                    disabled={!selectedEvent.allowInstallmentPayments}
                                                >
                                                    Pago en Cuotas
                                                </Button>
                                            </div>
                                            {!selectedEvent.allowInstallmentPayments && (
                                                <p className="text-xs text-red-500">Este evento no permite pago en cuotas.</p>
                                            )}
                                        </div>

                                        {paymentType === 'full' && (
                                            <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                                                <Checkbox id="paid" checked={isPaid} onCheckedChange={(c) => setIsPaid(!!c)} />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor="paid"
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        Marcar como Pagado (Entregado offline)
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Si se marca, el ticket se generará con estado "Aprobado".
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {paymentType === 'installment' && (
                                            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calculator className="w-4 h-4 text-primary" />
                                                    <h4 className="font-medium">Configuración de Cuotas</h4>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Monto Reserva</Label>
                                                        <Input
                                                            type="number"
                                                            value={reservationAmount}
                                                            onChange={(e) => setReservationAmount(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">N° Cuotas</Label>
                                                        <Input
                                                            type="number"
                                                            value={installmentsCount}
                                                            onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Fecha 1ra Cuota</Label>
                                                        <Input
                                                            type="date"
                                                            value={firstPaymentDate}
                                                            onChange={(e) => setFirstPaymentDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {installmentPlan && installmentPlan.success && (
                                                    <div className="mt-4">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="py-2 h-8 text-xs">Cuota</TableHead>
                                                                    <TableHead className="py-2 h-8 text-xs">Vencimiento</TableHead>
                                                                    <TableHead className="py-2 h-8 text-xs text-right">Monto</TableHead>
                                                                    <TableHead className="py-2 h-8 text-xs text-center">¿Pagado?</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                <TableRow>
                                                                    <TableCell className="py-2 text-xs font-medium">Reserva</TableCell>
                                                                    <TableCell className="py-2 text-xs">Hoy</TableCell>
                                                                    <TableCell className="py-2 text-xs text-right font-medium">
                                                                        {selectedEvent.currency} {Number(installmentPlan.reservationAmount).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell className="py-2 text-center">
                                                                        <Checkbox
                                                                            checked={paidInstallments.includes(-1)}
                                                                            onCheckedChange={() => handleToggleInstallmentPaid(-1)}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                                {installmentPlan.installments?.map((inst, idx) => (
                                                                    <TableRow key={inst.installmentNumber}>
                                                                        <TableCell className="py-2 text-xs">#{inst.installmentNumber}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{inst.dueDate.toLocaleDateString()}</TableCell>
                                                                        <TableCell className="py-2 text-xs text-right">
                                                                            {selectedEvent.currency} {inst.amount.toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell className="py-2 text-center">
                                                                            <Checkbox
                                                                                checked={paidInstallments.includes(idx)}
                                                                                onCheckedChange={() => handleToggleInstallmentPaid(idx)}
                                                                            />
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                <TableRow className="border-t-2">
                                                                    <TableCell className="py-2 text-xs font-bold">Total</TableCell>
                                                                    <TableCell></TableCell>
                                                                    <TableCell className="py-2 text-xs text-right font-bold">
                                                                        {selectedEvent.currency} {Number(installmentPlan.totalAmount).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell></TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}

                                                {installmentPlan && !installmentPlan.success && (
                                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>{installmentPlan.error}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}


                                {/* Final Summary */}
                                <div className="bg-primary/5 p-4 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Evento:</span>
                                        <span className="font-medium">{selectedEvent.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ticket:</span>
                                        <span className="font-medium">{quantity}x {selectedZone?.name} ({selectedPhase?.name})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total a Pagar:</span>
                                        <span className="font-bold text-lg">{selectedEvent.currency} {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-muted-foreground">Estado Final:</span>
                                        {assignmentType === 'courtesy' ? (
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Cortesía / Aprobado</Badge>
                                        ) : (
                                            (paymentType === 'full' && isPaid) ?
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pagado / Aprobado</Badge> :
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pendiente de Pago</Badge>
                                        )}

                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (assignmentType === 'sale' && paymentType === 'installment' && !installmentPlan?.success)}
                                        className="w-32"
                                    >
                                        {isSubmitting ? 'Creando...' : 'Crear Ticket'}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
