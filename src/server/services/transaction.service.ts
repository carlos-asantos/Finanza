/**
 * Transaction Service
 * Layered Architecture: Service / Business Logic Layer
 * Handles entry and expense transactions, validation, and deletion.
 */
import { transactionRepository, ITransactionRepository } from '../repositories/transaction.repository';
import { TransactionDTO, PaymentType, TransactionType } from '../types/domain';

export class TransactionService {
  constructor(private txRepo: ITransactionRepository = transactionRepository) {}

  async getAllTransactions(profileId: string): Promise<TransactionDTO[]> {
    return this.txRepo.findByProfileId(profileId);
  }

  async getMonthTransactions(profileId: string, year: number, month: number): Promise<TransactionDTO[]> {
    return this.txRepo.findByMonth(profileId, year, month);
  }

  async getTransactionById(id: string): Promise<TransactionDTO | null> {
    return this.txRepo.findById(id);
  }

  async createTransaction(data: {
    profileId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    date: string;
    description: string;
    paymentType: PaymentType;
    notes?: string;
  }): Promise<TransactionDTO> {
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }
    const amount = Math.abs(Number(data.amount));
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    return this.txRepo.create({
      profileId: data.profileId,
      categoryId: data.categoryId,
      type: data.type,
      amount,
      date: new Date(data.date).toISOString(),
      description: data.description.trim(),
      paymentType: data.paymentType || 'card',
      notes: data.notes?.trim(),
    });
  }

  async updateTransaction(id: string, data: Partial<{
    categoryId: string;
    type: TransactionType;
    amount: number;
    date: string;
    description: string;
    paymentType: PaymentType;
    notes?: string;
  }>): Promise<TransactionDTO> {
    const existing = await this.txRepo.findById(id);
    if (!existing) {
      throw new Error(`Transaction ${id} not found`);
    }

    const payload: Partial<TransactionDTO> = {};
    if (data.categoryId) payload.categoryId = data.categoryId;
    if (data.type) payload.type = data.type;
    if (data.amount !== undefined) {
      const amt = Math.abs(Number(data.amount));
      if (!isNaN(amt) && amt > 0) payload.amount = amt;
    }
    if (data.date) payload.date = new Date(data.date).toISOString();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.paymentType) payload.paymentType = data.paymentType;
    if (data.notes !== undefined) payload.notes = data.notes.trim();

    return this.txRepo.update(id, payload);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.txRepo.delete(id);
  }
}

export const transactionService = new TransactionService();
