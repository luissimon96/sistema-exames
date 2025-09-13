/**
 * LGPD Consent Entity
 * Sistema Exames - Privacy Domain
 */

import { Entity } from '../../../shared/types/base';

export interface ConsentProps {
  id: string;
  userId: string;
  dataType: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  revokedDate?: Date;
  source: 'registration' | 'profile_update' | 'feature_access' | 'explicit_request';
  legalBasis: 'consent' | 'legitimate_interest' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'contract';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// LGPD Data Types
export type LGPDDataType = 
  | 'personal_data'
  | 'sensitive_data'
  | 'health_data'
  | 'biometric_data'
  | 'location_data'
  | 'behavioral_data'
  | 'financial_data';

// LGPD Processing Purposes
export type LGPDPurpose =
  | 'service_provision'
  | 'customer_support'
  | 'security'
  | 'analytics'
  | 'marketing'
  | 'research'
  | 'legal_compliance'
  | 'fraud_prevention';

export class Consent extends Entity<string> {
  private props: ConsentProps;

  constructor(props: ConsentProps) {
    super(props.id);
    this.props = props;
  }

  // Factory methods
  static create(props: Omit<ConsentProps, 'id' | 'createdAt' | 'updatedAt'>): Consent {
    const now = new Date();
    return new Consent({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(data: any): Consent {
    return new Consent({
      id: data.id,
      userId: data.userId,
      dataType: data.dataType,
      purpose: data.purpose,
      consentGiven: data.consentGiven,
      consentDate: new Date(data.consentDate),
      revokedDate: data.revokedDate ? new Date(data.revokedDate) : undefined,
      source: data.source,
      legalBasis: data.legalBasis,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }

  get dataType(): string {
    return this.props.dataType;
  }

  get purpose(): string {
    return this.props.purpose;
  }

  get consentGiven(): boolean {
    return this.props.consentGiven;
  }

  get consentDate(): Date {
    return this.props.consentDate;
  }

  get revokedDate(): Date | undefined {
    return this.props.revokedDate;
  }

  get source(): string {
    return this.props.source;
  }

  get legalBasis(): string {
    return this.props.legalBasis;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic
  revoke(reason?: string): void {
    if (!this.props.consentGiven) {
      throw new Error('Consent is already revoked');
    }

    if (this.props.revokedDate) {
      throw new Error('Consent has already been revoked');
    }

    this.props.consentGiven = false;
    this.props.revokedDate = new Date();
    this.props.updatedAt = new Date();

    if (reason) {
      this.props.metadata = {
        ...this.props.metadata,
        revocationReason: reason,
      };
    }
  }

  renew(source: ConsentProps['source']): void {
    if (this.props.consentGiven && !this.props.revokedDate) {
      throw new Error('Consent is already active');
    }

    this.props.consentGiven = true;
    this.props.consentDate = new Date();
    this.props.revokedDate = undefined;
    this.props.source = source;
    this.props.updatedAt = new Date();

    // Clear revocation metadata
    if (this.props.metadata?.revocationReason) {
      const { revocationReason, ...restMetadata } = this.props.metadata;
      this.props.metadata = restMetadata;
    }
  }

  isActive(): boolean {
    return this.props.consentGiven && !this.props.revokedDate;
  }

  isExpired(maxAgeMonths: number = 24): boolean {
    const expirationDate = new Date(this.props.consentDate);
    expirationDate.setMonth(expirationDate.getMonth() + maxAgeMonths);
    return new Date() > expirationDate;
  }

  needsRenewal(renewalThresholdMonths: number = 18): boolean {
    const renewalDate = new Date(this.props.consentDate);
    renewalDate.setMonth(renewalDate.getMonth() + renewalThresholdMonths);
    return new Date() > renewalDate;
  }

  // Data conversion
  toPersistence(): any {
    return {
      id: this.getId(),
      userId: this.props.userId,
      dataType: this.props.dataType,
      purpose: this.props.purpose,
      consentGiven: this.props.consentGiven,
      consentDate: this.props.consentDate,
      revokedDate: this.props.revokedDate,
      source: this.props.source,
      legalBasis: this.props.legalBasis,
      metadata: this.props.metadata ? JSON.stringify(this.props.metadata) : null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  toResponse(): any {
    return {
      id: this.getId(),
      dataType: this.props.dataType,
      purpose: this.props.purpose,
      consentGiven: this.props.consentGiven,
      consentDate: this.props.consentDate.toISOString(),
      revokedDate: this.props.revokedDate?.toISOString(),
      source: this.props.source,
      legalBasis: this.props.legalBasis,
      isActive: this.isActive(),
      isExpired: this.isExpired(),
      needsRenewal: this.needsRenewal(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

// Predefined consent templates for common scenarios
export class ConsentTemplates {
  static healthDataProcessing(userId: string): Consent {
    return Consent.create({
      userId,
      dataType: 'health_data',
      purpose: 'service_provision',
      consentGiven: true,
      consentDate: new Date(),
      source: 'registration',
      legalBasis: 'consent',
      metadata: {
        description: 'Processamento de dados de saúde para análise de exames médicos',
        dataRetentionPeriod: '5 years',
        sharingWithThirdParties: false,
      },
    });
  }

  static personalDataProcessing(userId: string): Consent {
    return Consent.create({
      userId,
      dataType: 'personal_data',
      purpose: 'service_provision',
      consentGiven: true,
      consentDate: new Date(),
      source: 'registration',
      legalBasis: 'consent',
      metadata: {
        description: 'Processamento de dados pessoais para fornecimento do serviço',
        dataRetentionPeriod: '2 years after account closure',
        sharingWithThirdParties: false,
      },
    });
  }

  static marketingCommunications(userId: string): Consent {
    return Consent.create({
      userId,
      dataType: 'personal_data',
      purpose: 'marketing',
      consentGiven: false, // Default to false for marketing
      consentDate: new Date(),
      source: 'explicit_request',
      legalBasis: 'consent',
      metadata: {
        description: 'Envio de comunicações de marketing e promocionais',
        dataRetentionPeriod: 'Until consent is revoked',
        sharingWithThirdParties: false,
      },
    });
  }

  static analyticsProcessing(userId: string): Consent {
    return Consent.create({
      userId,
      dataType: 'behavioral_data',
      purpose: 'analytics',
      consentGiven: true,
      consentDate: new Date(),
      source: 'registration',
      legalBasis: 'legitimate_interest',
      metadata: {
        description: 'Análise de comportamento para melhoria do serviço',
        dataRetentionPeriod: '1 year',
        anonymized: true,
      },
    });
  }
}