export type ExpenseType = 'Necesidad' | 'Deseo' | 'Deuda';

export type PaymentMethod = 
  | 'Efectivo' 
  | 'Tarjeta de Débito' 
  | 'Tarjeta de Crédito' 
  | 'Transferencia' 
  | 'Mercado Pago / Billetera Virtual';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: ExpenseType;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  notes?: string;
  isLeak?: boolean; // Marcar si es considerado un gasto hormiga o prescindible
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  totalBalance: number;
  monthlyPayment: number;
  interestRate: number; // Tasa anual o mensual (%)
  minimumPayment: number;
  dueDateDay?: number;
  category: 'Tarjeta de Crédito' | 'Préstamo Personal' | 'Hipotecario' | 'Vehicular' | 'Familiar / Informal' | 'Servicios Atrasados';
  notes?: string;
}

export interface SalaryProfile {
  monthlySalary: number;
  extraIncome: number;
  payFrequency: 'Mensual' | 'Quincenal' | 'Semanal';
  currency: string;
  currencySymbol: string;
  emergencyFundCurrent: number;
  emergencyFundGoal: number;
}

export interface SalaryAllocationPlan {
  id: string;
  name: string;
  description: string;
  needsPercentage: number;
  wantsPercentage: number;
  debtPercentage: number;
  savingsPercentage: number;
}

export interface CostCuttingOpportunity {
  category: string;
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  difficulty: 'Fácil' | 'Moderado' | 'Esfuerzo';
}

export interface DebtPayoffStrategy {
  name: string;
  explanation: string;
  steps: string[];
}

export interface AIDiagnosisResult {
  overallAssessment: string;
  debtRiskLevel: 'Saludable' | 'Moderado' | 'Alto Riesgo' | 'Crítico';
  debtAnalysis: string;
  recommendedDebtStrategy: DebtPayoffStrategy;
  salaryDistributionRecommendation: {
    needsPercentage: number;
    wantsPercentage: number;
    debtPercentage: number;
    savingsPercentage: number;
    rationale: string;
  };
  costCuttingOpportunities: CostCuttingOpportunity[];
  immediateActionPlan: string[];
  generatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type ActiveTab = 'dashboard' | 'expenses' | 'cost-reduction' | 'debts' | 'salary-distribution' | 'ai-coach';
