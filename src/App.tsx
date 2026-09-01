import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Expense, Debt, SalaryProfile, SalaryAllocationPlan, AIDiagnosisResult, ChatMessage } from './types';
import { 
  DEFAULT_SALARY_PROFILE, 
  INITIAL_EXPENSES, 
  INITIAL_DEBTS, 
  PRESET_SALARY_PLANS 
} from './data/defaultData';
import { 
  STORAGE_KEYS, 
  loadFromStorage, 
  saveToStorage, 
  clearAllStorage,
  exportBackupData 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExpenseTrackerView } from './components/ExpenseTrackerView';
import { CostReductionView } from './components/CostReductionView';
import { DebtManagerView } from './components/DebtManagerView';
import { SalaryDistributorView } from './components/SalaryDistributorView';
import { AiChatAdvisor } from './components/AiChatAdvisor';
import { ProfileModal } from './components/ProfileModal';
import { 
  calculateTotalIncome, 
  calculateDebtMetrics, 
  detectMoneyLeaks 
} from './utils/financeCalculators';

export default function App() {
  // Load state from localStorage with safe fallback defaults
  const [profile, setProfile] = useState<SalaryProfile>(() => 
    loadFromStorage<SalaryProfile>(STORAGE_KEYS.PROFILE, DEFAULT_SALARY_PROFILE)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() => 
    loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );

  const [debts, setDebts] = useState<Debt[]>(() => 
    loadFromStorage<Debt[]>(STORAGE_KEYS.DEBTS, INITIAL_DEBTS)
  );

  const [selectedPlan, setSelectedPlan] = useState<SalaryAllocationPlan>(() => 
    loadFromStorage<SalaryAllocationPlan>(STORAGE_KEYS.SELECTED_PLAN, PRESET_SALARY_PLANS[1])
  );

  const [aiDiagnosis, setAiDiagnosis] = useState<AIDiagnosisResult | null>(() => 
    loadFromStorage<AIDiagnosisResult | null>(STORAGE_KEYS.AI_DIAGNOSIS, null)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => 
    loadFromStorage<ActiveTab>(STORAGE_KEYS.ACTIVE_TAB, 'dashboard')
  );

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Auto-sync with localStorage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROFILE, profile);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [profile]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [expenses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DEBTS, debts);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [debts]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_PLAN, selectedPlan);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [selectedPlan]);

  useEffect(() => {
    if (aiDiagnosis) {
      saveToStorage(STORAGE_KEYS.AI_DIAGNOSIS, aiDiagnosis);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AI_DIAGNOSIS);
    }
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [aiDiagnosis]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Handlers for Expenses
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setExpenses((prev) => [created, ...prev]);
  };

  const handleAddMultipleExpenses = (newExpenses: Omit<Expense, 'id'>[]) => {
    const createdList: Expense[] = newExpenses.map((exp, idx) => ({
      ...exp,
      id: `exp-${Date.now()}-${idx}`,
    }));
    setExpenses((prev) => [...createdList, ...prev]);
  };

  const handleUpdateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Handlers for Debts
  const handleAddDebt = (newDebt: Omit<Debt, 'id'>) => {
    const created: Debt = {
      ...newDebt,
      id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setDebts((prev) => [...prev, created]);
  };

  const handleUpdateDebt = (id: string, updated: Partial<Debt>) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  const handleDeleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // Reset demo / all data
  const handleResetData = () => {
    clearAllStorage();
    setProfile(DEFAULT_SALARY_PROFILE);
    setExpenses(INITIAL_EXPENSES);
    setDebts(INITIAL_DEBTS);
    setSelectedPlan(PRESET_SALARY_PLANS[1]);
    setAiDiagnosis(null);
    setActiveTab('dashboard');
  };

  // Import external JSON
  const handleImportData = (data: { profile?: SalaryProfile; expenses?: Expense[]; debts?: Debt[]; selectedPlan?: SalaryAllocationPlan; aiDiagnosis?: AIDiagnosisResult | null }) => {
    if (data.profile) setProfile(data.profile);
    if (Array.isArray(data.expenses)) setExpenses(data.expenses);
    if (Array.isArray(data.debts)) setDebts(data.debts);
    if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
    if (data.aiDiagnosis !== undefined) setAiDiagnosis(data.aiDiagnosis);
  };

  // Computed metrics for badges
  const totalIncome = calculateTotalIncome(profile);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);
  const moneyLeaks = detectMoneyLeaks(expenses);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-zinc-200">
      {/* Top Fixed Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        dtiRatio={debtMetrics.dtiRatio}
        totalLeaksCount={moneyLeaks.length}
        lastSavedTime={lastSavedTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            expenses={expenses}
            debts={debts}
            profile={profile}
            setActiveTab={setActiveTab}
            onOpenAddExpense={() => setActiveTab('expenses')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTrackerView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onAddMultipleExpenses={handleAddMultipleExpenses}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            profile={profile}
          />
        )}

        {activeTab === 'cost-reduction' && (
          <CostReductionView
            expenses={expenses}
            debts={debts}
            profile={profile}
            aiDiagnosis={aiDiagnosis}
            onSaveAiDiagnosis={(diag) => setAiDiagnosis(diag)}
          />
        )}

        {activeTab === 'debts' && (
          <DebtManagerView
            debts={debts}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            profile={profile}
          />
        )}

        {activeTab === 'salary-distribution' && (
          <SalaryDistributorView
            profile={profile}
            expenses={expenses}
            aiDiagnosis={aiDiagnosis}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onUpdateProfile={(updated) => setProfile((p) => ({ ...p, ...updated }))}
          />
        )}

        {activeTab === 'ai-coach' && (
          <AiChatAdvisor
            profile={profile}
            expenses={expenses}
            debts={debts}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-zinc-700">Zentavo · Control de Gastos & Sueldo</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              ✓ Guardado en tu dispositivo
            </span>
          </div>
          <span className="text-zinc-400">Tus datos nunca se pierden al recargar · Almacenamiento local persistente</span>
        </div>
      </footer>

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        expenses={expenses}
        debts={debts}
        selectedPlan={selectedPlan}
        aiDiagnosis={aiDiagnosis}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    </div>
  );
}
