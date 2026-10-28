/**
 * Incomes Management Modal
 * Allows unlimited manual entries into "Salário & Entradas Principais",
 * sums them up dynamically, and allows deleting individual entries.
 */
import React, { useState } from 'react';
import { Transaction, Category } from '../../types/finance';
import { Language, translations, formatBRL, formatDateDDMMYYYY } from '../../utils/i18n';
import { X, Plus, Trash2, ArrowUpRight, Calendar, CreditCard, Banknote, Send, Building, ShieldCheck, Tag } from 'lucide-react';

interface IncomesManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  monthLabel: string;
  defaultDate: string; // "YYYY-MM-DD"
  incomeCategory: Category | undefined;
  incomeTransactions: Transaction[];
  totalIncome: number;
  totalAllocated: number;
  unallocatedBalance: number;
  onAddIncome: (data: {
    description: string;
    amount: number;
    date: string;
    paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
    categoryId: string;
  }) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
}

export const IncomesManageModal: React.FC<IncomesManageModalProps> = ({
  isOpen,
  onClose,
  lang,
  monthLabel,
  defaultDate,
  incomeCategory,
  incomeTransactions,
  totalIncome,
  totalAllocated,
  unallocatedBalance,
  onAddIncome,
  onDeleteIncome,
}) => {
  const t = translations[lang];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [paymentType, setPaymentType] = useState<'card' | 'cash' | 'pix' | 'transfer' | 'other'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t.validAmountErr);
      return;
    }

    if (!description.trim()) {
      setError(t.descErr);
      return;
    }

    if (!incomeCategory) {
      setError(t.catErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddIncome({
        description: description.trim(),
        amount: parsedAmount,
        date: new Date(date + 'T12:00:00').toISOString(),
        paymentType,
        categoryId: incomeCategory.id,
      });
      setDescription('');
      setAmount('');
      setError(null);
    } catch {
      setError(t.saveTxErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverAllocated = unallocatedBalance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {t.incomesModalTitle.replace('{month}', monthLabel)}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.incomesModalDesc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Allocation Counter Strip */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 my-4 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.literalTotalIncomes}
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
              +{formatBRL(totalIncome)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {t.incomesCountBadge.replace('{count}', incomeTransactions.length.toString())}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.allocatedToCategoriesTitle}
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-slate-200 tabular-nums">
              {formatBRL(totalAllocated)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {totalIncome > 0 ? `${Math.round((totalAllocated / totalIncome) * 100)}% das entradas` : '0%'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.unallocatedIndicatorTitle}
            </span>
            <span className={`font-mono text-base sm:text-lg font-bold tabular-nums ${isOverAllocated ? 'text-rose-400' : 'text-cyan-400'}`}>
              {formatBRL(unallocatedBalance)}
            </span>
            <span className={`text-[10px] font-medium block ${isOverAllocated ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOverAllocated ? t.overAllocatedBadge : unallocatedBalance === 0 ? t.fullyAllocatedBadge : t.freeToAllocateBadge}
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          {/* Form to insert a new income */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>{t.insertIncomeQuickBtn}</span>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.descLabel}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.incomeDescriptionPlaceholder}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.amountLabel} (BRL)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400 font-mono font-bold text-xs">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>{t.dateLabel}</span>
                    <span className="text-[10px] text-slate-500 font-mono">(dd/mm/aaaa)</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.paymentMethodLabel}
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pix">{t.pix}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="cash">{t.cash}</option>
                    <option value="card">{t.card}</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? t.saving : t.insertIncomeQuickBtn}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* List of existing incoming entries */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>{t.literalTotalIncomes} ({incomeTransactions.length})</span>
              <span className="text-emerald-400 font-mono text-xs">
                Soma: {formatBRL(totalIncome)}
              </span>
            </h4>

            {incomeTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                {t.noIncomesYet}
              </div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                {incomeTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{tx.description}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono">
                            {formatDateDDMMYYYY(tx.date)}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="capitalize">{tx.paymentType === 'pix' ? 'Pix' : tx.paymentType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                        +{formatBRL(tx.amount)}
                      </span>

                      {/* Delete button with inline confirmation */}
                      {confirmDeleteId === tx.id ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                          <span className="text-[11px] font-semibold text-rose-400">
                            {lang === 'pt' ? 'Excluir?' : 'Delete?'}
                          </span>
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            onClick={async () => {
                              setDeletingId(tx.id);
                              try {
                                await onDeleteIncome(tx.id);
                                setConfirmDeleteId(null);
                              } catch (err) {
                                console.error('Error deleting income:', err);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === tx.id ? '...' : (lang === 'pt' ? 'Sim' : 'Yes')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-[11px] text-slate-300 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            {lang === 'pt' ? 'Não' : 'No'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t.deleteTx}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0 text-xs text-slate-400">
          <span>{t.incomesCountBadge.replace('{count}', incomeTransactions.length.toString())}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
