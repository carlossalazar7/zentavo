import React, { useState, useRef } from 'react';
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
  ArrowUpDown,
  Camera,
  UploadCloud,
  FileSpreadsheet,
  Printer,
  Download,
  Sliders,
  AlertTriangle,
  FileText,
  X,
  RefreshCw
} from 'lucide-react';
import { Expense, ExpenseType, PaymentMethod, SalaryProfile, CategoryBudget } from '../types';
import { EXPENSE_CATEGORIES } from '../data/defaultData';
import { 
  formatMoney, 
  calculateExpensesByCategory, 
  calculateBudgetsProgress, 
  exportToCsv,
  CategoryBudgetProgress 
} from '../utils/financeCalculators';

interface ExpenseTrackerViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddMultipleExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
  onUpdateExpense: (id: string, updated: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  profile: SalaryProfile;
  categoryBudgets?: CategoryBudget[];
  onUpdateCategoryBudgets?: (budgets: CategoryBudget[]) => void;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  expenses,
  onAddExpense,
  onAddMultipleExpenses,
  onUpdateExpense,
  onDeleteExpense,
  profile,
  categoryBudgets = [],
  onUpdateCategoryBudgets,
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
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentNumber, setInstallmentNumber] = useState<string>('1');
  const [totalInstallments, setTotalInstallments] = useState<string>('3');
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // AI Free Text Natural Language Parser state
  const [aiText, setAiText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiParsedExpenses, setAiParsedExpenses] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // AI Receipt OCR Scanner state
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [scannedReceiptResult, setScannedReceiptResult] = useState<{
    merchant?: string;
    totalAmount?: number;
    category?: string;
    type?: string;
    date?: string;
    paymentMethod?: string;
    taxAmount?: number;
    items?: string[];
    notes?: string;
    confidence?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budget Limits Configuration Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});

  // Printable Report Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<'ALL' | 'INSTALLMENTS' | 'NON_INSTALLMENTS'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
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
    setIsInstallment(false);
    setInstallmentNumber('1');
    setTotalInstallments('3');
    setTotalPurchaseAmount('');
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
    setIsInstallment(!!exp.isInstallment);
    setInstallmentNumber(exp.installmentNumber ? String(exp.installmentNumber) : '1');
    setTotalInstallments(exp.totalInstallments ? String(exp.totalInstallments) : '3');
    setTotalPurchaseAmount(exp.totalPurchaseAmount ? String(exp.totalPurchaseAmount) : '');
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const parsedInstNumber = isInstallment ? (parseInt(installmentNumber) || 1) : undefined;
    const parsedTotalInst = isInstallment ? (parseInt(totalInstallments) || 1) : undefined;
    const parsedTotalPurchase = isInstallment && totalPurchaseAmount ? parseFloat(totalPurchaseAmount) : undefined;

    const payload: Omit<Expense, 'id'> = {
      title: title.trim(),
      amount: numAmount,
      category,
      type,
      paymentMethod,
      date,
      isRecurring,
      isLeak,
      isInstallment,
      installmentNumber: parsedInstNumber,
      totalInstallments: parsedTotalInst,
      totalPurchaseAmount: parsedTotalPurchase,
      notes: notes.trim(),
    };

    if (editingId) {
      onUpdateExpense(editingId, payload);
    } else {
      onAddExpense(payload);
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

  // OCR Receipt Processing
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOcrError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setOcrImagePreview(base64);
      processReceiptOcr(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processReceiptOcr = async (base64: string, mimeType: string) => {
    setIsScanningOcr(true);
    setOcrError(null);
    setScannedReceiptResult(null);

    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          currency: profile.currencySymbol,
          profileType: profile.type,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Error al escanear el recibo.');
      }

      const data = await res.json();
      if (data.result && data.result.totalAmount) {
        setScannedReceiptResult(data.result);
      } else {
        setOcrError('No fue posible detectar con claridad el total o emisor del ticket. Intenta tomar la foto con más luz.');
      }
    } catch (err: any) {
      setOcrError(err.message || 'Error al procesar la imagen.');
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleSaveScannedReceipt = () => {
    if (!scannedReceiptResult) return;

    const newExpense: Omit<Expense, 'id'> = {
      title: scannedReceiptResult.merchant || 'Compra con Recibo',
      amount: Number(scannedReceiptResult.totalAmount) || 0,
      category: scannedReceiptResult.category || EXPENSE_CATEGORIES[2].name,
      type: (scannedReceiptResult.type === 'Deseo' || scannedReceiptResult.type === 'Deuda' ? scannedReceiptResult.type : 'Necesidad') as ExpenseType,
      date: scannedReceiptResult.date || new Date().toISOString().split('T')[0],
      paymentMethod: (scannedReceiptResult.paymentMethod as PaymentMethod) || 'Tarjeta de Débito',
      notes: scannedReceiptResult.notes || (scannedReceiptResult.items ? `Items: ${scannedReceiptResult.items.join(', ')}` : 'Ticket escaneado con OCR'),
      isLeak: scannedReceiptResult.category?.toLowerCase().includes('hormiga') || scannedReceiptResult.category?.toLowerCase().includes('snack'),
      receiptData: {
        merchant: scannedReceiptResult.merchant,
        items: scannedReceiptResult.items,
        tax: scannedReceiptResult.taxAmount,
      }
    };

    onAddExpense(newExpense);
    setIsOcrModalOpen(false);
    setOcrImagePreview(null);
    setScannedReceiptResult(null);
  };

  // Open Budget Limits Modal
  const openBudgetModal = () => {
    const initialMap: Record<string, string> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const existing = (categoryBudgets || []).find((b) => b.category === cat.name);
      initialMap[cat.name] = existing ? String(existing.monthlyLimit) : '';
    }
    setEditingBudgets(initialMap);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedList: CategoryBudget[] = [];
    for (const [catName, val] of Object.entries(editingBudgets)) {
      const numVal = parseFloat(String(val));
      if (!isNaN(numVal) && numVal > 0) {
        updatedList.push({
          category: catName,
          monthlyLimit: numVal,
        });
      }
    }
    if (onUpdateCategoryBudgets) {
      onUpdateCategoryBudgets(updatedList);
    }
    setIsBudgetModalOpen(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Fecha', 'Concepto', 'Categoría', 'Tipo', 'Monto Cuota/Gasto', 'Moneda', 'Método de Pago', 'En Cuotas', 'Cuota Nro', 'Total Cuotas', 'Monto Total Compra', 'Fuga / Hormiga', 'Fijo', 'Notas'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      e.title,
      e.category,
      e.type,
      e.amount,
      profile.currency,
      e.paymentMethod,
      e.isInstallment ? 'SI' : 'NO',
      e.isInstallment ? (e.installmentNumber || 1) : '-',
      e.isInstallment ? (e.totalInstallments || 1) : '-',
      e.isInstallment && e.totalPurchaseAmount ? e.totalPurchaseAmount : '-',
      e.isLeak ? 'SI' : 'NO',
      e.isRecurring ? 'SI' : 'NO',
      e.notes || ''
    ]);

    const dateTag = new Date().toISOString().split('T')[0];
    exportToCsv(`Gastos_${profile.name.replace(/\s+/g, '_')}_${dateTag}.csv`, headers, rows);
  };

  // Unique months available for filtering
  const availableMonths = Array.from(
    new Set(expenses.map((e) => e.date.substring(0, 7)).filter(Boolean))
  ).sort().reverse();

  // Filtered & sorted expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || exp.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || exp.type === selectedType;
    const matchesMonth = selectedMonth === 'ALL' || exp.date.startsWith(selectedMonth);
    const matchesPayment = selectedPaymentFilter === 'ALL'
      ? true
      : selectedPaymentFilter === 'INSTALLMENTS'
      ? !!exp.isInstallment
      : !exp.isInstallment;
    return matchesSearch && matchesCat && matchesType && matchesMonth && matchesPayment;
  }).sort((a, b) => {
    if (sortOrder === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOrder === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortOrder === 'amount-desc') return b.amount - a.amount;
    if (sortOrder === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const categoryBreakdown = calculateExpensesByCategory(filteredExpenses);
  const totalExpensesSum = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Calculate Budget Progress
  const budgetProgress = calculateBudgetsProgress(expenses, categoryBudgets);
  const overBudgetCategories = budgetProgress.filter((b) => b.isOverBudget);
  const warningBudgetCategories = budgetProgress.filter((b) => b.isWarning);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Registro y Control de Gastos</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
              {expenses.length} Registrados
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Escanea tickets con IA, clasifica tus gastos y mantén cada categoría bajo presupuesto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* OCR Scanner Button */}
          <button
            id="btn-scan-receipt"
            onClick={() => {
              setOcrImagePreview(null);
              setScannedReceiptResult(null);
              setOcrError(null);
              setIsOcrModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs border border-emerald-300 transition-all shadow-2xs"
            title="Escanear ticket o factura con IA"
          >
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Escanear Ticket IA</span>
          </button>

          {/* Budget Limits Button */}
          <button
            id="btn-category-budgets"
            onClick={openBudgetModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition-all shadow-2xs"
            title="Definir topes máximos por categoría"
          >
            <Sliders className="w-4 h-4 text-zinc-600" />
            <span>Presupuestos</span>
          </button>

          {/* Export Report Dropdown / Actions */}
          <button
            id="btn-export-csv"
            onClick={handleExportCsv}
            disabled={expenses.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-800 font-semibold text-xs transition-all shadow-2xs"
            title="Exportar a archivo Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="btn-print-report"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={expenses.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-800 font-semibold text-xs transition-all shadow-2xs"
            title="Ver reporte imprimible / Guardar PDF"
          >
            <Printer className="w-4 h-4 text-zinc-600" />
          </button>

          {/* Manual Add Button */}
          <button
            id="btn-open-add-modal"
            onClick={openNewModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Anotar Gasto</span>
          </button>
        </div>
      </div>

      {/* Overbudget Alerts (if any) */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold block">
              ¡Alerta de Presupuesto Excedido en {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'categoría' : 'categorías'}!
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {overBudgetCategories.map((ob) => (
                <span key={ob.category} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-semibold border border-rose-300">
                  {ob.category}: Gastado {formatMoney(ob.spent, profile.currencySymbol)} / Límite {formatMoney(ob.monthlyLimit, profile.currencySymbol)} (+{formatMoney(ob.spent - ob.monthlyLimit, profile.currencySymbol)})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets Visual Widget (Caps & Progress) */}
      {categoryBudgets.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900">Presupuestos Máximos por Categoría</h3>
            </div>
            <button
              onClick={openBudgetModal}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline"
            >
              Ajustar Límites
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {budgetProgress.map((bp) => {
              const isOver = bp.isOverBudget;
              const isNear = bp.isWarning;
              const barColor = isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={bp.category} className={`p-3 rounded-xl border ${isOver ? 'bg-rose-50/40 border-rose-200' : isNear ? 'bg-amber-50/40 border-amber-200' : 'bg-zinc-50 border-zinc-200/80'} text-xs space-y-1.5`}>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-zinc-800 truncate" title={bp.category}>{bp.category}</span>
                    <span className={isOver ? 'text-rose-700' : isNear ? 'text-amber-700' : 'text-zinc-700'}>
                      {Math.round(bp.percentage)}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-zinc-200/70 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Gastado: <strong className="text-zinc-900">{formatMoney(bp.spent, profile.currencySymbol)}</strong></span>
                    <span>Límite: <strong>{formatMoney(bp.monthlyLimit, profile.currencySymbol)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-Click Quick Preset Buttons */}
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
                Escribe lo que gastaste en una frase y la IA creará los registros con categoría y tipo automáticamente.
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
            <p className="text-xs text-zinc-500">
              Total filtrado: <strong className="text-zinc-900 font-bold">{formatMoney(totalExpensesSum, profile.currencySymbol)}</strong>
            </p>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
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
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por concepto, comercio o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {availableMonths.length > 0 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="ALL">Todos los Meses</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="Necesidad">Necesidades</option>
                <option value="Deseo">Deseos / Ocio</option>
                <option value="Deuda">Deudas</option>
              </select>

              <select
                value={selectedPaymentFilter}
                onChange={(e: any) => setSelectedPaymentFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">Forma de Pago: Todos</option>
                <option value="INSTALLMENTS">💳 Solo en Cuotas</option>
                <option value="NON_INSTALLMENTS">💵 Débito / Efectivo / Contado</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="date-desc">Recientes</option>
                <option value="date-asc">Antiguos</option>
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
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {exp.isLeak && (
                            <span title="Gasto Hormiga / Fuga detectada" className="text-amber-500 shrink-0">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-bold text-zinc-900">{exp.title}</span>
                          
                          {exp.isInstallment && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center space-x-1" 
                              title={`Compra en Cuotas: Cuota ${exp.installmentNumber || 1} de ${exp.totalInstallments || 1}${exp.totalPurchaseAmount ? ` (Total compra: ${formatMoney(exp.totalPurchaseAmount, profile.currencySymbol)})` : ''}`}
                            >
                              <CreditCard className="w-2.5 h-2.5 inline" />
                              <span>Cuota {exp.installmentNumber || 1}/{exp.totalInstallments || 1}</span>
                            </span>
                          )}

                          {exp.isRecurring && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
                              Fijo
                            </span>
                          )}
                          {exp.receiptData?.merchant && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium" title="Escaneado con OCR">
                              Ticket
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

      {/* AI OCR Receipt Scanner Modal */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Escáner de Tickets & Facturas con IA</h3>
                  <p className="text-[11px] text-zinc-500">Gemini OCR extrae comercio, fecha, total y categoría</p>
                </div>
              </div>
              <button
                onClick={() => setIsOcrModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Upload Area */}
            {!ocrImagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-emerald-50/30 space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-zinc-900 block">Sube una foto del ticket o comprobante</span>
                  <span className="text-xs text-zinc-500">Haz click para buscar en tus archivos o tomar foto con la cámara</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Formatos soportados: JPG, PNG, WEBP (hasta 15MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleReceiptFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Thumbnail Preview */}
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 max-h-48 flex items-center justify-center bg-zinc-900">
                  <img
                    src={ocrImagePreview}
                    alt="Ticket Preview"
                    className="max-h-48 w-auto object-contain"
                  />
                  <button
                    onClick={() => {
                      setOcrImagePreview(null);
                      setScannedReceiptResult(null);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                    title="Cambiar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isScanningOcr && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center space-x-3 text-xs text-zinc-700">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-semibold">Gemini está analizando los montos y datos del ticket...</span>
                  </div>
                )}

                {ocrError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>No se pudo procesar</span>
                    </div>
                    <p>{ocrError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-bold text-rose-900 underline"
                    >
                      Intentar con otra foto
                    </button>
                  </div>
                )}

                {scannedReceiptResult && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between font-bold text-emerald-950 border-b border-emerald-200/60 pb-2">
                      <span className="text-sm">{scannedReceiptResult.merchant || 'Comercio Detectado'}</span>
                      <span className="text-base font-extrabold text-emerald-800">
                        {formatMoney(scannedReceiptResult.totalAmount || 0, profile.currencySymbol)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-zinc-700">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Categoría asignada:</span>
                        <strong className="text-zinc-900">{scannedReceiptResult.category}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Tipo de Gasto:</span>
                        <strong className="text-zinc-900">{scannedReceiptResult.type}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Fecha detectada:</span>
                        <strong className="text-zinc-900">{scannedReceiptResult.date}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Método de pago:</span>
                        <strong className="text-zinc-900">{scannedReceiptResult.paymentMethod || 'Débito / Tarjeta'}</strong>
                      </div>
                    </div>

                    {scannedReceiptResult.items && scannedReceiptResult.items.length > 0 && (
                      <div className="text-[11px] text-zinc-600 bg-white/70 p-2 rounded-lg border border-emerald-100">
                        <span className="font-bold text-zinc-800 block text-[10px]">Items detectados:</span>
                        {scannedReceiptResult.items.join(' • ')}
                      </div>
                    )}

                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={handleSaveScannedReceipt}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Guardar en mis Gastos</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Budgets Configuration Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Configurar Presupuestos Máximos</h3>
                <p className="text-[11px] text-zinc-500">Define cuánto planeas gastar como máximo por categoría al mes</p>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudgets} className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="font-semibold text-zinc-800 truncate max-w-[240px]">{cat.name}</span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="font-bold text-zinc-500">{profile.currencySymbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Sin tope"
                      value={editingBudgets[cat.name] || ''}
                      onChange={(e) => setEditingBudgets({ ...editingBudgets, [cat.name]: e.target.value })}
                      className="w-24 px-2 py-1.5 rounded-lg bg-white border border-zinc-200 font-bold text-right text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-zinc-100 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xs"
                >
                  Guardar Presupuestos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Tipo de Gasto</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ExpenseType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-medium"
                  >
                    <option value="Necesidad">Necesidad (Esencial)</option>
                    <option value="Deseo">Deseo (Prescindible/Ocio)</option>
                    <option value="Deuda">Deuda (Cuota de crédito)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-medium"
                >
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Mercado Pago / Billetera Virtual">Billetera Virtual / QR</option>
                </select>
              </div>

              {/* Installments Option / Compra en Cuotas */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsInstallment(checked);
                      if (checked && paymentMethod !== 'Tarjeta de Crédito') {
                        setPaymentMethod('Tarjeta de Crédito');
                      }
                    }}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-900">
                    <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                    <span>¿Pagaste esta compra en cuotas? (Tarjeta / Financiado)</span>
                  </div>
                </label>

                {isInstallment && (
                  <div className="space-y-3 pt-1 border-t border-purple-200/60 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-purple-950 text-[11px] mb-1">
                          Cantidad total de cuotas *
                        </label>
                        <select
                          value={['2', '3', '6', '9', '12', '18', '24'].includes(totalInstallments) ? totalInstallments : 'custom'}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              setTotalInstallments(e.target.value);
                              if (totalPurchaseAmount && parseFloat(totalPurchaseAmount) > 0) {
                                const perMonth = parseFloat(totalPurchaseAmount) / parseInt(e.target.value);
                                setAmount(perMonth.toFixed(2));
                              }
                            }
                          }}
                          className="w-full px-2.5 py-2 rounded-lg border border-purple-200 bg-white font-semibold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="2">2 cuotas</option>
                          <option value="3">3 cuotas</option>
                          <option value="6">6 cuotas</option>
                          <option value="9">9 cuotas</option>
                          <option value="12">12 cuotas</option>
                          <option value="18">18 cuotas</option>
                          <option value="24">24 cuotas</option>
                          <option value="custom">Otro número...</option>
                        </select>
                        {!['2', '3', '6', '9', '12', '18', '24'].includes(totalInstallments) && (
                          <input
                            type="number"
                            min="2"
                            max="72"
                            value={totalInstallments}
                            onChange={(e) => {
                              setTotalInstallments(e.target.value);
                              if (totalPurchaseAmount && parseFloat(totalPurchaseAmount) > 0 && parseInt(e.target.value) > 0) {
                                const perMonth = parseFloat(totalPurchaseAmount) / parseInt(e.target.value);
                                setAmount(perMonth.toFixed(2));
                              }
                            }}
                            placeholder="Ej: 4"
                            className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white font-bold text-xs"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-purple-950 text-[11px] mb-1">
                          Cuota actual pagada este mes *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={totalInstallments ? parseInt(totalInstallments) || 72 : 72}
                          value={installmentNumber}
                          onChange={(e) => setInstallmentNumber(e.target.value)}
                          placeholder="Ej: 1"
                          className="w-full px-2.5 py-2 rounded-lg border border-purple-200 bg-white font-semibold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-purple-950 text-[11px] mb-1">
                        Monto total de la compra original (opcional)
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-2 font-bold text-zinc-400 text-xs">{profile.currencySymbol}</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={totalPurchaseAmount}
                            onChange={(e) => {
                              setTotalPurchaseAmount(e.target.value);
                              const parsedTot = parseFloat(e.target.value);
                              const parsedInst = parseInt(totalInstallments);
                              if (!isNaN(parsedTot) && parsedTot > 0 && !isNaN(parsedInst) && parsedInst > 0) {
                                setAmount((parsedTot / parsedInst).toFixed(2));
                              }
                            }}
                            placeholder="Ej: 300.00"
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                        {amount && parseFloat(amount) > 0 && parseInt(totalInstallments) > 0 && !totalPurchaseAmount && (
                          <button
                            type="button"
                            onClick={() => {
                              const calc = (parseFloat(amount) * parseInt(totalInstallments)).toFixed(2);
                              setTotalPurchaseAmount(calc);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-[10px] whitespace-nowrap transition-colors"
                          >
                            Calcular total ({formatMoney(parseFloat(amount) * parseInt(totalInstallments), profile.currencySymbol)})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-purple-100/60 text-purple-900 text-[11px] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-purple-700" />
                      <span>
                        Registrando <strong>Cuota {installmentNumber || 1} de {totalInstallments || 1}</strong> por <strong>{formatMoney(parseFloat(amount) || 0, profile.currencySymbol)}/mes</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-6 py-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-zinc-700 font-semibold">Gasto fijo mensual</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLeak}
                    onChange={(e) => setIsLeak(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-amber-700 font-semibold">Fuga / Gasto Hormiga</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Notas / Detalle opcional</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Salida con amigos, compra en 3 cuotas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xs"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Resumen Financiero Imprimible</h3>
                <p className="text-[11px] text-zinc-500">Perfil: {profile.name} ({profile.type})</p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4 border border-zinc-200 rounded-xl bg-zinc-50/50 text-xs">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-base text-zinc-900">ZENTAVO · ESTADO DE GASTOS</h4>
                  <p className="text-zinc-500">Generado el: {new Date().toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Total Egresos Registrados:</span>
                  <span className="text-lg font-extrabold text-zinc-900">{formatMoney(totalExpensesSum, profile.currencySymbol)}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-zinc-800 mb-2">Desglose por Categoría:</h5>
                <div className="space-y-1.5">
                  {categoryBreakdown.map((c) => (
                    <div key={c.category} className="flex justify-between text-zinc-700 py-1 border-b border-zinc-100">
                      <span>{c.category} ({c.count} items)</span>
                      <strong className="text-zinc-900">{formatMoney(c.total, profile.currencySymbol)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-zinc-800 mb-2">Últimos Gastos:</h5>
                <div className="space-y-1">
                  {filteredExpenses.slice(0, 15).map((e) => (
                    <div key={e.id} className="flex justify-between text-[11px] py-1 border-b border-zinc-100">
                      <span>
                        {e.date} · <strong>{e.title}</strong> {e.isInstallment ? `[Cuota ${e.installmentNumber || 1}/${e.totalInstallments || 1}]` : ''} ({e.category})
                      </span>
                      <span className="font-bold text-zinc-900">{formatMoney(e.amount, profile.currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
