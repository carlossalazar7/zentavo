import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingDown, 
  CreditCard, 
  PieChart, 
  Bot, 
  Settings, 
  Sparkles,
  DollarSign,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';
import { formatMoney } from '../utils/financeCalculators';
import { ZentavoIcon } from './ZentavoLogo';
import { ProfileSelector } from './ProfileSelector';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profiles: UserProfile[];
  activeProfile: UserProfile;
  onSelectProfile: (profileId: string) => void;
  onOpenProfileModal: (tab?: 'edit' | 'manage' | 'create' | 'backup') => void;
  dtiRatio: number;
  totalLeaksCount: number;
  lastSavedTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenProfileModal,
  dtiRatio,
  totalLeaksCount,
  lastSavedTime,
}) => {
  const totalIncome = (Number(activeProfile.monthlySalary) || 0) + (Number(activeProfile.extraIncome) || 0);

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Panel General', icon: LayoutDashboard },
    { id: 'expenses', label: 'Anotar Gastos', icon: Receipt },
    { 
      id: 'cost-reduction', 
      label: 'Reducir Costos', 
      icon: TrendingDown,
      badge: totalLeaksCount > 0 ? `${totalLeaksCount} fugas` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200'
    },
    { 
      id: 'debts', 
      label: 'Control de Deudas', 
      icon: CreditCard,
      badge: dtiRatio > 35 ? `${dtiRatio}% DTI` : undefined,
      badgeColor: dtiRatio > 45 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
    },
    { id: 'salary-distribution', label: 'Distribuir Sueldo', icon: PieChart },
    { 
      id: 'ai-coach', 
      label: 'Asesor IA', 
      icon: Bot,
      badge: 'Gemini',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-zinc-200/80 bg-zinc-950 flex items-center justify-center">
              <ZentavoIcon size={34} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-zinc-900 text-base sm:text-lg tracking-tight">
                  Zentavo
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                  Finanzas Zen
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden md:block">
                Anota gastos · Reduce fugas · Liquida deudas · Distribuye tu sueldo
              </p>
            </div>
          </div>

          {/* Quick Financial Badge & Profile Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Auto-save status badge */}
            <div 
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-500"
              title="Tus datos se guardan instantáneamente en tu navegador y no se pierden al recargar"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-600">Guardado local</span>
              {lastSavedTime && <span className="text-zinc-400">({lastSavedTime})</span>}
            </div>

            {/* Profile Dropdown Switcher */}
            <ProfileSelector
              profiles={profiles}
              activeProfile={activeProfile}
              onSelectProfile={onSelectProfile}
              onOpenManageProfiles={(tab) => onOpenProfileModal(tab || 'edit')}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto pb-2 sm:pb-2.5 scrollbar-none border-t border-zinc-100 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.badgeColor || 'bg-zinc-100 text-zinc-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

