import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Receipt, 
  Coffee, 
  ShoppingCart, 
  Car, 
  Utensils, 
  Zap, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { Expense, ExpenseType, PaymentMethod, SalaryProfile } from '../types';
import { EXPENSE_CATEGORIES } from '../data/defaultData';
import { formatMoney, calculateExpensesByCategory } from '../utils/financeCalculators';

interface ExpenseTrackerViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddMultipleExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
  onUpdateExpense: (id: string, updated: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  profile: SalaryProfile;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  expenses,
  onAddExpense,
  onAddMultipleExpenses,
  onUpdateExpense,
  onDeleteExpense,
  profile,
}) => {
  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [type, setType] = useState<ExpenseType>('Necesidad');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tarjeta de Débito');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLeak, setIsLeak] = useState(false);
  const [notes, setNotes] = useState('');

  // AI Free Text Natural Language Parser state
  const [aiText, setAiText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiParsedExpenses, setAiParsedExpenses] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Quick Preset Add helper
  const handleQuickAdd = (quickTitle: string, quickAmount: number, quickCategory: string, quickType: ExpenseType, quickLeak: boolean = false) => {
    onAddExpense({
      title: quickTitle,
      amount: quickAmount,
      category: quickCategory,
      type: quickType,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Tarjeta de Débito',
      isRecurring: false,
      isLeak: quickLeak,
    });
  };

  // Open modal for new expense
  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setCategory(EXPENSE_CATEGORIES[0].name);
    setType('Necesidad');
    setPaymentMethod('Tarjeta de Débito');
    setDate(new Date().toISOString().split('T')[0]);
    setIsRecurring(false);
    setIsLeak(false);
    setNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    setTitle(exp.title);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setType(exp.type);
    setPaymentMethod(exp.paymentMethod);
    setDate(exp.date);
    setIsRecurring(!!exp.isRecurring);
    setIsLeak(!!exp.isLeak);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    if (editingId) {
      onUpdateExpense(editingId, {
        title: title.trim(),
        amount: numAmount,
        category,
        type,
        paymentMethod,
        date,
        isRecurring,
        isLeak,
        notes: notes.trim(),
      });
    } else {
      onAddExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        type,
        paymentMethod,
        date,
        isRecurring,
        isLeak,
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  // Parse AI Natural text
  const handleParseAiText = async () => {
    if (!aiText.trim()) return;
    setIsParsingAi(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const res = await fetch('/api/ai/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          currency: profile.currencySymbol,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al interpretar el texto con IA.');
      }

      const data = await res.json();
      if (data.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
        setAiParsedExpenses(data.expenses);
        setAiSuccessMsg(`Se detectaron ${data.expenses.length} gastos. Revisa y confirma abajo.`);
      } else {
        setAiError('No pudimos extraer gastos claros del texto. Intenta especificar el concepto y el monto.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleConfirmAiExpenses = () => {
    const formatted = aiParsedExpenses.map((p) => ({
      title: p.title || 'Gasto registrado',
      amount: Number(p.amount) || 0,
      category: p.category || 'Otros Imprevistos',
      type: (p.type === 'Deseo' || p.type === 'Deuda' ? p.type : 'Necesidad') as ExpenseType,
      date: p.date || new Date().toISOString().split('T')[0],
      paymentMethod: (p.paymentMethod as PaymentMethod) || 'Tarjeta de Débito',
      notes: p.notes || 'Registrado con Asistente IA',
      isLeak: p.category?.toLowerCase().includes('hormiga') || p.category?.toLowerCase().includes('snack'),
    }));

    onAddMultipleExpenses(formatted);
    setAiParsedExpenses([]);
    setAiText('');
    setAiSuccessMsg(`¡${formatted.length} gastos guardados con éxito!`);
    setTimeout(() => setAiSuccessMsg(null), 4000);
  };

  // Filtered & sorted expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || exp.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || exp.type === selectedType;
    return matchesSearch && matchesCat && matchesType;
  }).sort((a, b) => {
    if (sortOrder === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOrder === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortOrder === 'amount-desc') return b.amount - a.amount;
    if (sortOrder === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const categoryBreakdown = calculateExpensesByCategory(expenses);
  const totalExpensesSum = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Registro y Control de Gastos</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Anota todos tus gastos para identificar a dónde se va tu dinero y clasificarlo en Necesidades, Deseos y Deudas.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            id="btn-open-add-modal"
            onClick={openNewModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Anotar Gasto</span>
          </button>
        </div>
      </div>

      {/* 1-Click Quick Preset Presets */}
      <div className="bg-zinc-50/70 rounded-2xl p-4 border border-zinc-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            ⚡ Atajos Rápidos de 1 Click:
          </span>
          <span className="text-[11px] text-zinc-400">Presiona para registrar al instante</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAdd('Café / Snack Kiosco', 3.5, 'Gastos Hormiga (Café, Snacks, Kiosco)', 'Deseo', true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-semibold text-zinc-700 flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Café / Snack $3.50</span>
          </button>
          <button
            onClick={() => handleQuickAdd('Supermercado Express', 35, 'Alimentación y Supermercado', 'Necesidad', false)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs font-semibold text-zinc-700 flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
            <span>Supermercado $35</span>
          </button>
          <button
            onClick={() => handleQuickAdd('Delivery Comida', 18, 'Restaurantes y Delivery', 'Deseo', true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-semibold text-zinc-700 flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>Delivery $18</span>
          </button>
          <button
            onClick={() => handleQuickAdd('Transporte / Combustible', 25, 'Transporte y Movilidad', 'Necesidad', false)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs font-semibold text-zinc-700 flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <Car className="w-3.5 h-3.5 text-blue-600" />
            <span>Transporte $25</span>
          </button>
          <button
            onClick={() => handleQuickAdd('Factura de Servicio', 45, 'Servicios Básicos (Luz, Agua, Gas, Net)', 'Necesidad', false)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs font-semibold text-zinc-700 flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Servicios $45</span>
          </button>
        </div>
      </div>

      {/* AI Free Text Natural Language Box */}
      <div className="bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Anotar con IA en Lenguaje Natural</h3>
              <p className="text-[11px] text-zinc-500">
                Escribe lo que gastaste como si hablaras con un amigo y la IA creará los registros automáticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParseAiText()}
            placeholder="Ejemplo: 'Ayer gasté 45 en nafta con débito y 12 en almuerzo de trabajo'"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 shadow-2xs"
          />
          <button
            onClick={handleParseAiText}
            disabled={isParsingAi || !aiText.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shrink-0 transition-all shadow-xs"
          >
            {isParsingAi ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Interpretando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interpretar</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiSuccessMsg && (
          <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{aiSuccessMsg}</span>
          </div>
        )}

        {/* Preview of AI Parsed Expenses */}
        {aiParsedExpenses.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-zinc-200/80 space-y-3 mt-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">
                Gastos detectados ({aiParsedExpenses.length}):
              </span>
              <button
                onClick={handleConfirmAiExpenses}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar y Guardar Todos</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiParsedExpenses.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>{item.title}</span>
                    <span className="text-emerald-700">{formatMoney(item.amount, profile.currencySymbol)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-semibold">{item.category}</span>
                    <span>• {item.type}</span>
                    <span>• {item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown by Category & Expense List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Desglose por Categorías</h3>
            <p className="text-xs text-zinc-500">Distribución de tu dinero este mes</p>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Aún no hay gastos registrados para categorizar.
              </div>
            ) : (
              categoryBreakdown.map((item) => {
                const pct = totalExpensesSum > 0 ? Math.round((item.total / totalExpensesSum) * 100) : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-800 truncate max-w-[170px]" title={item.category}>
                        {item.category}
                      </span>
                      <span className="font-bold text-zinc-900">
                        {formatMoney(item.total, profile.currencySymbol)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          item.type === 'Necesidad' 
                            ? 'bg-blue-600' 
                            : item.type === 'Deuda' 
                            ? 'bg-rose-500' 
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Search, Filters & Expenses Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="Necesidad">Necesidades</option>
                <option value="Deseo">Deseos / Ocio</option>
                <option value="Deuda">Deudas</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="date-desc">Más recientes primero</option>
                <option value="date-asc">Más antiguos primero</option>
                <option value="amount-desc">Mayor monto</option>
                <option value="amount-asc">Menor monto</option>
              </select>
            </div>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Gasto / Concepto</th>
                  <th className="py-2.5 px-2">Categoría</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2 text-right">Monto</th>
                  <th className="py-2.5 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                      No se encontraron gastos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-50/60 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          {exp.isLeak && (
                            <span title="Gasto Hormiga / Fuga detectada" className="text-amber-500">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-bold text-zinc-900">{exp.title}</span>
                          {exp.isRecurring && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
                              Fijo
                            </span>
                          )}
                        </div>
                        {exp.notes && (
                          <p className="text-[11px] text-zinc-400 italic mt-0.5">{exp.notes}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-zinc-600 font-medium whitespace-nowrap">
                        {exp.category}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          exp.type === 'Necesidad' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : exp.type === 'Deuda' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-zinc-500 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-zinc-900 whitespace-nowrap">
                        {formatMoney(exp.amount, profile.currencySymbol)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            title="Editar gasto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {editingId ? 'Editar Gasto' : 'Anotar Nuevo Gasto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Concepto / Nombre del Gasto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Supermercado, Alquiler, Café, Nafta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Monto ({profile.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      const catObj = EXPENSE_CATEGORIES.find((c) => c.name === e.target.value);
                      if (catObj) setType(catObj.defaultType);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Clasificación Financiera</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ExpenseType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold"
                  >
                    <option value="Necesidad">Necesidad (Básico / Fijo)</option>
                    <option value="Deseo">Deseo (Ocio / Prescindible)</option>
                    <option value="Deuda">Deuda (Cuotas / Tarjetas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Mercado Pago / Billetera Virtual">Billetera Virtual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Notas / Detalle</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes for recurring and leak */}
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-xs text-zinc-700">Gasto mensual fijo/recurrente</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLeak}
                    onChange={(e) => setIsLeak(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-amber-800 font-medium">Posible fuga / gasto hormiga</span>
                </label>
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
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xs"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
