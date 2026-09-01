import React, { useState } from 'react';
import { 
  TrendingDown, 
  Flame, 
  Sparkles, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  ShieldCheck, 
  Calendar, 
  DollarSign,
  HelpCircle,
  Tv,
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  Plus,
  Trash2,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Expense, Debt, SalaryProfile, AIDiagnosisResult, CategoryBudget } from '../types';
import { 
  formatMoney, 
  calculateTotalIncome, 
  detectMoneyLeaks, 
  calculateDebtMetrics 
} from '../utils/financeCalculators';

interface CostReductionViewProps {
  expenses: Expense[];
  debts: Debt[];
  profile: SalaryProfile;
  aiDiagnosis: AIDiagnosisResult | null;
  onSaveAiDiagnosis: (diagnosis: AIDiagnosisResult) => void;
  categoryBudgets?: CategoryBudget[];
  onUpdateCategoryBudgets?: (budgets: CategoryBudget[]) => void;
}

interface HabitLeak {
  id: string;
  name: string;
  category: string;
  dailyCost: number;
  daysPerWeek: number;
  icon: 'coffee' | 'delivery' | 'snack' | 'ride' | 'shopping';
}

interface SubscriptionItem {
  id: string;
  name: string;
  monthlyCost: number;
  category: string;
  status: 'keep' | 'pause' | 'cancel';
}

