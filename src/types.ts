export type ProfileType = 'Personal' | 'Trabajo' | 'Empresa' | 'Otro';

export interface CategoryBudget {
  category: string;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  targetDate?: string;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt?: string;
}

export interface BillReminder {
  id: string;
  name: string;
  amount: number;
  dueDateDay: number; // 1 to 31
  category: string;
  type: 'Deuda' | 'Servicio' | 'Suscripción' | 'Vivienda' | 'Otro';
  isPaidForCurrentMonth?: boolean;
  lastPaidDate?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  type: ProfileType;
  icon: string;
  colorTheme: string;
  description?: string;
  monthlySalary: number;
  extraIncome: number;
  payFrequency: 'Mensual' | 'Quincenal' | 'Semanal';
  currency: string;
  currencySymbol: string;
  emergencyFundCurrent: number;
  emergencyFundGoal: number;
  expenses: Expense[];
  debts: Debt[];
  categoryBudgets?: CategoryBudget[];
  savingsGoals?: SavingsGoal[];
  billReminders?: BillReminder[];
  selectedPlan?: SalaryAllocationPlan;
  aiDiagnosis?: AIDiagnosisResult | null;
  chatMessages?: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

// SalaryProfile for compatibility
export type SalaryProfile = UserProfile;

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
  dueDateDay?: number;
  notes?: string;
  isLeak?: boolean; // Marcar si es considerado un gasto hormiga o prescindible
  receiptData?: {
    merchant?: string;
    items?: string[];
    tax?: number;
  };
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
  isPaidThisMonth?: boolean;
  extraMonthlyPayment?: number; // Para simulaciones de amortización
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
