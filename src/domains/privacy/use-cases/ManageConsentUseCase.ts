/**
 * Manage Consent Use Case - LGPD Compliance
 * Sistema Exames - Privacy Domain
 */

import { UseCase, Result } from '../../../shared/types/base';
import { Consent, ConsentTemplates } from '../entities/Consent';
import { ConsentRepository } from '../repositories/ConsentRepository';
import { 
  UserNotFoundError, 
  ValidationError,
  AuthorizationError 
} from '../../../shared/infrastructure/errors';
import { logger, metrics } from '../../../shared/infrastructure/logger';
import { eventBus, BaseDomainEvent } from '../../../shared/infrastructure/events';

// Domain Events
export class ConsentGrantedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly consentId: string,
    public readonly dataType: string,
    public readonly purpose: string,
    metadata?: any
  ) {
    super('consent.granted', userId, metadata);
  }
}

export class ConsentRevokedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly consentId: string,
    public readonly dataType: string,
    public readonly purpose: string,
    public readonly reason?: string,
    metadata?: any
  ) {
    super('consent.revoked', userId, metadata);
  }
}

// Use Case Requests/Responses
export interface GrantConsentRequest {
  userId: string;
  requestingUserId: string;
  dataType: string;
  purpose: string;
  source: 'registration' | 'profile_update' | 'feature_access' | 'explicit_request';
  legalBasis?: 'consent' | 'legitimate_interest' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'contract';
  metadata?: Record<string, any>;
}

export interface RevokeConsentRequest {
  userId: string;
  requestingUserId: string;
  consentId?: string;
  dataType?: string;
  purpose?: string;
  reason?: string;
}

export interface GetUserConsentsRequest {
  userId: string;
  requestingUserId: string;
  includeRevoked?: boolean;
  dataType?: string;
  purpose?: string;
}

export interface ConsentResponse {
  consents: Consent[];
  summary: {
    totalActive: number;
    totalRevoked: number;
    needingRenewal: number;
    expired: number;
  };
}

export class ManageConsentUseCase implements UseCase<any, any> {
  constructor(
    private consentRepository: ConsentRepository
  ) {}

  async execute(request: any): Promise<Result<any>> {
    // This is a multi-method use case - route based on request type
    if ('consentId' in request && request.reason) {
      return this.revokeConsent(request);
    } else if ('dataType' in request && 'purpose' in request && !('consentId' in request)) {
      return this.grantConsent(request);
    } else {
      return this.getUserConsents(request);
    }
  }

