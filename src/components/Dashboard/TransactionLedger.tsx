/**
 * Transaction Ledger Component
 * Manual daily transaction management with searching, filtering, and monthly view.
 * Strictly formatted in Brazilian Real (BRL - R$) with Portuguese/English language support.
 */
import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../../types/finance';
import { Language, translations, formatBRL, formatDateDDMMYYYY } from '../../utils/i18n';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  CreditCard,
  Banknote,
  Send,
  Building,
  Receipt,
  Calendar,
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  categories: Category[];
  lang: Language;
  selectedMonthKey: string; // "YYYY-MM"
  selectedMonthLabel: string; // e.g. "Outubro 2026"
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  categories,
  lang,
  selectedMonthKey,
  selectedMonthLabel,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [monthScope, setMonthScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const [confirmingTxId, setConfirmingTxId] = useState<string | null>(null);

  // Category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Monthly filter
      if (monthScope === 'CURRENT' && !tx.date.startsWith(selectedMonthKey)) {
        return false;
      }
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && tx.categoryId !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(query);
        const notesMatch = tx.notes?.toLowerCase().includes(query) ?? false;
        const catNameMatch = categoryMap.get(tx.categoryId)?.name.toLowerCase().includes(query) ?? false;
        if (!descMatch && !notesMatch && !catNameMatch) return false;
      }
      return true;
    });
  }, [transactions, monthScope, selectedMonthKey, typeFilter, categoryFilter, searchTerm, categoryMap]);

  // Group filtered transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    for (const tx of filtered) {
      const dateKey = tx.date.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Helper for date headers strictly formatted as dd/mm/yyyy
  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const formatted = formatDateDDMMYYYY(dateStr);

    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const weekday = d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      weekday: 'long',
    });
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    if (dateStr === today) return `${t.today} (${formatted})`;
    if (dateStr === yesterday) return `${t.yesterday} (${formatted})`;

    return `${capWeekday}, ${formatted}`;
  };

  const renderPaymentIcon = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="w-3 h-3 text-slate-400" />;
      case 'cash': return <Banknote className="w-3 h-3 text-emerald-400" />;
      case 'pix': return <Send className="w-3 h-3 text-cyan-400" />;
      case 'transfer': return <Building className="w-3 h-3 text-indigo-400" />;
      default: return <Receipt className="w-3 h-3 text-slate-400" />;
    }
  };

  const getPaymentLabel = (type: string) => {
    switch (type) {
      case 'card': return t.card;
      case 'cash': return t.cash;
      case 'pix': return t.pix;
      case 'transfer': return t.transfer;
      default: return t.other;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">{t.ledgerHeading}</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {monthScope === 'CURRENT' ? selectedMonthLabel : (lang === 'pt' ? 'Histórico Completo' : 'All Months')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle between selected month and all history */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMonthScope('CURRENT')}
              className={`px-2.5 py-1 rounded transition-colors ${
                monthScope === 'CURRENT' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {selectedMonthLabel}
            </button>
            <button
              onClick={() => setMonthScope('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                monthScope === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'pt' ? 'Todos os Meses' : 'All Months'}
            </button>
          </div>

          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.logDailyTxBtn}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setTypeFilter('EXPENSE')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'EXPENSE' ? 'bg-slate-800 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterExpenses}
            </button>
            <button
              onClick={() => setTypeFilter('INCOME')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'INCOME' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterIncomes}
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table / List */}
      {groupedByDate.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-400">{t.noTransactionsMatch}</p>
          <p className="text-xs text-slate-400 mt-1">{t.noTransactionsHint}</p>
          <button
            onClick={onOpenNewTransaction}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            {t.logTxAction}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateKey, txList]) => (
            <div key={dateKey} className="space-y-1.5">
              {/* Date Group Heading */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1 border-b border-slate-800/80">
                <span className="font-semibold text-slate-300">{formatDateHeader(dateKey)}</span>
                <span className="text-[11px] font-mono">
                  {txList.length} {t.entriesCount}
                </span>
              </div>

              {/* Transactions for this day */}
              <div className="divide-y divide-slate-800/60 bg-slate-950/40 rounded-lg border border-slate-800/80 overflow-hidden">
                {txList.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const isIncome = tx.type === 'INCOME';

                  return (
                    <div
                      key={tx.id}
                      className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Left: Category color & Description */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {tx.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span
                              className="font-medium truncate max-w-[140px]"
                              style={{ color: cat?.color || '#94a3b8' }}
                            >
                              {cat?.name || t.uncategorized}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {formatDateDDMMYYYY(tx.date)}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="flex items-center gap-1">
                              {renderPaymentIcon(tx.paymentType)}
                              <span>{getPaymentLabel(tx.paymentType)}</span>
                            </span>
                            {tx.notes && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="truncate max-w-[120px] text-slate-500 italic">
                                  {tx.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount in BRL & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            isIncome ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatBRL(tx.amount)}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title={t.editTx}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {confirmingTxId === tx.id ? (
                            <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 animate-in fade-in">
                              <span className="text-[10px] text-rose-400 font-semibold">{lang === 'pt' ? 'Excluir?' : 'Del?'}</span>
                              <button
                                onClick={() => {
                                  onDeleteTransaction(tx.id);
                                  setConfirmingTxId(null);
                                }}
                                className="px-1.5 py-0.5 text-[10px] bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-colors cursor-pointer"
                              >
                                {lang === 'pt' ? 'Sim' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmingTxId(null)}
                                className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                              >
                                {lang === 'pt' ? 'Não' : 'No'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingTxId(tx.id)}
                              title={t.deleteTx}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
