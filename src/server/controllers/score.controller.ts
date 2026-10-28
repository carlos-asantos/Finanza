/**
 * Score Controller
 * Layered Architecture: Controller Layer
 * Handles arcade Flappy Bird score entries.
 */
import { Request, Response } from 'express';
import { scoreRepository } from '../repositories/score.repository';

export class ScoreController {
  async getScores(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        res.status(400).json({ success: false, error: 'profileId is required' });
        return;
      }

      const scores = await scoreRepository.findByProfileId(profileId);
      res.json({ success: true, data: scores });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch scores';
      res.status(500).json({ success: false, error: message });
    }
  }

  async saveScore(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, score, medal, pipesPassed } = req.body;
      if (!profileId || score === undefined) {
        res.status(400).json({ success: false, error: 'profileId and score are required' });
        return;
      }

      const saved = await scoreRepository.saveScore({
        profileId,
        score: Number(score),
        medal,
        pipesPassed: Number(pipesPassed) || 0,
      });

      res.status(201).json({ success: true, data: saved });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save score';
      res.status(400).json({ success: false, error: message });
    }
  }
}

export const scoreController = new ScoreController();
