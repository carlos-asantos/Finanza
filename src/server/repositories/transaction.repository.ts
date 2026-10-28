/**
 * Transaction Repository
 * Layered Architecture: Repository Layer
 * Manages Transaction persistence with Prisma ORM (MySQL).
 */
import { prisma, checkMySQLConnection } from '../config/prisma';
import { TransactionDTO } from '../types/domain';
import { getInitialSeedData } from './seed.data';

export interface ITransactionRepository {
  findByProfileId(profileId: string): Promise<TransactionDTO[]>;
  findById(id: string): Promise<TransactionDTO | null>;
  findByMonth(profileId: string, year: number, month: number): Promise<TransactionDTO[]>;
  create(data: Omit<TransactionDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TransactionDTO>;
  update(id: string, data: Partial<TransactionDTO>): Promise<TransactionDTO>;
  delete(id: string): Promise<boolean>;
}

class TransactionRepository implements ITransactionRepository {
  private fallbackStore: TransactionDTO[] = [];
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      const seed = getInitialSeedData();
      this.fallbackStore = [...seed.transactions];
      this.initialized = true;
    }
  }

  async findByProfileId(profileId: string): Promise<TransactionDTO[]> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const txs = await prisma.transaction.findMany({
        where: { profileId },
        orderBy: { date: 'desc' },
      });
      return txs.map(t => ({
        id: t.id,
        profileId: t.profileId,
        categoryId: t.categoryId,
        type: t.type as 'INCOME' | 'EXPENSE',
        amount: Number(t.amount),
        date: t.date.toISOString(),
        description: t.description,
        paymentType: t.paymentType as 'card' | 'cash' | 'pix' | 'transfer' | 'other',
        notes: t.notes || undefined,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));
    }
    await this.ensureInitialized();
    return this.fallbackStore
      .filter(t => t.profileId === profileId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async findById(id: string): Promise<TransactionDTO | null> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const t = await prisma.transaction.findUnique({
        where: { id },
      });
      if (!t) return null;
      return {
        id: t.id,
        profileId: t.profileId,
        categoryId: t.categoryId,
        type: t.type as 'INCOME' | 'EXPENSE',
        amount: Number(t.amount),
        date: t.date.toISOString(),
        description: t.description,
        paymentType: t.paymentType as 'card' | 'cash' | 'pix' | 'transfer' | 'other',
        notes: t.notes || undefined,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const found = this.fallbackStore.find(t => t.id === id);
    return found ? { ...found } : null;
  }

  async findByMonth(profileId: string, year: number, month: number): Promise<TransactionDTO[]> {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`;

    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const txs = await prisma.transaction.findMany({
        where: {
          profileId,
          date: {
            gte: new Date(startStr),
            lt: new Date(endStr),
          },
        },
        orderBy: { date: 'desc' },
      });
      return txs.map(t => ({
        id: t.id,
        profileId: t.profileId,
        categoryId: t.categoryId,
        type: t.type as 'INCOME' | 'EXPENSE',
        amount: Number(t.amount),
        date: t.date.toISOString(),
        description: t.description,
        paymentType: t.paymentType as 'card' | 'cash' | 'pix' | 'transfer' | 'other',
        notes: t.notes || undefined,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));
    }
    await this.ensureInitialized();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.fallbackStore
      .filter(t => t.profileId === profileId && t.date.startsWith(monthPrefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async create(data: Omit<TransactionDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TransactionDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const created = await prisma.transaction.create({
        data: {
          id: data.id,
          profileId: data.profileId,
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount,
          date: new Date(data.date),
          description: data.description,
          paymentType: data.paymentType,
          notes: data.notes,
        },
      });
      return {
        id: created.id,
        profileId: created.profileId,
        categoryId: created.categoryId,
        type: created.type as 'INCOME' | 'EXPENSE',
        amount: Number(created.amount),
        date: created.date.toISOString(),
        description: created.description,
        paymentType: created.paymentType as 'card' | 'cash' | 'pix' | 'transfer' | 'other',
        notes: created.notes || undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newTx: TransactionDTO = {
      id: data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      profileId: data.profileId,
      categoryId: data.categoryId,
      type: data.type,
      amount: Math.abs(Number(data.amount)),
      date: new Date(data.date).toISOString(),
      description: data.description,
      paymentType: data.paymentType || 'card',
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.fallbackStore.push(newTx);
    return { ...newTx };
  }

  async update(id: string, data: Partial<TransactionDTO>): Promise<TransactionDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount !== undefined ? data.amount : undefined,
          date: data.date ? new Date(data.date) : undefined,
          description: data.description,
          paymentType: data.paymentType,
          notes: data.notes,
        },
      });
      return {
        id: updated.id,
        profileId: updated.profileId,
        categoryId: updated.categoryId,
        type: updated.type as 'INCOME' | 'EXPENSE',
        amount: Number(updated.amount),
        date: updated.date.toISOString(),
        description: updated.description,
        paymentType: updated.paymentType as 'card' | 'cash' | 'pix' | 'transfer' | 'other',
        notes: updated.notes || undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const idx = this.fallbackStore.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`Transaction ${id} not found`);
    }
    const current = this.fallbackStore[idx];
    const updated: TransactionDTO = {
      ...current,
      ...data,
      amount: data.amount !== undefined ? Math.abs(Number(data.amount)) : current.amount,
      date: data.date ? new Date(data.date).toISOString() : current.date,
      updatedAt: new Date().toISOString(),
    };
    this.fallbackStore[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      try {
        await prisma.transaction.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    }
    await this.ensureInitialized();
    const initialLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter(t => t.id !== id);
    return this.fallbackStore.length < initialLen;
  }
}

export const transactionRepository = new TransactionRepository();
