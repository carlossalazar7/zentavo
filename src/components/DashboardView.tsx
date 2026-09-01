import React from 'react';
import { 
  DollarSign, 
  Receipt, 
  TrendingDown, 
  CreditCard, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  AlertTriangle,
  Flame,
  CheckCircle2,
  PieChart,
  PiggyBank,
  Wallet
} from 'lucide-react';
import { Expense, Debt, SalaryProfile, ActiveTab } from '../types';
import { 
  formatMoney, 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateExpensesByType,
  calculateDebtMetrics,
  detectMoneyLeaks 
} from '../utils/financeCalculators';
import { ZentavoIcon } from './ZentavoLogo';

interface DashboardViewProps {
  expenses: Expense[];
  debts: Debt[];
  profile: SalaryProfile;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
  onOpenProfileModal?: (tab?: 'edit' | 'manage' | 'create' | 'backup') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  debts,
  profile,
  setActiveTab,
  onOpenAddExpense,
  onOpenProfileModal,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const totalExpenses = calculateTotalExpenses(expenses);
  const { needs, wants, debts: expDebts } = calculateExpensesByType(expenses);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);
  
  // Compromiso real de deuda mensual (el mayor entre las cuotas de Deudas y los gastos de deuda ya registrados en el mes)
  const totalCommittedMonthlyDebt = Math.max(debtMetrics.monthlyCommittedPayment, expDebts);
  
  // Gastos del mes excluyendo deudas para descontar el compromiso de deuda sin duplicar
  const expensesExcludingDebt = needs + wants;
  
  // Flujo libre neto real descontando gastos corrientes y cuotas de deuda mensual
  const remainingCash = totalIncome - expensesExcludingDebt - totalCommittedMonthlyDebt;
  
  const moneyLeaks = detectMoneyLeaks(expenses);
  const totalLeaksSum = moneyLeaks.reduce((sum, l) => sum + l.totalAmount, 0);

  // Percentages of total income
  const needsPct = totalIncome > 0 ? Math.round((needs / totalIncome) * 100) : 0;
  const wantsPct = totalIncome > 0 ? Math.round((wants / totalIncome) * 100) : 0;
  const debtsPct = totalIncome > 0 ? Math.round((totalCommittedMonthlyDebt / totalIncome) * 100) : 0;
  const remainingPct = totalIncome > 0 ? Math.max(0, Math.round((remainingCash / totalIncome) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Greeting & Financial Health Diagnosis */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white p-6 sm:p-8 border border-zinc-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-zinc-800 text-emerald-400 text-xs font-semibold border border-zinc-700/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zentavo · Diagnóstico Financiero</span>
              </div>
              {profile.name && (
                <button
                  type="button"
                  onClick={() => onOpenProfileModal?.('manage')}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                  title="Cambiar o administrar perfiles"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Perfil: <strong>{profile.name}</strong> ({profile.type || 'Personal'})</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 filter drop-shadow-md">
                <ZentavoIcon size={38} className="w-full h-full" />
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Zentavo <span className="text-amber-400">SV</span>
                </h1>
                <span className="text-zinc-400 text-sm sm:text-base font-normal">
                  | Control de Gastos & Sueldo
                </span>
              </div>
            </div>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
              {totalIncome === 0 && expenses.length === 0 && debts.length === 0 ? (
                <span className="text-zinc-300 font-medium">
                  Comienza configurando tu sueldo en Ajustes y anotando tus primeros gastos o compromisos para ver tu diagnóstico en tiempo real.
                </span>
              ) : debtMetrics.dtiRatio > 40 ? (
                <span className="text-rose-300 font-medium">
                  Atención: Tus compromisos de deuda consumen el {debtMetrics.dtiRatio}% de tu sueldo. Te recomendamos activar el Plan Anti-Deudas para liberar flujo mensual.
                </span>
              ) : debtMetrics.dtiRatio > 25 ? (
                <span>
                  Tus deudas representan el {debtMetrics.dtiRatio}% de tu sueldo (Nivel Moderado). Revisa las fugas de dinero para acelerar tu ahorro.
                </span>
              ) : (
                <span className="text-emerald-300 font-medium">
                  Excelente: Tus deudas representan el {debtMetrics.dtiRatio}% de tu sueldo. Tienes gran capacidad para ahorrar y distribuir estratégicamente tus ingresos.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-quick-add-expense"
              onClick={onOpenAddExpense}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs sm:text-sm transition-all shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Anotar Gasto</span>
            </button>
            <button
              id="btn-go-to-ai-coach"
              onClick={() => setActiveTab('ai-coach')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs sm:text-sm border border-zinc-700 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>Consultar Asesor IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ingreso Neto Mensual</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              {formatMoney(totalIncome, profile.currencySymbol)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Fijo: {formatMoney(profile.monthlySalary, profile.currencySymbol)} + Extra: {formatMoney(profile.extraIncome, profile.currencySymbol)}
            </p>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gastos Totales del Mes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              {formatMoney(totalExpenses, profile.currencySymbol)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-500 mt-1">
              <span>{totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}% de tu sueldo</span>
              <span className="text-zinc-300">•</span>
              <span>{expenses.length} movimientos</span>
            </div>
          </div>
        </div>

        {/* Card 3: Free Cash Flow / Remaining */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Flujo Libre / Saldo</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              remainingCash >= 0 ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold tracking-tight ${
              remainingCash >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}>
              {formatMoney(remainingCash, profile.currencySymbol)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {remainingCash >= 0 
                ? (totalCommittedMonthlyDebt > 0 
                    ? `Libre tras gastos y cuotas de deuda (${formatMoney(totalCommittedMonthlyDebt, profile.currencySymbol)}/mes)` 
                    : 'Disponible para ahorro o inversión')
                : `Déficit: superas tus ingresos por ${formatMoney(Math.abs(remainingCash), profile.currencySymbol)}`}
            </p>
          </div>
        </div>

        {/* Card 4: DTI Debt Stress Level */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ratio Endeudamiento (DTI)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              debtMetrics.dtiRatio > 40 ? 'bg-rose-50 text-rose-700 border-rose-200' : debtMetrics.dtiRatio > 25 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold tracking-tight ${
                debtMetrics.dtiRatio > 40 ? 'text-rose-600' : debtMetrics.dtiRatio > 25 ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {debtMetrics.dtiRatio}%
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${debtMetrics.riskColor}`}>
                {debtMetrics.riskLevel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Cuotas: {formatMoney(debtMetrics.monthlyCommittedPayment, profile.currencySymbol)}/mes
            </p>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Real Distribution vs Ideal Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distribution analysis & Money leak alert */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Salary Distribution Bar & 50/30/20 Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  ¿Cómo se reparte tu sueldo actualmente?
                </h3>
                <p className="text-xs text-zinc-500">
                  Desglose real de tus gastos clasificados según la metodología financiera 50/30/20
                </p>
              </div>
              <button
                onClick={() => setActiveTab('salary-distribution')}
                className="text-xs font-semibold text-zinc-900 hover:text-zinc-700 flex items-center space-x-1"
              >
                <span>Optimizar distribución</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="space-y-2.5">
              <div className="h-4 w-full rounded-full bg-zinc-100 overflow-hidden flex">
                <div 
                  style={{ width: `${Math.min(100, needsPct)}%` }} 
                  className="bg-blue-600 h-full transition-all duration-500" 
                  title={`Necesidades: ${needsPct}%`}
                />
                <div 
                  style={{ width: `${Math.min(100 - needsPct, wantsPct)}%` }} 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  title={`Deseos y Ocio: ${wantsPct}%`}
                />
                <div 
                  style={{ width: `${Math.min(100 - needsPct - wantsPct, debtsPct)}%` }} 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  title={`Cuotas de Deuda: ${debtsPct}%`}
                />
                {remainingPct > 0 && (
                  <div 
                    style={{ width: `${remainingPct}%` }} 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    title={`Ahorro / Flujo Libre: ${remainingPct}%`}
                  />
                )}
              </div>

              {/* Legend with Amounts and Comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-1.5 text-zinc-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Necesidades</span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 mt-1 tracking-tight">
                    {formatMoney(needs, profile.currencySymbol)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {needsPct}% (Meta: ~50%)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-1.5 text-zinc-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Deseos & Ocio</span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 mt-1 tracking-tight">
                    {formatMoney(wants, profile.currencySymbol)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {wantsPct}% (Meta: ~15-30%)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-1.5 text-zinc-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Cuotas Deuda</span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 mt-1 tracking-tight">
                    {formatMoney(totalCommittedMonthlyDebt, profile.currencySymbol)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {debtsPct}% (DTI: {debtMetrics.dtiRatio}%)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-1.5 text-zinc-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Flujo Libre</span>
                  </div>
                  <div className={`text-base font-bold mt-1 tracking-tight ${remainingCash >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
                    {formatMoney(remainingCash, profile.currencySymbol)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {remainingPct}% (Ahorro/Inversión)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Money Leaks & Cost Cutting Opportunity Alert */}
          {moneyLeaks.length > 0 && (
            <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Fugas de Dinero Detectadas en tus Gastos</span>
                </div>
                <button
                  onClick={() => setActiveTab('cost-reduction')}
                  className="text-xs font-semibold text-amber-900 hover:underline flex items-center space-x-1"
                >
                  <span>Ver cómo recortar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Detectamos <strong className="text-zinc-900">{moneyLeaks.length} fuentes de fuga</strong> (gastos hormiga, suscripciones duplicadas y delivery frecuente) que suman{' '}
                <strong className="text-amber-900">{formatMoney(totalLeaksSum, profile.currencySymbol)}/mes</strong>. Reducirlos puede acelerar tu pago de deudas en meses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {moneyLeaks.slice(0, 2).map((leak, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-amber-200/80 text-xs flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="font-semibold text-zinc-800 block">{leak.title}</span>
                      <span className="text-zinc-500 text-[11px]">{leak.reason.substring(0, 55)}...</span>
                    </div>
                    <span className="font-bold text-amber-800 whitespace-nowrap ml-2">
                      -{formatMoney(leak.suggestedCut, profile.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent 5 Expenses List */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Últimos Gastos Registrados</h3>
                <p className="text-xs text-zinc-500">Historial reciente de movimientos</p>
              </div>
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-semibold text-zinc-900 hover:text-zinc-700 flex items-center space-x-1"
              >
                <span>Ver todos ({expenses.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-zinc-100">
              {expenses.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-zinc-400">Aún no hay gastos registrados este mes.</p>
                  <button
                    onClick={onOpenAddExpense}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anotar primer gasto</span>
                  </button>
                </div>
              ) : (
                expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        exp.type === 'Necesidad' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : exp.type === 'Deuda' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {exp.category.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">{exp.title}</span>
                        <span className="text-[11px] text-zinc-400">{exp.category} · {exp.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-900 block">
                        {formatMoney(exp.amount, profile.currencySymbol)}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        exp.type === 'Necesidad' ? 'text-blue-700 bg-blue-50' : exp.type === 'Deuda' ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {exp.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Debt Freedom Tracker & Action Roadmap */}
        <div className="space-y-6">
          {/* Debt Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Tu Carga de Deudas</h3>
              <button
                onClick={() => setActiveTab('debts')}
                className="text-xs font-semibold text-zinc-900 hover:text-zinc-700"
              >
                Gestionar
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-zinc-500 font-medium">Deuda Total Acumulada</span>
                <span className="text-lg font-bold text-zinc-900 tracking-tight">
                  {formatMoney(debtMetrics.totalBalance, profile.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-zinc-500 font-medium">Cuotas Mensuales</span>
                <span className="text-sm font-bold text-rose-600">
                  {formatMoney(debtMetrics.monthlyCommittedPayment, profile.currencySymbol)}/mes
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-zinc-500 font-medium">Tiempo est. de liquidación</span>
                <span className="text-xs font-bold text-zinc-700">
                  {debts.length === 0 ? 'Sin deudas' : `~${debtMetrics.estimatedMonths} meses`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Tus Deudas Activas ({debts.length})
              </span>
              <div className="space-y-2">
                {debts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-xs text-zinc-400">
                    No tienes deudas activas registradas.
                  </div>
                ) : (
                  debts.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-colors shadow-2xs">
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
                        <span>{d.name}</span>
                        <span>{formatMoney(d.totalBalance, profile.currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-1">
                        <span>Cuota: {formatMoney(d.monthlyPayment, profile.currencySymbol)}</span>
                        <span className="text-rose-600 font-medium">{d.interestRate}% anual</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4-Step Financial Action Checklist */}
          <div className="bg-zinc-900 rounded-2xl p-6 text-white border border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Ruta Hacia la Libertad Financiera</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sigue estos 4 pasos probados para salir de deudas y organizar tu sueldo:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  <strong className="text-white block">Fondo de Emergencia Inicial</strong>
                  <span className="text-zinc-400 text-[11px]">Junta de {formatMoney(300, profile.currencySymbol)} a {formatMoney(500, profile.currencySymbol)} para no endeudarte si ocurre un imprevisto.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  <strong className="text-white block">Frenar Fugas y Ocio</strong>
                  <span className="text-zinc-400 text-[11px]">Pasa de 30% a 15% en deseos temporales para inyectar ese dinero a deudas.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50">
                <span className="w-5 h-5 rounded-full bg-indigo-400 text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  <strong className="text-white block">Ataque Bola de Nieve</strong>
                  <span className="text-zinc-400 text-[11px]">Paga el mínimo en todas y vuelca todo el excedente a la deuda más pequeña.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50">
                <span className="w-5 h-5 rounded-full bg-blue-400 text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                <div>
                  <strong className="text-white block">Distribución Inteligente 50/30/20</strong>
                  <span className="text-zinc-400 text-[11px]">Una vez libre de deudas caras, destina el 20% a ahorro e inversión a largo plazo.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('ai-coach')}
              className="w-full py-2.5 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-100 transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>Pedir Diagnóstico a Gemini IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
