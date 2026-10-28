/**
 * Auth Service
 * Layered Architecture: Service / Business Logic Layer
 * Manages user authentication, bcrypt password encryption, and account registration.
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userRepository, IUserRepository } from '../repositories/user.repository';
import { categoryRepository, ICategoryRepository } from '../repositories/category.repository';
import { UserProfileDTO } from '../types/domain';

export interface PasswordValidation {
  isValid: boolean;
  message?: string;
}

export class AuthService {
  constructor(
    private userRepo: IUserRepository = userRepository,
    private categoryRepo: ICategoryRepository = categoryRepository
  ) {}

  /**
   * Validates email format according to requirement:
   * "o email caso não siga o formato xxxx@xxxx.com não será aceito"
   * (permits 'admin' for local development convenience).
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (clean === 'admin') return true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(clean);
  }

  /**
   * Validates password according to requirement:
   * "A senha precisa ter pelo menos 8 caracteres, conter pelo menos 1 número, caractere especial e letra maiúscula"
   */
  validatePassword(password: string): PasswordValidation {
    if (!password) {
      return { isValid: false, message: 'A senha é obrigatória.' };
    }
    if (password.length < 8) {
      return { isValid: false, message: 'A senha deve conter pelo menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'A senha deve conter pelo menos 1 letra maiúscula.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'A senha deve conter pelo menos 1 número.' };
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
      return { isValid: false, message: 'A senha deve conter pelo menos 1 caractere especial (!@#$...).' };
    }
    return { isValid: true };
  }

  /**
   * Encrypts plain password using bcrypt (salt rounds = 10)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verifies plain password against stored hash using bcrypt (with sha256 fallback)
   */
  async comparePassword(plainPassword: string, storedHash: string): Promise<boolean> {
    if (!storedHash || !plainPassword) return false;
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      return bcrypt.compare(plainPassword, storedHash);
    }
    // Fallback sha256 check
    const sha = crypto.createHash('sha256').update(plainPassword).digest('hex');
    return sha === storedHash;
  }

  async getAllProfiles(): Promise<Omit<UserProfileDTO, 'passwordHash'>[]> {
    const profiles = await this.userRepo.findAll();
    return profiles.map(({ passwordHash: _, ...rest }) => rest);
  }

  async getProfileById(id: string): Promise<UserProfileDTO | null> {
    return this.userRepo.findById(id);
  }

  /**
   * Authenticates user by email or username or id with bcrypt comparison
   */
  async authenticate(identifier: string, plainPassword: string): Promise<UserProfileDTO | null> {
    const profile = await this.userRepo.findByIdentifier(identifier);
    if (!profile) return null;

    const isValid = await this.comparePassword(plainPassword, profile.passwordHash);
    if (isValid) {
      return profile;
    }
    return null;
  }

  /**
   * Backward-compatible verifyPassword method
   */
  async verifyPassword(id: string, plainPassword: string): Promise<UserProfileDTO | null> {
    return this.authenticate(id, plainPassword);
  }

  /**
   * Register a new user account with basic required data and bcrypt encryption
   */
  async register(data: {
    email: string;
    fullName: string;
    password: string;
    username?: string;
    mainIncomeTarget?: number;
  }): Promise<UserProfileDTO> {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Email format validation
    if (!this.validateEmail(cleanEmail)) {
      throw new Error('E-mail inválido. Deve seguir o formato usuario@dominio.com');
    }

    // 2. Password security validation
    const passCheck = this.validatePassword(data.password);
    if (!passCheck.isValid) {
      throw new Error(passCheck.message || 'Senha não atende aos requisitos de segurança');
    }

    // 3. Name validation
    if (!data.fullName || data.fullName.trim().length < 2) {
      throw new Error('Nome completo é obrigatório');
    }

    // 4. Duplicate checks
    const existingByEmail = await this.userRepo.findByEmail(cleanEmail);
    if (existingByEmail) {
      throw new Error('Já existe uma conta cadastrada com este e-mail');
    }

    const username = (data.username || cleanEmail.split('@')[0]).toLowerCase().trim();
    const existingByUsername = await this.userRepo.findByUsername(username);
    const finalUsername = existingByUsername ? `${username}_${Math.random().toString(36).substring(2, 6)}` : username;

    // 5. Encrypt password with bcrypt
    const passwordHash = await this.hashPassword(data.password);
    const incomeTarget = data.mainIncomeTarget !== undefined && !isNaN(data.mainIncomeTarget) && data.mainIncomeTarget > 0
      ? data.mainIncomeTarget
      : 5000;

    // 6. Create user profile
    const profile = await this.userRepo.create({
      username: finalUsername,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`,
      passwordHash,
      currency: 'BRL',
      mainIncomeTarget: incomeTarget,
      carryoverBalance: true,
    });

    // 7. Seed essential default categories so the account is immediately functional
    const defaultCategories = [
      { name: 'Salário & Entradas Principais', icon: 'briefcase', color: '#10b981', budgetLimit: incomeTarget, isIncome: true },
      { name: 'Moradia & Aluguel', icon: 'home', color: '#3b82f6', budgetLimit: Math.round(incomeTarget * 0.3), isIncome: false },
      { name: 'Supermercado & Alimentação', icon: 'shopping-cart', color: '#06b6d4', budgetLimit: Math.round(incomeTarget * 0.18), isIncome: false },
      { name: 'Transporte & Combustível', icon: 'car', color: '#8b5cf6', budgetLimit: Math.round(incomeTarget * 0.1), isIncome: false },
      { name: 'Contas & Internet', icon: 'zap', color: '#ec4899', budgetLimit: Math.round(incomeTarget * 0.08), isIncome: false },
      { name: 'Lazer & Entretenimento', icon: 'gamepad-2', color: '#f59e0b', budgetLimit: Math.round(incomeTarget * 0.08), isIncome: false },
      { name: 'Saúde & Farmácia', icon: 'heart-pulse', color: '#ef4444', budgetLimit: Math.round(incomeTarget * 0.06), isIncome: false },
    ];

    for (const cat of defaultCategories) {
      await this.categoryRepo.create({
        profileId: profile.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budgetLimit: cat.budgetLimit,
        isIncome: cat.isIncome,
      });
    }

    return profile;
  }

  async createProfile(data: {
    username: string;
    fullName: string;
    password: string;
    email?: string;
    avatar?: string;
    mainIncomeTarget?: number;
    carryoverBalance?: boolean;
  }): Promise<UserProfileDTO> {
    if (data.email) {
      return this.register({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        username: data.username,
        mainIncomeTarget: data.mainIncomeTarget,
      });
    }

    const existing = await this.userRepo.findByUsername(data.username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passCheck = this.validatePassword(data.password);
    if (!passCheck.isValid) {
      throw new Error(passCheck.message || 'Senha não atende aos requisitos');
    }

    const passwordHash = await this.hashPassword(data.password);
    return this.userRepo.create({
      username: data.username.toLowerCase().trim(),
      email: data.email,
      fullName: data.fullName.trim(),
      avatar: data.avatar,
      passwordHash,
      currency: 'BRL',
      mainIncomeTarget: data.mainIncomeTarget || 5000,
      carryoverBalance: data.carryoverBalance ?? true,
    });
  }

  async setCarryoverPreference(profileId: string, enabled: boolean): Promise<UserProfileDTO> {
    return this.userRepo.update(profileId, { carryoverBalance: enabled });
  }

  async updateMainIncomeTarget(profileId: string, target: number): Promise<UserProfileDTO> {
    return this.userRepo.update(profileId, { mainIncomeTarget: target });
  }

  async updateProfile(profileId: string, data: {
    fullName?: string;
    email?: string;
    avatar?: string;
    mainIncomeTarget?: number;
    carryoverBalance?: boolean;
  }): Promise<UserProfileDTO> {
    const existing = await this.userRepo.findById(profileId);
    if (!existing) {
      throw new Error('Usuário não encontrado');
    }

    const updates: Partial<UserProfileDTO> = {};

    if (data.fullName !== undefined) {
      if (!data.fullName.trim()) throw new Error('Nome completo não pode ser vazio');
      updates.fullName = data.fullName.trim();
    }

    if (data.email !== undefined) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (!this.validateEmail(cleanEmail)) {
        throw new Error('E-mail inválido. O formato deve ser usuario@dominio.com');
      }
      const existingWithEmail = await this.userRepo.findByEmail(cleanEmail);
      if (existingWithEmail && existingWithEmail.id !== profileId) {
        throw new Error('Este e-mail já está em uso por outra conta');
      }
      updates.email = cleanEmail;
    }

    if (data.avatar !== undefined) {
      updates.avatar = data.avatar;
    }

    if (data.mainIncomeTarget !== undefined && !isNaN(data.mainIncomeTarget)) {
      updates.mainIncomeTarget = Math.max(0, data.mainIncomeTarget);
    }

    if (data.carryoverBalance !== undefined) {
      updates.carryoverBalance = !!data.carryoverBalance;
    }

    return this.userRepo.update(profileId, updates);
  }
}

export const authService = new AuthService();
