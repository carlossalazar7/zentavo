import { Expense, Debt, SalaryProfile, SalaryAllocationPlan } from '../types';

export function formatMoney(amount: number, symbol: string = '$'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function calculateTotalIncome(profile: SalaryProfile): number {
  return (Number(profile.monthlySalary) || 0) + (Number(profile.extraIncome) || 0);
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
}

export function calculateExpensesByType(expenses: Expense[]) {
  const needs = expenses
    .filter((e) => e.type === 'Necesidad')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const wants = expenses
    .filter((e) => e.type === 'Deseo')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const debts = expenses
    .filter((e) => e.type === 'Deuda')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const total = needs + wants + debts;

  return {
    needs,
    wants,
    debts,
    total,
  };
}

export function calculateExpensesByCategory(expenses: Expense[]) {
  const map = new Map<string, { total: number; count: number; type: string }>();

  for (const exp of expenses) {
    const existing = map.get(exp.category) || { total: 0, count: 0, type: exp.type };
    map.set(exp.category, {
      total: existing.total + (Number(exp.amount) || 0),
      count: existing.count + 1,
      type: exp.type,
    });
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      type: data.type,
    }))
    .sort((a, b) => b.total - a.total);
}

// Calculate DTI (Ratio de Endeudamiento)
// Monthly Debt Payments / Monthly Net Income
export function calculateDebtMetrics(debts: Debt[], totalMonthlyIncome: number) {
  const totalBalance = debts.reduce((sum, d) => sum + (Number(d.totalBalance) || 0), 0);
  const monthlyCommittedPayment = debts.reduce((sum, d) => sum + (Number(d.monthlyPayment) || 0), 0);
  const minimumMonthlyPayment = debts.reduce((sum, d) => sum + (Number(d.minimumPayment) || 0), 0);

  const dtiRatio = totalMonthlyIncome > 0 ? (monthlyCommittedPayment / totalMonthlyIncome) * 100 : 0;

  let riskLevel: 'Excelente' | 'Saludable' | 'Alerta' | 'Crítico';
  let riskColor: string;
  let riskAdvice: string;

  if (dtiRatio <= 20) {
    riskLevel = 'Excelente';
    riskColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    riskAdvice = 'Tus deudas están en un nivel óptimo. Tienes amplio margen para ahorrar e invertir.';
  } else if (dtiRatio <= 35) {
    riskLevel = 'Saludable';
    riskColor = 'text-blue-700 bg-blue-50 border-blue-200';
    riskAdvice = 'Tu nivel de endeudamiento es manejable, pero evita asumir nuevos créditos innecesarios.';
  } else if (dtiRatio <= 45) {
    riskLevel = 'Alerta';
    riskColor = 'text-amber-700 bg-amber-50 border-amber-200';
    riskAdvice = 'Tus deudas consumen una porción peligrosa de tu sueldo. Es hora de priorizar pagos y recortar ocio.';
  } else {
    riskLevel = 'Crítico';
    riskColor = 'text-rose-700 bg-rose-50 border-rose-200';
    riskAdvice = 'Nivel de sobreendeudamiento severo. Necesitas un plan de choque urgente para frenar intereses.';
  }

  // Months to debt freedom if maintaining payments
  let estimatedMonths = 0;
  if (monthlyCommittedPayment > 0) {
    // Aprox including avg interest
    const avgInterest = debts.reduce((sum, d) => sum + d.interestRate, 0) / (debts.length || 1);
    const monthlyRate = avgInterest / 100 / 12;
    if (monthlyRate > 0 && monthlyCommittedPayment > totalBalance * monthlyRate) {
      estimatedMonths = Math.ceil(
        Math.log(monthlyCommittedPayment / (monthlyCommittedPayment - totalBalance * monthlyRate)) /
        Math.log(1 + monthlyRate)
      );
    } else {
      estimatedMonths = Math.ceil(totalBalance / monthlyCommittedPayment);
    }
  }

  return {
    totalBalance,
    monthlyCommittedPayment,
    minimumMonthlyPayment,
    dtiRatio: Math.round(dtiRatio * 10) / 10,
    riskLevel,
    riskColor,
    riskAdvice,
    estimatedMonths: Math.max(1, isFinite(estimatedMonths) ? estimatedMonths : 36),
  };
}

// Snowball (Bola de Nieve): menor saldo primero
export function getSnowballOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => a.totalBalance - b.totalBalance);
}

// Avalanche (Avalancha): mayor tasa de interés primero
export function getAvalancheOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

// Money Leaks detection
export function detectMoneyLeaks(expenses: Expense[]) {
  const leaks: {
    category: string;
    title: string;
    totalAmount: number;
    count: number;
    reason: string;
    suggestedCut: number;
  }[] = [];

  // 1. Gastos marcados explícitamente como fuga / hormiga
  const markedLeaks = expenses.filter((e) => e.isLeak || e.category.includes('Hormiga'));
  const leakTotal = markedLeaks.reduce((sum, e) => sum + Number(e.amount), 0);

  if (leakTotal > 0) {
    leaks.push({
      category: 'Gastos Hormiga y Kiosco',
      title: 'Pequeñas compras diarias y snacks',
      totalAmount: leakTotal,
      count: markedLeaks.length,
      reason: 'Cafés diarios, snacks y compras impulsivas que drenan tu sueldo sin que lo notes.',
      suggestedCut: Math.round(leakTotal * 0.6), // recortar 60%
    });
  }

  // 2. Suscripciones
  const subscriptions = expenses.filter((e) => e.category.includes('Suscripciones') || e.isRecurring);
  const subTotal = subscriptions.reduce((sum, e) => sum + Number(e.amount), 0);
  if (subscriptions.length >= 2) {
    leaks.push({
      category: 'Suscripciones y Apps',
      title: 'Plataformas de streaming y membresías',
      totalAmount: subTotal,
      count: subscriptions.length,
      reason: 'Suscripciones acumuladas (streaming, música, apps). ¿Realmente usas todas este mes?',
      suggestedCut: Math.round(subTotal * 0.4),
    });
  }

  // 3. Delivery y salidas
  const delivery = expenses.filter((e) => e.category.includes('Delivery') || e.category.includes('Restaurantes'));
  const deliveryTotal = delivery.reduce((sum, e) => sum + Number(e.amount), 0);
  if (deliveryTotal > 70) {
    leaks.push({
      category: 'Comida Afuera y Delivery',
      title: 'Pedidos de comida rápida y restaurantes',
      totalAmount: deliveryTotal,
      count: delivery.length,
      reason: 'Cocinar en lote (meal prep) 2 o 3 días a la semana puede liberar fondos clave para tus deudas.',
      suggestedCut: Math.round(deliveryTotal * 0.5),
    });
  }

  return leaks;
}

// Salary Distribution helper
export function calculateSalaryDistribution(
  totalIncome: number,
  plan: SalaryAllocationPlan
) {
  const needsAmount = (totalIncome * plan.needsPercentage) / 100;
  const wantsAmount = (totalIncome * plan.wantsPercentage) / 100;
  const debtAmount = (totalIncome * plan.debtPercentage) / 100;
  const savingsAmount = (totalIncome * plan.savingsPercentage) / 100;

  return {
    needsAmount,
    wantsAmount,
    debtAmount,
    savingsAmount,
    totalAllocated: needsAmount + wantsAmount + debtAmount + savingsAmount,
  };
}
