import { calculateInstallmentDueDates, getLastInstallmentWarning } from './date-utils';

export interface InstallmentPlanItem {
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    isAdjusted?: boolean; // ✅ NUEVO: Marca si la fecha fue ajustada por el evento
}

export interface CalculationResult {
    success: boolean;
    totalAmount?: number;
    reservationAmount?: number;
    remainingAmount?: number;
    monthlyAmount?: number;
    installments?: InstallmentPlanItem[];
    intervalDays?: number; // ✅ NUEVO: Días entre cuotas (puede ser 30 mensual o custom)
    isMonthly?: boolean; // ✅ NUEVO: true si son cuotas mensuales, false si es intervalo custom
    lastInstallmentAdjusted?: boolean; // ✅ NUEVO
    warning?: string; // ✅ NUEVO
    error?: string;
}

/**
 * Calculates the installment plan for a ticket purchase.
 * ✅ MEJORADO: Ahora valida que la última cuota no exceda la fecha del evento
 *
 * @param totalAmount - Total price of the ticket(s)
 * @param reservationAmount - Initial down payment (can be 0)
 * @param installmentsCount - Number of installments (excluding reservation/initial payment if treated as separate)
 * @param startDate - Date of the first installment (after the reservation)
 * @param eventDate - Event date to validate against (✅ NUEVO)
 */
export function calculateInstallmentPlan(
    totalAmount: number,
    reservationAmount: number,
    installmentsCount: number,
    startDate: Date,
    eventDate?: Date | string | any // ✅ NUEVO: Fecha del evento
): CalculationResult {

    if (totalAmount <= 0) {
        return { success: false, error: 'Total amount must be greater than 0' };
    }

    if (reservationAmount < 0) {
        return { success: false, error: 'Reservation amount cannot be negative' };
    }

    if (reservationAmount >= totalAmount) {
        return { success: false, error: 'Reservation amount cannot be greater than or equal to total amount' };
    }

    if (installmentsCount <= 0) {
        return { success: false, error: 'Installments count must be at least 1' };
    }

    const remainingAmount = totalAmount - reservationAmount;

    // Calculate monthly amount, properly rounding to 2 decimals
    const rawMonthlyAmount = remainingAmount / installmentsCount;
    const roundedMonthlyAmount = Math.floor(rawMonthlyAmount * 100) / 100;

    // ✅ CAMBIO: Usar función de date-utils que calcula intervalos inteligentes
    const calculationResult = eventDate
        ? calculateInstallmentDueDates(startDate, installmentsCount, eventDate)
        : { dueDates: [], intervalDays: 30, isMonthly: true, lastInstallmentAdjusted: false, warning: undefined };

    const { dueDates, intervalDays, isMonthly, lastInstallmentAdjusted, warning } = calculationResult;

    const installments: InstallmentPlanItem[] = [];
    let currentSum = 0;

    for (let i = 1; i <= installmentsCount; i++) {
        let amount = roundedMonthlyAmount;

        // Adjust last installment to cover any rounding difference
        if (i === installmentsCount) {
            amount = Number((remainingAmount - currentSum).toFixed(2));
        } else {
            currentSum += amount;
        }

        // ✅ CAMBIO: Usar fecha calculada con intervalos inteligentes
        const dueDate = eventDate ? dueDates[i - 1] : (() => {
            // Fallback: cálculo original si no hay eventDate
            const date = new Date(startDate);
            const originalDay = startDate.getDate();
            date.setMonth(startDate.getMonth() + i);
            if (date.getDate() !== originalDay) {
                date.setDate(0);
            }
            return date;
        })();

        installments.push({
            installmentNumber: i,
            amount: amount,
            dueDate: dueDate,
            isAdjusted: i === installmentsCount && lastInstallmentAdjusted // ✅ NUEVO
        });
    }

    return {
        success: true,
        totalAmount,
        reservationAmount,
        remainingAmount,
        monthlyAmount: roundedMonthlyAmount,
        installments,
        intervalDays, // ✅ NUEVO: Retornar intervalo calculado
        isMonthly, // ✅ NUEVO: Indicar si es mensual o custom
        lastInstallmentAdjusted, // ✅ NUEVO
        warning // ✅ NUEVO
    };
}
