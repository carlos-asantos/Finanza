/**
 * TypeScript Data Models mirroring the MySQL Prisma Schema
 * With monthly separation, zero-based budget allocation, and unallocated funds tracking.
 */

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  fullName: string;
  avatar?: string;
  passwordHash: string;
  currency: string; // BRL
  mainIncomeTarget: number; // Planned main income target
  carryoverBalance: boolean; // Option to roll over remaining balance to next month
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number; // User-determined planned limit/value
  isIncome: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  profileId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string YYYY-MM-DDTHH:mm:ss
  description: string;
  paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameScore {
  id: string;
  profileId: string;
  score: number;
  medal?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  pipesPassed: number;
  createdAt: string;
}

export interface CategoryWithStats extends Category {
  totalSpent: number;
  totalIncome: number;
  balance: number;
  remainingBudget: number;
  percentSpent: number;
  transactionCount: number;
}

export interface MonthlyFinancialSummary {
  year: number;
  month: number; // 1-12
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // e.g. "Outubro 2026" / "October 2026"
  isCurrentMonth: boolean;
  totalIncome: number; // Literal total sum of all incomes/entries registered in this month
  totalExpense: number; // Outflows in this month
  monthNetBalance: number; // Incomes - Expenses for this specific month
  previousCarryover: number; // Surplus or deficit brought forward from prior months
  totalEffectiveBalance: number; // monthNetBalance + (carryoverEnabled ? previousCarryover : 0)
  carryoverEnabled: boolean;
  mainIncomeTarget: number;
  savingsRate: number;
  daysInMonth: number;
  // Zero-based budget allocation:
  totalAllocatedToBudgets: number; // Sum of all determined category budget limits
  unallocatedBalance: number; // totalIncome - totalAllocatedToBudgets (Funds not yet assigned to categories)
  allocationPercent: number; // % of total entries already assigned
  incomeTransactions: Transaction[]; // List of individual incoming entries for management and deletion
  spendingByDay: {
    date: string; // "YYYY-MM-DD"
    dayNumber: number; // 1..31
    dayLabel: string; // "Seg, 26 Out" / "Mon, Oct 26"
    totalExpense: number;
    totalIncome: number;
    transactions: Transaction[];
  }[];
}
