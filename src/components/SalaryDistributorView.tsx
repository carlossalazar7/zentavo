import React, { useState } from 'react';
import { 
  PieChart, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Calendar, 
  AlertCircle, 
  Wallet, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Building,
  HeartHandshake,
  DollarSign
} from 'lucide-react';
import { SalaryProfile, Expense, SalaryAllocationPlan, AIDiagnosisResult } from '../types';
import { PRESET_SALARY_PLANS } from '../data/defaultData';
import { 
  formatMoney, 
  calculateTotalIncome, 
  calculateExpensesByType, 
  calculateSalaryDistribution 
} from '../utils/financeCalculators';

interface SalaryDistributorViewProps {
  profile: SalaryProfile;
  expenses: Expense[];
  aiDiagnosis: AIDiagnosisResult | null;
  selectedPlan: SalaryAllocationPlan;
  onSelectPlan: (plan: SalaryAllocationPlan) => void;
  onUpdateProfile: (updated: Partial<SalaryProfile>) => void;
}

export const SalaryDistributorView: React.FC<SalaryDistributorViewProps> = ({
  profile,
  expenses,
  aiDiagnosis,
  selectedPlan,
  onSelectPlan,
  onUpdateProfile,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const { needs: actualNeeds, wants: actualWants, debts: actualDebts } = calculateExpensesByType(expenses);

  // Custom Allocation Sliders State
  const [customNeeds, setCustomNeeds] = useState(selectedPlan.needsPercentage);
  const [customWants, setCustomWants] = useState(selectedPlan.wantsPercentage);
  const [customDebts, setCustomDebts] = useState(selectedPlan.debtPercentage);
  const [customSavings, setCustomSavings] = useState(selectedPlan.savingsPercentage);

  const customTotalPct = customNeeds + customWants + customDebts + customSavings;

  // Active Plan amounts
  const distribution = calculateSalaryDistribution(totalIncome, selectedPlan);

  // Bi-weekly split helper (if user gets paid quincenalmente)
  const isQuincenal = profile.payFrequency === 'Quincenal';
  const divisor = isQuincenal ? 2 : 1;

  // Apply AI Recommended Plan if available
  const handleApplyAiPlan = () => {
    if (!aiDiagnosis?.salaryDistributionRecommendation) return;
    const rec = aiDiagnosis.salaryDistributionRecommendation;
    const aiPlan: SalaryAllocationPlan = {
      id: 'ai-recommended-plan',
      name: 'Plan Personalizado por IA',
      description: rec.rationale || 'Distribución óptima calculada por Gemini AI según tu nivel de deudas y sueldo.',
      needsPercentage: rec.needsPercentage,
      wantsPercentage: rec.wantsPercentage,
      debtPercentage: rec.debtPercentage,
      savingsPercentage: rec.savingsPercentage,
    };
    onSelectPlan(aiPlan);
    setCustomNeeds(rec.needsPercentage);
    setCustomWants(rec.wantsPercentage);
    setCustomDebts(rec.debtPercentage);
    setCustomSavings(rec.savingsPercentage);
  };

  const handleApplyCustomPlan = () => {
    if (customTotalPct !== 100) return;
    const newPlan: SalaryAllocationPlan = {
      id: 'custom-user-plan',
      name: 'Mi Plan Personalizado',
      description: 'Distribución ajustada manualmente a tus prioridades personales.',
      needsPercentage: customNeeds,
      wantsPercentage: customWants,
      debtPercentage: customDebts,
      savingsPercentage: customSavings,
    };
    onSelectPlan(newPlan);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
          <PieChart className="w-3.5 h-3.5 text-zinc-400" />
          <span>Planificación Presupuestaria Inteligente</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          ¿Cómo distribuir mejor mi sueldo?
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
          El secreto para que el sueldo rinda y no se esfume no es ganar más, sino <strong className="text-white font-bold">asignarle un propósito a cada peso el día que cobras</strong> antes de gastar por impulso.
        </p>
      </div>

      {/* Preset Plan Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">
            1. Elige una Plantilla de Distribución de Sueldo:
          </h3>
          {aiDiagnosis?.salaryDistributionRecommendation && (
            <button
              onClick={handleApplyAiPlan}
              className="text-xs font-semibold text-zinc-900 hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Usar Plan Sugerido por IA</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_SALARY_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  onSelectPlan(plan);
                  setCustomNeeds(plan.needsPercentage);
                  setCustomWants(plan.wantsPercentage);
                  setCustomDebts(plan.debtPercentage);
                  setCustomSavings(plan.savingsPercentage);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 shadow-xs ring-1 ring-zinc-900/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-zinc-900">{plan.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-[11px]">
                  <div className="flex justify-between font-semibold">
                    <span className="text-blue-700">Necesidades</span>
                    <span>{plan.needsPercentage}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-700">Deseos & Ocio</span>
                    <span>{plan.wantsPercentage}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-rose-700">Pago Deudas</span>
                    <span>{plan.debtPercentage}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-emerald-700">Ahorro / Fondo</span>
                    <span>{plan.savingsPercentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Plan vs Actual Reality Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            2. Tu Presupuesto Ideal en Números Reales ({selectedPlan.name})
          </h3>
          <p className="text-xs text-zinc-500">
            Basado en tu ingreso mensual de <strong className="text-zinc-800">{formatMoney(totalIncome, profile.currencySymbol)}</strong> (cobro {profile.payFrequency})
          </p>
        </div>

        {/* 4 Category Allocation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Needs */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
              <span>🏠 Necesidades Básicas ({selectedPlan.needsPercentage}%)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {formatMoney(distribution.needsAmount, profile.currencySymbol)}
            </div>
            <div className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200 flex justify-between">
              <span>Gastado: {formatMoney(actualNeeds, profile.currencySymbol)}</span>
              <span className={actualNeeds > distribution.needsAmount ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                {actualNeeds > distribution.needsAmount ? 'Excedido' : 'En regla'}
              </span>
            </div>
            {isQuincenal && (
              <span className="text-[10px] text-zinc-500 block">
                Por quincena: {formatMoney(distribution.needsAmount / 2, profile.currencySymbol)}
              </span>
            )}
          </div>

          {/* Wants */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
              <span>🎉 Deseos y Ocio ({selectedPlan.wantsPercentage}%)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {formatMoney(distribution.wantsAmount, profile.currencySymbol)}
            </div>
            <div className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200 flex justify-between">
              <span>Gastado: {formatMoney(actualWants, profile.currencySymbol)}</span>
              <span className={actualWants > distribution.wantsAmount ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                {actualWants > distribution.wantsAmount ? 'Excedido' : 'En regla'}
              </span>
            </div>
            {isQuincenal && (
              <span className="text-[10px] text-zinc-500 block">
                Por quincena: {formatMoney(distribution.wantsAmount / 2, profile.currencySymbol)}
              </span>
            )}
          </div>

          {/* Debts */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
              <span>💳 Pago de Deudas ({selectedPlan.debtPercentage}%)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {formatMoney(distribution.debtAmount, profile.currencySymbol)}
            </div>
            <div className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200 flex justify-between">
              <span>Compromiso: {formatMoney(actualDebts, profile.currencySymbol)}</span>
              <span className={actualDebts > distribution.debtAmount ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                {actualDebts > distribution.debtAmount ? 'Ajustar' : 'Cubierto'}
              </span>
            </div>
            {isQuincenal && (
              <span className="text-[10px] text-zinc-500 block">
                Por quincena: {formatMoney(distribution.debtAmount / 2, profile.currencySymbol)}
              </span>
            )}
          </div>

          {/* Savings */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
              <span>🛡️ Ahorro / Fondo ({selectedPlan.savingsPercentage}%)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {formatMoney(distribution.savingsAmount, profile.currencySymbol)}
            </div>
            <div className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200">
              <span>Meta mensual para tranquilidad</span>
            </div>
            {isQuincenal && (
              <span className="text-[10px] text-zinc-500 block">
                Por quincena: {formatMoney(distribution.savingsAmount / 2, profile.currencySymbol)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Custom Distribution Fine-Tuning Sliders */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-zinc-800" />
              <span>3. Ajuste Manual de Porcentajes a Medida</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Personaliza los porcentajes según tu situación exacta. La suma debe dar 100%.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              customTotalPct === 100 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              Total: {customTotalPct}% {customTotalPct === 100 ? '✓' : '(Debe ser 100%)'}
            </span>
            <button
              onClick={handleApplyCustomPlan}
              disabled={customTotalPct !== 100}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-xs"
            >
              Aplicar Mi Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex justify-between text-xs font-semibold text-zinc-800">
              <span>Necesidades</span>
              <span className="font-bold">{customNeeds}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={customNeeds}
              onChange={(e) => setCustomNeeds(Number(e.target.value))}
              className="w-full accent-zinc-900"
            />
            <span className="text-[11px] text-zinc-500 block font-semibold">
              {formatMoney((totalIncome * customNeeds) / 100, profile.currencySymbol)}
            </span>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex justify-between text-xs font-semibold text-zinc-800">
              <span>Deseos & Ocio</span>
              <span className="font-bold">{customWants}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={customWants}
              onChange={(e) => setCustomWants(Number(e.target.value))}
              className="w-full accent-zinc-900"
            />
            <span className="text-[11px] text-zinc-500 block font-semibold">
              {formatMoney((totalIncome * customWants) / 100, profile.currencySymbol)}
            </span>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex justify-between text-xs font-semibold text-zinc-800">
              <span>Deudas</span>
              <span className="font-bold">{customDebts}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={customDebts}
              onChange={(e) => setCustomDebts(Number(e.target.value))}
              className="w-full accent-zinc-900"
            />
            <span className="text-[11px] text-zinc-500 block font-semibold">
              {formatMoney((totalIncome * customDebts) / 100, profile.currencySymbol)}
            </span>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex justify-between text-xs font-semibold text-zinc-800">
              <span>Ahorro / Fondo</span>
              <span className="font-bold">{customSavings}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={customSavings}
              onChange={(e) => setCustomSavings(Number(e.target.value))}
              className="w-full accent-zinc-900"
            />
            <span className="text-[11px] text-zinc-500 block font-semibold">
              {formatMoney((totalIncome * customSavings) / 100, profile.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Paycheck Day Action Guide: Sistema de Cuentas */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <span>Protocolo del Día de Cobro (Cómo no quedarte sin dinero a mitad de mes)</span>
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Para que tu distribución funcione, sigue este orden estricto apenas entre tu sueldo a la cuenta bancaria:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-800 space-y-2 border border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-zinc-700 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <strong className="text-sm text-white block">Paga Deudas y Fijos</strong>
            <p className="text-xs text-zinc-400">
              Transfiere de inmediato los {formatMoney(distribution.debtAmount, profile.currencySymbol)} de deudas y aparta el alquiler y servicios. No dejes ese dinero suelto en tu cuenta corriente.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-800 space-y-2 border border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-zinc-700 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <strong className="text-sm text-white block">Págate a ti Mismo Primero</strong>
            <p className="text-xs text-zinc-400">
              Mueve los {formatMoney(distribution.savingsAmount, profile.currencySymbol)} a tu fondo de emergencia o cuenta de ahorros separada. Nunca ahorres "lo que sobre", porque nunca sobra.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-800 space-y-2 border border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-zinc-700 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <strong className="text-sm text-white block">Presupuesto Semanal de Ocio</strong>
            <p className="text-xs text-zinc-400">
              Divide los {formatMoney(distribution.wantsAmount, profile.currencySymbol)} en 4 semanas (~{formatMoney(distribution.wantsAmount / 4, profile.currencySymbol)}/semana) para tus salidas y comidas sin culpas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
