import { 
  UserProfile,
  SalaryProfile, 
  Expense, 
  Debt, 
  SalaryAllocationPlan, 
  AIDiagnosisResult, 
  ChatMessage, 
  ActiveTab 
} from '../types';
import { 
  DEFAULT_PROFILES,
  DEFAULT_SALARY_PROFILE, 
  INITIAL_EXPENSES, 
  INITIAL_DEBTS, 
  PRESET_SALARY_PLANS 
} from '../data/defaultData';

export const STORAGE_KEYS = {
  PROFILES_V2: 'zentavo_profiles_v2',
  ACTIVE_PROFILE_ID: 'zentavo_active_profile_id_v2',
  ACTIVE_TAB: 'zentavo_active_tab_v1',
  CHAT_MESSAGES: 'zentavo_chat_messages_v2',
  LAST_SAVED: 'zentavo_last_saved_timestamp',
  // Legacy v1 keys
  LEGACY_PROFILE: 'zentavo_profile_v1',
  LEGACY_EXPENSES: 'zentavo_expenses_v1',
  LEGACY_DEBTS: 'zentavo_debts_v1',
  LEGACY_SELECTED_PLAN: 'zentavo_selected_plan_v1',
  LEGACY_AI_DIAGNOSIS: 'zentavo_ai_diagnosis_v1',
  LEGACY_CHAT_MESSAGES: 'zentavo_chat_messages_v1',
};

/**
 * Safely read and parse data from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item) as T;
    }
  } catch (error) {
    console.warn(`[Zentavo Storage] Error loading key "${key}":`, error);
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
    console.error(`[Zentavo Storage] Error saving key "${key}":`, error);
    return false;
  }
}

/**
 * Load all user profiles with automatic migration from v1 legacy single-profile structure
 */
export function loadProfilesAndActive(): { profiles: UserProfile[]; activeProfileId: string } {
  try {
    // 1. Try loading v2 multi-profiles
    const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES_V2);
    const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);

    if (storedProfiles) {
      const parsedProfiles: UserProfile[] = JSON.parse(storedProfiles);
      if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
        const validActiveId = storedActiveId && parsedProfiles.some(p => p.id === storedActiveId)
          ? storedActiveId
          : parsedProfiles[0].id;
        return {
          profiles: parsedProfiles,
          activeProfileId: validActiveId,
        };
      }
    }

    // 2. Check for legacy v1 data to migrate
    const legacyProfileRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_PROFILE) 
      || localStorage.getItem('finanzas_claras_profile_v2')
      || localStorage.getItem('zentavo_profile');

    if (legacyProfileRaw) {
      const legacyProfile = JSON.parse(legacyProfileRaw);
      const legacyExpenses = loadFromStorage<Expense[]>(STORAGE_KEYS.LEGACY_EXPENSES, INITIAL_EXPENSES);
      const legacyDebts = loadFromStorage<Debt[]>(STORAGE_KEYS.LEGACY_DEBTS, INITIAL_DEBTS);
      const legacyPlan = loadFromStorage<SalaryAllocationPlan>(STORAGE_KEYS.LEGACY_SELECTED_PLAN, PRESET_SALARY_PLANS[0]);
      const legacyAi = loadFromStorage<AIDiagnosisResult | null>(STORAGE_KEYS.LEGACY_AI_DIAGNOSIS, null);
      const legacyChat = loadFromStorage<ChatMessage[]>(STORAGE_KEYS.LEGACY_CHAT_MESSAGES, []);

      const migratedPersonalProfile: UserProfile = {
        id: 'profile-personal',
        name: legacyProfile.name || 'Finanzas Personales',
        type: 'Personal',
        icon: 'User',
        colorTheme: 'emerald',
        description: 'Finanzas y presupuesto del hogar',
        monthlySalary: legacyProfile.monthlySalary || 0,
        extraIncome: legacyProfile.extraIncome || 0,
        payFrequency: legacyProfile.payFrequency || 'Mensual',
        currency: legacyProfile.currency || 'USD',
        currencySymbol: legacyProfile.currencySymbol || '$',
        emergencyFundCurrent: legacyProfile.emergencyFundCurrent || 0,
        emergencyFundGoal: legacyProfile.emergencyFundGoal || 0,
        expenses: Array.isArray(legacyExpenses) ? legacyExpenses : [],
        debts: Array.isArray(legacyDebts) ? legacyDebts : [],
        selectedPlan: legacyPlan,
        aiDiagnosis: legacyAi,
        chatMessages: legacyChat,
        createdAt: new Date().toISOString(),
      };

      const initialProfiles = [migratedPersonalProfile, ...DEFAULT_PROFILES.slice(1)];
      saveProfiles(initialProfiles, migratedPersonalProfile.id);

      return {
        profiles: initialProfiles,
        activeProfileId: migratedPersonalProfile.id,
      };
    }
  } catch (error) {
    console.error('[Zentavo Storage] Error loading profiles:', error);
  }

  // 3. Fallback to default presets
  const initial = [...DEFAULT_PROFILES];
  saveProfiles(initial, initial[0].id);
  return {
    profiles: initial,
    activeProfileId: initial[0].id,
  };
}

