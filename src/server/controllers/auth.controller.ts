/**
 * Auth Controller
 * Layered Architecture: Controller Layer
 * Handles authentication requests, profile switching, and credentials verification.
 */
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async getProfiles(_req: Request, res: Response): Promise<void> {
    try {
      const profiles = await authService.getAllProfiles();
      res.json({ success: true, data: profiles });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve profiles';
      res.status(500).json({ success: false, error: message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, identifier, profileId, password } = req.body;
      const targetIdentifier = (email || username || identifier || profileId || '').toString().trim();

      if (!targetIdentifier || !password) {
        res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const profile = await authService.authenticate(targetIdentifier, password);
      if (!profile) {
        res.status(401).json({ success: false, error: 'E-mail ou senha incorretos. Verifique suas credenciais.' });
        return;
      }

      const { passwordHash: _, ...safeProfile } = profile;
      res.json({ success: true, data: safeProfile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação';
      res.status(500).json({ success: false, error: message });
    }
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, fullName, password, avatar, mainIncomeTarget, carryoverBalance } = req.body;
      
      // If email is provided, run registration flow with email validation
      if (email) {
        if (!authService.validateEmail(email)) {
          res.status(400).json({ success: false, error: 'E-mail inválido. O e-mail deve seguir o formato usuario@dominio.com.' });
          return;
        }

        const passCheck = authService.validatePassword(password);
        if (!passCheck.isValid) {
          res.status(400).json({ success: false, error: passCheck.message || 'Senha inválida' });
          return;
        }

        const profile = await authService.register({
          email,
          fullName: fullName || email.split('@')[0],
          password,
          username,
          mainIncomeTarget: Number(mainIncomeTarget) || 5000,
        });

        const { passwordHash: _, ...safeProfile } = profile;
        res.status(201).json({ success: true, data: safeProfile });
        return;
      }

      if (!username || !fullName || !password) {
        res.status(400).json({ success: false, error: 'Nome completo, e-mail e senha são obrigatórios.' });
        return;
      }

      const profile = await authService.createProfile({
        username,
        email,
        fullName,
        password,
        avatar,
        mainIncomeTarget: Number(mainIncomeTarget) || 5000,
        carryoverBalance,
      });

      const { passwordHash: _, ...safeProfile } = profile;
      res.status(201).json({ success: true, data: safeProfile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao criar conta';
      res.status(400).json({ success: false, error: message });
    }
  }

  async updateCarryoverPreference(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, enabled } = req.body;
      if (!profileId || typeof enabled !== 'boolean') {
        res.status(400).json({ success: false, error: 'profileId and enabled boolean are required' });
        return;
      }

      const profile = await authService.setCarryoverPreference(profileId, enabled);
      const { passwordHash: _, ...safeProfile } = profile;
      res.json({ success: true, data: safeProfile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update carryover preference';
      res.status(500).json({ success: false, error: message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, fullName, email, avatar, mainIncomeTarget, carryoverBalance } = req.body;
      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const updated = await authService.updateProfile(profileId, {
        fullName,
        email,
        avatar,
        mainIncomeTarget: mainIncomeTarget !== undefined ? Number(mainIncomeTarget) : undefined,
        carryoverBalance,
      });

      const { passwordHash: _, ...safeProfile } = updated;
      res.json({ success: true, data: safeProfile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar dados do usuário';
      res.status(400).json({ success: false, error: message });
    }
  }
}

export const authController = new AuthController();
