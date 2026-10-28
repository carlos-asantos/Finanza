/**
 * Category Controller
 * Layered Architecture: Controller Layer
 * Handles category CRUD and budget limits.
 */
import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';

export class CategoryController {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const categories = await categoryService.getCategoriesByProfile(profileId);
      res.json({ success: true, data: categories });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      res.status(500).json({ success: false, error: message });
    }
  }

  async saveCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id, profileId, name, icon, color, budgetLimit, isIncome } = req.body;
      if (!profileId || !name) {
        res.status(400).json({ success: false, error: 'profileId and name are required' });
        return;
      }

      const saved = await categoryService.saveCategory({
        id,
        profileId,
        name,
        icon,
        color,
        budgetLimit,
        isIncome,
      });

      res.status(id ? 200 : 201).json({ success: true, data: saved });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      res.status(400).json({ success: false, error: message });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'Category id is required' });
        return;
      }

      const success = await categoryService.deleteCategory(id);
      res.json({ success, data: { id } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      res.status(500).json({ success: false, error: message });
    }
  }
}

export const categoryController = new CategoryController();
