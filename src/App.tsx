/**
 * Finanza - Personal Finance & Budget Organization
 * Built with HTML, CSS, JavaScript, Prisma ORM MySQL architecture,
 * responsive dashboard, category budgets, daily ledger, and secret Flappy Bird game.
 * Supports monthly separation, current month initial view, optional carryover balance,
 * bilingual Portuguese (PT) & English (EN), and strict Brazilian Real (BRL - R$) currency format.
 */
import { useEffect, useState, useCallback } from 'react';
import { UserProfile, CategoryWithStats, MonthlyFinancialSummary, Transaction, Category } from './types/finance';
import { FinanzaService } from './services/storage';
import { Language, translations, formatBRL, formatDateDDMMYYYY } from './utils/i18n';
import { LoginScreen } from './components/Auth/LoginScreen';
import { Header } from './components/Dashboard/Header';
import { MonthNavigator } from './components/Dashboard/MonthNavigator';
import { OverviewStats } from './components/Dashboard/OverviewStats';
import { SpendingHistoryChart } from './components/Dashboard/SpendingHistoryChart';
import { CategoryGrid } from './components/Dashboard/CategoryGrid';
import { TransactionLedger } from './components/Dashboard/TransactionLedger';
import { TransactionModal } from './components/Modals/TransactionModal';
import { CategoryManageModal } from './components/Modals/CategoryManageModal';
import { IncomesManageModal } from './components/Modals/IncomesManageModal';
import { UserInfoModal } from './components/Modals/UserInfoModal';
import { FlappyBirdGame } from './components/SecretGame/FlappyBirdGame';

