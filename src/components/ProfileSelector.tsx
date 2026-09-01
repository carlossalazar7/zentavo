import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  Building2, 
  Store, 
  Laptop, 
  Wallet, 
  PiggyBank, 
  Truck, 
  Sparkles,
  ChevronDown, 
  Plus, 
  Settings2, 
  Check,
  FolderOpen
} from 'lucide-react';
import { UserProfile, ProfileType } from '../types';
import { PROFILE_COLORS, PROFILE_TYPES } from '../data/defaultData';
import { formatMoney } from '../utils/financeCalculators';

// Helper to render profile icon
export const renderProfileIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Store':
      return <Store className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'PiggyBank':
      return <PiggyBank className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'User':
    default:
      return <User className={className} />;
  }
};

export const getProfileColorBadge = (colorTheme = 'emerald') => {
  const found = PROFILE_COLORS.find(c => c.id === colorTheme);
  return found ? found.badge : 'bg-emerald-50 text-emerald-800 border-emerald-300';
};

interface ProfileSelectorProps {
  profiles: UserProfile[];
  activeProfile: UserProfile;
  onSelectProfile: (profileId: string) => void;
  onOpenManageProfiles: (initialTab?: 'edit' | 'manage' | 'create' | 'backup') => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenManageProfiles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalIncome = (Number(activeProfile.monthlySalary) || 0) + (Number(activeProfile.extraIncome) || 0);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="btn-profile-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/90 text-xs sm:text-sm text-left transition-all active:scale-98 shadow-2xs"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
          {renderProfileIcon(activeProfile.icon, 'w-3.5 h-3.5 text-emerald-400')}
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-zinc-900 truncate max-w-[110px] sm:max-w-[140px]">
              {activeProfile.name}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getProfileColorBadge(activeProfile.colorTheme)}`}>
              {activeProfile.type}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 truncate">
            {activeProfile.type === 'Empresa' ? 'Facturación: ' : 'Ingresos: '}
            <strong className="text-zinc-800 font-semibold">
              {formatMoney(totalIncome, activeProfile.currencySymbol)}
            </strong>
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-zinc-700' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-xl border border-zinc-200 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden divide-y divide-zinc-100">
          {/* Header */}
          <div className="p-3 bg-zinc-50/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                Tus Perfiles Financieros
              </span>
              <span className="text-xs font-semibold text-zinc-800">
                Selecciona o crea un perfil independiente
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700">
              {profiles.length} {profiles.length === 1 ? 'perfil' : 'perfiles'}
            </span>
          </div>

          {/* Profiles List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {profiles.map((p) => {
              const isActive = p.id === activeProfile.id;
              const pIncome = (Number(p.monthlySalary) || 0) + (Number(p.extraIncome) || 0);
              const pExpensesCount = p.expenses?.length || 0;
              const pDebtsCount = p.debts?.length || 0;

              return (
                <button
                  key={p.id}
                  id={`profile-item-${p.id}`}
                  onClick={() => {
                    onSelectProfile(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {renderProfileIcon(p.icon, 'w-4 h-4')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                          {p.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                          isActive ? 'bg-zinc-800 text-emerald-300 border-zinc-700' : getProfileColorBadge(p.colorTheme)
                        }`}>
                          {p.type}
                        </span>
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {formatMoney(pIncome, p.currencySymbol)}/mes · {pExpensesCount} gastos · {pDebtsCount} deudas
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 ml-2">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="p-2 bg-zinc-50/50 flex flex-col gap-1 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenManageProfiles('create');
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-200/70 font-semibold transition-colors text-left"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Crear Nuevo Perfil (Personal, Trabajo, Empresa...)</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenManageProfiles('manage');
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-zinc-700 hover:bg-zinc-200/70 font-medium transition-colors text-left"
            >
              <Settings2 className="w-4 h-4 text-zinc-500" />
              <span>Administrar Todos los Perfiles</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
