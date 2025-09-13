/**
 * Mock Repository Implementations for Testing
 * Sistema Exames - Test Infrastructure
 */

import { 
  UserRepository, 
  UserSearchOptions, 
  UserSearchResult, 
  UserStatistics 
} from '../../src/domains/user/repositories/UserRepository';
import { User } from '../../src/domains/user/entities/User';
import { UserEmail } from '../../src/domains/user/value-objects';
import { UserNotFoundError, EmailAlreadyExistsError } from '../../src/shared/infrastructure/errors';

export class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  // Test utilities
  reset(): void {
    this.users.clear();
    this.emailIndex.clear();
  }

  addUser(user: User): void {
    this.users.set(user.getId(), user);
    this.emailIndex.set(user.email.value, user.getId());
  }

  getUserCount(): number {
    return this.users.size;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Repository interface implementation
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const userId = this.emailIndex.get(email.value);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async save(user: User): Promise<User> {
    const existingUser = this.users.get(user.getId());
    const emailUser = this.emailIndex.get(user.email.value);
    
    // Check for email conflicts
    if (emailUser && emailUser !== user.getId()) {
      throw new EmailAlreadyExistsError(user.email.value);
    }

    // Handle events
    const events = user.getUncommittedEvents();
    if (events.length > 0) {
      // In a real implementation, events would be published here
      user.markEventsAsCommitted();
    }

    // Save user
    this.users.set(user.getId(), user);
    this.emailIndex.set(user.email.value, user.getId());

    return user;
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    this.users.delete(id);
    this.emailIndex.delete(user.email.value);
  }

  async findUsersWithExpiredSessions(olderThanDays: number): Promise<User[]> {
    // Mock implementation - return empty array or specific test data
    return [];
  }

  async countBySubscriptionTier(tier: 'free' | 'pro' | 'family'): Promise<number> {
    return Array.from(this.users.values())
      .filter(user => user.subscriptionTier === tier)
      .length;
  }

  async findRecentlyRegistered(days: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return Array.from(this.users.values())
      .filter(user => user.createdAt >= cutoffDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async search(options: UserSearchOptions): Promise<UserSearchResult> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (options.email) {
      users = users.filter(user => 
        user.email.value.toLowerCase().includes(options.email!.toLowerCase())
      );
    }

    if (options.name) {
      users = users.filter(user => 
        user.profile.name.toLowerCase().includes(options.name!.toLowerCase())
      );
    }

    if (options.subscriptionTier) {
      users = users.filter(user => user.subscriptionTier === options.subscriptionTier);
    }

    if (options.subscriptionStatus) {
      users = users.filter(user => user.subscriptionStatus === options.subscriptionStatus);
    }

    if (options.emailVerified !== undefined) {
      users = users.filter(user => user.isEmailVerified === options.emailVerified);
    }

    if (options.twoFactorEnabled !== undefined) {
      users = users.filter(user => user.isTwoFactorEnabled === options.twoFactorEnabled);
    }

    if (options.createdAfter) {
      users = users.filter(user => user.createdAt >= options.createdAfter!);
    }

    if (options.createdBefore) {
      users = users.filter(user => user.createdAt <= options.createdBefore!);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = users.length;
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const paginatedUsers = users.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      users: paginatedUsers,
      total,
      hasMore,
    };
  }

  async getStatistics(): Promise<UserStatistics> {
    const allUsers = Array.from(this.users.values());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      totalUsers: allUsers.length,
      verifiedUsers: allUsers.filter(user => user.isEmailVerified).length,
      twoFactorUsers: allUsers.filter(user => user.isTwoFactorEnabled).length,
      subscriptionBreakdown: {
        free: allUsers.filter(user => user.subscriptionTier === 'free').length,
        pro: allUsers.filter(user => user.subscriptionTier === 'pro').length,
        family: allUsers.filter(user => user.subscriptionTier === 'family').length,
      },
      recentRegistrations: allUsers.filter(user => user.createdAt >= thirtyDaysAgo).length,
      activeSubscriptions: allUsers.filter(user => user.subscriptionStatus === 'active').length,
    };
  }

  // Test helper methods
  simulateError(method: string, error: Error): void {
    const originalMethod = this[method as keyof this] as any;
    (this as any)[method] = jest.fn().mockRejectedValue(error);
    
    // Restore after one call
    setTimeout(() => {
      (this as any)[method] = originalMethod;
    }, 0);
  }

  expectMethodCalled(method: string): jest.MockedFunction<any> {
    return (this as any)[method] as jest.MockedFunction<any>;
  }
}

// Factory for creating mock repositories with test data
export class MockRepositoryFactory {
  static createUserRepository(options?: {
    withUsers?: User[];
    simulateErrors?: boolean;
  }): MockUserRepository {
    const repository = new MockUserRepository();

    if (options?.withUsers) {
      options.withUsers.forEach(user => repository.addUser(user));
    }

    if (options?.simulateErrors) {
      // Add some error simulation logic if needed
    }

    return repository;
  }
}

// Spy utilities for tracking repository calls
export class RepositorySpy {
  static spyOnRepository<T extends Record<string, any>>(repository: T): T {
    const spy = {} as T;
    
    Object.getOwnPropertyNames(Object.getPrototypeOf(repository))
      .filter(name => name !== 'constructor' && typeof repository[name] === 'function')
      .forEach(method => {
        spy[method] = jest.spyOn(repository, method);
      });

    return spy;
  }

  static expectRepositoryCall<T>(
    repositorySpy: T,
    method: keyof T,
    times = 1
  ): void {
    expect(repositorySpy[method]).toHaveBeenCalledTimes(times);
  }

  static expectRepositoryCallWith<T>(
    repositorySpy: T,
    method: keyof T,
    ...args: any[]
  ): void {
    expect(repositorySpy[method]).toHaveBeenCalledWith(...args);
  }
}