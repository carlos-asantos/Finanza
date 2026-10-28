/**
 * Finance Service
 * Layered Architecture: Service / Business Logic Layer
 * Calculates monthly financial metrics, carryover balances,
 * zero-based budget allocation, and category statistics.
 */
import { transactionRepository, ITransactionRepository } from '../repositories/transaction.repository';
import { categoryRepository, ICategoryRepository } from '../repositories/category.repository';
import { userRepository, IUserRepository } from '../repositories/user.repository';
import { CategoryWithStatsDTO, MonthlyFinancialSummaryDTO, TransactionDTO } from '../types/domain';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export class FinanceService {
  constructor(
    private txRepo: ITransactionRepository = transactionRepository,
    private catRepo: ICategoryRepository = categoryRepository,
    private userRepo: IUserRepository = userRepository
  ) {}

  formatMonthLabel(year: number, month: number, lang: 'pt' | 'en' = 'pt'): string {
    const list = lang === 'pt' ? MONTH_NAMES_PT : MONTH_NAMES_EN;
    const name = list[month - 1] || '';
    return `${name} ${year}`;
  }

  async getCategoriesWithMonthlyStats(
    profileId: string,
    year: number,
    month: number
  ): Promise<CategoryWithStatsDTO[]> {
    const [categories, transactions] = await Promise.all([
      this.catRepo.findByProfileId(profileId),
      this.txRepo.findByMonth(profileId, year, month),
    ]);

    return categories.map(cat => {
      const catTxs = transactions.filter(t => t.categoryId === cat.id);
      const totalSpent = catTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = catTxs
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const budgetLimit = cat.budgetLimit;
      const remainingBudget = Math.max(0, budgetLimit - totalSpent);
      const percentSpent = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
      const balance = cat.isIncome ? totalIncome : budgetLimit - totalSpent;

      return {
        ...cat,
        totalSpent,
        totalIncome,
        balance,
        remainingBudget,
        percentSpent,
        transactionCount: catTxs.length,
      };
    });
  }

  async getMonthlyFinancialSummary(
    profileId: string,
    year: number,
    month: number,
    lang: 'pt' | 'en' = 'pt'
  ): Promise<MonthlyFinancialSummaryDTO> {
    const [profile, categories, allTransactions] = await Promise.all([
      this.userRepo.findById(profileId),
      this.catRepo.findByProfileId(profileId),
      this.txRepo.findByProfileId(profileId),
    ]);

    const carryoverEnabled = profile ? profile.carryoverBalance : true;
    const mainIncomeTarget = profile ? profile.mainIncomeTarget : 0;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = monthKey === currentMonthKey;

    // Filter transactions strictly for this month
    const monthTransactions = allTransactions.filter(t => t.date.startsWith(monthKey));

    // Calculate literal total of all registered incoming entries this month
    const incomeTransactions = monthTransactions.filter(t => t.type === 'INCOME');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate total expenses for this month
    const expenseTransactions = monthTransactions.filter(t => t.type === 'EXPENSE');
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Monthly net balance strictly for this month
    const monthNetBalance = totalIncome - totalExpense;

    // Calculate total budget allocated across expense categories
    const totalAllocatedToBudgets = categories
      .filter(c => !c.isIncome)
      .reduce((sum, c) => sum + c.budgetLimit, 0);

    // Money not yet allocated to any specific category (zero-based budgeting)
    const unallocatedBalance = totalIncome - totalAllocatedToBudgets;
    const allocationPercent = totalIncome > 0
      ? Math.min(100, Math.round((totalAllocatedToBudgets / totalIncome) * 100))
      : 0;

    // Calculate previous months carryover
    // Accumulate all net balances from earlier months strictly if carryover is enabled
    let previousCarryover = 0;
    if (carryoverEnabled) {
      const priorTransactions = allTransactions.filter(t => {
        const txMonthKey = t.date.substring(0, 7);
        return txMonthKey < monthKey;
      });

      const priorIncome = priorTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const priorExpense = priorTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      previousCarryover = priorIncome - priorExpense;
    }

    const totalEffectiveBalance = monthNetBalance + (carryoverEnabled ? previousCarryover : 0);
    const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Days in this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const spendingByDay: MonthlyFinancialSummaryDTO['spendingByDay'] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${monthKey}-${dayStr}`;
      const dayDate = new Date(year, month - 1, day);
      const dayOfWeek = dayDate.getDay();

      const shortDay = lang === 'pt' ? DAYS_SHORT_PT[dayOfWeek] : DAYS_SHORT_EN[dayOfWeek];
      const monthNumStr = String(month).padStart(2, '0');
      const dayLabel = `${shortDay}, ${dayStr}/${monthNumStr}/${year}`;

      const dayTxs = monthTransactions.filter(t => t.date.startsWith(dateStr));
      const dayExpense = dayTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = dayTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);

      spendingByDay.push({
        date: dateStr,
        dayNumber: day,
        dayLabel,
        totalExpense: dayExpense,
        totalIncome: dayIncome,
        transactions: dayTxs,
      });
    }

    return {
      year,
      month,
      monthKey,
      monthLabel: this.formatMonthLabel(year, month, lang),
      isCurrentMonth,
      totalIncome,
      totalExpense,
      monthNetBalance,
      previousCarryover,
      totalEffectiveBalance,
      carryoverEnabled,
      mainIncomeTarget,
      savingsRate,
      daysInMonth,
      totalAllocatedToBudgets,
      unallocatedBalance,
      allocationPercent,
      incomeTransactions,
      spendingByDay,
    };
  }

  async getAvailableMonths(profileId: string, lang: 'pt' | 'en' = 'pt'): Promise<{ year: number; month: number; label: string }[]> {
    const transactions = await this.txRepo.findByProfileId(profileId);
    const monthSet = new Set<string>();

    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentKey);

    transactions.forEach(t => {
      const key = t.date.substring(0, 7);
      if (/^\d{4}-\d{2}$/.test(key)) {
        monthSet.add(key);
      }
    });

    const sortedKeys = Array.from(monthSet).sort().reverse();

    return sortedKeys.map(k => {
      const [yStr, mStr] = k.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      return {
        year: y,
        month: m,
        label: this.formatMonthLabel(y, m, lang),
      };
    });
  }
}

export const financeService = new FinanceService();
