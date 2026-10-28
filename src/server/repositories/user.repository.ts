/**
 * User Repository
 * Layered Architecture: Repository Layer
 * Manages user profile persistence via Prisma ORM (MySQL).
 */
import { prisma, checkMySQLConnection } from '../config/prisma';
import { UserProfileDTO } from '../types/domain';
import { getInitialSeedData } from './seed.data';

export interface IUserRepository {
  findAll(): Promise<UserProfileDTO[]>;
  findById(id: string): Promise<UserProfileDTO | null>;
  findByUsername(username: string): Promise<UserProfileDTO | null>;
  findByEmail(email: string): Promise<UserProfileDTO | null>;
  findByIdentifier(identifier: string): Promise<UserProfileDTO | null>;
  create(data: Omit<UserProfileDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserProfileDTO>;
  update(id: string, data: Partial<UserProfileDTO>): Promise<UserProfileDTO>;
  delete(id: string): Promise<boolean>;
}

class UserRepository implements IUserRepository {
  private fallbackStore: UserProfileDTO[] = [];
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      const seed = getInitialSeedData();
      this.fallbackStore = [...seed.profiles];
      this.initialized = true;
    }
  }

  async findAll(): Promise<UserProfileDTO[]> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const users = await prisma.userProfile.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return users.map(u => ({
        id: u.id,
        email: u.email || undefined,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar || undefined,
        passwordHash: u.passwordHash,
        currency: u.currency,
        mainIncomeTarget: Number(u.mainIncomeTarget),
        carryoverBalance: u.carryoverBalance,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      }));
    }
    await this.ensureInitialized();
    return [...this.fallbackStore];
  }

  async findById(id: string): Promise<UserProfileDTO | null> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const u = await prisma.userProfile.findUnique({
        where: { id },
      });
      if (!u) return null;
      return {
        id: u.id,
        email: u.email || undefined,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar || undefined,
        passwordHash: u.passwordHash,
        currency: u.currency,
        mainIncomeTarget: Number(u.mainIncomeTarget),
        carryoverBalance: u.carryoverBalance,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const found = this.fallbackStore.find(p => p.id === id);
    return found ? { ...found } : null;
  }

  async findByUsername(username: string): Promise<UserProfileDTO | null> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const u = await prisma.userProfile.findUnique({
        where: { username },
      });
      if (!u) return null;
      return {
        id: u.id,
        email: u.email || undefined,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar || undefined,
        passwordHash: u.passwordHash,
        currency: u.currency,
        mainIncomeTarget: Number(u.mainIncomeTarget),
        carryoverBalance: u.carryoverBalance,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const found = this.fallbackStore.find(p => p.username.toLowerCase() === username.toLowerCase());
    return found ? { ...found } : null;
  }

  async findByEmail(email: string): Promise<UserProfileDTO | null> {
    const cleanEmail = email.toLowerCase().trim();
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const u = await prisma.userProfile.findFirst({
        where: { email: cleanEmail },
      });
      if (!u) return null;
      return {
        id: u.id,
        email: u.email || undefined,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar || undefined,
        passwordHash: u.passwordHash,
        currency: u.currency,
        mainIncomeTarget: Number(u.mainIncomeTarget),
        carryoverBalance: u.carryoverBalance,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const found = this.fallbackStore.find(p => p.email?.toLowerCase() === cleanEmail);
    return found ? { ...found } : null;
  }

  async findByIdentifier(identifier: string): Promise<UserProfileDTO | null> {
    const clean = identifier.toLowerCase().trim();
    // 1. Try by email
    const byEmail = await this.findByEmail(clean);
    if (byEmail) return byEmail;

    // 2. Try by username
    const byUser = await this.findByUsername(clean);
    if (byUser) return byUser;

    // 3. Try by id
    return this.findById(clean);
  }

  async create(data: Omit<UserProfileDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserProfileDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const created = await prisma.userProfile.create({
        data: {
          id: data.id,
          email: data.email,
          username: data.username,
          fullName: data.fullName,
          avatar: data.avatar,
          passwordHash: data.passwordHash,
          currency: data.currency || 'BRL',
          mainIncomeTarget: data.mainIncomeTarget || 0,
          carryoverBalance: data.carryoverBalance ?? true,
        },
      });
      return {
        id: created.id,
        email: created.email || undefined,
        username: created.username,
        fullName: created.fullName,
        avatar: created.avatar || undefined,
        passwordHash: created.passwordHash,
        currency: created.currency,
        mainIncomeTarget: Number(created.mainIncomeTarget),
        carryoverBalance: created.carryoverBalance,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newProfile: UserProfileDTO = {
      id: data.id || `profile-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      avatar: data.avatar,
      passwordHash: data.passwordHash,
      currency: data.currency || 'BRL',
      mainIncomeTarget: data.mainIncomeTarget || 0,
      carryoverBalance: data.carryoverBalance ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.fallbackStore.push(newProfile);
    return { ...newProfile };
  }

  async update(id: string, data: Partial<UserProfileDTO>): Promise<UserProfileDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const updated = await prisma.userProfile.update({
        where: { id },
        data: {
          email: data.email,
          fullName: data.fullName,
          avatar: data.avatar,
          passwordHash: data.passwordHash,
          currency: data.currency,
          mainIncomeTarget: data.mainIncomeTarget,
          carryoverBalance: data.carryoverBalance,
        },
      });
      return {
        id: updated.id,
        email: updated.email || undefined,
        username: updated.username,
        fullName: updated.fullName,
        avatar: updated.avatar || undefined,
        passwordHash: updated.passwordHash,
        currency: updated.currency,
        mainIncomeTarget: Number(updated.mainIncomeTarget),
        carryoverBalance: updated.carryoverBalance,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const index = this.fallbackStore.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`User profile ${id} not found`);
    }
    const current = this.fallbackStore[index];
    const updated: UserProfileDTO = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.fallbackStore[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      await prisma.userProfile.delete({ where: { id } });
      return true;
    }
    await this.ensureInitialized();
    const initialLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter(p => p.id !== id);
    return this.fallbackStore.length < initialLen;
  }
}

export const userRepository = new UserRepository();
