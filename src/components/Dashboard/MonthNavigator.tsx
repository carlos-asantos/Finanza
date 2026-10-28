/**
 * Month Navigator and Carryover Balance Control Component
 * Allows browsing historical months, defaulting to the current month,
 * and toggling whether remaining balance carries over to next month.
 */
import React from 'react';
import { MonthlyFinancialSummary } from '../../types/finance';
import { Language, translations, formatBRL } from '../../utils/i18n';
import { ChevronLeft, ChevronRight, Calendar, ArrowRightLeft, Sparkles, Check, X } from 'lucide-react';

interface MonthNavigatorProps {
  summary: MonthlyFinancialSummary;
  availableMonths?: { year: number; month: number; label: string }[];
  lang: Language;
  onSelectMonth: (year: number, month: number) => void;
  onGoToCurrentMonth: () => void;
  onToggleCarryover: (enabled: boolean) => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  summary,
  lang,
  onSelectMonth,
  onGoToCurrentMonth,
  onToggleCarryover,
}) => {
  const t = translations[lang];

  // Calculate previous and next month coordinates
  const handlePrevMonth = () => {
    let prevYear = summary.year;
    let prevMonth = summary.month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    onSelectMonth(prevYear, prevMonth);
  };

  const handleNextMonth = () => {
    let nextYear = summary.year;
    let nextMonth = summary.month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    onSelectMonth(nextYear, nextMonth);
  };

  const isCurrent = summary.isCurrentMonth;
  const carryover = summary.carryoverEnabled;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Month Navigator Arrows & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              title={t.previousMonthBtn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-base sm:text-lg tracking-tight select-none whitespace-nowrap">
                {summary.monthLabel}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              title={t.nextMonthBtn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick status or Go to Current Month */}
          {isCurrent ? (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {t.currentMonthBadge}
            </span>
          ) : (
            <button
              onClick={onGoToCurrentMonth}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.goToCurrentMonth}</span>
            </button>
          )}

        </div>

        {/* Right: Carryover Balance Toggle (Rollover Option) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.carryoverOptionTitle}</span>
              </span>
            </div>

            {/* Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={carryover}
              onClick={() => onToggleCarryover(!carryover)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                carryover ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  carryover ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Previous Month Carryover Pill if enabled */}
          {carryover && summary.previousCarryover !== 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-slate-400">{t.carriedFromPrevious}:</span>
              <span className={`font-mono font-bold tabular-nums ${summary.previousCarryover >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.previousCarryover >= 0 ? '+' : ''}{formatBRL(summary.previousCarryover)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
