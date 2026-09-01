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
  HelpCircle
} from 'lucide-react';
import { Expense, Debt, SalaryProfile, AIDiagnosisResult } from '../types';
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
}

export const CostReductionView: React.FC<CostReductionViewProps> = ({
  expenses,
  debts,
  profile,
  aiDiagnosis,
  onSaveAiDiagnosis,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const moneyLeaks = detectMoneyLeaks(expenses);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);

  // AI Generation State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Interactive Simulator State
  const [deliveryCutPct, setDeliveryCutPct] = useState(40);
  const [leaksCutPct, setLeaksCutPct] = useState(60);
  const [subsCutAmount, setSubsCutAmount] = useState(15);
  const [leisureCutPct, setLeisureCutPct] = useState(30);

  // Calculate simulated monthly savings
  const deliveryExpenses = expenses
    .filter((e) => e.category.includes('Delivery') || e.category.includes('Restaurantes'))
    .reduce((s, e) => s + e.amount, 0);

  const leakExpenses = expenses
    .filter((e) => e.isLeak || e.category.includes('Hormiga'))
    .reduce((s, e) => s + e.amount, 0);

  const leisureExpenses = expenses
    .filter((e) => e.category.includes('Entretenimiento') || e.category.includes('Ropa'))
    .reduce((s, e) => s + e.amount, 0);

  const simulatedDeliverySavings = (deliveryExpenses * deliveryCutPct) / 100;
  const simulatedLeaksSavings = (leakExpenses * leaksCutPct) / 100;
  const simulatedLeisureSavings = (leisureExpenses * leisureCutPct) / 100;
  const totalSimulatedMonthlySavings = 
    simulatedDeliverySavings + simulatedLeaksSavings + simulatedLeisureSavings + Number(subsCutAmount);
  
  const simulatedYearlySavings = totalSimulatedMonthlySavings * 12;

  // Faster debt payoff calculation
  const currentMonthlyDebt = debtMetrics.monthlyCommittedPayment;
  const acceleratedMonthlyDebt = currentMonthlyDebt + totalSimulatedMonthlySavings;
  const acceleratedMonths = acceleratedMonthlyDebt > 0 
    ? Math.max(1, Math.ceil(debtMetrics.totalBalance / acceleratedMonthlyDebt))
    : debtMetrics.estimatedMonths;
  const monthsSaved = Math.max(0, debtMetrics.estimatedMonths - acceleratedMonths);

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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Error al conectar con Gemini AI.');
      }

      const data: AIDiagnosisResult = await res.json();
      data.generatedAt = new Date().toLocaleString('es-ES');
      onSaveAiDiagnosis(data);
    } catch (err: any) {
      setAiError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5 text-emerald-400" />
              <span>Optimización de Gastos & Fugas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¿En qué puedo reducir costos?
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Descubre las pequeñas fugas invisibles que merman tu sueldo y simula cuánto dinero puedes recuperar cada mes para liquidar tus deudas más rápido.
            </p>
          </div>

          <button
            onClick={handleRunAiDiagnosis}
            disabled={isLoadingAi}
            className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-xs flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all active:scale-98 disabled:opacity-50 shrink-0"
          >
            {isLoadingAi ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Analizando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Generar Diagnóstico con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* 1. Money Leaks Detected Cards */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Fugas de Dinero Detectadas en tus Registros</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Gastos automáticos o cotidianos donde recortar genera el mayor impacto sin sacrificar bienestar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {moneyLeaks.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs text-zinc-400">
              No se detectaron fugas evidentes en los gastos actuales. ¡Buen trabajo de control!
            </div>
          ) : (
            moneyLeaks.map((leak, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-zinc-900">{leak.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {leak.count} gastos
                  </span>
                </div>
                <p className="text-xs text-zinc-600">{leak.reason}</p>
                <div className="pt-2 border-t border-zinc-200/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Gasto actual</span>
                    <span className="font-bold text-zinc-800">
                      {formatMoney(leak.totalAmount, profile.currencySymbol)}/mes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 block font-semibold">Ahorro sugerido</span>
                    <span className="font-bold text-emerald-700">
                      +{formatMoney(leak.suggestedCut, profile.currencySymbol)}/mes
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Interactive Cost Reduction Simulator */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-zinc-800" />
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Simulador Interactivo de Recortes y Aceleración de Deudas
            </h3>
            <p className="text-xs text-zinc-500">
              Ajusta los deslizadores para ver cuánto dinero liberas y cuántos meses antes terminas de pagar tus deudas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Sliders */}
          <div className="space-y-4">
            {/* Slider 1: Delivery & Restaurants */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-800">Reducir Comida Afuera / Delivery (Gasto: {formatMoney(deliveryExpenses, profile.currencySymbol)})</span>
                <span className="text-zinc-900 font-bold">-{deliveryCutPct}% ({formatMoney(simulatedDeliverySavings, profile.currencySymbol)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={deliveryCutPct}
                onChange={(e) => setDeliveryCutPct(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>

            {/* Slider 2: Gastos Hormiga & Snacks */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-800">Controlar Gastos Hormiga / Snacks (Gasto: {formatMoney(leakExpenses, profile.currencySymbol)})</span>
                <span className="text-zinc-900 font-bold">-{leaksCutPct}% ({formatMoney(simulatedLeaksSavings, profile.currencySymbol)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={leaksCutPct}
                onChange={(e) => setLeaksCutPct(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>

            {/* Slider 3: Streaming & Subscriptions */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-800">Pausar Suscripciones Innecesarias</span>
                <span className="text-zinc-900 font-bold">-{formatMoney(subsCutAmount, profile.currencySymbol)}/mes</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={subsCutAmount}
                onChange={(e) => setSubsCutAmount(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>

            {/* Slider 4: Leisure & Clothing */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-800">Ajustar Salidas & Ropa (Gasto: {formatMoney(leisureExpenses, profile.currencySymbol)})</span>
                <span className="text-zinc-900 font-bold">-{leisureCutPct}% ({formatMoney(simulatedLeisureSavings, profile.currencySymbol)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={leisureCutPct}
                onChange={(e) => setLeisureCutPct(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>
          </div>

          {/* Results Outcome Box */}
          <div className="bg-zinc-50/80 rounded-2xl p-6 border border-zinc-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">
                Impacto Financiero de tu Ajuste:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Ahorro Mensual</span>
                  <span className="text-xl font-bold text-emerald-700">
                    +{formatMoney(totalSimulatedMonthlySavings, profile.currencySymbol)}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Ahorro Anual</span>
                  <span className="text-xl font-bold text-zinc-900">
                    +{formatMoney(simulatedYearlySavings, profile.currencySymbol)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
                  <span>Adelanto en Liquidación de Deudas:</span>
                  <span className="text-zinc-900 text-sm font-bold">
                    {monthsSaved > 0 ? `¡${monthsSaved} meses antes!` : 'Aceleración activa'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Si inyectas estos {formatMoney(totalSimulatedMonthlySavings, profile.currencySymbol)} extra cada mes directamente al pago de capital, terminarías tus deudas en ~{acceleratedMonths} meses en lugar de {debtMetrics.estimatedMonths} meses.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-zinc-700 font-medium bg-zinc-200/60 p-2.5 rounded-xl border border-zinc-300/60">
              💡 <strong>Regla de oro:</strong> No necesitas eliminar todo el ocio. Recortar solo un 30% a 40% de lo prescindible basta para transformar tus finanzas sin sufrimiento.
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Generated Diagnosis Report */}
      {aiDiagnosis && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-zinc-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Diagnóstico Personalizado de Gemini IA
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
