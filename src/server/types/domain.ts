/**
 * Finanza Backend Domain Types & DTOs
 * Layered Architecture: Domain Layer
 */

export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentType = 'card' | 'cash' | 'pix' | 'transfer' | 'other';
export type MedalType = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface UserProfileDTO {
  id: string;
  email?: string;
  username: string;
  fullName: string;
  avatar?: string;
  passwordHash: string;
  currency: string;
  mainIncomeTarget: number;
  carryoverBalance: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number;
  isIncome: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDTO {
  id: string;
  profileId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String
  description: string;
  paymentType: PaymentType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameScoreDTO {
  id: string;
  profileId: string;
  score: number;
  medal?: MedalType | null;
  pipesPassed: number;
  createdAt: string;
}

export interface CategoryWithStatsDTO extends CategoryDTO {
  totalSpent: number;
  totalIncome: number;
  balance: number;
  remainingBudget: number;
  percentSpent: number;
  transactionCount: number;
}

export interface MonthlyFinancialSummaryDTO {
  year: number;
  month: number;
  monthKey: string;
  monthLabel: string;
  isCurrentMonth: boolean;
  totalIncome: number;
  totalExpense: number;
  monthNetBalance: number;
  previousCarryover: number;
  totalEffectiveBalance: number;
  carryoverEnabled: boolean;
  mainIncomeTarget: number;
  savingsRate: number;
  daysInMonth: number;
  totalAllocatedToBudgets: number;
  unallocatedBalance: number;
  allocationPercent: number;
  incomeTransactions: TransactionDTO[];
  spendingByDay: {
    date: string;
    dayNumber: number;
    dayLabel: string;
    totalExpense: number;
    totalIncome: number;
    transactions: TransactionDTO[];
  }[];
}
