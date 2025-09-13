/**
 * Prisma Implementation of User Repository
 * Sistema Exames - Infrastructure Layer
 */

import { PrismaClient } from '@prisma/client';
import { 
  UserRepository, 
  UserSearchOptions, 
  UserSearchResult, 
  UserStatistics 
} from './UserRepository';
import { User } from '../entities/User';
import { UserEmail } from '../value-objects';
import { 
  UserNotFoundError, 
  DatabaseError, 
  EmailAlreadyExistsError 
} from '../../../shared/infrastructure/errors';
import { logger, metrics, measurePerformance } from '../../../shared/infrastructure/logger';
import { eventBus } from '../../../shared/infrastructure/events';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return measurePerformance(
      'user_repository_find_by_id',
      async () => {
        try {
          const userData = await this.prisma.user.findUnique({
            where: { id },
          });

          if (!userData) {
            logger.debug('User not found by ID', {
              domain: 'user',
              layer: 'infrastructure',
              userId: id,
            });
            return null;
          }

          const user = User.fromPersistence(userData);
          
          metrics.counter('user_repository_operations_total', {
            operation: 'findById',
            status: 'success',
          }).inc();

          return user;

        } catch (error) {
          logger.error('Failed to find user by ID', {
            domain: 'user',
            layer: 'infrastructure',
            userId: id,
            error,
          });

          metrics.counter('user_repository_operations_total', {
            operation: 'findById',
            status: 'error',
          }).inc();

          throw new DatabaseError(`Failed to find user: ${error}`);
        }
      },
      { domain: 'user', operation: 'findById' }
    );
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    return measurePerformance(
      'user_repository_find_by_email',
      async () => {
        try {
          const userData = await this.prisma.user.findUnique({
            where: { email: email.value },
          });

          if (!userData) {
            logger.debug('User not found by email', {
              domain: 'user',
              layer: 'infrastructure',
              email: email.value,
            });
            return null;
          }

          const user = User.fromPersistence(userData);
          
          metrics.counter('user_repository_operations_total', {
            operation: 'findByEmail',
            status: 'success',
          }).inc();

          return user;

        } catch (error) {
          logger.error('Failed to find user by email', {
            domain: 'user',
            layer: 'infrastructure',
            email: email.value,
            error,
          });

          metrics.counter('user_repository_operations_total', {
            operation: 'findByEmail',
            status: 'error',
          }).inc();

          throw new DatabaseError(`Failed to find user: ${error}`);
        }
      },
      { domain: 'user', operation: 'findByEmail' }
    );
  }

  async save(user: User): Promise<User> {
    return measurePerformance(
      'user_repository_save',
      async () => {
        try {
          const persistenceData = user.toPersistence();
          
          // Check if user already exists by email (for creates)
          const existingUser = await this.prisma.user.findUnique({
            where: { email: persistenceData.email },
          });

          let savedUser;

          if (existingUser && existingUser.id !== persistenceData.id) {
            throw new EmailAlreadyExistsError(persistenceData.email);
          }

          if (existingUser) {
            // Update existing user
            savedUser = await this.prisma.user.update({
              where: { id: persistenceData.id },
              data: {
                ...persistenceData,
                updatedAt: new Date(),
              },
            });

            logger.info('User updated', {
              domain: 'user',
              layer: 'infrastructure',
              userId: user.getId(),
              email: persistenceData.email,
            });

          } else {
            // Create new user
            savedUser = await this.prisma.user.create({
              data: persistenceData,
            });

            logger.info('User created', {
              domain: 'user',
              layer: 'infrastructure',
              userId: user.getId(),
              email: persistenceData.email,
            });
          }

          // Publish domain events
          const events = user.getUncommittedEvents();
          for (const event of events) {
            await eventBus.publish(event);
          }
          user.markEventsAsCommitted();

          metrics.counter('user_repository_operations_total', {
            operation: 'save',
            status: 'success',
          }).inc();

          return User.fromPersistence(savedUser);

        } catch (error) {
          logger.error('Failed to save user', {
            domain: 'user',
            layer: 'infrastructure',
            userId: user.getId(),
            error,
          });

          metrics.counter('user_repository_operations_total', {
            operation: 'save',
            status: 'error',
          }).inc();

          if (error instanceof EmailAlreadyExistsError) {
            throw error;
          }

          throw new DatabaseError(`Failed to save user: ${error}`);
        }
      },
      { domain: 'user', operation: 'save' }
    );
  }

  async delete(id: string): Promise<void> {
    return measurePerformance(
      'user_repository_delete',
      async () => {
        try {
          const deletedUser = await this.prisma.user.delete({
            where: { id },
          });

          logger.info('User deleted', {
            domain: 'user',
            layer: 'infrastructure',
            userId: id,
            email: deletedUser.email,
          });

          metrics.counter('user_repository_operations_total', {
            operation: 'delete',
            status: 'success',
          }).inc();

        } catch (error) {
          if (error.code === 'P2025') {
            throw new UserNotFoundError(id);
          }

          logger.error('Failed to delete user', {
            domain: 'user',
            layer: 'infrastructure',
            userId: id,
            error,
          });

          metrics.counter('user_repository_operations_total', {
            operation: 'delete',
            status: 'error',
          }).inc();

          throw new DatabaseError(`Failed to delete user: ${error}`);
        }
      },
      { domain: 'user', operation: 'delete' }
    );
  }

  async findUsersWithExpiredSessions(olderThanDays: number): Promise<User[]> {
    return measurePerformance(
      'user_repository_find_expired_sessions',
      async () => {
        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

          const usersData = await this.prisma.user.findMany({
            where: {
              sessions: {
                every: {
                  OR: [
                    { expires: { lt: new Date() } },
                    { expires: { lt: cutoffDate } },
                  ],
                },
              },
            },
          });

          return usersData.map(userData => User.fromPersistence(userData));

        } catch (error) {
          logger.error('Failed to find users with expired sessions', {
            domain: 'user',
            layer: 'infrastructure',
            olderThanDays,
            error,
          });

          throw new DatabaseError(`Failed to find users with expired sessions: ${error}`);
        }
      },
      { domain: 'user', operation: 'findExpiredSessions' }
    );
  }

  async countBySubscriptionTier(tier: 'free' | 'pro' | 'family'): Promise<number> {
    return measurePerformance(
      'user_repository_count_by_tier',
      async () => {
        try {
          return await this.prisma.user.count({
            where: { subscriptionTier: tier },
          });

        } catch (error) {
          logger.error('Failed to count users by subscription tier', {
            domain: 'user',
            layer: 'infrastructure',
            tier,
            error,
          });

          throw new DatabaseError(`Failed to count users: ${error}`);
        }
      },
      { domain: 'user', operation: 'countByTier' }
    );
  }

  async findRecentlyRegistered(days: number): Promise<User[]> {
    return measurePerformance(
      'user_repository_find_recently_registered',
      async () => {
        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);

          const usersData = await this.prisma.user.findMany({
            where: {
              createdAt: { gte: cutoffDate },
            },
            orderBy: { createdAt: 'desc' },
          });

          return usersData.map(userData => User.fromPersistence(userData));

        } catch (error) {
          logger.error('Failed to find recently registered users', {
            domain: 'user',
            layer: 'infrastructure',
            days,
            error,
          });

          throw new DatabaseError(`Failed to find recent users: ${error}`);
        }
      },
      { domain: 'user', operation: 'findRecentlyRegistered' }
    );
  }

  async search(options: UserSearchOptions): Promise<UserSearchResult> {
    return measurePerformance(
      'user_repository_search',
      async () => {
        try {
          const where: any = {};

          if (options.email) {
            where.email = { contains: options.email, mode: 'insensitive' };
          }

          if (options.name) {
            where.name = { contains: options.name, mode: 'insensitive' };
          }

          if (options.subscriptionTier) {
            where.subscriptionTier = options.subscriptionTier;
          }

          if (options.subscriptionStatus) {
            where.subscriptionStatus = options.subscriptionStatus;
          }

          if (options.emailVerified !== undefined) {
            where.emailVerified = options.emailVerified;
          }

          if (options.twoFactorEnabled !== undefined) {
            where.twoFactorEnabled = options.twoFactorEnabled;
          }

          if (options.createdAfter) {
            where.createdAt = { ...where.createdAt, gte: options.createdAfter };
          }

          if (options.createdBefore) {
            where.createdAt = { ...where.createdAt, lte: options.createdBefore };
          }

          const limit = options.limit || 50;
          const offset = options.offset || 0;

          const [usersData, total] = await Promise.all([
            this.prisma.user.findMany({
              where,
              skip: offset,
              take: limit,
              orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
          ]);

          const users = usersData.map(userData => User.fromPersistence(userData));
          const hasMore = offset + limit < total;

          return { users, total, hasMore };

        } catch (error) {
          logger.error('Failed to search users', {
            domain: 'user',
            layer: 'infrastructure',
            options,
            error,
          });

          throw new DatabaseError(`Failed to search users: ${error}`);
        }
      },
      { domain: 'user', operation: 'search' }
    );
  }

  async getStatistics(): Promise<UserStatistics> {
    return measurePerformance(
      'user_repository_get_statistics',
      async () => {
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const [
            totalUsers,
            verifiedUsers,
            twoFactorUsers,
            freeUsers,
            proUsers,
            familyUsers,
            recentRegistrations,
            activeSubscriptions,
          ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { emailVerified: true } }),
            this.prisma.user.count({ where: { twoFactorEnabled: true } }),
            this.prisma.user.count({ where: { subscriptionTier: 'free' } }),
            this.prisma.user.count({ where: { subscriptionTier: 'pro' } }),
            this.prisma.user.count({ where: { subscriptionTier: 'family' } }),
            this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            this.prisma.user.count({ where: { subscriptionStatus: 'active' } }),
          ]);

          return {
            totalUsers,
            verifiedUsers,
            twoFactorUsers,
            subscriptionBreakdown: {
              free: freeUsers,
              pro: proUsers,
              family: familyUsers,
            },
            recentRegistrations,
            activeSubscriptions,
          };

        } catch (error) {
          logger.error('Failed to get user statistics', {
            domain: 'user',
            layer: 'infrastructure',
            error,
          });

          throw new DatabaseError(`Failed to get statistics: ${error}`);
        }
      },
      { domain: 'user', operation: 'getStatistics' }
    );
  }
}