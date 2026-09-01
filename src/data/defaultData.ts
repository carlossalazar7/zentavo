import { Expense, Debt, SalaryProfile, SalaryAllocationPlan } from '../types';

export const EXPENSE_CATEGORIES = [
  { id: 'vivienda', name: 'Vivienda y Alquiler', defaultType: 'Necesidad' as const, icon: 'Home' },
  { id: 'servicios', name: 'Servicios Básicos (Luz, Agua, Gas, Net)', defaultType: 'Necesidad' as const, icon: 'Zap' },
  { id: 'supermercado', name: 'Alimentación y Supermercado', defaultType: 'Necesidad' as const, icon: 'ShoppingCart' },
  { id: 'transporte', name: 'Transporte y Movilidad', defaultType: 'Necesidad' as const, icon: 'Car' },
  { id: 'salud', name: 'Salud y Medicamentos', defaultType: 'Necesidad' as const, icon: 'HeartPulse' },
  { id: 'deudas', name: 'Cuotas de Deudas y Tarjetas', defaultType: 'Deuda' as const, icon: 'CreditCard' },
  { id: 'suscripciones', name: 'Suscripciones y Apps (Netflix, Spotify)', defaultType: 'Deseo' as const, icon: 'Tv' },
  { id: 'comida_afuera', name: 'Restaurantes y Delivery', defaultType: 'Deseo' as const, icon: 'Utensils' },
  { id: 'ocio', name: 'Entretenimiento, Salidas y Hobbies', defaultType: 'Deseo' as const, icon: 'Film' },
  { id: 'ropa', name: 'Ropa y Calzado', defaultType: 'Deseo' as const, icon: 'Shirt' },
  { id: 'gastos_hormiga', name: 'Gastos Hormiga (Café, Snacks, Kiosco)', defaultType: 'Deseo' as const, icon: 'Coffee' },
  { id: 'educacion', name: 'Educación y Cursos', defaultType: 'Necesidad' as const, icon: 'GraduationCap' },
  { id: 'otros', name: 'Otros Imprevistos', defaultType: 'Deseo' as const, icon: 'HelpCircle' },
];

export const DEFAULT_SALARY_PROFILE: SalaryProfile = {
  monthlySalary: 0,
  extraIncome: 0,
  payFrequency: 'Mensual',
  currency: 'USD',
  currencySymbol: '$',
  emergencyFundCurrent: 0,
  emergencyFundGoal: 0,
};

export const PRESET_SALARY_PLANS: SalaryAllocationPlan[] = [
  {
    id: 'standard-50-30-20',
    name: 'Regla Tradicional 50/30/20',
    description: 'Equilibrio ideal para finanzas sin deudas pesadas (50% Necesidades, 30% Deseos, 20% Ahorro/Inversión).',
    needsPercentage: 50,
    wantsPercentage: 30,
    debtPercentage: 0,
    savingsPercentage: 20,
  },
  {
    id: 'anti-debt-50-15-35',
    name: 'Plan Anti-Deudas (Recomendado si debes mucho)',
    description: 'Recorta drásticamente los deseos para destinar el 35% de tu sueldo a liquidar deudas rápido y recuperar tu tranquilidad.',
    needsPercentage: 50,
    wantsPercentage: 15,
    debtPercentage: 25,
    savingsPercentage: 10,
  },
  {
    id: 'crisis-relief-60-10-30',
    name: 'Modo Supervivencia y Reestructuración',
    description: 'Para ingresos ajustados con alta presión financiera. Máxima prioridad a cubrir lo esencial y frenar intereses.',
    needsPercentage: 60,
    wantsPercentage: 10,
    debtPercentage: 25,
    savingsPercentage: 5,
  },
  {
    id: 'aggressive-savings-40-20-40',
    name: 'Ahorro Agresivo e Inversión',
    description: 'Una vez libre de deudas, maximiza tu patrimonio y fondo de retiro.',
    needsPercentage: 40,
    wantsPercentage: 20,
    debtPercentage: 0,
    savingsPercentage: 40,
  },
];

// Datos iniciales limpios (sin data dummy) para registrar datos reales
export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_DEBTS: Debt[] = [];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN $)' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS $)' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP $)' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP $)' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (S/)' },
  { code: 'UYU', symbol: '$', name: 'Peso Uruguayo (UYU $)' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense (₡)' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño (R$)' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco (Q)' },
];
