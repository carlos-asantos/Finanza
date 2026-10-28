/**
 * Game Score Repository
 * Layered Architecture: Repository Layer
 * Manages arcade flappy bird high scores with Prisma ORM (MySQL).
 */
import { prisma, checkMySQLConnection } from '../config/prisma';
import { GameScoreDTO, MedalType } from '../types/domain';
import { getInitialSeedData } from './seed.data';

export interface IScoreRepository {
  findByProfileId(profileId: string): Promise<GameScoreDTO[]>;
  saveScore(data: { profileId: string; score: number; medal?: MedalType | null; pipesPassed: number }): Promise<GameScoreDTO>;
}

class ScoreRepository implements IScoreRepository {
  private fallbackStore: GameScoreDTO[] = [];
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      const seed = getInitialSeedData();
      this.fallbackStore = [...seed.scores];
      this.initialized = true;
    }
  }

  async findByProfileId(profileId: string): Promise<GameScoreDTO[]> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const scores = await prisma.gameScore.findMany({
        where: { profileId },
        orderBy: { score: 'desc' },
        take: 10,
      });
      return scores.map(s => ({
        id: s.id,
        profileId: s.profileId,
        score: s.score,
        medal: s.medal as MedalType | null,
        pipesPassed: s.pipesPassed,
        createdAt: s.createdAt.toISOString(),
      }));
    }
    await this.ensureInitialized();
    return this.fallbackStore
      .filter(s => s.profileId === profileId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async saveScore(data: { profileId: string; score: number; medal?: MedalType | null; pipesPassed: number }): Promise<GameScoreDTO> {
    const isMySQL = await checkMySQLConnection();
    if (isMySQL) {
      const created = await prisma.gameScore.create({
        data: {
          profileId: data.profileId,
          score: data.score,
          medal: data.medal,
          pipesPassed: data.pipesPassed,
        },
      });
      return {
        id: created.id,
        profileId: created.profileId,
        score: created.score,
        medal: created.medal as MedalType | null,
        pipesPassed: created.pipesPassed,
        createdAt: created.createdAt.toISOString(),
      };
    }
    await this.ensureInitialized();
    const newScore: GameScoreDTO = {
      id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      profileId: data.profileId,
      score: data.score,
      medal: data.medal,
      pipesPassed: data.pipesPassed,
      createdAt: new Date().toISOString(),
    };
    this.fallbackStore.push(newScore);
    return { ...newScore };
  }
}

export const scoreRepository = new ScoreRepository();
