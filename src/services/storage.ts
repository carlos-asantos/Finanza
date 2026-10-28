/**
 * Frontend API Client & Storage Layer
 * Connects the React UI to the Layered Node.js TypeScript Backend.
 */
import {
  UserProfile,
  Category,
  Transaction,
  GameScore,
  CategoryWithStats,
  MonthlyFinancialSummary,
} from '../types/finance';
import { Language } from '../utils/i18n';

const ACTIVE_PROFILE_KEY = 'finanza_active_profile_id_v2';

export class FinanzaService {
  private static activeProfileId: string | null = null;

  static async init(): Promise<void> {
    const saved = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (saved) {
      this.activeProfileId = saved;
    }
  }

  // --- Profile & Authentication ---
  static async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/auth/profiles');
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error loading profiles:', err);
      return [];
    }
  }

  static async getActiveProfile(): Promise<UserProfile | null> {
    if (!this.activeProfileId) {
      this.activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    }
    if (!this.activeProfileId) {
      const all = await this.getAllProfiles();
      return all[0] || null;
    }
    const all = await this.getAllProfiles();
    return all.find(p => p.id === this.activeProfileId) || all[0] || null;
  }

  static async setActiveProfile(profileId: string): Promise<void> {
    this.activeProfileId = profileId;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  static setActiveProfileId(profileId: string): void {
    this.activeProfileId = profileId;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  static async loginWithEmail(email: string, plainPassword: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: plainPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Credenciais inválidas.');
    }
    await this.setActiveProfile(json.data.id);
    return json.data;
  }

  static async registerAccount(data: {
    email: string;
    fullName: string;
    password: string;
    mainIncomeTarget?: number;
  }): Promise<UserProfile> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim(),
        fullName: data.fullName.trim(),
        password: data.password,
        mainIncomeTarget: data.mainIncomeTarget || 5000,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Falha ao criar conta');
    }
    await this.setActiveProfile(json.data.id);
    return json.data;
  }

  static async verifyPassword(profileId: string, plainPassword: string): Promise<UserProfile | null> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, password: plainPassword }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) {
        await this.setActiveProfile(json.data.id);
        return json.data;
      }
      return null;
    } catch (err) {
      console.error('[API] Error verifying password:', err);
      return null;
    }
  }

  static async createProfile(data: {
    username?: string;
    email?: string;
    fullName: string;
    password: string;
    currency?: string;
    avatar?: string;
    mainIncomeTarget?: number;
    carryoverBalance?: boolean;
  }): Promise<UserProfile> {
    const res = await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to create profile');
    }
    await this.setActiveProfile(json.data.id);
    return json.data;
  }

  static async setCarryoverPreference(profileId: string, enabled: boolean): Promise<UserProfile> {
    const res = await fetch('/api/auth/carryover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, enabled }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update carryover preference');
    }
    return json.data;
  }

  static async updateProfile(profileId: string, data: {
    fullName?: string;
    email?: string;
    avatar?: string;
    mainIncomeTarget?: number;
    carryoverBalance?: boolean;
  }): Promise<UserProfile> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, ...data }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Falha ao atualizar dados do usuário');
    }
    return json.data;
  }

  // --- Categories ---
  static async getCategories(profileId: string): Promise<Category[]> {
    try {
      const res = await fetch(`/api/categories?profileId=${encodeURIComponent(profileId)}`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error fetching categories:', err);
      return [];
    }
  }

  static async saveCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save category');
    }
    return json.data;
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Failed to delete category');
    }
  }

  // --- Transactions ---
  static async getAllTransactions(profileId: string): Promise<Transaction[]> {
    try {
      const res = await fetch(`/api/transactions?profileId=${encodeURIComponent(profileId)}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error fetching transactions:', err);
      return [];
    }
  }

  static async createTransaction(txData: {
    profileId: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string;
    description: string;
    paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
    notes?: string;
  }): Promise<Transaction> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to create transaction');
    }
    return json.data;
  }

  static async updateTransaction(
    id: string,
    txData: Partial<{
      categoryId: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      date: string;
      description: string;
      paymentType: 'card' | 'cash' | 'pix' | 'transfer' | 'other';
      notes?: string;
    }>
  ): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update transaction');
    }
    return json.data;
  }

  static async deleteTransaction(id: string): Promise<boolean> {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Failed to delete transaction');
    }
    const json = await res.json();
    return Boolean(json.success);
  }

  // --- Financial Summaries & Category Stats ---
  static async getCategoriesWithMonthlyStats(
    profileId: string,
    year: number,
    month: number
  ): Promise<CategoryWithStats[]> {
    try {
      const res = await fetch(
        `/api/finance/categories-stats?profileId=${encodeURIComponent(profileId)}&year=${year}&month=${month}`
      );
      if (!res.ok) throw new Error('Failed to fetch category stats');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error fetching category stats:', err);
      return [];
    }
  }

  static async getMonthlyFinancialSummary(
    profileId: string,
    year: number,
    month: number,
    lang: Language = 'pt'
  ): Promise<MonthlyFinancialSummary> {
    try {
      const res = await fetch(
        `/api/finance/summary?profileId=${encodeURIComponent(profileId)}&year=${year}&month=${month}&lang=${lang}`
      );
      if (!res.ok) throw new Error('Failed to fetch monthly financial summary');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error fetching summary:', err);
      // Return empty summary structure rather than throwing to keep UI responsive
      return {
        year,
        month,
        monthKey: `${year}-${String(month).padStart(2, '0')}`,
        monthLabel: `${year}-${month}`,
        isCurrentMonth: true,
        totalIncome: 0,
        totalExpense: 0,
        monthNetBalance: 0,
        previousCarryover: 0,
        totalEffectiveBalance: 0,
        carryoverEnabled: true,
        mainIncomeTarget: 0,
        savingsRate: 0,
        daysInMonth: 30,
        totalAllocatedToBudgets: 0,
        unallocatedBalance: 0,
        allocationPercent: 0,
        incomeTransactions: [],
        spendingByDay: [],
      };
    }
  }

  static async getAvailableMonths(profileId: string, lang: Language = 'pt'): Promise<{ year: number; month: number; label: string }[]> {
    try {
      const res = await fetch(`/api/finance/months?profileId=${encodeURIComponent(profileId)}&lang=${lang}`);
      if (!res.ok) throw new Error('Failed to fetch available months');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error fetching months:', err);
      const now = new Date();
      return [{ year: now.getFullYear(), month: now.getMonth() + 1, label: 'Mês Atual' }];
    }
  }

  // --- Secret Arcade Game Scores ---
  static async getTopScores(profileId: string): Promise<GameScore[]> {
    return this.getHighScores(profileId);
  }

  static async getHighScores(profileId: string): Promise<GameScore[]> {
    try {
      const res = await fetch(`/api/scores?profileId=${encodeURIComponent(profileId)}`);
      if (!res.ok) throw new Error('Failed to fetch scores');
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('[API] Error fetching game scores:', err);
      return [];
    }
  }

  static async saveGameScore(data: {
    profileId: string;
    score: number;
    medal?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
    pipesPassed: number;
  }): Promise<GameScore> {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  }

  static async recordGameScore(profileId: string, score: number, pipesPassed: number): Promise<GameScore> {
    let medal: 'bronze' | 'silver' | 'gold' | 'platinum' | null = null;
    if (score >= 40) medal = 'platinum';
    else if (score >= 30) medal = 'gold';
    else if (score >= 20) medal = 'silver';
    else if (score >= 10) medal = 'bronze';

    return this.saveGameScore({
      profileId,
      score,
      medal,
      pipesPassed,
    });
  }
}