/**
 * Save all profiles and active profile ID
 */
export function saveProfiles(profiles: UserProfile[], activeProfileId: string): void {
  saveToStorage(STORAGE_KEYS.PROFILES_V2, profiles);
  saveToStorage(STORAGE_KEYS.ACTIVE_PROFILE_ID, activeProfileId);
}

/**
 * Clear all data
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.clear();
  } catch (error) {
    console.error('[Zentavo Storage] Error clearing storage:', error);
  }
}

/**
 * Export a single profile as a JSON object
 */
export function exportSingleProfileBackup(profile: UserProfile) {
  return {
    version: '2.0',
    type: 'single_profile',
    app: 'Zentavo',
    exportedAt: new Date().toISOString(),
    profile,
  };
}

/**
 * Export all workspace profiles
 */
export function exportAllProfilesBackup(profiles: UserProfile[], activeProfileId: string) {
  return {
    version: '2.0',
    type: 'all_profiles',
    app: 'Zentavo',
    exportedAt: new Date().toISOString(),
    activeProfileId,
    profiles,
  };
}

/**
 * Import and validate JSON backup data (supports v1, v2 single, v2 all)
 */
export function importBackupData(
  jsonString: string,
  currentProfiles: UserProfile[]
): {
  success: boolean;
  message: string;
  profiles?: UserProfile[];
  activeProfileId?: string;
} {
  try {
    const data = JSON.parse(jsonString);

    // Case A: Full v2 workspace backup
    if (data.type === 'all_profiles' && Array.isArray(data.profiles) && data.profiles.length > 0) {
      const validProfiles = data.profiles.filter((p: any) => p && typeof p.name === 'string');
      if (validProfiles.length === 0) {
        return { success: false, message: 'El archivo no contiene perfiles válidos.' };
      }
      const activeId = data.activeProfileId && validProfiles.some((p: any) => p.id === data.activeProfileId)
        ? data.activeProfileId
        : validProfiles[0].id;

      return {
        success: true,
        message: `Se importaron exitosamente ${validProfiles.length} perfiles.`,
        profiles: validProfiles,
        activeProfileId: activeId,
      };
    }

    // Case B: Single v2 profile backup
    if (data.type === 'single_profile' && data.profile && typeof data.profile.name === 'string') {
      const importedProfile: UserProfile = {
        ...data.profile,
        id: `profile-${Date.now()}`,
        name: `${data.profile.name} (Importado)`,
      };
      const updatedProfiles = [...currentProfiles, importedProfile];
      return {
        success: true,
        message: `Se importó el perfil "${importedProfile.name}" correctamente.`,
        profiles: updatedProfiles,
        activeProfileId: importedProfile.id,
      };
    }

    // Case C: Legacy v1 backup
    if (data.profile && typeof data.profile === 'object') {
      const legacyProfile: UserProfile = {
        id: `profile-imported-${Date.now()}`,
        name: data.profile.name || 'Perfil Importado',
        type: 'Personal',
        icon: 'User',
        colorTheme: 'emerald',
        monthlySalary: data.profile.monthlySalary || 0,
        extraIncome: data.profile.extraIncome || 0,
        payFrequency: data.profile.payFrequency || 'Mensual',
        currency: data.profile.currency || 'USD',
        currencySymbol: data.profile.currencySymbol || '$',
        emergencyFundCurrent: data.profile.emergencyFundCurrent || 0,
        emergencyFundGoal: data.profile.emergencyFundGoal || 0,
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        debts: Array.isArray(data.debts) ? data.debts : [],
        selectedPlan: data.selectedPlan || PRESET_SALARY_PLANS[0],
        aiDiagnosis: data.aiDiagnosis || null,
        chatMessages: Array.isArray(data.chatMessages) ? data.chatMessages : [],
        createdAt: new Date().toISOString(),
      };
      const updatedProfiles = [...currentProfiles, legacyProfile];
      return {
        success: true,
        message: `Se importó el respaldo v1 como un nuevo perfil "${legacyProfile.name}".`,
        profiles: updatedProfiles,
        activeProfileId: legacyProfile.id,
      };
    }

    return { success: false, message: 'Formato de archivo JSON no reconocido.' };
  } catch (err: any) {
    return { success: false, message: 'Error al procesar el archivo JSON: ' + (err.message || 'Formato inválido') };
  }
}
