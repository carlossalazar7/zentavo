import React, { useState } from 'react';
import { 
  CreditCard, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  CheckCircle2, 
  Zap, 
  Snowflake, 
  Flame, 
  ShieldAlert, 
  DollarSign,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Debt, SalaryProfile } from '../types';
import { 
  formatMoney, 
  calculateTotalIncome, 
  calculateDebtMetrics, 
  getSnowballOrder, 
  getAvalancheOrder 
} from '../utils/financeCalculators';

interface DebtManagerViewProps {
  debts: Debt[];
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onUpdateDebt: (id: string, updated: Partial<Debt>) => void;
  onDeleteDebt: (id: string) => void;
  profile: SalaryProfile;
}

export const DebtManagerView: React.FC<DebtManagerViewProps> = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  profile,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const metrics = calculateDebtMetrics(debts, totalIncome);

  // Strategy Selector
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalBalance, setTotalBalance] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [interestRate, setInterestRate] = useState('35');
  const [dueDateDay, setDueDateDay] = useState('10');
  const [category, setCategory] = useState<Debt['category']>('Tarjeta de Crédito');
  const [notes, setNotes] = useState('');

  // Abono extra modal state
  const [extraPaymentDebtId, setExtraPaymentDebtId] = useState<string | null>(null);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState('');

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setCreditor('');
    setTotalBalance('');
    setMonthlyPayment('');
    setMinimumPayment('');
    setInterestRate('30');
    setDueDateDay('10');
    setCategory('Tarjeta de Crédito');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Debt) => {
    setEditingId(d.id);
    setName(d.name);
    setCreditor(d.creditor);
    setTotalBalance(d.totalBalance.toString());
    setMonthlyPayment(d.monthlyPayment.toString());
    setMinimumPayment(d.minimumPayment.toString());
    setInterestRate(d.interestRate.toString());
    setDueDateDay((d.dueDateDay || 10).toString());
    setCategory(d.category);
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(totalBalance);
    const paymentNum = parseFloat(monthlyPayment);
    const minPayNum = parseFloat(minimumPayment) || paymentNum;
    const rateNum = parseFloat(interestRate) || 0;

    if (!name.trim() || isNaN(balanceNum) || balanceNum <= 0) return;

    if (editingId) {
      onUpdateDebt(editingId, {
        name: name.trim(),
        creditor: creditor.trim(),
        totalBalance: balanceNum,
        monthlyPayment: paymentNum,
        minimumPayment: minPayNum,
        interestRate: rateNum,
        dueDateDay: parseInt(dueDateDay) || 1,
        category,
        notes: notes.trim(),
      });
    } else {
      onAddDebt({
        name: name.trim(),
        creditor: creditor.trim(),
        totalBalance: balanceNum,
        monthlyPayment: paymentNum,
        minimumPayment: minPayNum,
        interestRate: rateNum,
        dueDateDay: parseInt(dueDateDay) || 1,
        category,
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  // Handle Extra Payment towards principal
  const handleApplyExtraPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraPaymentDebtId) return;
    const amountNum = parseFloat(extraPaymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetDebt = debts.find((d) => d.id === extraPaymentDebtId);
    if (!targetDebt) return;

    const newBalance = Math.max(0, targetDebt.totalBalance - amountNum);
    onUpdateDebt(extraPaymentDebtId, { totalBalance: newBalance });
    setExtraPaymentDebtId(null);
    setExtraPaymentAmount('');
  };

  const orderedDebts = strategy === 'snowball' ? getSnowballOrder(debts) : getAvalancheOrder(debts);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & DTI Answer */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Diagnóstico de Deudas vs Sueldo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¿Debo mucho en base a mi sueldo?
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tus pagos de deuda consumen actualmente el{' '}
              <strong className="text-white font-bold">
                {metrics.dtiRatio}% de tu sueldo mensual
              </strong>. Conoce si estás en un nivel seguro o de riesgo y aplica una estrategia matemática para quedar libre.
            </p>
          </div>

          <button
            onClick={openNewModal}
            className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-xs flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Deuda</span>
          </button>
        </div>
      </div>

      {/* 2. DTI Semáforo & Interpretation Gauge */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Semáforo de Ratio de Endeudamiento (DTI)
            </h3>
            <p className="text-xs text-zinc-500">
              Fórmula: (Cuotas mensuales de deuda / Sueldo neto mensual) = {metrics.dtiRatio}%
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${metrics.riskColor}`}>
            Nivel: {metrics.riskLevel}
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="space-y-2">
          <div className="relative h-3 rounded-full bg-zinc-100 overflow-hidden flex">
            <div style={{ width: '20%' }} className="bg-emerald-500 h-full" title="0-20%: Excelente" />
            <div style={{ width: '15%' }} className="bg-blue-500 h-full" title="20-35%: Saludable" />
            <div style={{ width: '15%' }} className="bg-amber-500 h-full" title="35-50%: Alerta" />
            <div style={{ width: '50%' }} className="bg-rose-500 h-full" title=">50%: Crítico" />
            
            {/* Indicator pin */}
            <div 
              style={{ left: `${Math.min(98, Math.max(2, metrics.dtiRatio))}%` }} 
              className="absolute top-0 bottom-0 w-2 bg-zinc-950 -ml-1 shadow-xs"
              title={`Tu posición actual: ${metrics.dtiRatio}%`}
            />
          </div>

          <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs font-medium text-zinc-500 pt-1">
            <span className="text-emerald-700">0 - 20% (Excelente)</span>
            <span className="text-blue-700">21 - 35% (Saludable)</span>
            <span className="text-amber-700">36 - 45% (Alerta)</span>
            <span className="text-rose-700">&gt; 45% (Crítico)</span>
          </div>
        </div>

        {/* Explanation Callout */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${metrics.riskColor}`}>
          <strong>Diagnóstico: </strong> {metrics.riskAdvice}
        </div>
      </div>

      {/* 3. Debt Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Deuda Total Acumulada</span>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            {formatMoney(metrics.totalBalance, profile.currencySymbol)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">{debts.length} deudas activas</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pago Mensual Comprometido</span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {formatMoney(metrics.monthlyCommittedPayment, profile.currencySymbol)}/mes
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">Pagos mínimos: {formatMoney(metrics.minimumMonthlyPayment, profile.currencySymbol)}</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Tiempo Estimado para Liquidar</span>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            ~{metrics.estimatedMonths} meses
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">Manteniendo pagos actuales</span>
        </div>
      </div>

      {/* 4. Payoff Strategy: Snowball vs Avalanche */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Estrategia Recomendada de Pago
            </h3>
            <p className="text-xs text-zinc-500">
              Elige el método probado que mejor se adapte a tu motivación y bolsillo
            </p>
          </div>

          <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 text-xs">
            <button
              onClick={() => setStrategy('snowball')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                strategy === 'snowball'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-blue-500" />
              <span>Bola de Nieve (Menor saldo)</span>
            </button>
            <button
              onClick={() => setStrategy('avalanche')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                strategy === 'avalanche'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Avalancha (Mayor interés)</span>
            </button>
          </div>
        </div>

        {/* Strategy explanation */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
          {strategy === 'snowball' ? (
            <div>
              <strong className="text-zinc-900 font-semibold">Método Bola de Nieve:</strong> Pagas el mínimo en todas las deudas y enfocas todo el dinero extra en la deuda con <strong>menor saldo total</strong>. Al liquidarla rápido, ganas una victoria psicológica clave y usas ese pago mensual liberado para atacar la siguiente.
            </div>
          ) : (
            <div>
              <strong className="text-zinc-900 font-semibold">Método Avalancha:</strong> Pagas el mínimo en todas y enfocas todo el dinero extra en la deuda con la <strong>tasa de interés más alta</strong>. Matemáticamente es el método que más dinero ahorra en intereses a largo plazo.
            </div>
          )}
        </div>

        {/* Ordered Debt List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
            Orden de Ataque Sugerido ({orderedDebts.length} deudas):
          </span>

          <div className="space-y-2">
            {orderedDebts.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200 space-y-3">
                <p className="text-xs text-zinc-500 font-medium">
                  No tienes deudas activas registradas. ¡Felicitaciones!
                </p>
                <button
                  onClick={openNewModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar una deuda</span>
                </button>
              </div>
            ) : (
              orderedDebts.map((debt, index) => (
                <div 
                  key={debt.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    index === 0 
                      ? 'border-zinc-300 bg-zinc-50 ring-1 ring-zinc-400/20' 
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                        index === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-900 text-sm">{debt.name}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-white">
                              OBJETIVO ACTUAL
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">
                          {debt.creditor} · {debt.category} · Vence día {debt.dueDateDay || 10}
                        </span>
                        {debt.notes && (
                          <p className="text-[11px] text-zinc-400 italic mt-0.5">{debt.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">Saldo Pendiente</span>
                        <span className="text-sm font-bold text-zinc-900">
                          {formatMoney(debt.totalBalance, profile.currencySymbol)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">Cuota / Tasa</span>
                        <span className="text-xs font-bold text-rose-600 block">
                          {formatMoney(debt.monthlyPayment, profile.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          {debt.interestRate}% int
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 pl-2 border-l border-zinc-100">
                        <button
                          onClick={() => {
                            setExtraPaymentDebtId(debt.id);
                            setExtraPaymentAmount('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold"
                          title="Registrar abono de capital"
                        >
                          + Abono
                        </button>
                        <button
                          onClick={() => openEditModal(debt)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDebt(debt.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {editingId ? 'Editar Deuda' : 'Registrar Nueva Deuda'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nombre de la Deuda *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Tarjeta Visa Oro, Préstamo Auto, Deuda Familiar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Entidad / Acreedor</label>
                  <input
                    type="text"
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    placeholder="Ej: Banco Santander, Tienda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none font-semibold"
                  >
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Préstamo Personal">Préstamo Personal</option>
                    <option value="Hipotecario">Hipotecario</option>
                    <option value="Vehicular">Vehicular</option>
                    <option value="Familiar / Informal">Familiar / Informal</option>
                    <option value="Servicios Atrasados">Servicios Atrasados</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Saldo Total Pendiente ({profile.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={totalBalance}
                    onChange={(e) => setTotalBalance(e.target.value)}
                    placeholder="1200.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Cuota Mensual Comprometida *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    placeholder="140.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tasa de Interés Anual (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="Ej: 35"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Día de Vencimiento Mensual</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDateDay}
                    onChange={(e) => setDueDateDay(e.target.value)}
                    placeholder="Ej: 15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Quedan 8 cuotas, interés alto..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-xs"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Deuda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Payment Modal */}
      {extraPaymentDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Registrar Abono Extra a Capital
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Ingresa el monto adicional pagado para reducir directamente el saldo de la deuda.
            </p>

            <form onSubmit={handleApplyExtraPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Monto del Abono ({profile.currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  autoFocus
                  value={extraPaymentAmount}
                  onChange={(e) => setExtraPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none font-bold text-base"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtraPaymentDebtId(null)}
                  className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-xs"
                >
                  Aplicar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
