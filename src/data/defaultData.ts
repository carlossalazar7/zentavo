import { Expense, Debt, SalaryProfile, SalaryAllocationPlan, UserProfile, ProfileType } from '../types';

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

export const PROFILE_TYPES: { type: ProfileType; label: string; description: string; defaultIcon: string; defaultColor: string }[] = [
  { 
    type: 'Personal', 
    label: 'Finanzas Personales', 
    description: 'Control de sueldo fijo, gastos de hogar, deudas personales y fondo de ahorro familiar.',
    defaultIcon: 'User',
    defaultColor: 'emerald'
  },
  { 
    type: 'Trabajo', 
    label: 'Trabajo / Freelance', 
    description: 'Gestión de cobros por servicios, clientes, herramientas de trabajo, viáticos e impuestos.',
    defaultIcon: 'Briefcase',
    defaultColor: 'blue'
  },
  { 
    type: 'Empresa', 
    label: 'Empresa / Negocio / PyME', 
    description: 'Facturación mensual, costos operativos, nóminas, proveedores y caja de capital de trabajo.',
    defaultIcon: 'Building2',
    defaultColor: 'purple'
  },
  { 
    type: 'Otro', 
    label: 'Proyecto / Otro', 
    description: 'Presupuestos independientes para viajes, inversiones, inmuebles o proyectos especiales.',
    defaultIcon: 'Sparkles',
    defaultColor: 'amber'
  },
];

export const PROFILE_ICONS = [
  { id: 'User', name: 'Personal (Usuario)', emoji: '👤' },
  { id: 'Briefcase', name: 'Trabajo (Portafolio)', emoji: '💼' },
  { id: 'Building2', name: 'Empresa (Edificio)', emoji: '🏢' },
  { id: 'Store', name: 'Comercio / Tienda', emoji: '🏪' },
  { id: 'Laptop', name: 'Freelance / Digital', emoji: '💻' },
  { id: 'Wallet', name: 'Billetera / Ahorro', emoji: '👛' },
  { id: 'PiggyBank', name: 'Fondo / Hucha', emoji: '🐷' },
  { id: 'Truck', name: 'Logística / Flota', emoji: '🚚' },
  { id: 'Sparkles', name: 'Proyecto Especial', emoji: '✨' },
];

export const PROFILE_COLORS = [
  { id: 'emerald', name: 'Verde Esmeralda', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  { id: 'blue', name: 'Azul Océano', badge: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  { id: 'purple', name: 'Púrpura Imperial', badge: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
  { id: 'amber', name: 'Ámbar Cálido', badge: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { id: 'rose', name: 'Rosa Rubí', badge: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
  { id: 'indigo', name: 'Índigo Profundo', badge: 'bg-indigo-50 text-indigo-800 border-indigo-300', dot: 'bg-indigo-500' },
  { id: 'zinc', name: 'Grafito Neutro', badge: 'bg-zinc-100 text-zinc-800 border-zinc-300', dot: 'bg-zinc-700' },
];

export const DEFAULT_SALARY_PROFILE: SalaryProfile = {
  id: 'profile-personal-default',
  name: 'Finanzas Personales',
  type: 'Personal',
  icon: 'User',
  colorTheme: 'emerald',
  description: 'Presupuesto y control de gastos personales',
  monthlySalary: 0,
  extraIncome: 0,
  payFrequency: 'Mensual',
  currency: 'USD',
  currencySymbol: '$',
  emergencyFundCurrent: 0,
  emergencyFundGoal: 0,
  expenses: [],
  debts: [],
};

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'profile-personal',
    name: 'Finanzas Personales',
    type: 'Personal',
    icon: 'User',
    colorTheme: 'emerald',
    description: 'Control de sueldo fijo, gastos de hogar y fondo de ahorro familiar.',
    monthlySalary: 0,
    extraIncome: 0,
    payFrequency: 'Mensual',
    currency: 'USD',
    currencySymbol: '$',
    emergencyFundCurrent: 0,
    emergencyFundGoal: 0,
    expenses: [],
    debts: [],
    selectedPlan: {
      id: 'anti-debt-50-15-35',
      name: 'Plan Anti-Deudas (Recomendado si debes mucho)',
      description: 'Recorta drásticamente los deseos para destinar el 35% de tu sueldo a liquidar deudas rápido.',
      needsPercentage: 50,
      wantsPercentage: 15,
      debtPercentage: 25,
      savingsPercentage: 10,
    },
    aiDiagnosis: null,
    chatMessages: [],
  },
  {
    id: 'profile-trabajo',
    name: 'Trabajo / Freelance',
    type: 'Trabajo',
    icon: 'Briefcase',
    colorTheme: 'blue',
    description: 'Facturación por proyectos, servicios profesionales y retenciones.',
    monthlySalary: 0,
    extraIncome: 0,
    payFrequency: 'Mensual',
    currency: 'USD',
    currencySymbol: '$',
    emergencyFundCurrent: 0,
    emergencyFundGoal: 0,
    expenses: [],
    debts: [],
    selectedPlan: {
      id: 'standard-50-30-20',
      name: 'Regla Tradicional 50/30/20',
      description: 'Equilibrio ideal para finanzas de trabajo y servicios.',
      needsPercentage: 50,
      wantsPercentage: 30,
      debtPercentage: 0,
      savingsPercentage: 20,
    },
    aiDiagnosis: null,
    chatMessages: [],
  },
  {
    id: 'profile-empresa',
    name: 'Empresa / Negocio',
    type: 'Empresa',
    icon: 'Building2',
    colorTheme: 'purple',
    description: 'Ventas brutas, gastos de nómina, alquiler comercial y proveedores.',
    monthlySalary: 0,
    extraIncome: 0,
    payFrequency: 'Mensual',
    currency: 'USD',
    currencySymbol: '$',
    emergencyFundCurrent: 0,
    emergencyFundGoal: 0,
    expenses: [],
    debts: [],
    selectedPlan: {
      id: 'standard-50-30-20',
      name: 'Regla Tradicional 50/30/20',
      description: 'Equilibrio para costos operativos y reinversión.',
      needsPercentage: 50,
      wantsPercentage: 30,
      debtPercentage: 0,
      savingsPercentage: 20,
    },
    aiDiagnosis: null,
    chatMessages: [],
  },
];

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
