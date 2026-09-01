import React, { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  X
} from 'lucide-react';
import { SalaryProfile, Expense, Debt, SalaryAllocationPlan, AIDiagnosisResult } from '../types';
import { CURRENCIES, INITIAL_EXPENSES, INITIAL_DEBTS, DEFAULT_SALARY_PROFILE } from '../data/defaultData';
import { formatMoney } from '../utils/financeCalculators';
import { exportBackupData } from '../utils/storage';
import { ZentavoIcon } from './ZentavoLogo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SalaryProfile;
  onSaveProfile: (profile: SalaryProfile) => void;
  expenses: Expense[];
  debts: Debt[];
  selectedPlan?: SalaryAllocationPlan;
  aiDiagnosis?: AIDiagnosisResult | null;
  onImportData: (data: { profile?: SalaryProfile; expenses?: Expense[]; debts?: Debt[]; selectedPlan?: SalaryAllocationPlan; aiDiagnosis?: AIDiagnosisResult | null }) => void;
  onResetData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  expenses,
  debts,
  selectedPlan,
  aiDiagnosis,
  onImportData,
  onResetData,
}) => {
  if (!isOpen) return null;

  const [monthlySalary, setMonthlySalary] = useState(profile.monthlySalary.toString());
  const [extraIncome, setExtraIncome] = useState(profile.extraIncome.toString());
  const [payFrequency, setPayFrequency] = useState<SalaryProfile['payFrequency']>(profile.payFrequency);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(profile.currency);
  const [emergencyGoal, setEmergencyGoal] = useState(profile.emergencyFundGoal.toString());
  const [emergencyCurrent, setEmergencyCurrent] = useState(profile.emergencyFundCurrent.toString());

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrencyCode(code);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const curObj = CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];

    onSaveProfile({
      monthlySalary: parseFloat(monthlySalary) || 0,
      extraIncome: parseFloat(extraIncome) || 0,
      payFrequency,
      currency: curObj.code,
      currencySymbol: curObj.symbol,
      emergencyFundGoal: parseFloat(emergencyGoal) || 0,
      emergencyFundCurrent: parseFloat(emergencyCurrent) || 0,
    });
    onClose();
  };

  // Export JSON backup
  const handleExportData = () => {
    const data = exportBackupData(
      profile,
      expenses,
      debts,
      selectedPlan || ({} as any),
      aiDiagnosis || null
    );
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentavo_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile || Array.isArray(parsed.expenses) || Array.isArray(parsed.debts)) {
          onImportData(parsed);
          setImportSuccess('¡Datos importados y guardados en tu navegador!');
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportError('El archivo no contiene un formato de respaldo válido de Zentavo.');
        }
      } catch (err) {
        setImportError('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-200/80 bg-zinc-950 flex items-center justify-center shadow-xs">
              <ZentavoIcon size={26} className="w-full h-full" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Zentavo · Configuración de Sueldo & Perfil
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 font-bold text-lg p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Moneda Principal</label>
              <select
                value={selectedCurrencyCode}
                onChange={(e) => handleCurrencyChange(e.target.value)}
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
              <label className="block font-bold text-zinc-700 mb-1">Frecuencia de Cobro</label>
              <select
                value={payFrequency}
                onChange={(e: any) => setPayFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold text-zinc-900"
              >
                <option value="Mensual">Mensual (1 cobro al mes)</option>
                <option value="Quincenal">Quincenal (2 cobros al mes)</option>
                <option value="Semanal">Semanal (4 cobros al mes)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Sueldo Neto Mensual Fijo *</label>
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
              <label className="block font-bold text-zinc-700 mb-1">Ingresos Extras Promedio</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Fondo de Emergencia Actual</label>
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
              <label className="block font-bold text-zinc-700 mb-1">Meta Fondo de Emergencia</label>
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

          <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-xs transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </form>

        {/* Backup & Restore Section */}
        <div className="pt-6 mt-6 border-t border-zinc-200 space-y-3 text-xs">
          <span className="font-bold text-zinc-800 uppercase tracking-wider block">
            Copia de Seguridad y Datos
          </span>

          {importError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              {importSuccess}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportData}
              className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Respaldo JSON</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Respaldo</span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de vaciar todos los gastos, deudas y configuración para empezar de cero?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold flex items-center space-x-1.5 ml-auto transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vaciar Datos (Empezar de cero)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
