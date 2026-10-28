/**
 * API Router
 * Layered Architecture: Routing Layer
 * Exposes REST endpoints cleanly connecting to controllers.
 */
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { categoryController } from '../controllers/category.controller';
import { transactionController } from '../controllers/transaction.controller';
import { financeController } from '../controllers/finance.controller';
import { scoreController } from '../controllers/score.controller';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Finanza Full-Stack API',
  });
});

// Authentication & Profile Routes
apiRouter.get('/auth/profiles', (req, res) => authController.getProfiles(req, res));
apiRouter.post('/auth/login', (req, res) => authController.login(req, res));
apiRouter.post('/auth/register', (req, res) => authController.createProfile(req, res));
apiRouter.post('/auth/create-profile', (req, res) => authController.createProfile(req, res));
apiRouter.post('/auth/carryover', (req, res) => authController.updateCarryoverPreference(req, res));
apiRouter.put('/auth/profile', (req, res) => authController.updateProfile(req, res));

// Category Routes
apiRouter.get('/categories', (req, res) => categoryController.getCategories(req, res));
apiRouter.post('/categories', (req, res) => categoryController.saveCategory(req, res));
apiRouter.delete('/categories/:id', (req, res) => categoryController.deleteCategory(req, res));

// Transaction Routes
apiRouter.get('/transactions', (req, res) => transactionController.getTransactions(req, res));
apiRouter.post('/transactions', (req, res) => transactionController.createTransaction(req, res));
apiRouter.put('/transactions/:id', (req, res) => transactionController.updateTransaction(req, res));
apiRouter.delete('/transactions/:id', (req, res) => transactionController.deleteTransaction(req, res));

// Finance & Analytics Routes
apiRouter.get('/finance/summary', (req, res) => financeController.getSummary(req, res));
apiRouter.get('/finance/categories-stats', (req, res) => financeController.getCategoriesWithStats(req, res));
apiRouter.get('/finance/months', (req, res) => financeController.getAvailableMonths(req, res));

// Arcade High Scores
apiRouter.get('/scores', (req, res) => scoreController.getScores(req, res));
apiRouter.post('/scores', (req, res) => scoreController.saveScore(req, res));
