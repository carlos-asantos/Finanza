/**
 * Transaction Controller
 * Layered Architecture: Controller Layer
 * Handles transaction entries, listing, updating, and deletion.
 */
import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service';

export class TransactionController {
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      let transactions;
      if (year && month) {
        transactions = await transactionService.getMonthTransactions(profileId, year, month);
      } else {
        transactions = await transactionService.getAllTransactions(profileId);
      }

      res.json({ success: true, data: transactions });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      res.status(500).json({ success: false, error: message });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, categoryId, type, amount, date, description, paymentType, notes } = req.body;
      if (!profileId || !categoryId || !type || amount === undefined || !date || !description) {
        res.status(400).json({
          success: false,
          error: 'profileId, categoryId, type, amount, date and description are required',
        });
        return;
      }

      const tx = await transactionService.createTransaction({
        profileId,
        categoryId,
        type,
        amount: Number(amount),
        date,
        description,
        paymentType: paymentType || 'card',
        notes,
      });

      res.status(201).json({ success: true, data: tx });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create transaction';
      res.status(400).json({ success: false, error: message });
    }
  }

  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categoryId, type, amount, date, description, paymentType, notes } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Transaction id is required' });
        return;
      }

      const updated = await transactionService.updateTransaction(id, {
        categoryId,
        type,
        amount: amount !== undefined ? Number(amount) : undefined,
        date,
        description,
        paymentType,
        notes,
      });

      res.json({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update transaction';
      res.status(400).json({ success: false, error: message });
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'Transaction id is required' });
        return;
      }

      const success = await transactionService.deleteTransaction(id);
      if (!success) {
        res.status(404).json({ success: false, error: 'Transaction not found or could not be deleted' });
        return;
      }

      res.json({ success: true, data: { id } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete transaction';
      res.status(500).json({ success: false, error: message });
    }
  }
}

export const transactionController = new TransactionController();
