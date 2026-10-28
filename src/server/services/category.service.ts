/**
 * Category Service
 * Layered Architecture: Service / Business Logic Layer
 * Handles budget limits, category creation, updates, and validations.
 */
import { categoryRepository, ICategoryRepository } from '../repositories/category.repository';
import { CategoryDTO } from '../types/domain';

export class CategoryService {
  constructor(private catRepo: ICategoryRepository = categoryRepository) {}

  async getCategoriesByProfile(profileId: string): Promise<CategoryDTO[]> {
    return this.catRepo.findByProfileId(profileId);
  }

  async getCategoryById(id: string): Promise<CategoryDTO | null> {
    return this.catRepo.findById(id);
  }

  async saveCategory(data: {
    id?: string;
    profileId: string;
    name: string;
    icon?: string;
    color?: string;
    budgetLimit: number;
    isIncome?: boolean;
  }): Promise<CategoryDTO> {
    if (data.id) {
      return this.catRepo.update(data.id, {
        name: data.name.trim(),
        icon: data.icon || 'tag',
        color: data.color || '#10b981',
        budgetLimit: Math.max(0, Number(data.budgetLimit) || 0),
        isIncome: Boolean(data.isIncome),
      });
    }

    return this.catRepo.create({
      profileId: data.profileId,
      name: data.name.trim(),
      icon: data.icon || 'tag',
      color: data.color || '#10b981',
      budgetLimit: Math.max(0, Number(data.budgetLimit) || 0),
      isIncome: Boolean(data.isIncome),
    });
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.catRepo.delete(id);
  }
}

export const categoryService = new CategoryService();
