/**
 * Header Component implementing the 3-Zone Top Bar Contract
 * With language switcher (PT-BR / EN) and BRL currency indicator.
 */
import React from 'react';
import { UserProfile } from '../../types/finance';
import { Language, translations } from '../../utils/i18n';
import { Plus, Gamepad2, LogOut, ChevronDown, Globe } from 'lucide-react';

interface HeaderProps {
  activeProfile: UserProfile;
  profiles?: UserProfile[];
  activeTab: 'overview' | 'categories' | 'transactions';
  setActiveTab: (tab: 'overview' | 'categories' | 'transactions') => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenNewTransaction: () => void;
  onOpenSecretGame: () => void;
  onOpenUserInfo: () => void;
  onLogout: () => void;
  onSwitchProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  activeTab,
  setActiveTab,
  lang,
  onToggleLang,
  onOpenNewTransaction,
  onOpenSecretGame,
  onOpenUserInfo,
  onLogout,
  onSwitchProfile,
}) => {
  const t = translations[lang];
  const handleLogout = onLogout || onSwitchProfile;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            F
          </div>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
          >
            {t.brand}
          </a>
        </div>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-emerald-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
              activeTab === 'categories'
                ? 'text-white border-b-2 border-emerald-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navCategories}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-white border-b-2 border-emerald-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navLedger}
          </button>
        </nav>

        {/* Zone 3: Language Toggle, Secret Arcade, Profile & Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Language Selector (PT-BR / EN) */}
          <button
            onClick={onToggleLang}
            title={lang === 'pt' ? 'Mudar para Inglês (Switch to English)' : 'Mudar para Português (Switch to Portuguese)'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'pt' ? 'PT' : 'EN'}</span>
            <span className="text-[10px] text-slate-400 font-sans">· BRL</span>
          </button>

          {/* Secret Arcade Trigger */}
          <button
            onClick={onOpenSecretGame}
            title={`${t.secretArcade}: ${t.secretArcadeSubtitle} (Teclas 'B' ou 'F')`}
            className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer group"
          >
            <Gamepad2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Active User Button (Onde aparece o nome): Abre informações do usuário */}
          <button
            onClick={onOpenUserInfo}
            title={lang === 'pt' ? 'Ver informações do usuário' : 'View user details'}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm hover:border-emerald-500/40"
          >
            <img
              src={activeProfile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeProfile.username}`}
              alt={activeProfile.fullName}
              className="w-5 h-5 rounded-full object-cover border border-slate-600 group-hover:border-emerald-400 transition-colors"
            />
            <span className="font-medium text-white truncate max-w-[120px]">
              {activeProfile.fullName.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>

          {/* Primary Action Button (+ Registrar Transação) */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.logEntry}</span>
          </button>

          {/* Canto Extremo Superior Direito: Novo Botão de Logout Dedicado */}
          <button
            onClick={handleLogout}
            title={lang === 'pt' ? 'Sair da Conta (Logout)' : 'Log Out'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 text-xs font-medium transition-all cursor-pointer shadow-sm shrink-0 ml-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.logoutButton || (lang === 'pt' ? 'Sair' : 'Log Out')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav Strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 text-xs text-slate-400 bg-slate-900/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-1 px-2 font-medium ${activeTab === 'overview' ? 'text-emerald-400' : ''}`}
        >
          {t.navDashboard}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-1 px-2 font-medium ${activeTab === 'categories' ? 'text-emerald-400' : ''}`}
        >
          {t.navCategories}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-1 px-2 font-medium ${activeTab === 'transactions' ? 'text-emerald-400' : ''}`}
        >
          {t.navLedger}
        </button>
      </div>
    </header>
  );
};
