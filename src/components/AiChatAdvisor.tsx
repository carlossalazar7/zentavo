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
  TrendingDown
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

  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome-1',
    role: 'model',
    content: totalIncome === 0 && expenses.length === 0 && debts.length === 0
      ? `¡Hola! Soy tu **Coach Financiero de Zentavo**. 

Tu panel está listo y limpio para comenzar:
- Puedes configurar tu **Sueldo e Ingresos** en Ajustes.
- Anotar tus **Gastos del Mes** para detectar fugas.
- Registrar tus **Deudas o Tarjetas** para calcular tu nivel de endeudamiento (DTI) y ver tu orden de pago óptimo.

¿En qué te gustaría que te ayude hoy? Puedes hacerme cualquier consulta financiera, preguntarme sobre estrategias de ahorro o cómo armar un presupuesto desde cero.`
      : `¡Hola! Soy tu **Coach Financiero de Zentavo**. 

He analizado tus datos actuales:
- **Sueldo Total:** ${formatMoney(totalIncome, profile.currencySymbol)}
- **Gastos del Mes:** ${formatMoney(totalExpenses, profile.currencySymbol)}
- **Carga de Deudas:** ${formatMoney(debtMetrics.totalBalance, profile.currencySymbol)} (${debtMetrics.dtiRatio}% de tu sueldo — Nivel **${debtMetrics.riskLevel}**)
- **Fugas detectadas:** ${moneyLeaks.length} categorías que podrías optimizar.

¿En qué te gustaría que te ayude hoy? Puedes preguntarme cómo recortar gastos específicos, qué estrategia de deuda seguir o cómo organizar tu próxima quincena.`,
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
    '¿Cómo armo mi fondo de emergencia si vivo con lo justo?',
    '¿Cómo aplico la regla 50/30/20 a mi sueldo real?',
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
        expensesList: expenses.slice(0, 20).map((e) => ({
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
        content: `⚠️ **Ocurrió un error:** ${err.message || 'No se pudo contactar al asesor IA. Verifica tu conexión.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([initialWelcomeMessage]);
    saveToStorage(chatStorageKey, [initialWelcomeMessage]);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col h-[780px] max-h-[85vh] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center text-white border border-zinc-700/80 shadow-xs">
            <ZentavoIcon size={38} className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-base text-white">Coach Financiero Zentavo</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Conectado a tus números: Sueldo {formatMoney(totalIncome, profile.currencySymbol)} · DTI {debtMetrics.dtiRatio}%
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs flex items-center space-x-1 transition-colors"
          title="Reiniciar conversación"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center space-x-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <Lightbulb className="w-3.5 h-3.5 text-zinc-600" />
          <span>Preguntas Rápidas:</span>
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
                <div
                  className={`text-[10px] pt-1 text-right ${
                    isUser ? 'text-zinc-400' : 'text-zinc-400'
                  }`}
                >
                  {msg.timestamp}
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
            placeholder="Pregúntale a tu asesor (ej: ¿Cómo salir de mi tarjeta más cara?)..."
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