export default function App() {
  // Language state (defaults to Portuguese, saved in localStorage)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('finanza_lang');
    return saved === 'en' ? 'en' : 'pt';
  });

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'pt' ? 'en' : 'pt';
      localStorage.setItem('finanza_lang', next);
      return next;
    });
  };

  const t = translations[lang];

  // Current calendar month initialization (User requirement: initial view must be current month)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'transactions'>('overview');

  // Financial Data
  const [categoriesWithStats, setCategoriesWithStats] = useState<CategoryWithStats[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlyFinancialSummary | null>(null);
  const [availableMonths, setAvailableMonths] = useState<{ year: number; month: number; label: string }[]>([]);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultTxCategory, setDefaultTxCategory] = useState<string | undefined>();
  const [defaultTxType, setDefaultTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [isSecretGameOpen, setIsSecretGameOpen] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState<boolean>(false);

  // Load profiles on mount
  const refreshProfiles = useCallback(async () => {
    await FinanzaService.init();
    const all = await FinanzaService.getAllProfiles();
    setProfiles(all);
    const active = await FinanzaService.getActiveProfile();
    if (active && !activeProfile) {
      setActiveProfile(active);
    }
  }, [activeProfile]);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  // Load monthly financial data
  const loadMonthlyData = useCallback(async (
    profileId: string,
    year: number,
    month: number,
    language: Language
  ) => {
    const [cats, txs, summ, months] = await Promise.all([
      FinanzaService.getCategoriesWithMonthlyStats(profileId, year, month),
      FinanzaService.getAllTransactions(profileId),
      FinanzaService.getMonthlyFinancialSummary(profileId, year, month, language),
      FinanzaService.getAvailableMonths(profileId),
    ]);
    setCategoriesWithStats(cats);
    setAllTransactions(txs);
    setSummary(summ);
    setAvailableMonths(months);
  }, []);

  useEffect(() => {
    if (activeProfile && isAuthenticated) {
      loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
    }
  }, [activeProfile, isAuthenticated, selectedYear, selectedMonth, lang, loadMonthlyData]);

  // Global keyboard shortcut to launch secret Flappy Bird game ('b' or 'f')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      if ((e.key === 'b' || e.key === 'B' || e.key === 'f' || e.key === 'F') && isAuthenticated) {
        setIsSecretGameOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const handleLoginSuccess = (profile: UserProfile) => {
    setActiveProfile(profile);
    setIsAuthenticated(true);
  };

  const handleSwitchProfile = () => {
    setIsUserInfoModalOpen(false);
    setIsAuthenticated(false);
  };

  // Month Navigation Handlers
  const handleSelectMonth = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleGoToCurrentMonth = () => {
    const currentDate = new Date();
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
  };

  // Toggle Carryover Balance
  const handleToggleCarryover = async (enabled: boolean) => {
    if (!activeProfile) return;
    const updated = await FinanzaService.setCarryoverPreference(activeProfile.id, enabled);
    setActiveProfile(updated);
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  // Transaction Handlers
  const handleOpenNewTransaction = (categoryId?: string, type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
    setEditingTransaction(null);
    setDefaultTxCategory(categoryId);
    setDefaultTxType(type);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (data: {
    id?: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string;
    description: string;
    paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
    notes?: string;
  }) => {
    if (!activeProfile) return;
    if (data.id) {
      await FinanzaService.updateTransaction(data.id, data);
    } else {
      await FinanzaService.createTransaction({
        ...data,
        profileId: activeProfile.id,
      });
    }
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!activeProfile) return;
    await FinanzaService.deleteTransaction(id);
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  // Specific Income Handlers (Unlimited entries into Salário & Entradas Principais)
  const handleAddIncome = async (data: {
    description: string;
    amount: number;
    date: string;
    paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
    categoryId: string;
  }) => {
    if (!activeProfile) return;
    await FinanzaService.createTransaction({
      ...data,
      type: 'INCOME',
      profileId: activeProfile.id,
    });
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!activeProfile) return;
    await FinanzaService.deleteTransaction(id);
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  // Category Handlers
  const handleSaveCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!activeProfile) return;
    await FinanzaService.saveCategory(category);
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!activeProfile) return;
    await FinanzaService.deleteCategory(categoryId);
    await loadMonthlyData(activeProfile.id, selectedYear, selectedMonth, lang);
  };

  // If not logged in, render the profile password selection screen
  if (!isAuthenticated || !activeProfile) {
    return (
      <LoginScreen
        profiles={profiles}
        lang={lang}
        onToggleLang={toggleLang}
        onLoginSuccess={handleLoginSuccess}
        onRefreshProfiles={refreshProfiles}
      />
    );
  }

  // Transactions belonging strictly to the selected month
  const selectedMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthTransactions = allTransactions.filter(t => t.date.startsWith(selectedMonthKey));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        activeProfile={activeProfile}
        profiles={profiles}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenSecretGame={() => setIsSecretGameOpen(true)}
        onOpenUserInfo={() => setIsUserInfoModalOpen(true)}
        onLogout={handleSwitchProfile}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome Kicker */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t.dashboardHeading}
          </h1>
        </div>

        {/* 1. Month Navigator & Carryover Balance Toggle (Key User Request) */}
        {summary && (
          <MonthNavigator
            summary={summary}
            availableMonths={availableMonths}
            lang={lang}
            onSelectMonth={handleSelectMonth}
            onGoToCurrentMonth={handleGoToCurrentMonth}
            onToggleCarryover={handleToggleCarryover}
          />
        )}

        {/* 2. Core Overview Statistics for the Selected Month (With optional Carryover) */}
        {summary && (
          <OverviewStats
            summary={summary}
            profile={activeProfile}
            lang={lang}
            onOpenManageIncomes={() => setIsIncomeModalOpen(true)}
            onOpenManageCategories={() => setIsCategoryModalOpen(true)}
            showCategoryDetails={showCategoryDetails}
            onToggleCategoryDetails={() => {
              if (activeTab !== 'categories') {
                setActiveTab('categories');
              }
              setShowCategoryDetails((prev) => !prev);
            }}
          />
        )}

        {/* Tab-driven View */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Monthly Daily Spending Evolution (Calendar month, not rolling 30 days) */}
            <SpendingHistoryChart
              summary={summary}
              lang={lang}
              onSelectDateFilter={() => setActiveTab('transactions')}
            />
          </div>
        )}

        {/* Tab 2: Focused Category Budgets */}
        {activeTab === 'categories' && summary && (
          <div className="space-y-6">
            <CategoryGrid
              categories={categoriesWithStats}
              summary={summary}
              lang={lang}
              onOpenManageCategories={() => setIsCategoryModalOpen(true)}
              onOpenManageIncomes={() => setIsIncomeModalOpen(true)}
              onQuickAddTransaction={(catId, type) => handleOpenNewTransaction(catId, type)}
              onEditCategory={() => setIsCategoryModalOpen(true)}
              showDetailedSummary={showCategoryDetails}
            />
          </div>
        )}

        {/* Tab 3: Full Daily Ledger */}
        {activeTab === 'transactions' && summary && (
          <TransactionLedger
            transactions={allTransactions}
            categories={categoriesWithStats}
            lang={lang}
            selectedMonthKey={summary.monthKey}
            selectedMonthLabel={summary.monthLabel}
            onOpenNewTransaction={() => handleOpenNewTransaction()}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t.footerBrand}</span>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        lang={lang}
        onSave={handleSaveTransaction}
        categories={categoriesWithStats}
        editingTransaction={editingTransaction}
        defaultCategoryId={defaultTxCategory}
        defaultType={defaultTxType}
      />

      <CategoryManageModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        lang={lang}
        categories={categoriesWithStats}
        profileId={activeProfile.id}
        totalIncome={summary?.totalIncome ?? 0}
        totalAllocated={summary?.totalAllocatedToBudgets ?? 0}
        unallocatedBalance={summary?.unallocatedBalance ?? 0}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {summary && (
        <IncomesManageModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          lang={lang}
          monthLabel={summary.monthLabel}
          defaultDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
          incomeCategory={categoriesWithStats.find((c) => c.isIncome)}
          incomeTransactions={summary.incomeTransactions || []}
          totalIncome={summary.totalIncome}
          totalAllocated={summary.totalAllocatedToBudgets}
          unallocatedBalance={summary.unallocatedBalance}
          onAddIncome={handleAddIncome}
          onDeleteIncome={handleDeleteIncome}
        />
      )}

      {isSecretGameOpen && (
        <FlappyBirdGame
          profileId={activeProfile.id}
          lang={lang}
          onClose={() => setIsSecretGameOpen(false)}
        />
      )}

      {/* User Information Modal */}
      <UserInfoModal
        isOpen={isUserInfoModalOpen}
        onClose={() => setIsUserInfoModalOpen(false)}
        activeProfile={activeProfile}
        categories={categoriesWithStats}
        transactions={allTransactions}
        lang={lang}
        onProfileUpdated={(updated) => {
          setActiveProfile(updated);
          refreshProfiles();
          loadMonthlyData(updated.id, selectedYear, selectedMonth, lang);
        }}
        onLogout={handleSwitchProfile}
      />
    </div>
  );
}
