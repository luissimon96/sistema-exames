/**
 * Dependency Injection Container
 * Sistema Exames - Infrastructure Layer
 */

import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../domains/user/repositories/UserRepository';
import { PrismaUserRepository } from '../../domains/user/repositories/PrismaUserRepository';
import { UpdateUserProfileUseCase } from '../../domains/user/use-cases/UpdateUserProfileUseCase';

// Container for managing dependencies
class Container {
  private instances = new Map<string, any>();

  // Singleton pattern for repository instances
  get<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key);
  }

  // Reset for testing
  clear(): void {
    this.instances.clear();
  }
}

const container = new Container();

// Database connection
export const getPrismaClient = (): PrismaClient => {
  return container.get('prisma', () => {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Graceful shutdown
    if (typeof window === 'undefined') {
      process.on('beforeExit', async () => {
        await prisma.$disconnect();
      });
    }

    return prisma;
  });
};

// Repository instances
export const getUserRepository = (): UserRepository => {
  return container.get('userRepository', () => {
    return new PrismaUserRepository(getPrismaClient());
  });
};

// Use case instances
export const getUpdateUserProfileUseCase = (): UpdateUserProfileUseCase => {
  return container.get('updateUserProfileUseCase', () => {
    return new UpdateUserProfileUseCase(getUserRepository());
  });
};

// Health check utility
export const getHealthChecks = () => {
  return {
    database: async (): Promise<boolean> => {
      try {
        await getPrismaClient().$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  };
};

// Export container for testing
export { container };