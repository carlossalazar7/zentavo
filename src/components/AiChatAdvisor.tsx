import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Trash2, 
  CornerDownLeft, 
  CheckCircle2, 
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  TrendingDown,
  Calculator,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, SalaryProfile, Expense, Debt } from '../types';
import { 
  formatMoney, 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateDebtMetrics, 
  detectMoneyLeaks 
} from '../utils/financeCalculators';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { ZentavoIcon } from './ZentavoLogo';

interface AiChatAdvisorProps {
  profile: SalaryProfile;
  expenses: Expense[];
  debts: Debt[];
}

export const AiChatAdvisor: React.FC<AiChatAdvisorProps> = ({
  profile,
  expenses,
  debts,
}) => {
  const totalIncome = calculateTotalIncome(profile);
  const totalExpenses = calculateTotalExpenses(expenses);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);
  const moneyLeaks = detectMoneyLeaks(expenses);

  // Hourly wage calculation (160 working hours a month standard)
  const hourlyWage = totalIncome > 0 ? totalIncome / 160 : 0;

  // Affordability Calculator State
  const [showAffordabilityCalc, setShowAffordabilityCalc] = useState(false);
  const [purchaseTitle, setPurchaseTitle] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome-1',
    role: 'model',
    content: totalIncome === 0 && expenses.length === 0 && debts.length === 0
      ? `¡Hola! Soy tu **Coach Financiero Zentavo SV**. 

Tu panel está listo y limpio para comenzar:
- Puedes configurar tu **Sueldo e Ingresos** en Ajustes.
- Anotar tus **Gastos del Mes** para detectar fugas.
- Registrar tus **Deudas o Tarjetas** para calcular tu nivel de endeudamiento (DTI) y ver tu orden de pago óptimo.

¿En qué te gustaría que te ayude hoy? Puedes hacerme cualquier consulta financiera, preguntarme sobre estrategias de ahorro o cómo armar un presupuesto desde cero.`
      : `¡Hola! Soy tu **Coach Financiero Zentavo SV**. 

He analizado los números de tu perfil **"${profile.name}"**:
- **Ingreso Total:** ${formatMoney(totalIncome, profile.currencySymbol)}
- **Gastos del Mes:** ${formatMoney(totalExpenses, profile.currencySymbol)}
- **Carga de Deudas:** ${formatMoney(debtMetrics.totalBalance, profile.currencySymbol)} (${debtMetrics.dtiRatio}% de tu sueldo — Nivel **${debtMetrics.riskLevel}**)
- **Fugas detectadas:** ${moneyLeaks.length} categorías con oportunidad de recorte.

¿En qué te gustaría que nos enfoquemos hoy? Puedes preguntarme cómo organizar tu quincena, qué deuda pagar primero o utilizar la calculadora de compras abajo.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const chatStorageKey = `${STORAGE_KEYS.CHAT_MESSAGES}_${profile.id}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadFromStorage<ChatMessage[]>(chatStorageKey, []);
    return saved.length > 0 ? saved : [initialWelcomeMessage];
  });

  // Reload chat when active profile changes
  useEffect(() => {
    const saved = loadFromStorage<ChatMessage[]>(chatStorageKey, []);
    setMessages(saved.length > 0 ? saved : [initialWelcomeMessage]);
  }, [profile.id]);

  // Sync messages with localStorage for active profile
  useEffect(() => {
    saveToStorage(chatStorageKey, messages);
  }, [messages, chatStorageKey]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickQuestions = [
    '¿Cómo organizo mi sueldo si las deudas superan el 30%?',
    '¿En qué gastos específicos puedo recortar $100 al mes?',
    '¿Qué deuda me conviene liquidar primero y por qué?',
    'Guion para llamar al banco y pedir baja de intereses',
    '¿Cómo armo mi fondo de emergencia si vivo con lo justo?',
    '¿Cómo aplico la regla 50/30/20 a mi sueldo real?',
  ];

  // Follow-up suggestion chips
  const followUpChips = [
    '¿Cómo aplico esto a mi próxima quincena?',
    '¿Qué pasa si tengo un ingreso imprevisto extra?',
    'Explícame la diferencia entre Bola de Nieve y Avalancha',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build context
      const financialContext = {
        profileName: profile.name,
        profileType: profile.type,
        salary: profile.monthlySalary,
        extraIncome: profile.extraIncome,
        currency: profile.currencySymbol,
        payFrequency: profile.payFrequency,
        totalExpenses,
        debtsSummary: {
          totalDebt: debtMetrics.totalBalance,
          monthlyCommitted: debtMetrics.monthlyCommittedPayment,
          dtiRatio: debtMetrics.dtiRatio,
          riskLevel: debtMetrics.riskLevel,
          debtsList: debts.map((d) => ({
            name: d.name,
            balance: d.totalBalance,
            payment: d.monthlyPayment,
            rate: d.interestRate,
          })),
        },
        expensesList: expenses.slice(0, 25).map((e) => ({
          title: e.title,
          amount: e.amount,
          category: e.category,
          type: e.type,
          isLeak: !!e.isLeak,
        })),
        leaks: moneyLeaks.map((l) => ({
          title: l.title,
          amount: l.totalAmount,
          reason: l.reason,
        })),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          financialContext,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al comunicarse con el asesor IA.');
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No pude generar una respuesta clara. Intenta reformular tu pregunta.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Ocurrió un error:** ${err.message || 'No se pudo contactar al asesor IA. Verifica tu conexión o intenta más tarde.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('¿Deseas reiniciar la conversación de este perfil?')) {
      setMessages([initialWelcomeMessage]);
      saveToStorage(chatStorageKey, [initialWelcomeMessage]);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Affordability analysis calculations
  const numPurchaseAmount = Number(purchaseAmount) || 0;
  const purchasePctOfIncome = totalIncome > 0 ? (numPurchaseAmount / totalIncome) * 100 : 0;
  const purchaseHoursOfWork = hourlyWage > 0 ? numPurchaseAmount / hourlyWage : 0;
  const purchaseDaysOfWork = purchaseHoursOfWork / 8;

  let affordabilityVerdict: { color: string; label: string; explanation: string } = {
    color: 'emerald',
    label: '🟢 Compra Segura / Planificable',
    explanation: 'Representa menos del 5% de tu ingreso mensual y no compromete tus compromisos de deuda.',
  };

  if (numPurchaseAmount > 0) {
    if (debtMetrics.dtiRatio > 40 || purchasePctOfIncome > 20) {
      affordabilityVerdict = {
        color: 'rose',
        label: '🔴 Alto Impacto / Desaconsejado Ahora',
        explanation: `Representa el ${purchasePctOfIncome.toFixed(1)}% de tu sueldo y equivale a ${purchaseHoursOfWork.toFixed(0)} horas de trabajo. Con un DTI del ${debtMetrics.dtiRatio}%, este gasto retrasará el pago de tus deudas.`,
      };
    } else if (purchasePctOfIncome > 8 || debtMetrics.dtiRatio > 25) {
      affordabilityVerdict = {
        color: 'amber',
        label: '🟡 Precaución (Aplica regla de las 48h)',
        explanation: `Equivale a ${purchaseHoursOfWork.toFixed(0)} horas de trabajo (${purchaseDaysOfWork.toFixed(1)} días laborales). Espera 48 horas antes de comprar para evitar impulso.`,
      };
    }
  }

  const handleConsultAffordabilityInChat = () => {
    if (numPurchaseAmount <= 0) return;
    const item = purchaseTitle.trim() || 'esta compra';
    const text = `Estoy evaluando comprar "${item}" por ${formatMoney(numPurchaseAmount, profile.currencySymbol)} (equivale al ${purchasePctOfIncome.toFixed(1)}% de mi sueldo o ${purchaseHoursOfWork.toFixed(1)} horas de trabajo). ¿Me conviene hacerlo ahora considerando mis deudas y metas, o qué alternativa me recomiendas?`;
    handleSendMessage(text);
    setShowAffordabilityCalc(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col h-[820px] max-h-[85vh] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 filter drop-shadow-sm">
            <ZentavoIcon size={40} className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-base text-white">
                Coach Financiero Zentavo <span className="text-amber-400 font-extrabold text-xs">SV</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Perfil: <strong className="text-zinc-200">{profile.name}</strong> · Ingreso: {formatMoney(totalIncome, profile.currencySymbol)} · DTI: {debtMetrics.dtiRatio}%
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAffordabilityCalc(!showAffordabilityCalc)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              showAffordabilityCalc 
                ? 'bg-emerald-500 text-zinc-950 font-bold' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title="Calculadora ¿Puedo permitirme este gasto?"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">¿Puedo comprar esto?</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs flex items-center space-x-1 transition-colors"
            title="Reiniciar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Affordability Drawer Widget */}
      {showAffordabilityCalc && (
        <div className="bg-zinc-900 text-white p-4 border-b border-zinc-800 animate-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Calculator className="w-4 h-4" />
              <span>Calculadora de Compras Inteligentes & Horas de Trabajo</span>
            </span>
            <button onClick={() => setShowAffordabilityCalc(false)} className="text-xs text-zinc-400 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-300 block">¿Qué deseas comprar?</label>
              <input
                type="text"
                value={purchaseTitle}
                onChange={(e) => setPurchaseTitle(e.target.value)}
                placeholder="Ej: Celular nuevo, Zapatos..."
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-300 block">Precio ({profile.currencySymbol})</label>
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConsultAffordabilityInChat}
                disabled={numPurchaseAmount <= 0}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1 transition-all"
              >
                <span>Preguntar al Coach IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {numPurchaseAmount > 0 && (
            <div className="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white block">{affordabilityVerdict.label}</span>
                <p className="text-zinc-300 text-[11px]">{affordabilityVerdict.explanation}</p>
              </div>
              <div className="flex items-center space-x-3 shrink-0 text-right">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">Horas de Trabajo</span>
                  <span className="font-bold text-emerald-400">{purchaseHoursOfWork.toFixed(1)} hrs</span>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">% de tu Sueldo</span>
                  <span className="font-bold text-white">{purchasePctOfIncome.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center space-x-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <Lightbulb className="w-3.5 h-3.5 text-zinc-600" />
          <span>Consultas Rápidas:</span>
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-white hover:bg-zinc-100 hover:border-zinc-300 border border-zinc-200 text-xs text-zinc-700 whitespace-nowrap transition-all shadow-xs shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-800 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-400" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-zinc-900 text-white rounded-tr-none shadow-xs'
                    : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-tl-none space-y-2 shadow-xs'
                }`}
              >
                {/* Format content with bold, bullets, lines */}
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10px] text-zinc-400">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="hover:text-zinc-700 flex items-center space-x-1"
                      title="Copiar respuesta"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-xs text-zinc-700 font-medium">
                <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Calculando y analizando tus finanzas...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestion chips at bottom */}
        {!isLoading && messages.length > 1 && (
          <div className="pt-2 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Continuar:</span>
            {followUpChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-zinc-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pregúntale a tu coach (ej: ¿Cómo pagar mi tarjeta con interés del 32%?)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-xs shrink-0"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
