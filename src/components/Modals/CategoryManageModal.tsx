/**
 * Category Management Modal
 * Allows users to set user-determined budget values, create categories, and customize colors/icons.
 * Strictly formatted in Brazilian Real (BRL - R$) with Portuguese/English language support.
 */
import React, { useState } from 'react';
import { Category, CategoryWithStats } from '../../types/finance';
import { Language, translations, formatBRL } from '../../utils/i18n';
import {
  X,
  Trash2,
  Tag,
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
  Check,
} from 'lucide-react';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  categories: CategoryWithStats[];
  profileId: string;
  totalIncome?: number;
  totalAllocated?: number;
  unallocatedBalance?: number;
  onSaveCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: 'tag', label: 'Tag', icon: Tag },
  { name: 'home', label: 'Moradia / Home', icon: Home },
  { name: 'shopping-cart', label: 'Mercado / Groceries', icon: ShoppingCart },
  { name: 'coffee', label: 'Alimentação / Dining', icon: Coffee },
  { name: 'car', label: 'Transporte / Car', icon: Car },
  { name: 'zap', label: 'Contas / Utilities', icon: Zap },
  { name: 'gamepad-2', label: 'Lazer / Games', icon: Gamepad2 },
  { name: 'heart-pulse', label: 'Saúde / Health', icon: HeartPulse },
  { name: 'briefcase', label: 'Trabalho / Work', icon: Briefcase },
  { name: 'server', label: 'Tech / Cloud', icon: Server },
  { name: 'monitor', label: 'Equipamentos / Gear', icon: Monitor },
];

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  lang,
  categories,
  profileId,
  totalIncome = 0,
  totalAllocated = 0,
  unallocatedBalance = 0,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const t = translations[lang];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#10b981');
  const [isIncome, setIsIncome] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live zero-based projection when user is typing a budget value
  const currentCategoryLimit = editingId ? (categories.find(c => c.id === editingId)?.budgetLimit || 0) : 0;
  const parsedLimit = parseFloat(budgetLimit.replace(',', '.')) || 0;
  const allocationDelta = !isIncome ? (parsedLimit - currentCategoryLimit) : 0;
  const projectedUnallocated = unallocatedBalance - allocationDelta;
  const isOverAllocated = unallocatedBalance < 0;
  const isProjectedOverAllocated = projectedUnallocated < 0;

  const startEdit = (cat: CategoryWithStats) => {
    setEditingId(cat.id);
    setName(cat.name);
    setBudgetLimit(cat.budgetLimit.toString());
    setIcon(cat.icon);
    setColor(cat.color);
    setIsIncome(cat.isIncome);
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBudgetLimit('');
    setIcon('tag');
    setColor('#10b981');
    setIsIncome(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t.nameErr);
      return;
    }

    const parsedLimit = parseFloat(budgetLimit.replace(',', '.')) || 0;

    setIsSaving(true);
    try {
      await onSaveCategory({
        ...(editingId ? { id: editingId } : {}),
        profileId,
        name: name.trim(),
        icon,
        color,
        budgetLimit: parsedLimit,
        isIncome,
      });
      resetForm();
    } catch {
      setError(t.saveCatErr);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">{t.manageCatModalHeading}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.manageCatModalDesc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto space-y-5 py-4 flex-1 pr-1">
          {/* Zero-Based Allocation Status Banner */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.literalTotalIncomes}
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                +{formatBRL(totalIncome)}
              </span>
              <span className="text-[10px] text-slate-500 block">Entradas base</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.allocatedToCategoriesTitle}
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-slate-200 tabular-nums">
                {formatBRL(totalAllocated)}
              </span>
              <span className="text-[10px] text-slate-500 block">Soma categorias</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.unallocatedIndicatorTitle}
              </span>
              <span className={`font-mono text-sm sm:text-base font-bold tabular-nums ${isOverAllocated ? 'text-rose-400' : 'text-cyan-400'}`}>
                {formatBRL(unallocatedBalance)}
              </span>
              <span className={`text-[10px] font-medium block ${isOverAllocated ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isOverAllocated ? t.overAllocatedBadge : unallocatedBalance === 0 ? t.fullyAllocatedBadge : t.freeToAllocateBadge}
              </span>
            </div>
          </div>

          {/* Add or Edit Category Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              {editingId ? t.editCatHeading : t.addCatHeading}
            </h4>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.catNameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.catNamePlaceholder}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isIncome ? t.targetMonthlyInflow : t.catLimitLabel} (BRL)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400 font-mono font-bold text-xs">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  {/* Subtraction explanation & live projected unallocated helper */}
                  {!isIncome && (
                    <div className="mt-1 text-[11px] text-slate-400 flex flex-col gap-0.5">
                      <span>Este valor é subtraído do total de entradas.</span>
                      {parsedLimit > 0 && (
                        <span className={`font-mono ${isProjectedOverAllocated ? 'text-rose-400 font-semibold' : 'text-cyan-400'}`}>
                          Após salvar: restará {formatBRL(projectedUnallocated)} não destinado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Icon & Color selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.iconLabel}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_ICONS.map((i) => {
                      const IconComp = i.icon;
                      const isSelected = icon === i.name;
                      return (
                        <button
                          key={i.name}
                          type="button"
                          onClick={() => setIcon(i.name)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={i.label}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.colorLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                          color === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                      >
                        {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Type Switch */}
              <div className="flex items-center gap-4 text-xs pt-1">
                <span className="text-slate-400">{t.catTypeLabel}</span>
                <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="categoryType"
                    checked={!isIncome}
                    onChange={() => setIsIncome(false)}
                    className="accent-emerald-500"
                  />
                  <span>{t.expenseRadio}</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="categoryType"
                    checked={isIncome}
                    onChange={() => setIsIncome(true)}
                    className="accent-emerald-500"
                  />
                  <span>{t.incomeRadio}</span>
                </label>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    {t.cancelEdit}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isSaving ? t.saving : editingId ? t.updateCatBtn : t.addCatBtn}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t.existingCatsHeading} ({categories.length})
            </h4>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        {cat.isIncome && (
                          <span className="text-[10px] text-emerald-400 font-mono">(Receita / Income)</span>
                        )}
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        {t.determinedValue} <span className="font-mono text-slate-300 tabular-nums">{formatBRL(cat.budgetLimit)}</span>
                        {' · '}
                        {t.spent}: <span className="font-mono text-rose-400 tabular-nums">{formatBRL(cat.totalSpent)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {t.editBudget}
                    </button>
                    {confirmDeleteCatId === cat.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <span className="text-[11px] font-semibold text-rose-400">{lang === 'pt' ? 'Excluir?' : 'Delete?'}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteCategory(cat.id);
                            setConfirmDeleteCatId(null);
                          }}
                          className="px-2 py-0.5 text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded transition-colors cursor-pointer"
                        >
                          {lang === 'pt' ? 'Sim' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(null)}
                          className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                        >
                          {lang === 'pt' ? 'Não' : 'No'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCatId(cat.id)}
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
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
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
