/**
 * User Repository Interface and Implementation
 * Sistema Exames - User Domain
 */

import { Repository } from '../../../shared/types/base';
import { User } from '../entities/User';
import { UserEmail } from '../value-objects';

// Domain repository interface
export interface UserRepository extends Repository<User> {
  findById(id: string): Promise<User | null>;
  findByEmail(email: UserEmail): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findUsersWithExpiredSessions(olderThanDays: number): Promise<User[]>;
  countBySubscriptionTier(tier: 'free' | 'pro' | 'family'): Promise<number>;
  findRecentlyRegistered(days: number): Promise<User[]>;
}

// User search and filtering options
export interface UserSearchOptions {
  email?: string;
  name?: string;
  subscriptionTier?: 'free' | 'pro' | 'family';
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  hasMore: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  verifiedUsers: number;
  twoFactorUsers: number;
  subscriptionBreakdown: {
    free: number;
    pro: number;
    family: number;
  };
  recentRegistrations: number; // Last 30 days
  activeSubscriptions: number;
}