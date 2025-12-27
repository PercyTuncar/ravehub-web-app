
export interface InstallmentPlanItem {
    installmentNumber: number;
    amount: number;
    dueDate: Date;
}

export interface CalculationResult {
    success: boolean;
    totalAmount?: number;
    reservationAmount?: number;
    remainingAmount?: number;
    monthlyAmount?: number;
    installments?: InstallmentPlanItem[];
    error?: string;
}

/**
 * Calculates the installment plan for a ticket purchase.
 * 
 * @param totalAmount - Total price of the ticket(s)
 * @param reservationAmount - Initial down payment (can be 0)
 * @param installmentsCount - Number of installments (excluding reservation/initial payment if treated as separate)
 *                           However, usually "3 installments" means 3 payments total or 1 initial + 2 future?
 *                           Based on user request: "reserva con inicial y saldo en cuotas".
 *                           Interpretation: Initial (Reservation) + N Monthly Installments.
 * @param startDate - Date of the first installment (after the reservation)
 */
export function calculateInstallmentPlan(
    totalAmount: number,
    reservationAmount: number,
    installmentsCount: number,
    startDate: Date
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
    // We want to ensure sum of installments equals exactly the remaining amount.
    // We can distribute the difference in the last installment.

    const rawMonthlyAmount = remainingAmount / installmentsCount;
    const roundedMonthlyAmount = Math.floor(rawMonthlyAmount * 100) / 100;

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

        // Robust date calculation
        const dueDate = new Date(startDate);
        const originalDay = startDate.getDate();

        // Add (i-1) months
        dueDate.setMonth(startDate.getMonth() + (i - 1));

        // Check for month overflow (e.g. Jan 31 + 1 month -> Feb 28/29, not March)
        // If the day changed, it means we overflowed into the next month
        if (dueDate.getDate() !== originalDay) {
            // Set to last day of previous month (which is the correct month)
            dueDate.setDate(0);
        }

        installments.push({
            installmentNumber: i,
            amount: amount,
            dueDate: dueDate
        });
    }

    return {
        success: true,
        totalAmount,
        reservationAmount,
        remainingAmount,
        monthlyAmount: roundedMonthlyAmount, // approximate for display
        installments
    };
}