  async grantConsent(request: GrantConsentRequest): Promise<Result<Consent>> {
    try {
      logger.info('Granting consent', {
        domain: 'privacy',
        usecase: 'grant-consent',
        userId: request.userId,
        dataType: request.dataType,
        purpose: request.purpose,
      });

      // Authorization check
      if (request.userId !== request.requestingUserId) {
        return Result.failure(new AuthorizationError(
          'Users can only manage their own consent'
        ));
      }

      // Check if consent already exists
      const existingConsents = await this.consentRepository.findByUserAndType(
        request.userId,
        request.dataType,
        request.purpose
      );

      let consent: Consent;

      if (existingConsents.length > 0) {
        // Renew existing consent
        consent = existingConsents[0];
        if (consent.isActive()) {
          logger.debug('Consent already active', {
            domain: 'privacy',
            userId: request.userId,
            consentId: consent.getId(),
          });
          return Result.success(consent);
        }

        consent.renew(request.source);
      } else {
        // Create new consent
        consent = Consent.create({
          userId: request.userId,
          dataType: request.dataType,
          purpose: request.purpose,
          consentGiven: true,
          consentDate: new Date(),
          source: request.source,
          legalBasis: request.legalBasis || 'consent',
          metadata: request.metadata,
        });
      }

      // Save consent
      const savedConsent = await this.consentRepository.save(consent);

      // Publish domain event
      await eventBus.publish(new ConsentGrantedEvent(
        request.userId,
        savedConsent.getId(),
        request.dataType,
        request.purpose,
        { source: request.source }
      ));

      // Metrics
      metrics.counter('lgpd_consent_granted_total', {
        dataType: request.dataType,
        purpose: request.purpose,
        source: request.source,
      }).inc();

      logger.info('Consent granted successfully', {
        domain: 'privacy',
        userId: request.userId,
        consentId: savedConsent.getId(),
        dataType: request.dataType,
        purpose: request.purpose,
      });

      return Result.success(savedConsent);

    } catch (error: unknown) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      
      logger.error('Failed to grant consent', {
        domain: 'privacy',
        usecase: 'grant-consent',
        userId: request.userId,
        error: errorInstance,
      });

      metrics.counter('lgpd_consent_errors_total', {
        operation: 'grant',
        errorType: errorInstance.constructor.name,
      }).inc();

      return Result.failure(errorInstance);
    }
  }

  async revokeConsent(request: RevokeConsentRequest): Promise<Result<Consent>> {
    try {
      logger.info('Revoking consent', {
        domain: 'privacy',
        usecase: 'revoke-consent',
        userId: request.userId,
        consentId: request.consentId,
        reason: request.reason,
      });

      // Authorization check
      if (request.userId !== request.requestingUserId) {
        return Result.failure(new AuthorizationError(
          'Users can only manage their own consent'
        ));
      }

      let consent: Consent | null = null;

      if (request.consentId) {
        // Revoke specific consent by ID
        consent = await this.consentRepository.findById(request.consentId);
        if (!consent) {
          return Result.failure(new ValidationError(
            'consentId', 
            request.consentId, 
            'Consent not found'
          ));
        }

        if (consent.userId !== request.userId) {
          return Result.failure(new AuthorizationError(
            'Cannot revoke consent belonging to another user'
          ));
        }
      } else if (request.dataType && request.purpose) {
        // Find and revoke consent by type and purpose
        const consents = await this.consentRepository.findByUserAndType(
          request.userId,
          request.dataType,
          request.purpose
        );

        const activeConsents = consents.filter(c => c.isActive());
        if (activeConsents.length === 0) {
          return Result.failure(new ValidationError(
            'consent',
            `${request.dataType}:${request.purpose}`,
            'No active consent found for specified type and purpose'
          ));
        }

        consent = activeConsents[0];
      } else {
        return Result.failure(new ValidationError(
          'request',
          request,
          'Either consentId or both dataType and purpose must be provided'
        ));
      }

      // Revoke consent
      consent.revoke(request.reason);

      // Save consent
      const savedConsent = await this.consentRepository.save(consent);

      // Publish domain event
      await eventBus.publish(new ConsentRevokedEvent(
        request.userId,
        savedConsent.getId(),
        consent.dataType,
        consent.purpose,
        request.reason,
        { requestingUserId: request.requestingUserId }
      ));

      // Metrics
      metrics.counter('lgpd_consent_revoked_total', {
        dataType: consent.dataType,
        purpose: consent.purpose,
        hasReason: !!request.reason ? 'yes' : 'no',
      }).inc();

      logger.info('Consent revoked successfully', {
        domain: 'privacy',
        userId: request.userId,
        consentId: savedConsent.getId(),
        dataType: consent.dataType,
        purpose: consent.purpose,
        reason: request.reason,
      });

      return Result.success(savedConsent);

    } catch (error: unknown) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      
      logger.error('Failed to revoke consent', {
        domain: 'privacy',
        usecase: 'revoke-consent',
        userId: request.userId,
        error: errorInstance,
      });

      metrics.counter('lgpd_consent_errors_total', {
        operation: 'revoke',
        errorType: errorInstance.constructor.name,
      }).inc();

      return Result.failure(errorInstance);
    }
  }

  async getUserConsents(request: GetUserConsentsRequest): Promise<Result<ConsentResponse>> {
    try {
      logger.debug('Getting user consents', {
        domain: 'privacy',
        usecase: 'get-user-consents',
        userId: request.userId,
        includeRevoked: request.includeRevoked,
      });

      // Authorization check
      if (request.userId !== request.requestingUserId) {
        return Result.failure(new AuthorizationError(
          'Users can only view their own consent'
        ));
      }

      // Get consents
      const consents = await this.consentRepository.findByUser(
        request.userId,
        {
          includeRevoked: request.includeRevoked || false,
          dataType: request.dataType,
          purpose: request.purpose,
        }
      );

      // Calculate summary
      const activeConsents = consents.filter(c => c.isActive());
      const revokedConsents = consents.filter(c => !c.isActive());
      const needingRenewal = activeConsents.filter(c => c.needsRenewal());
      const expired = activeConsents.filter(c => c.isExpired());

      const summary = {
        totalActive: activeConsents.length,
        totalRevoked: revokedConsents.length,
        needingRenewal: needingRenewal.length,
        expired: expired.length,
      };

      logger.debug('User consents retrieved', {
        domain: 'privacy',
        userId: request.userId,
        ...summary,
      });

      return Result.success({
        consents,
        summary,
      });

    } catch (error: unknown) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      
      logger.error('Failed to get user consents', {
        domain: 'privacy',
        usecase: 'get-user-consents',
        userId: request.userId,
        error: errorInstance,
      });

      return Result.failure(errorInstance);
    }
  }

  // Helper method to initialize default consents for new users
  async initializeDefaultConsents(userId: string): Promise<Result<Consent[]>> {
    try {
      const defaultConsents = [
        ConsentTemplates.personalDataProcessing(userId),
        ConsentTemplates.healthDataProcessing(userId),
        ConsentTemplates.analyticsProcessing(userId),
        // Marketing consent defaults to false
      ];

      const savedConsents = await Promise.all(
        defaultConsents.map(consent => this.consentRepository.save(consent))
      );

      // Publish events for each consent
      for (const consent of savedConsents) {
        await eventBus.publish(new ConsentGrantedEvent(
          userId,
          consent.getId(),
          consent.dataType,
          consent.purpose,
          { source: 'registration', isDefault: true }
        ));
      }

      logger.info('Default consents initialized', {
        domain: 'privacy',
        userId,
        consentCount: savedConsents.length,
      });

      return Result.success(savedConsents);

    } catch (error: unknown) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      
      logger.error('Failed to initialize default consents', {
        domain: 'privacy',
        userId,
        error: errorInstance,
      });

      return Result.failure(errorInstance);
    }
  }
}