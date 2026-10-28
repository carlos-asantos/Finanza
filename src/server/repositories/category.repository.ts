/**
 * Category Repository
 * Layered Architecture: Repository Layer
 * Manages Category persistence with Prisma ORM (MySQL).
 */
import { prisma, checkMySQLConnection } from '../config/prisma';
import { CategoryDTO } from '../types/domain';
import { getInitialSeedData } from './seed.data';

export interface ICategoryRepository {
  findByProfileId(profileId: string): Promise<CategoryDTO[]>;
  findById(id: string): Promise<CategoryDTO | null>;
  create(data: Omit<CategoryDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CategoryDTO>;
  update(id: string, data: Partial<CategoryDTO>): Promise<CategoryDTO>;
  delete(id: string): Promise<boolean>;
}

class CategoryRepository implements ICategoryRepository {
  private fallbackStore: CategoryDTO[] = [];
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      const seed = getInitialSeedData();
      this.fallbackStore = [...seed.categories];
      this.initialized = true;
    }
  }

  async findByProfileId(profileId: string): Promise<CategoryDTO[]> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const cats = await prisma.category.findMany({
        where: { profileId },
        orderBy: [{ isIncome: 'desc' }, { createdAt: 'asc' }],
      });
      return cats.map(c => ({
        id: c.id,
        profileId: c.profileId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        budgetLimit: Number(c.budgetLimit),
        isIncome: c.isIncome,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }
    await this.ensureInitialized();
    return this.fallbackStore
      .filter(c => c.profileId === profileId)
      .sort((a, b) => (b.isIncome ? 1 : 0) - (a.isIncome ? 1 : 0));
  }

  async findById(id: string): Promise<CategoryDTO | null> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const c = await prisma.category.findUnique({
        where: { id },
      });
      if (!c) return null;
      return {
        id: c.id,
        profileId: c.profileId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        budgetLimit: Number(c.budgetLimit),
        isIncome: c.isIncome,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const found = this.fallbackStore.find(c => c.id === id);
    return found ? { ...found } : null;
  }

  async create(data: Omit<CategoryDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CategoryDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const created = await prisma.category.create({
        data: {
          id: data.id,
          profileId: data.profileId,
          name: data.name,
          icon: data.icon,
          color: data.color,
          budgetLimit: data.budgetLimit,
          isIncome: data.isIncome,
        },
      });
      return {
        id: created.id,
        profileId: created.profileId,
        name: created.name,
        icon: created.icon,
        color: created.color,
        budgetLimit: Number(created.budgetLimit),
        isIncome: created.isIncome,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newCat: CategoryDTO = {
      id: data.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      profileId: data.profileId,
      name: data.name,
      icon: data.icon || 'tag',
      color: data.color || '#10b981',
      budgetLimit: data.budgetLimit || 0,
      isIncome: Boolean(data.isIncome),
      createdAt: now,
      updatedAt: now,
    };
    this.fallbackStore.push(newCat);
    return { ...newCat };
  }

  async update(id: string, data: Partial<CategoryDTO>): Promise<CategoryDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          icon: data.icon,
          color: data.color,
          budgetLimit: data.budgetLimit,
          isIncome: data.isIncome,
        },
      });
      return {
        id: updated.id,
        profileId: updated.profileId,
        name: updated.name,
        icon: updated.icon,
        color: updated.color,
        budgetLimit: Number(updated.budgetLimit),
        isIncome: updated.isIncome,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const idx = this.fallbackStore.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Category ${id} not found`);
    }
    const current = this.fallbackStore[idx];
    const updated: CategoryDTO = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.fallbackStore[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      await prisma.category.delete({ where: { id } });
      return true;
    }
    await this.ensureInitialized();
    const len = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter(c => c.id !== id);
    return this.fallbackStore.length < len;
  }
}

export const categoryRepository = new CategoryRepository();
