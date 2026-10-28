/**
 * Category Grid Component
 * Displays user-determined category budgets, individual balances (entries & spents),
 * zero-based budget subtraction from total incomes, and direct entry management.
 * Strictly formatted in Brazilian Real (BRL - R$) with Portuguese/English language support.
 */
import React from 'react';
import { CategoryWithStats, MonthlyFinancialSummary } from '../../types/finance';
import { Language, translations, formatBRL } from '../../utils/i18n';
import {
  Layers,
  Settings2,
  PlusCircle,
  Home,
  ShoppingCart,
  Coffee,
  Car,
  Zap,
  Gamepad2,
  HeartPulse,
  Briefcase,
  Server,
  Monitor,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Plus,
} from 'lucide-react';

interface CategoryGridProps {
  categories: CategoryWithStats[];
  summary: MonthlyFinancialSummary;
  lang: Language;
  onOpenManageCategories: () => void;
  onOpenManageIncomes: () => void;
  onQuickAddTransaction: (categoryId: string, type: 'INCOME' | 'EXPENSE') => void;
  onEditCategory: (category: CategoryWithStats) => void;
  showDetailedSummary?: boolean;
}

// Icon mapper
const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'home': return <Home className={className} />;
    case 'shopping-cart': return <ShoppingCart className={className} />;
    case 'coffee': return <Coffee className={className} />;
    case 'car': return <Car className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'gamepad-2': return <Gamepad2 className={className} />;
    case 'heart-pulse': return <HeartPulse className={className} />;
    case 'briefcase': return <Briefcase className={className} />;
    case 'server': return <Server className={className} />;
    case 'monitor': return <Monitor className={className} />;
    default: return <Tag className={className} />;
  }
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  summary,
  lang,
  onOpenManageCategories,
  onOpenManageIncomes,
  onQuickAddTransaction,
  onEditCategory,
  showDetailedSummary = false,
}) => {
  const t = translations[lang];

  // Separate expense categories and income categories
  const expenseCategories = categories.filter((c) => !c.isIncome);
  const incomeCategories = categories.filter((c) => c.isIncome);

  const totalDeterminedBudget = summary.totalAllocatedToBudgets;
  const isOverAllocated = summary.unallocatedBalance < 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">{t.categoriesHeading}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenManageIncomes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{t.manageIncomesBtn}</span>
          </button>

          <button
            onClick={onOpenManageCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{t.manageCategoriesBtn}</span>
          </button>
        </div>
      </div>

      {/* Conditionally rendered: Salário & Entradas Principais and Main Master Summary Card */}
      {showDetailedSummary && (
        <>
          {/* 1. Salário & Entradas Principais (Unlimited entries with unallocated counter) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    Salário &amp; Entradas Principais
                  </h3>
                </div>
              </div>

              {/* Counters: Total de Entradas e Não Destinado */}
              <div className="flex items-center gap-4 bg-slate-950/90 p-3 rounded-xl border border-slate-800 self-stretch md:self-auto justify-between md:justify-end">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.literalTotalIncomes}</span>
                  <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                    +{formatBRL(summary.totalIncome)}
                  </span>
                </div>

                <div className="w-px h-8 bg-slate-800" />

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.unallocatedIndicatorTitle}</span>
                  <span className={`font-mono text-lg font-bold tabular-nums ${isOverAllocated ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {formatBRL(summary.unallocatedBalance)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pl-2">
                  <button
                    onClick={onOpenManageIncomes}
                    title={t.manageIncomesBtn}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const incCat = incomeCategories[0];
                      if (incCat) onQuickAddTransaction(incCat.id, 'INCOME');
                      else onOpenManageIncomes();
                    }}
                    className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'pt' ? 'Inserir Entrada' : 'Add Income'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MAIN MASTER SUMMARY CARD: Total Sum of All Financial Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {t.masterCardTag}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t.masterCardHeading}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {t.masterCardText}
                </p>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 shrink-0">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    {t.totalEntriesLabel}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                    +{formatBRL(summary.totalIncome)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    {t.totalSpentsLabel}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-rose-400 tabular-nums">
                    -{formatBRL(summary.totalExpense)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    {t.netSumLabel}
                  </span>
                  <span className={`font-mono text-base sm:text-lg font-bold tabular-nums ${summary.monthNetBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {formatBRL(summary.monthNetBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Expense Categories Grid (Values subtract from Total Incomes) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Total Destinado: {formatBRL(totalDeterminedBudget)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((cat) => {
            const isOverBudget = cat.totalSpent > cat.budgetLimit && cat.budgetLimit > 0;
            const isNearLimit = cat.percentSpent >= 85 && !isOverBudget;

            return (
              <div
                key={cat.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        {renderCategoryIcon(cat.icon)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{cat.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>{t.target}:</span>
                          <span className="font-mono text-slate-300 font-medium tabular-nums">
                            {formatBRL(cat.budgetLimit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isOverBudget ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>{t.overBudget}</span>
                        </span>
                      ) : isNearLimit ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                          <span>{t.nearLimit}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.onTrack}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Balance & Spents Detail */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 my-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.spent}</span>
                      <span className="font-mono text-sm font-bold text-rose-400 tabular-nums">
                        {formatBRL(cat.totalSpent)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.remaining}</span>
                      <span className={`font-mono text-sm font-bold tabular-nums ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatBRL(cat.remainingBudget)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{t.capacityUsed}</span>
                      <span className={`font-mono font-semibold tabular-nums ${isOverBudget ? 'text-rose-400' : 'text-slate-300'}`}>
                        {cat.percentSpent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${Math.min(100, cat.percentSpent)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverBudget
                            ? 'bg-rose-500'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onEditCategory(cat)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {t.editBudget}
                  </button>

                  <button
                    onClick={() => onQuickAddTransaction(cat.id, 'EXPENSE')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{t.logSpent}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
