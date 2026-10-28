/**
 * Monthly Spending Evolution Component
 * "Visualização que seja inicialmente do mês atual (não dos últimos 30 dias)"
 * Displays daily spending velocity across all days of the selected calendar month.
 */
import React, { useState } from 'react';
import { MonthlyFinancialSummary } from '../../types/finance';
import { Language, translations, formatBRL } from '../../utils/i18n';
import { Calendar, AlertCircle } from 'lucide-react';

interface SpendingHistoryChartProps {
  summary: MonthlyFinancialSummary;
  lang: Language;
  onSelectDateFilter?: (dateStr: string) => void;
}

export const SpendingHistoryChart: React.FC<SpendingHistoryChartProps> = ({
  summary,
  lang,
  onSelectDateFilter,
}) => {
  const t = translations[lang];
  const [hoveredDay, setHoveredDay] = useState<MonthlyFinancialSummary['spendingByDay'][0] | null>(null);

  const days = summary.spendingByDay;
  const maxDayExpense = Math.max(...days.map((d) => d.totalExpense), 1);
  const totalPeriodExpense = summary.totalExpense;
  const daysWithExpensesCount = days.filter((d) => d.totalExpense > 0).length;
  const averageDailyExpense = totalPeriodExpense / (summary.daysInMonth || 1);

  // Highest spending day in this month
  const highestDay = [...days].sort((a, b) => b.totalExpense - a.totalExpense)[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
      {/* Header with Monthly Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">
              {t.spendingMonthHeading.replace('{month}', summary.monthLabel)}
            </h2>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <span>{summary.daysInMonth} {lang === 'pt' ? 'dias no mês' : 'days in month'} · {daysWithExpensesCount} {lang === 'pt' ? 'com despesas' : 'with expenses'}</span>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium block">{t.totalPeriodSpent}</span>
          <span className="font-mono text-base font-bold text-white tabular-nums">
            {formatBRL(totalPeriodExpense)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium block">{t.dailyAverage}</span>
          <span className="font-mono text-base font-bold text-slate-200 tabular-nums">
            {formatBRL(averageDailyExpense)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium block">{t.peakSpendingDay}</span>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium truncate">
              {highestDay && highestDay.totalExpense > 0 ? highestDay.dayLabel : t.none}
            </span>
            <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
              {highestDay && highestDay.totalExpense > 0 ? formatBRL(highestDay.totalExpense) : 'R$ 0,00'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Across the Calendar Month */}
      <div className="mt-6">
        <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1 relative overflow-x-auto">
          {/* Subtle guide line */}
          <div className="absolute top-6 left-0 right-0 border-b border-dashed border-slate-800 pointer-events-none" />

          {days.map((day) => {
            const heightPercent = Math.max(3, Math.round((day.totalExpense / maxDayExpense) * 100));
            const isHighest = day.date === highestDay?.date && day.totalExpense > 0;
            const isHovered = hoveredDay?.date === day.date;
            const hasSpending = day.totalExpense > 0;

            return (
              <div
                key={day.date}
                className="flex-1 min-w-[8px] sm:min-w-[12px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => onSelectDateFilter && onSelectDateFilter(day.date)}
              >
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[18px] rounded-t transition-all ${
                    isHighest
                      ? 'bg-rose-500 hover:bg-rose-400'
                      : hasSpending
                      ? 'bg-emerald-500/80 group-hover:bg-emerald-400'
                      : 'bg-slate-800/40'
                  } ${isHovered ? 'ring-2 ring-white/60' : ''}`}
                />

                {/* Day Number Label */}
                <span className={`mt-2 text-[9px] sm:text-[10px] font-mono truncate text-center ${
                  hasSpending ? 'text-slate-300 font-semibold' : 'text-slate-500'
                }`}>
                  {day.dayNumber % 5 === 0 || day.dayNumber === 1 || day.dayNumber === summary.daysInMonth
                    ? day.dayNumber
                    : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip Detail Banner */}
        <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          {hoveredDay ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {lang === 'pt' ? 'Dia' : 'Day'} {hoveredDay.dayNumber} ({hoveredDay.dayLabel})
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400">
                  {hoveredDay.transactions.filter((t) => t.type === 'EXPENSE').length} {t.expensesLogged}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hoveredDay.totalIncome > 0 && (
                  <span className="font-mono text-emerald-400 tabular-nums">
                    +{formatBRL(hoveredDay.totalIncome)}
                  </span>
                )}
                <span className="font-mono font-bold text-rose-400 tabular-nums">
                  -{formatBRL(hoveredDay.totalExpense)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.hoverDayTip}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
