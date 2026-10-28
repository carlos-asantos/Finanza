/**
 * Finance Controller
 * Layered Architecture: Controller Layer
 * Handles financial summaries, category statistics, and available months.
 */
import { Request, Response } from 'express';
import { financeService } from '../services/finance.service';

export class FinanceController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;
      const lang = (req.query.lang === 'en' ? 'en' : 'pt') as 'pt' | 'en';

      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const summary = await financeService.getMonthlyFinancialSummary(profileId, year, month, lang);
      res.json({ success: true, data: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to calculate financial summary';
      res.status(500).json({ success: false, error: message });
    }
  }

  async getCategoriesWithStats(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;

      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const categories = await financeService.getCategoriesWithMonthlyStats(profileId, year, month);
      res.json({ success: true, data: categories });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to calculate category stats';
      res.status(500).json({ success: false, error: message });
    }
  }

  async getAvailableMonths(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      const lang = (req.query.lang === 'en' ? 'en' : 'pt') as 'pt' | 'en';

      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const months = await financeService.getAvailableMonths(profileId, lang);
      res.json({ success: true, data: months });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch available months';
      res.status(500).json({ success: false, error: message });
    }
  }
}

export const financeController = new FinanceController();
