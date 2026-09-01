import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  Expense, 
  Debt, 
  UserProfile, 
  SalaryAllocationPlan, 
  AIDiagnosisResult, 
  CategoryBudget, 
  SavingsGoal, 
  BillReminder 
} from './types';
import { 
  DEFAULT_PROFILES, 
  PRESET_SALARY_PLANS 
} from './data/defaultData';
import { 
  STORAGE_KEYS, 
  loadFromStorage, 
  saveToStorage, 
  loadProfilesAndActive, 
  saveProfiles, 
  clearAllStorage 
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
  // Load profiles and active profile ID from storage (with automated v1->v2 migration)
  const [profileState, setProfileState] = useState<{ profiles: UserProfile[]; activeProfileId: string }>(() => {
    return loadProfilesAndActive();
  });

  const { profiles, activeProfileId } = profileState;

  // Active profile fallback
  const activeProfile: UserProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  const expenses: Expense[] = activeProfile.expenses || [];
  const debts: Debt[] = activeProfile.debts || [];
  const selectedPlan: SalaryAllocationPlan = activeProfile.selectedPlan || PRESET_SALARY_PLANS[1];
  const aiDiagnosis: AIDiagnosisResult | null = activeProfile.aiDiagnosis || null;
  const categoryBudgets: CategoryBudget[] = activeProfile.categoryBudgets || [];
  const savingsGoals: SavingsGoal[] = activeProfile.savingsGoals || [];
  const billReminders: BillReminder[] = activeProfile.billReminders || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => 
    loadFromStorage<ActiveTab>(STORAGE_KEYS.ACTIVE_TAB, 'dashboard')
  );

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'edit' | 'manage' | 'create' | 'backup'>('edit');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Auto-sync active tab
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Centralized updater for mutating the active profile
  const updateActiveProfileData = (updater: (prev: UserProfile) => UserProfile) => {
    setProfileState((prevState) => {
      const updatedProfiles = prevState.profiles.map((p) => {
        if (p.id === prevState.activeProfileId) {
          return updater(p);
        }
        return p;
      });

      saveProfiles(updatedProfiles, prevState.activeProfileId);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        ...prevState,
        profiles: updatedProfiles,
      };
    });
  };

  // Switch profile handler
  const handleSelectProfile = (newId: string) => {
    if (newId === activeProfileId) return;
    setProfileState((prev) => {
      saveProfiles(prev.profiles, newId);
      return {
        ...prev,
        activeProfileId: newId,
      };
    });
  };

  // Create new profile handler
  const handleCreateProfile = (newProfile: UserProfile) => {
    setProfileState((prev) => {
      const nextProfiles = [...prev.profiles, newProfile];
      saveProfiles(nextProfiles, newProfile.id);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        profiles: nextProfiles,
        activeProfileId: newProfile.id,
      };
    });
  };

  // Delete profile handler
  const handleDeleteProfile = (profileId: string) => {
    setProfileState((prev) => {
      if (prev.profiles.length <= 1) return prev;
      const nextProfiles = prev.profiles.filter((p) => p.id !== profileId);
      const nextActiveId = prev.activeProfileId === profileId ? nextProfiles[0].id : prev.activeProfileId;
      saveProfiles(nextProfiles, nextActiveId);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        profiles: nextProfiles,
        activeProfileId: nextActiveId,
      };
    });
  };

  // Duplicate profile handler
  const handleDuplicateProfile = (profileId: string) => {
    const source = profiles.find((p) => p.id === profileId);
    if (!source) return;

    const duplicated: UserProfile = {
      ...source,
      id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `${source.name} (Copia)`,
      expenses: source.expenses.map((e) => ({ ...e, id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` })),
      debts: source.debts.map((d) => ({ ...d, id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` })),
      categoryBudgets: source.categoryBudgets ? [...source.categoryBudgets] : undefined,
      savingsGoals: source.savingsGoals ? [...source.savingsGoals] : undefined,
      billReminders: source.billReminders ? [...source.billReminders] : undefined,
    };

    setProfileState((prev) => {
      const nextProfiles = [...prev.profiles, duplicated];
      saveProfiles(nextProfiles, duplicated.id);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        profiles: nextProfiles,
        activeProfileId: duplicated.id,
      };
    });
  };

  // Save changes to active profile settings
  const handleSaveActiveProfile = (updated: Partial<UserProfile>) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // Handlers for Expenses on active profile
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateActiveProfileData((prev) => ({
      ...prev,
      expenses: [created, ...(prev.expenses || [])],
    }));
  };

  const handleAddMultipleExpenses = (newExpenses: Omit<Expense, 'id'>[]) => {
    const createdList: Expense[] = newExpenses.map((exp, idx) => ({
      ...exp,
      id: `exp-${Date.now()}-${idx}`,
    }));
    updateActiveProfileData((prev) => ({
      ...prev,
      expenses: [...createdList, ...(prev.expenses || [])],
    }));
  };

  const handleUpdateExpense = (id: string, updated: Partial<Expense>) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }));
  };

  const handleDeleteExpense = (id: string) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((e) => e.id !== id),
    }));
  };

  // Handlers for Debts on active profile
  const handleAddDebt = (newDebt: Omit<Debt, 'id'>) => {
    const created: Debt = {
      ...newDebt,
      id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateActiveProfileData((prev) => ({
      ...prev,
      debts: [...(prev.debts || []), created],
    }));
  };

  const handleUpdateDebt = (id: string, updated: Partial<Debt>) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      debts: (prev.debts || []).map((d) => (d.id === id ? { ...d, ...updated } : d)),
    }));
  };

  const handleDeleteDebt = (id: string) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      debts: (prev.debts || []).filter((d) => d.id !== id),
    }));
  };

  // Handler for Category Budgets
  const handleUpdateCategoryBudgets = (budgets: CategoryBudget[]) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      categoryBudgets: budgets,
    }));
  };

  // Handler for Savings Goals
  const handleUpdateSavingsGoals = (goals: SavingsGoal[]) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      savingsGoals: goals,
    }));
  };

  // Handler for Bill Reminders
  const handleUpdateBillReminders = (reminders: BillReminder[]) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      billReminders: reminders,
    }));
  };

  // Handler for Salary Distribution Plan
  const handleSelectPlan = (plan: SalaryAllocationPlan) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      selectedPlan: plan,
    }));
  };

  // Handler for AI Diagnosis
  const handleSaveAiDiagnosis = (diag: AIDiagnosisResult | null) => {
    updateActiveProfileData((prev) => ({
      ...prev,
      aiDiagnosis: diag,
    }));
  };

  // Reset active profile data or all profiles
  const handleResetActiveProfile = () => {
    updateActiveProfileData((prev) => ({
      ...prev,
      expenses: [],
      debts: [],
      aiDiagnosis: null,
      selectedPlan: PRESET_SALARY_PLANS[1],
      categoryBudgets: [],
      savingsGoals: [],
      billReminders: [],
    }));
  };

  const handleResetAllData = () => {
    clearAllStorage();
    const defaults = loadProfilesAndActive();
    setProfileState(defaults);
    setActiveTab('dashboard');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Import backup data (supports both full multi-profile and single profile)
  const handleImportProfiles = (importedProfiles: UserProfile[], nextActiveId?: string) => {
    const validId = nextActiveId && importedProfiles.some((p) => p.id === nextActiveId)
      ? nextActiveId
      : importedProfiles[0]?.id || DEFAULT_PROFILES[0].id;

    saveProfiles(importedProfiles, validId);
    setProfileState({
      profiles: importedProfiles,
      activeProfileId: validId,
    });
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleOpenProfileModal = (tab: 'edit' | 'manage' | 'create' | 'backup' = 'edit') => {
    setProfileModalInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  // Computed metrics for badges
  const totalIncome = calculateTotalIncome(activeProfile);
  const debtMetrics = calculateDebtMetrics(debts, totalIncome);
  const moneyLeaks = detectMoneyLeaks(expenses);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-zinc-200">
      {/* Top Fixed Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onOpenProfileModal={handleOpenProfileModal}
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
            profile={activeProfile}
            setActiveTab={setActiveTab}
            onOpenAddExpense={() => setActiveTab('expenses')}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTrackerView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onAddMultipleExpenses={handleAddMultipleExpenses}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            profile={activeProfile}
            categoryBudgets={categoryBudgets}
            onUpdateCategoryBudgets={handleUpdateCategoryBudgets}
          />
        )}

        {activeTab === 'cost-reduction' && (
          <CostReductionView
            expenses={expenses}
            debts={debts}
            profile={activeProfile}
            aiDiagnosis={aiDiagnosis}
            onSaveAiDiagnosis={handleSaveAiDiagnosis}
          />
        )}

        {activeTab === 'debts' && (
          <DebtManagerView
            debts={debts}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            profile={activeProfile}
            billReminders={billReminders}
            onUpdateBillReminders={handleUpdateBillReminders}
          />
        )}

        {activeTab === 'salary-distribution' && (
          <SalaryDistributorView
            profile={activeProfile}
            expenses={expenses}
            aiDiagnosis={aiDiagnosis}
            selectedPlan={selectedPlan}
            onSelectPlan={handleSelectPlan}
            onUpdateProfile={(updated) => handleSaveActiveProfile(updated)}
            savingsGoals={savingsGoals}
            onUpdateSavingsGoals={handleUpdateSavingsGoals}
          />
        )}

        {activeTab === 'ai-coach' && (
          <AiChatAdvisor
            profile={activeProfile}
            expenses={expenses}
            debts={debts}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-zinc-700">Zentavo · Control Multi-Perfil de Gastos & Sueldo</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              ✓ {profiles.length} {profiles.length === 1 ? 'Perfil Activo' : 'Perfiles Configurados'}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-zinc-400">
            <span>Perfil actual: <strong className="text-zinc-700">{activeProfile.name}</strong> ({activeProfile.type})</span>
            <span>·</span>
            <span>Almacenamiento local persistente</span>
          </div>
        </div>
      </footer>

      {/* Multi-Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        initialTab={profileModalInitialTab}
        onSelectProfile={handleSelectProfile}
        onSaveProfile={handleSaveActiveProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onDuplicateProfile={handleDuplicateProfile}
        onImportProfiles={handleImportProfiles}
        onResetActiveProfile={handleResetActiveProfile}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}
