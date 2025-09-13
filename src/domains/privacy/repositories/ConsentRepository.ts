/**
 * Consent Repository Interface
 * Sistema Exames - Privacy Domain
 */

import { Repository } from '../../../shared/types/base';
import { Consent } from '../entities/Consent';

export interface ConsentSearchOptions {
  includeRevoked?: boolean;
  dataType?: string;
  purpose?: string;
  legalBasis?: string;
  source?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ConsentRepository extends Repository<Consent> {
  findById(id: string): Promise<Consent | null>;
  save(consent: Consent): Promise<Consent>;
  delete(id: string): Promise<void>;
  
  // LGPD-specific methods
  findByUser(userId: string, options?: ConsentSearchOptions): Promise<Consent[]>;
  findByUserAndType(userId: string, dataType: string, purpose: string): Promise<Consent[]>;
  findExpiredConsents(maxAgeMonths?: number): Promise<Consent[]>;
  findConsentsNeedingRenewal(renewalThresholdMonths?: number): Promise<Consent[]>;
  
  // Bulk operations for LGPD compliance
  revokeAllUserConsents(userId: string, reason?: string): Promise<number>;
  deleteAllUserData(userId: string): Promise<number>;
  
  // Analytics and reporting
  getConsentStatistics(dateRange?: { from: Date; to: Date }): Promise<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    expiredConsents: number;
    byDataType: Record<string, number>;
    byPurpose: Record<string, number>;
    byLegalBasis: Record<string, number>;
  }>;
}