import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  User,
  Briefcase,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, ProfileType, SalaryAllocationPlan, Expense, Debt, AIDiagnosisResult } from '../types';
import { 
  CURRENCIES, 
  PROFILE_TYPES, 
  PROFILE_ICONS, 
  PROFILE_COLORS, 
  PRESET_SALARY_PLANS 
} from '../data/defaultData';
import { formatMoney } from '../utils/financeCalculators';
import { 
  exportSingleProfileBackup, 
  exportAllProfilesBackup, 
  importBackupData 
} from '../utils/storage';
import { ZentavoIcon } from './ZentavoLogo';
import { renderProfileIcon, getProfileColorBadge } from './ProfileSelector';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  activeProfile: UserProfile;
  initialTab?: 'edit' | 'manage' | 'create' | 'backup';
  onSelectProfile: (profileId: string) => void;
  onUpdateActiveProfile: (updatedProfile: Partial<UserProfile>) => void;
  onCreateProfile: (newProfile: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onDuplicateProfile: (profileId: string) => void;
  onImportProfiles: (profiles: UserProfile[], activeProfileId: string) => void;
  onResetActiveProfile: () => void;
  onResetAllData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  initialTab = 'edit',
  onSelectProfile,
  onUpdateActiveProfile,
  onCreateProfile,
  onDeleteProfile,
  onDuplicateProfile,
  onImportProfiles,
  onResetActiveProfile,
  onResetAllData,
}) => {
  if (!isOpen) return null;

  const [currentTab, setCurrentTab] = useState<'edit' | 'manage' | 'create' | 'backup'>(initialTab);

  // Edit Active Profile Form State
  const [name, setName] = useState(activeProfile.name);
  const [profileType, setProfileType] = useState<ProfileType>(activeProfile.type);
  const [icon, setIcon] = useState(activeProfile.icon || 'User');
  const [colorTheme, setColorTheme] = useState(activeProfile.colorTheme || 'emerald');
  const [description, setDescription] = useState(activeProfile.description || '');
  const [monthlySalary, setMonthlySalary] = useState(activeProfile.monthlySalary.toString());
  const [extraIncome, setExtraIncome] = useState(activeProfile.extraIncome.toString());
  const [payFrequency, setPayFrequency] = useState<UserProfile['payFrequency']>(activeProfile.payFrequency);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(activeProfile.currency);
  const [emergencyGoal, setEmergencyGoal] = useState(activeProfile.emergencyFundGoal.toString());
  const [emergencyCurrent, setEmergencyCurrent] = useState(activeProfile.emergencyFundCurrent.toString());

  // Create Profile Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<ProfileType>('Personal');
  const [newProfileIcon, setNewProfileIcon] = useState('User');
  const [newProfileColor, setNewProfileColor] = useState('emerald');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileSalary, setNewProfileSalary] = useState('0');
  const [newProfileExtra, setNewProfileExtra] = useState('0');
  const [newProfileCurrency, setNewProfileCurrency] = useState(activeProfile.currency);
  const [newProfileFrequency, setNewProfileFrequency] = useState<UserProfile['payFrequency']>('Mensual');
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileType | null>(null);

  // Import State
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Sync state whenever activeProfile or initialTab changes
  useEffect(() => {
    setName(activeProfile.name);
    setProfileType(activeProfile.type);
    setIcon(activeProfile.icon || 'User');
    setColorTheme(activeProfile.colorTheme || 'emerald');
    setDescription(activeProfile.description || '');
    setMonthlySalary(activeProfile.monthlySalary.toString());
    setExtraIncome(activeProfile.extraIncome.toString());
    setPayFrequency(activeProfile.payFrequency);
    setSelectedCurrencyCode(activeProfile.currency);
    setEmergencyGoal(activeProfile.emergencyFundGoal.toString());
    setEmergencyCurrent(activeProfile.emergencyFundCurrent.toString());
  }, [activeProfile]);

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  // Handle Save Active Profile
  const handleSaveActive = (e: React.FormEvent) => {
    e.preventDefault();
    const curObj = CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];

    onUpdateActiveProfile({
      name: name.trim() || 'Mi Perfil',
      type: profileType,
      icon,
      colorTheme,
      description,
      monthlySalary: parseFloat(monthlySalary) || 0,
      extraIncome: parseFloat(extraIncome) || 0,
      payFrequency,
      currency: curObj.code,
      currencySymbol: curObj.symbol,
      emergencyFundGoal: parseFloat(emergencyGoal) || 0,
      emergencyFundCurrent: parseFloat(emergencyCurrent) || 0,
      updatedAt: new Date().toISOString(),
    });

    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 800);
  };

  // Quick apply template for New Profile
  const handleSelectTemplate = (type: ProfileType) => {
    setSelectedTemplate(type);
    setNewProfileType(type);
    const typeInfo = PROFILE_TYPES.find(t => t.type === type);
    if (typeInfo) {
      setNewProfileName(type === 'Personal' ? 'Finanzas Familiares' : type === 'Trabajo' ? 'Trabajo Freelance' : type === 'Empresa' ? 'Mi Negocio / PyME' : 'Proyecto Inmuebles');
      setNewProfileIcon(typeInfo.defaultIcon);
      setNewProfileColor(typeInfo.defaultColor);
      setNewProfileDesc(typeInfo.description);
    }
  };

  // Handle Create New Profile
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const curObj = CURRENCIES.find((c) => c.code === newProfileCurrency) || CURRENCIES[0];
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim() || (newProfileType === 'Empresa' ? 'Nueva Empresa' : 'Nuevo Perfil'),
      type: newProfileType,
      icon: newProfileIcon,
      colorTheme: newProfileColor,
      description: newProfileDesc,
      monthlySalary: parseFloat(newProfileSalary) || 0,
      extraIncome: parseFloat(newProfileExtra) || 0,
      payFrequency: newProfileFrequency,
      currency: curObj.code,
      currencySymbol: curObj.symbol,
      emergencyFundCurrent: 0,
      emergencyFundGoal: 0,
      expenses: [],
      debts: [],
      selectedPlan: PRESET_SALARY_PLANS[0],
      aiDiagnosis: null,
      chatMessages: [],
      createdAt: new Date().toISOString(),
    };

    onCreateProfile(newProfile);
    setCurrentTab('edit');
  };

  // Export handlers
  const handleExportSingle = () => {
    const data = exportSingleProfileBackup(activeProfile);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentavo_perfil_${activeProfile.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const data = exportAllProfilesBackup(profiles, activeProfile.id);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentavo_todos_los_perfiles_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importBackupData(event.target?.result as string, profiles);
      if (result.success && result.profiles && result.activeProfileId) {
        onImportProfiles(result.profiles, result.activeProfileId);
        setImportStatus({ type: 'success', message: result.message });
        setTimeout(() => {
          setImportStatus(null);
          setCurrentTab('manage');
        }, 1200);
      } else {
        setImportStatus({ type: 'error', message: result.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200/80 bg-zinc-950 flex items-center justify-center shadow-xs">
              <ZentavoIcon size={28} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Gestión de Perfiles Financieros
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-700">
                  {profiles.length} {profiles.length === 1 ? 'Perfil' : 'Perfiles'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Alterna entre tus cuentas de Personal, Trabajo, Negocio o Empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 font-bold text-lg p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 px-6 bg-white gap-2 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setCurrentTab('edit')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              currentTab === 'edit'
                ? 'border-zinc-900 text-zinc-900 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Perfil Activo ({activeProfile.name})</span>
          </button>

          <button
            onClick={() => setCurrentTab('manage')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              currentTab === 'manage'
                ? 'border-zinc-900 text-zinc-900 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis Perfiles ({profiles.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('create')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              currentTab === 'create'
                ? 'border-zinc-900 text-zinc-900 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Crear Perfil</span>
          </button>

          <button
            onClick={() => setCurrentTab('backup')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              currentTab === 'backup'
                ? 'border-zinc-900 text-zinc-900 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Respaldar / Importar</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: EDIT ACTIVE PROFILE */}
          {currentTab === 'edit' && (
            <form onSubmit={handleSaveActive} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                    {renderProfileIcon(icon, 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">{name || 'Sin Nombre'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getProfileColorBadge(colorTheme)}`}>
                      {profileType}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('manage')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold transition-colors"
                >
                  Cambiar de Perfil
                </button>
              </div>

              {/* Profile Identity (Name, Type, Icon, Color) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Nombre del Perfil *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Finanzas Personales, Trabajo Freelance, Restaurante..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={profileType}
                    onChange={(e: any) => setProfileType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                  >
                    {PROFILE_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Icon & Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Ícono</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                  >
                    {PROFILE_ICONS.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.emoji} {ic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Etiqueta de Color</label>
                  <select
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                  >
                    {PROFILE_COLORS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency and Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Moneda Principal</label>
                  <select
                    value={selectedCurrencyCode}
                    onChange={(e) => setSelectedCurrencyCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Frecuencia de Cobro / Ingresos</label>
                  <select
                    value={payFrequency}
                    onChange={(e: any) => setPayFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                  >
                    <option value="Mensual">Mensual (1 cobro/cierre al mes)</option>
                    <option value="Quincenal">Quincenal (2 cobros/cierres al mes)</option>
                    <option value="Semanal">Semanal (4 cobros/cierres al mes)</option>
                  </select>
                </div>
              </div>

              {/* Incomes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    {profileType === 'Empresa' ? 'Facturación Neta Mensual *' : 'Sueldo Neto Fijo Mensual *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="1500.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    {profileType === 'Empresa' ? 'Ingresos Secundarios / Cobranzas' : 'Ingresos Extras Promedio'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={extraIncome}
                    onChange={(e) => setExtraIncome(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold text-zinc-900"
                  />
                </div>
              </div>

              {/* Emergency Reserve */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    {profileType === 'Empresa' ? 'Caja de Capital de Trabajo Actual' : 'Fondo de Emergencia Actual'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={emergencyCurrent}
                    onChange={(e) => setEmergencyCurrent(e.target.value)}
                    placeholder="300.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    {profileType === 'Empresa' ? 'Meta Colchón Operativo (Meses de Nómina)' : 'Meta Fondo de Emergencia'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={emergencyGoal}
                    onChange={(e) => setEmergencyGoal(e.target.value)}
                    placeholder="4500.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none text-zinc-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Descripción o Notas</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Gastos de la casa, sucursal norte, cuenta de honorarios..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none text-zinc-900"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Seguro de vaciar los gastos y deudas del perfil activo "${activeProfile.name}"?`)) {
                      onResetActiveProfile();
                      onClose();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Vaciar este perfil</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    {saveToast ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>¡Guardado!</span>
                      </>
                    ) : (
                      <span>Guardar Cambios</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE ALL PROFILES */}
          {currentTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Perfiles Registrados en tu Navegador</h4>
                  <p className="text-xs text-zinc-500">
                    Cada perfil mantiene su propio sueldo, lista de gastos, deudas y asesoría IA sin mezclarse.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('create')}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center space-x-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Nuevo Perfil</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfile.id;
                  const pIncome = (Number(p.monthlySalary) || 0) + (Number(p.extraIncome) || 0);
                  const pExpensesTotal = (p.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
                  const pDebtsTotal = (p.debts || []).reduce((s, d) => s + (Number(d.totalBalance) || 0), 0);

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-zinc-800 text-emerald-400' : 'bg-white border border-zinc-200 text-zinc-800'
                          }`}>
                            {renderProfileIcon(p.icon, 'w-5 h-5')}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                                {p.name}
                              </span>
                              <span className={`text-[10px] px-2 py-0.2 rounded font-bold border ${
                                isActive ? 'bg-zinc-800 text-emerald-300 border-zinc-700' : getProfileColorBadge(p.colorTheme)
                              }`}>
                                {p.type}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                  Activo Ahora
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${isActive ? 'text-zinc-300' : 'text-zinc-500'} mt-0.5`}>
                              {p.description || `Cuenta de tipo ${p.type}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                          {!isActive && (
                            <button
                              onClick={() => {
                                onSelectProfile(p.id);
                                setCurrentTab('edit');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors"
                            >
                              Seleccionar
                            </button>
                          )}

                          <button
                            onClick={() => onDuplicateProfile(p.id)}
                            title="Duplicar este perfil con sus gastos"
                            className={`p-2 rounded-xl border transition-colors ${
                              isActive
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {profiles.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el perfil "${p.name}" y todos sus datos?`)) {
                                  onDeleteProfile(p.id);
                                }
                              }}
                              title="Eliminar este perfil"
                              className={`p-2 rounded-xl border transition-colors ${
                                isActive
                                  ? 'bg-zinc-800 border-zinc-700 text-rose-400 hover:bg-rose-950/40'
                                  : 'bg-white border-zinc-200 text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Snapshot Metrics */}
                      <div className={`mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs ${
                        isActive ? 'border-zinc-800' : 'border-zinc-200/70'
                      }`}>
                        <div>
                          <span className={`text-[10px] block ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                            {p.type === 'Empresa' ? 'Facturación' : 'Ingresos'}
                          </span>
                          <strong className={isActive ? 'text-white' : 'text-zinc-800'}>
                            {formatMoney(pIncome, p.currencySymbol)}/mes
                          </strong>
                        </div>
                        <div>
                          <span className={`text-[10px] block ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                            Gastos Anotados
                          </span>
                          <strong className={isActive ? 'text-zinc-200' : 'text-zinc-700'}>
                            {formatMoney(pExpensesTotal, p.currencySymbol)} ({p.expenses?.length || 0})
                          </strong>
                        </div>
                        <div>
                          <span className={`text-[10px] block ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                            Deuda Total
                          </span>
                          <strong className={pDebtsTotal > 0 ? (isActive ? 'text-amber-300' : 'text-amber-700') : (isActive ? 'text-emerald-400' : 'text-emerald-700')}>
                            {formatMoney(pDebtsTotal, p.currencySymbol)} ({p.debts?.length || 0})
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW PROFILE WIZARD */}
          {currentTab === 'create' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Crear un Nuevo Perfil Financiero</h4>
                <p className="text-xs text-zinc-500">
                  Elige una plantilla rápida según el tipo de finanzas que deseas registrar:
                </p>
              </div>

              {/* Template cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PROFILE_TYPES.filter(t => t.type !== 'Otro').map((tmpl) => (
                  <button
                    key={tmpl.type}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.type)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedTemplate === tmpl.type
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        selectedTemplate === tmpl.type ? 'bg-zinc-800 text-emerald-400' : 'bg-white border border-zinc-200'
                      }`}>
                        {renderProfileIcon(tmpl.defaultIcon, 'w-4 h-4')}
                      </div>
                      <span className="font-bold text-xs">{tmpl.type}</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${
                      selectedTemplate === tmpl.type ? 'text-zinc-300' : 'text-zinc-500'
                    }`}>
                      {tmpl.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Form Customization */}
              <form onSubmit={handleCreateSubmit} className="space-y-3 pt-2 border-t border-zinc-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Nombre del Perfil *</label>
                    <input
                      type="text"
                      required
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Ej. Personal Hogar, Agencia Freelance, Local 1..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Tipo de Finanza</label>
                    <select
                      value={newProfileType}
                      onChange={(e: any) => setNewProfileType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                    >
                      {PROFILE_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Ícono Representativo</label>
                    <select
                      value={newProfileIcon}
                      onChange={(e) => setNewProfileIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                    >
                      {PROFILE_ICONS.map((ic) => (
                        <option key={ic.id} value={ic.id}>{ic.emoji} {ic.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Color Distintivo</label>
                    <select
                      value={newProfileColor}
                      onChange={(e) => setNewProfileColor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                    >
                      {PROFILE_COLORS.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      {newProfileType === 'Empresa' ? 'Facturación Neta Mensual Estimada' : 'Sueldo o Ingreso Mensual'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProfileSalary}
                      onChange={(e) => setNewProfileSalary(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-bold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Moneda</label>
                    <select
                      value={newProfileCurrency}
                      onChange={(e) => setNewProfileCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('manage')}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Crear y Activar Perfil</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: BACKUP & EXPORT/IMPORT */}
          {currentTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Copia de Seguridad y Sincronización Local</h4>
                <p className="text-xs text-zinc-500">
                  Exporta tus perfiles en archivos JSON legibles para guardarlos en tu equipo o restaurarlos en cualquier momento.
                </p>
              </div>

              {importStatus && (
                <div className={`p-3.5 rounded-xl border flex items-center space-x-2 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span className="font-semibold text-xs">{importStatus.message}</span>
                </div>
              )}

              {/* Export Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <span className="font-bold text-zinc-900 block text-xs">
                    Exportar Perfil Activo: "{activeProfile.name}"
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Descarga solo los gastos, deudas y metas del perfil actualmente seleccionado.
                  </p>
                  <button
                    onClick={handleExportSingle}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Solo "{activeProfile.name}"</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                  <span className="font-bold text-zinc-900 block text-xs">
                    Exportar Espacio Completo ({profiles.length} Perfiles)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Copia de seguridad total de todos tus perfiles personales, de trabajo y empresa.
                  </p>
                  <button
                    onClick={handleExportAll}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar Todos los Perfiles</span>
                  </button>
                </div>
              </div>

              {/* Import Options */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3">
                <span className="font-bold text-zinc-900 block text-xs">
                  Importar Archivo de Respaldo (.json)
                </span>
                <p className="text-[11px] text-zinc-500">
                  Puedes importar tanto copias de un perfil individual como de un espacio multi-perfil completo.
                </p>

                <label className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-900 bg-white text-zinc-700 font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-zinc-800" />
                  <span>Seleccionar Archivo JSON para Importar</span>
                  <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800 block">Zona de Reinicio Total</span>
                  <span className="text-[11px] text-zinc-500">Elimina todos los perfiles y restablece los valores predeterminados</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('⚠️ ADVERTENCIA: Esta acción borrará TODOS los perfiles, gastos, deudas y configuraciones de tu navegador. ¿Deseas continuar?')) {
                      onResetAllData();
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors"
                >
                  Vaciar Todo y Reiniciar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
