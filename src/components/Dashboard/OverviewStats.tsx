/**
 * Overview Statistics Component
 * Displays the main financial balance formatted strictly in Brazilian Real (BRL - R$),
 * showing net monthly result and carryover from previous months.
 *
 * As requested: Removed savings ratio, literal total of incomes, total expenses,
 * and the unallocated-to-categories indicator from the home screen overview.
 */
import React from 'react';
import { MonthlyFinancialSummary, UserProfile } from '../../types/finance';
import { Language, translations, formatBRL } from '../../utils/i18n';
import { TrendingUp, TrendingDown, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface OverviewStatsProps {
  summary: MonthlyFinancialSummary;
  profile?: UserProfile;
  lang: Language;
  onOpenManageIncomes?: () => void;
  onOpenManageCategories?: () => void;
  showCategoryDetails?: boolean;
  onToggleCategoryDetails?: () => void;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({
  summary,
  lang,
  showCategoryDetails = false,
  onToggleCategoryDetails,
}) => {
  const t = translations[lang];

  const isPositiveBalance = summary.totalEffectiveBalance >= 0;
  const isPositiveMonthNet = summary.monthNetBalance >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Balance Header & Big Number */}
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold tracking-wider uppercase">
              {summary.carryoverEnabled ? t.totalBalanceWithCarryover : t.monthBalanceOnly}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                isPositiveBalance
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositiveBalance ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositiveBalance ? t.healthySurplus : t.deficitWarning}</span>
            </span>

            {/* Setinha para baixo / volta para expandir ou recolher as duas divs de entradas e resumo */}
            {onToggleCategoryDetails && (
              <button
                type="button"
                onClick={onToggleCategoryDetails}
                title={
                  showCategoryDetails
                    ? (lang === 'pt' ? 'Ocultar entradas e resumo consolidado' : 'Hide incomes and summary')
                    : (lang === 'pt' ? 'Ver entradas e resumo consolidado' : 'Show incomes and summary')
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer ml-1"
                aria-label={showCategoryDetails ? 'Recolher detalhes' : 'Expandir detalhes'}
              >
                {showCategoryDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] hidden sm:inline">{lang === 'pt' ? 'Recolher' : 'Collapse'}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] hidden sm:inline">{lang === 'pt' ? 'Expandir' : 'Expand'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white tabular-nums">
              {formatBRL(summary.totalEffectiveBalance)}
            </span>
          </div>
        </div>

        {/* Breakdown Indicators: Resultado Líquido do Mês & Saldo Trazido de Meses Anteriores */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[11px] font-medium">{t.monthNetResult}</span>
            <span
              className={`font-mono font-bold text-sm tabular-nums ${
                isPositiveMonthNet ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositiveMonthNet ? '+' : ''}
              {formatBRL(summary.monthNetBalance)}
            </span>
          </div>

          {summary.carryoverEnabled && summary.previousCarryover !== 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                <span>{t.carriedFromPrevious}</span>
              </span>
              <span
                className={`font-mono font-bold text-sm tabular-nums ${
                  summary.previousCarryover >= 0 ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {summary.previousCarryover >= 0 ? '+' : ''}
                {formatBRL(summary.previousCarryover)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