export const CostReductionView: React.FC<CostReductionViewProps> = ({
  expenses,
  debts,
  profile,
  aiDiagnosis,
  onSaveAiDiagnosis,
  categoryBudgets = [],
  onUpdateCategoryBudgets,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const moneyLeaks = detectMoneyLeaks(expenses);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);

  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'habits' | 'subscriptions' | 'alternatives' | 'ai-report'>('simulator');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [appliedBudgetNotification, setAppliedBudgetNotification] = useState(false);

  // AI Generation State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Interactive Simulator State
  const [deliveryCutPct, setDeliveryCutPct] = useState(40);
  const [leaksCutPct, setLeaksCutPct] = useState(60);
  const [subsCutAmount, setSubsCutAmount] = useState(15);
  const [leisureCutPct, setLeisureCutPct] = useState(30);
  const [groceriesCutPct, setGroceriesCutPct] = useState(10);

  // Calculate real expense totals for simulation
  const deliveryExpenses = expenses
    .filter((e) => e.category.includes('Delivery') || e.category.includes('Restaurantes') || e.category.includes('Alimentación'))
    .reduce((s, e) => s + e.amount, 0);

  const leakExpenses = expenses
    .filter((e) => e.isLeak || e.category.includes('Hormiga') || e.category.includes('Snack'))
    .reduce((s, e) => s + e.amount, 0);

  const leisureExpenses = expenses
    .filter((e) => e.category.includes('Entretenimiento') || e.category.includes('Ropa') || e.category.includes('Salidas'))
    .reduce((s, e) => s + e.amount, 0);

  const subscriptionExpenses = expenses
    .filter((e) => e.category.includes('Suscripciones') || e.isRecurring)
    .reduce((s, e) => s + e.amount, 0);

  // Estimated baseline amounts if user has few registered expenses yet
  const effectiveDeliveryBase = deliveryExpenses > 0 ? deliveryExpenses : 120;
  const effectiveLeaksBase = leakExpenses > 0 ? leakExpenses : 65;
  const effectiveLeisureBase = leisureExpenses > 0 ? leisureExpenses : 90;

  const simulatedDeliverySavings = (effectiveDeliveryBase * deliveryCutPct) / 100;
  const simulatedLeaksSavings = (effectiveLeaksBase * leaksCutPct) / 100;
  const simulatedLeisureSavings = (effectiveLeisureBase * leisureCutPct) / 100;
  const simulatedGroceriesSavings = (250 * groceriesCutPct) / 100;

  const totalSimulatedMonthlySavings = 
    simulatedDeliverySavings + simulatedLeaksSavings + simulatedLeisureSavings + Number(subsCutAmount) + simulatedGroceriesSavings;
  
  const simulatedYearlySavings = totalSimulatedMonthlySavings * 12;
  const simulated5YearInvested = totalSimulatedMonthlySavings * ((Math.pow(1 + 0.07 / 12, 60) - 1) / (0.07 / 12));

  // Faster debt payoff calculation
  const currentMonthlyDebt = debtMetrics.monthlyCommittedPayment;
  const acceleratedMonthlyDebt = currentMonthlyDebt + totalSimulatedMonthlySavings;
  const acceleratedMonths = acceleratedMonthlyDebt > 0 
    ? Math.max(1, Math.ceil(debtMetrics.totalBalance / acceleratedMonthlyDebt))
    : debtMetrics.estimatedMonths;
  const monthsSaved = Math.max(0, debtMetrics.estimatedMonths - acceleratedMonths);

  // Preset plans for Scissor Mode
  const applyPresetPlan = (plan: 'soft' | 'efficient' | 'radical') => {
    if (plan === 'soft') {
      setDeliveryCutPct(15);
      setLeaksCutPct(25);
      setSubsCutAmount(10);
      setLeisureCutPct(10);
      setGroceriesCutPct(5);
    } else if (plan === 'efficient') {
      setDeliveryCutPct(40);
      setLeaksCutPct(60);
      setSubsCutAmount(20);
      setLeisureCutPct(35);
      setGroceriesCutPct(15);
    } else if (plan === 'radical') {
      setDeliveryCutPct(75);
      setLeaksCutPct(85);
      setSubsCutAmount(35);
      setLeisureCutPct(65);
      setGroceriesCutPct(25);
    }
  };

  // Habits and Micro-leaks interactive state
  const [customHabits, setCustomHabits] = useState<HabitLeak[]>([
    { id: 'h1', name: 'Café o bebida de franquicia de camino al trabajo', category: 'Alimentación', dailyCost: 3.50, daysPerWeek: 5, icon: 'coffee' },
    { id: 'h2', name: 'Delivery de comida los fines de semana', category: 'Delivery', dailyCost: 16.00, daysPerWeek: 2, icon: 'delivery' },
    { id: 'h3', name: 'Snacks, golosinas y refrescos en tienda/gasolinera', category: 'Gastos Hormiga', dailyCost: 2.25, daysPerWeek: 6, icon: 'snack' },
    { id: 'h4', name: 'Viajes en Uber / Taxi por salir tarde', category: 'Transporte', dailyCost: 6.00, daysPerWeek: 3, icon: 'ride' },
  ]);

  // Subscriptions interactive state
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([
    { id: 'sub1', name: 'Streaming TV (Netflix / Disney+ / Max)', monthlyCost: 15.99, category: 'Entretenimiento', status: 'keep' },
    { id: 'sub2', name: 'Música (Spotify / Apple Music)', monthlyCost: 10.99, category: 'Música', status: 'keep' },
    { id: 'sub3', name: 'Gimnasio / Membresía de acondicionamiento', monthlyCost: 35.00, category: 'Salud', status: 'keep' },
    { id: 'sub4', name: 'Almacenamiento en la Nube (iCloud / Google One)', monthlyCost: 2.99, category: 'Tecnología', status: 'keep' },
    { id: 'sub5', name: 'Delivery Premium / Envíos Gratis', monthlyCost: 6.99, category: 'Delivery', status: 'pause' },
  ]);

  const cancelledSubsSavings = subscriptions
    .filter((s) => s.status === 'cancel' || s.status === 'pause')
    .reduce((sum, s) => sum + s.monthlyCost, 0);

  // Trigger AI Financial Diagnosis
  const handleRunAiDiagnosis = async () => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary: profile.monthlySalary,
          extraIncome: profile.extraIncome,
          expenses,
          debts,
          currency: profile.currencySymbol,
          period: 'Mes en curso',
          profileType: profile.type,
          profileName: profile.name,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Error al conectar con Gemini AI.');
      }

      const data: AIDiagnosisResult = await res.json();
      data.generatedAt = new Date().toLocaleString('es-ES');
      onSaveAiDiagnosis(data);
      setActiveSubTab('ai-report');
    } catch (err: any) {
      setAiError(err.message || 'Ocurrió un error inesperado al contactar con la IA.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopyPlanToClipboard = () => {
    const text = `📋 PLAN DE RECORTES FINANCIEROS - ZENTAVO (${profile.name})
Ingreso Mensual: ${formatMoney(totalIncome, profile.currencySymbol)}
Ahorro Mensual Estimado: ${formatMoney(totalSimulatedMonthlySavings, profile.currencySymbol)}
Ahorro Anual Estimado: ${formatMoney(simulatedYearlySavings, profile.currencySymbol)}
Aceleración de Deudas: Ahorra ${monthsSaved} meses de pago.

Recortes simulados:
- Delivery y Restaurantes: -${deliveryCutPct}% (-${formatMoney(simulatedDeliverySavings, profile.currencySymbol)})
- Gastos Hormiga y Snacks: -${leaksCutPct}% (-${formatMoney(simulatedLeaksSavings, profile.currencySymbol)})
- Suscripciones optimizadas: -${formatMoney(subsCutAmount, profile.currencySymbol)}
- Ocio y Salidas: -${leisureCutPct}% (-${formatMoney(simulatedLeisureSavings, profile.currencySymbol)})
- Supermercado inteligente: -${groceriesCutPct}% (-${formatMoney(simulatedGroceriesSavings, profile.currencySymbol)})
`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleSyncWithBudgets = () => {
    if (!onUpdateCategoryBudgets) return;

    const newBudgets: CategoryBudget[] = [...categoryBudgets];
    
    // Set recommended targets
    const targets = [
      { category: 'Alimentación', limit: Math.max(150, effectiveDeliveryBase * (1 - deliveryCutPct / 100)) },
      { category: 'Gastos Hormiga', limit: Math.max(20, effectiveLeaksBase * (1 - leaksCutPct / 100)) },
      { category: 'Entretenimiento y Salidas', limit: Math.max(30, effectiveLeisureBase * (1 - leisureCutPct / 100)) },
      { category: 'Suscripciones', limit: Math.max(10, subscriptionExpenses - subsCutAmount) },
    ];

    targets.forEach((t) => {
      const idx = newBudgets.findIndex((b) => b.category.toLowerCase().includes(t.category.toLowerCase()));
      if (idx >= 0) {
        newBudgets[idx].monthlyLimit = Math.round(t.limit);
      } else {
        newBudgets.push({ category: t.category, monthlyLimit: Math.round(t.limit) });
      }
    });

    onUpdateCategoryBudgets(newBudgets);
    setAppliedBudgetNotification(true);
    setTimeout(() => setAppliedBudgetNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5 text-emerald-400" />
              <span>Optimización de Gastos & Fugas de Dinero</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¿En qué puedo reducir costos?
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Descubre las pequeñas fugas invisibles que merman tu sueldo y simula cuánto dinero puedes recuperar cada mes para acelerar tus metas y liquidar tus deudas más rápido.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={handleRunAiDiagnosis}
              disabled={isLoadingAi}
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-xs flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoadingAi ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analizando con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Diagnóstico Gemini IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulador & Tijera Presupuestaria</span>
          </button>
          <button
            onClick={() => setActiveSubTab('habits')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'habits'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Gastos Hormiga & Hábitos ({moneyLeaks.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('subscriptions')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'subscriptions'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Auditoría de Suscripciones</span>
          </button>
          <button
            onClick={() => setActiveSubTab('alternatives')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'alternatives'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Alternativas Inteligentes</span>
          </button>
          {aiDiagnosis && (
            <button
              onClick={() => setActiveSubTab('ai-report')}
              className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'ai-report'
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Informe de Gemini IA</span>
            </button>
          )}
        </div>
      </div>

      {aiError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {appliedBudgetNotification && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Topes presupuestarios sincronizados exitosamente con tus categorías de gasto!</span>
          </div>
          <button onClick={() => setAppliedBudgetNotification(false)} className="font-bold text-emerald-900">✕</button>
        </div>
      )}

      {/* SUB-TAB 1: SIMULATOR & SCISSORS */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          {/* Quick Presets Selector */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Ajuste Rápido de Tijera Presupuestaria:
              </span>
              <p className="text-xs text-zinc-600">
                Selecciona un nivel de ajuste automático con un solo clic:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => applyPresetPlan('soft')}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <span>🟢 Suave (5-10%)</span>
              </button>
              <button
                onClick={() => applyPresetPlan('efficient')}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <span>🟡 Modo Eficiencia (20%)</span>
              </button>
              <button
                onClick={() => applyPresetPlan('radical')}
                className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <span>🔴 Cirugía Financiera (35%)</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulator Grid */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-zinc-800" />
                  <span>Simulador de Recortes & Aceleración de Ahorro</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Desliza cada palanca para modelar tus ahorros y observar el impacto multiplicador
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls Sliders */}
              <div className="space-y-5">
                {/* Slider 1: Delivery & Restaurants */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800 flex items-center space-x-1.5">
                      <Utensils className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Comida Afuera / Delivery ({formatMoney(effectiveDeliveryBase, profile.currencySymbol)})</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      -{deliveryCutPct}% (+{formatMoney(simulatedDeliverySavings, profile.currencySymbol)}/mes)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={deliveryCutPct}
                    onChange={(e) => setDeliveryCutPct(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Sin cambios (0%)</span>
                    <span>Moderado (40%)</span>
                    <span>Cero pedidos (100%)</span>
                  </div>
                </div>

                {/* Slider 2: Gastos Hormiga & Snacks */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800 flex items-center space-x-1.5">
                      <Coffee className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Gastos Hormiga / Snacks ({formatMoney(effectiveLeaksBase, profile.currencySymbol)})</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      -{leaksCutPct}% (+{formatMoney(simulatedLeaksSavings, profile.currencySymbol)}/mes)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={leaksCutPct}
                    onChange={(e) => setLeaksCutPct(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>0%</span>
                    <span>Termo de café (50%)</span>
                    <span>Eliminar antojos (100%)</span>
                  </div>
                </div>

                {/* Slider 3: Streaming & Subscriptions */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800 flex items-center space-x-1.5">
                      <Tv className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Pausar / Cancelar Suscripciones Inactivas</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      +{formatMoney(subsCutAmount, profile.currencySymbol)}/mes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={subsCutAmount}
                    onChange={(e) => setSubsCutAmount(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>$0</span>
                    <span>1 servicio ($15)</span>
                    <span>3+ servicios ($45)</span>
                  </div>
                </div>

                {/* Slider 4: Leisure & Outings */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800 flex items-center space-x-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Ocio, Compras de Capricho & Salidas ({formatMoney(effectiveLeisureBase, profile.currencySymbol)})</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      -{leisureCutPct}% (+{formatMoney(simulatedLeisureSavings, profile.currencySymbol)}/mes)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={leisureCutPct}
                    onChange={(e) => setLeisureCutPct(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                </div>

                {/* Slider 5: Supermarket Optimization */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800 flex items-center space-x-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Compras de Supermercado con Lista Estricta</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      -{groceriesCutPct}% (+{formatMoney(simulatedGroceriesSavings, profile.currencySymbol)}/mes)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={groceriesCutPct}
                    onChange={(e) => setGroceriesCutPct(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Outcome Box */}
              <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-md">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Resultado de tu Optimización:
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                      Simulación en tiempo real
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-zinc-800/90 rounded-xl border border-zinc-700">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Ahorro Mensual</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        +{formatMoney(totalSimulatedMonthlySavings, profile.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {((totalSimulatedMonthlySavings / (totalIncome || 1)) * 100).toFixed(1)}% de tus ingresos
                      </span>
                    </div>

                    <div className="p-3.5 bg-zinc-800/90 rounded-xl border border-zinc-700">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Ahorro Anual</span>
                      <span className="text-2xl font-bold text-white">
                        +{formatMoney(simulatedYearlySavings, profile.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-emerald-300 block mt-0.5">
                        Directo a tus ahorros
                      </span>
                    </div>
                  </div>

                  {/* Impact on Debt payoff or Wealth */}
                  {debtMetrics.totalBalance > 0 ? (
                    <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-700 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-200">Aceleración de Deudas:</span>
                        <span className="text-emerald-400 text-sm font-extrabold">
                          {monthsSaved > 0 ? `¡${monthsSaved} meses antes!` : 'Aceleración activa'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Si destinas estos {formatMoney(totalSimulatedMonthlySavings, profile.currencySymbol)} extra al pago de capital, liquidarás tu deuda total de {formatMoney(debtMetrics.totalBalance, profile.currencySymbol)} en tan solo <strong>~{acceleratedMonths} meses</strong> en lugar de {debtMetrics.estimatedMonths} meses.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-800/60 rounded-xl border border-zinc-700 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-200">Proyección a 5 Años Invertido (7% Tasa):</span>
                        <span className="text-emerald-400 text-sm font-extrabold">
                          +{formatMoney(simulated5YearInvested, profile.currencySymbol)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        El dinero que recuperas de fugas, invertido de forma constante, se convierte en un patrimonio tangible para tu futuro gracias al interés compuesto.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer inside result */}
                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
                  {onUpdateCategoryBudgets && (
                    <button
                      onClick={handleSyncWithBudgets}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fijar como Mis Topes de Presupuesto</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopyPlanToClipboard}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                  >
                    {copiedNotification ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HABITS & MICRO-LEAKS CALCULATOR */}
      {activeSubTab === 'habits' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Calculadora Anualizada de Gastos Hormiga & Hábitos</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Mira cómo pequeños montos de $2 o $5 diarios se convierten en miles al final del año
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customHabits.map((habit) => {
                const weekly = habit.dailyCost * habit.daysPerWeek;
                const monthly = weekly * 4.33;
                const yearly = monthly * 12;
                const fiveYearsInvested = monthly * ((Math.pow(1 + 0.07 / 12, 60) - 1) / (0.07 / 12));

                return (
                  <div key={habit.id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                          {habit.icon === 'coffee' && '☕'}
                          {habit.icon === 'delivery' && '🛵'}
                          {habit.icon === 'snack' && '🥤'}
                          {habit.icon === 'ride' && '🚕'}
                          {habit.icon === 'shopping' && '🛍️'}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-zinc-900 block">{habit.name}</span>
                          <span className="text-[11px] text-zinc-500">
                            {formatMoney(habit.dailyCost, profile.currencySymbol)} por día ({habit.daysPerWeek} días/semana)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/80 text-center">
                      <div className="p-2 bg-white rounded-lg border border-zinc-200/60">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Al Mes</span>
                        <span className="text-xs font-bold text-zinc-900">{formatMoney(monthly, profile.currencySymbol)}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-zinc-200/60">
                        <span className="text-[10px] text-rose-500 block font-semibold">Al Año</span>
                        <span className="text-xs font-bold text-rose-700">{formatMoney(yearly, profile.currencySymbol)}</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 block font-semibold">En 5 Años Invertido</span>
                        <span className="text-xs font-bold text-emerald-800">+{formatMoney(fiveYearsInvested, profile.currencySymbol)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Money Leaks Detected in user expenses */}
            {moneyLeaks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-200 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Fugas Detectadas Directamente en tus Gastos Registrados:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {moneyLeaks.map((leak, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-zinc-900">
                        <span>{leak.title}</span>
                        <span className="text-amber-800">{formatMoney(leak.totalAmount, profile.currencySymbol)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600">{leak.reason}</p>
                      <div className="text-right pt-1 font-semibold text-emerald-700">
                        Ahorro sugerido: +{formatMoney(leak.suggestedCut, profile.currencySymbol)}/mes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SUBSCRIPTIONS AUDIT */}
      {activeSubTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                  <Tv className="w-5 h-5 text-zinc-800" />
                  <span>Auditoría de Suscripciones & Membresías</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Revisa cuáles servicios usas con regularidad y cancela los que no amortizan su valor
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-emerald-800 font-semibold block">Ahorro por Pausar/Cancelar:</span>
                <span className="text-base font-extrabold text-emerald-800">
                  +{formatMoney(cancelledSubsSavings, profile.currencySymbol)}/mes ({formatMoney(cancelledSubsSavings * 12, profile.currencySymbol)}/año)
                </span>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      sub.status === 'cancel'
                        ? 'bg-rose-100 text-rose-700'
                        : sub.status === 'pause'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${sub.status === 'cancel' ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                        {sub.name}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formatMoney(sub.monthlyCost, profile.currencySymbol)}/mes ({formatMoney(sub.monthlyCost * 12, profile.currencySymbol)}/año)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSubscriptions((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: 'keep' } : s))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sub.status === 'keep'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Mantener
                    </button>
                    <button
                      onClick={() => setSubscriptions((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: 'pause' } : s))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sub.status === 'pause'
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Pausar
                    </button>
                    <button
                      onClick={() => setSubscriptions((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: 'cancel' } : s))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sub.status === 'cancel'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <strong>💡 Consejo de Optimización:</strong>
              <p>
                Rola tus suscripciones: en lugar de pagar 4 plataformas de streaming simultáneas ($60/mes), contrata 1 diferente cada mes ($15/mes) para ver las series que te interesan y ahorra $540 al año sin perder entretenimiento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SMART ALTERNATIVES COMPARISON */}
      {activeSubTab === 'alternatives' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Comparativas Inteligentes: Sustitución de Costos</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Cambios de hábitos prácticos que generan ahorro masivo sin mermar tu calidad de vida
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-zinc-900">Meal Prep (Cocinar en Lotes) vs Delivery Diario</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Ahorro ~$180/mes
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-600">
                  <div className="flex justify-between">
                    <span>❌ Pedir almuerzo 4x semana ($8 c/u):</span>
                    <span className="font-semibold text-rose-600">$138/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Cocinar comida rica domingo ($2.50 c/u):</span>
                    <span className="font-semibold text-emerald-700">$43/mes</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                  Además de ahorrar dinero, controlas los ingredientes y mejoras tu salud y niveles de energía.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-zinc-900">Planes Familiares de Streaming Compartidos</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Ahorro ~$25/mes
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-600">
                  <div className="flex justify-between">
                    <span>❌ 3 suscripciones individuales por separado:</span>
                    <span className="font-semibold text-rose-600">$38/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Plan familiar dividido entre amigos/familia:</span>
                    <span className="font-semibold text-emerald-700">$13/mes</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                  Organiza a tu familia o círculo cercano para centralizar un solo pago compartido.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-zinc-900">Filtro de Agua de Grifo vs Botellas/Garrafones</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Ahorro ~$35/mes
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-600">
                  <div className="flex justify-between">
                    <span>❌ Comprar agua embotellada o garrafones frecuentes:</span>
                    <span className="font-semibold text-rose-600">$45/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Filtro purificador de inversión única:</span>
                    <span className="font-semibold text-emerald-700">~$8/mes (repuesto)</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                  Un solo filtro de calidad se amortiza en menos de 2 meses de uso.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-zinc-900">Supermercado Mayorista con Lista Estricta</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Ahorro ~$85/mes
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-600">
                  <div className="flex justify-between">
                    <span>❌ Ir a la tienda 3 veces por semana sin lista:</span>
                    <span className="font-semibold text-rose-600">$320/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Compra quincenal con lista y comida previa:</span>
                    <span className="font-semibold text-emerald-700">$235/mes</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                  Nunca vayas de compras con hambre: las compras por impulso representan el 20-30% del ticket.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AI REPORT */}
      {activeSubTab === 'ai-report' && aiDiagnosis && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-zinc-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Diagnóstico Estratégico de Gemini IA
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Generado el {aiDiagnosis.generatedAt || 'recientemente'}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              aiDiagnosis.debtRiskLevel === 'Crítico' || aiDiagnosis.debtRiskLevel === 'Alto Riesgo'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Riesgo: {aiDiagnosis.debtRiskLevel}
            </span>
          </div>

          {/* Assessment & Debt Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <strong className="text-zinc-900 font-bold block text-sm">Evaluación General</strong>
              <p className="text-zinc-700 leading-relaxed">{aiDiagnosis.overallAssessment}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <strong className="text-zinc-900 font-bold block text-sm">Análisis de Deudas</strong>
              <p className="text-zinc-700 leading-relaxed">{aiDiagnosis.debtAnalysis}</p>
            </div>
          </div>

          {/* AI Recommended Cost Cutting Opportunities */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-900">
              Oportunidades Concretas de Recorte Recomendadas por la IA:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiDiagnosis.costCuttingOpportunities.map((op, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-zinc-900">{op.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-zinc-700 border border-zinc-300">
                      {op.difficulty}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-[11px] leading-relaxed">{op.description}</p>
                  <div className="pt-2 border-t border-zinc-200 font-bold text-emerald-700 text-right">
                    Ahorro: +{formatMoney(op.estimatedMonthlySavings, profile.currencySymbol)}/mes
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Action Plan for this week */}
          <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-3">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Plan de Acción Inmediato para Esta Semana:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {aiDiagnosis.immediateActionPlan.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-white text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-200">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
