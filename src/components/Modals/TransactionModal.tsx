/**
 * Transaction Modal
 * For manual entry and editing of daily financial transactions.
 * Strict Brazilian Real (R$) currency input with Portuguese/English language support.
 */
import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../../types/finance';
import { Language, translations } from '../../utils/i18n';
import { X, ArrowUpRight, ArrowDownRight, Calendar, Tag, FileText } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSave: (data: {
    id?: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string;
    description: string;
    paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
    notes?: string;
  }) => Promise<void>;
  categories: Category[];
  editingTransaction?: Transaction | null;
  defaultCategoryId?: string;
  defaultType?: 'INCOME' | 'EXPENSE';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSave,
  categories,
  editingTransaction,
  defaultCategoryId,
  defaultType = 'EXPENSE',
}) => {
  const t = translations[lang];

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'card' | 'cash' | 'pix' | 'transfer' | 'other'>('card');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available categories based on selected type
  const matchingCategories = categories.filter((c) =>
    type === 'INCOME' ? c.isIncome : !c.isIncome
  );

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategoryId(editingTransaction.categoryId);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date.split('T')[0]);
      setDescription(editingTransaction.description);
      setPaymentType(editingTransaction.paymentType || 'card');
      setNotes(editingTransaction.notes || '');
    } else {
      setType(defaultType);
      const targetCatId = defaultCategoryId || (matchingCategories[0]?.id || categories[0]?.id || '');
      setCategoryId(targetCatId);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setPaymentType('card');
      setNotes('');
    }
    setError(null);
  }, [editingTransaction, defaultCategoryId, defaultType, isOpen]);

  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    setType(newType);
    const validCats = categories.filter((c) => (newType === 'INCOME' ? c.isIncome : !c.isIncome));
    if (validCats.length > 0 && !validCats.some((c) => c.id === categoryId)) {
      setCategoryId(validCats[0].id);
    }
  };

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

    if (!categoryId) {
      setError(t.catErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingTransaction?.id,
        categoryId,
        type,
        amount: parsedAmount,
        date: new Date(date + 'T12:00:00').toISOString(),
        description: description.trim(),
        paymentType,
        notes: notes.trim(),
      });
      onClose();
    } catch {
      setError(t.saveTxErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-base font-bold text-white">
            {editingTransaction ? t.modalEditTx : t.modalLogTx}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Segmented Switch */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{t.expenseType}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t.incomeType}</span>
            </button>
          </div>

          {/* Amount Input in Real (BRL) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.amountLabel} (BRL)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-mono font-bold text-sm">
                R$
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.descLabel}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descPlaceholder}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>

          {/* Category & Date in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>{t.categoryLabel}</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              >
                {matchingCategories.length === 0 ? (
                  <option value="">{t.noCategoriesOfType}</option>
                ) : (
                  matchingCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{t.dateLabel}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">(dd/mm/aaaa)</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.paymentMethodLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['card', 'cash', 'pix', 'transfer'] as const).map((method) => {
                const label = method === 'card' ? t.card : method === 'cash' ? t.cash : method === 'pix' ? t.pix : t.transfer;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentType(method)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      paymentType === method
                        ? 'bg-slate-800 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{t.notesLabel}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? t.saving : editingTransaction ? t.updateEntryBtn : t.logEntryBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
