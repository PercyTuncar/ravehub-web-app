// Test del cálculo de cuotas
function calculateInstallmentPlan(totalAmount, reservationAmount, installmentsCount) {
    console.log('\n📊 TEST DE CÁLCULO DE CUOTAS');
    console.log('='.repeat(50));
    console.log('Total Amount:', totalAmount);
    console.log('Reservation Amount:', reservationAmount);
    console.log('Installments Count:', installmentsCount);
    
    const remainingAmount = totalAmount - reservationAmount;
    console.log('\nRemaining Amount (después del adelanto):', remainingAmount);
    
    const rawMonthlyAmount = remainingAmount / installmentsCount;
    console.log('Raw Monthly Amount:', rawMonthlyAmount);
    
    const roundedMonthlyAmount = Math.floor(rawMonthlyAmount * 100) / 100;
    console.log('Rounded Monthly Amount:', roundedMonthlyAmount);
    
    let currentSum = 0;
    const installments = [];
    
    for (let i = 1; i <= installmentsCount; i++) {
        let amount = roundedMonthlyAmount;
        
        if (i === installmentsCount) {
            amount = Number((remainingAmount - currentSum).toFixed(2));
        } else {
            currentSum += amount;
        }
        
        installments.push({ number: i, amount });
    }
    
    console.log('\n📋 CUOTAS GENERADAS:');
    console.log('Adelanto:', reservationAmount);
    installments.forEach(inst => {
        console.log(`Cuota #${inst.number}: ${inst.amount}`);
    });
    
    const total = reservationAmount + installments.reduce((sum, i) => sum + i.amount, 0);
    console.log('\n✅ SUMA TOTAL:', total);
    console.log('DIFERENCIA:', total - totalAmount);
    
    return { reservationAmount, installments, total };
}

// Caso del usuario: 290 PEN total, 50 adelanto, 3 cuotas
console.log('\n🎯 CASO 1: Ticket de 290 PEN (real del usuario)');
calculateInstallmentPlan(290, 50, 3);

// Caso que sale mal: 450 PEN
console.log('\n\n⚠️  CASO 2: Lo que está saliendo (450 PEN)');
calculateInstallmentPlan(450, 50, 3);
