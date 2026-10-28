/**
 * Finanza Database Configuration
 * Layered Architecture: Configuration & Infrastructure Layer
 * Manages Prisma Client connection to MySQL database.
 */
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prismaClient) {
    global.__prismaClient = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prismaClient;
}

let isConnectedToMySQL: boolean | null = null;

export async function checkMySQLConnection(): Promise<boolean> {
  if (isConnectedToMySQL !== null) {
    return isConnectedToMySQL;
  }
  try {
    // Quick test query to verify MySQL server responsiveness
    await prisma.$queryRaw`SELECT 1`;
    isConnectedToMySQL = true;
    console.log('[Prisma:MySQL] Successfully connected to MySQL database.');
    return true;
  } catch (err: unknown) {
    isConnectedToMySQL = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Prisma:MySQL] MySQL server not reachable on configured DATABASE_URL. Activating in-memory storage fallback:', msg);
    return false;
  }
}

export { prisma };
