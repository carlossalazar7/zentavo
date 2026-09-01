import { 
  SalaryProfile, 
  Expense, 
  Debt, 
  SalaryAllocationPlan, 
  AIDiagnosisResult, 
  ChatMessage, 
  ActiveTab 
} from '../types';
import { 
  DEFAULT_SALARY_PROFILE, 
  INITIAL_EXPENSES, 
  INITIAL_DEBTS, 
  PRESET_SALARY_PLANS 
} from '../data/defaultData';

export const STORAGE_KEYS = {
  PROFILE: 'zentavo_profile_v1',
  EXPENSES: 'zentavo_expenses_v1',
  DEBTS: 'zentavo_debts_v1',
  SELECTED_PLAN: 'zentavo_selected_plan_v1',
  AI_DIAGNOSIS: 'zentavo_ai_diagnosis_v1',
  CHAT_MESSAGES: 'zentavo_chat_messages_v1',
  ACTIVE_TAB: 'zentavo_active_tab_v1',
  LAST_SAVED: 'zentavo_last_saved_timestamp',
};

// Legacy keys to migrate from if present
const LEGACY_KEYS: Record<string, string[]> = {
  [STORAGE_KEYS.PROFILE]: ['finanzas_claras_profile_v2', 'zentavo_profile'],
  [STORAGE_KEYS.EXPENSES]: ['finanzas_claras_expenses_v2', 'zentavo_expenses'],
  [STORAGE_KEYS.DEBTS]: ['finanzas_claras_debts_v2', 'zentavo_debts'],
  [STORAGE_KEYS.SELECTED_PLAN]: ['finanzas_claras_selected_plan_v2', 'zentavo_selected_plan'],
  [STORAGE_KEYS.AI_DIAGNOSIS]: ['finanzas_claras_ai_diagnosis_v2', 'zentavo_ai_diagnosis'],
};

/**
 * Safely read and parse data from localStorage with fallbacks
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item) as T;
    }

    // Check legacy keys for migration
    const fallbacks = LEGACY_KEYS[key] || [];
    for (const fallbackKey of fallbacks) {
      const legacyItem = localStorage.getItem(fallbackKey);
      if (legacyItem !== null) {
        const parsed = JSON.parse(legacyItem) as T;
        // Migrate to new key
        saveToStorage(key, parsed);
        return parsed;
      }
    }
  } catch (error) {
    console.warn(`[Zentavo Storage] Error loading key "${key}" from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Safely serialize and write data to localStorage
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    return true;
  } catch (error) {
    console.error(`[Zentavo Storage] Error saving key "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Zentavo Storage] Error removing key "${key}":`, error);
  }
}

/**
 * Clear all Zentavo application data from localStorage
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    Object.values(LEGACY_KEYS).flat().forEach((k) => localStorage.removeItem(k));
  } catch (error) {
    console.error('[Zentavo Storage] Error clearing storage:', error);
  }
}

/**
 * Export all current state to a backup object
 */
export function exportBackupData(
  profile: SalaryProfile,
  expenses: Expense[],
  debts: Debt[],
  selectedPlan: SalaryAllocationPlan,
  aiDiagnosis: AIDiagnosisResult | null,
  chatMessages?: ChatMessage[]
) {
  return {
    version: '1.0',
    app: 'Zentavo',
    exportedAt: new Date().toISOString(),
    profile,
    expenses,
    debts,
    selectedPlan,
    aiDiagnosis,
    chatMessages: chatMessages || [],
  };
}
