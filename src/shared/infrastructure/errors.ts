/**
 * Domain error types and error handling infrastructure
 * Sistema Exames - Error Management
 */

// Base domain error
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Authentication domain errors
export class AuthenticationError extends DomainError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;
}

export class InvalidCredentialsError extends AuthenticationError {
  readonly code = 'INVALID_CREDENTIALS';
  
  constructor() {
    super('Invalid email or password');
  }
}

export class TwoFactorRequiredError extends AuthenticationError {
  readonly code = 'TWO_FACTOR_REQUIRED';
  
  constructor() {
    super('Two-factor authentication is required');
  }
}

export class InvalidTwoFactorCodeError extends AuthenticationError {
  readonly code = 'INVALID_2FA_CODE';
  
  constructor() {
    super('Invalid two-factor authentication code');
  }
}

export class AccountNotVerifiedError extends AuthenticationError {
  readonly code = 'ACCOUNT_NOT_VERIFIED';
  
  constructor() {
    super('Email address not verified');
  }
}

// Authorization domain errors
export class AuthorizationError extends DomainError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class InsufficientPermissionsError extends AuthorizationError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  
  constructor(requiredRole?: string) {
    super(
      requiredRole 
        ? `Requires ${requiredRole} role to access this resource`
        : 'Insufficient permissions to access this resource'
    );
  }
}

// User domain errors
export class UserError extends DomainError {
  readonly code = 'USER_ERROR';
  readonly statusCode = 400;
}

export class UserNotFoundError extends UserError {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = 404;
  
  constructor(identifier?: string) {
    super(
      identifier 
        ? `User not found: ${identifier}`
        : 'User not found'
    );
  }
}

export class EmailAlreadyExistsError extends UserError {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly statusCode = 409;
  
  constructor(email: string) {
    super(`Email already exists: ${email}`);
  }
}

export class WeakPasswordError extends UserError {
  readonly code = 'WEAK_PASSWORD';
  
  constructor(requirements?: string[]) {
    const message = requirements?.length
      ? `Password must meet requirements: ${requirements.join(', ')}`
      : 'Password does not meet security requirements';
    super(message);
  }
}

// Subscription domain errors
export class SubscriptionError extends DomainError {
  readonly code = 'SUBSCRIPTION_ERROR';
  readonly statusCode = 400;
}

export class SubscriptionNotFoundError extends SubscriptionError {
  readonly code = 'SUBSCRIPTION_NOT_FOUND';
  readonly statusCode = 404;
  
  constructor() {
    super('Active subscription not found');
  }
}

export class PaymentRequiredError extends SubscriptionError {
  readonly code = 'PAYMENT_REQUIRED';
  readonly statusCode = 402;
  
  constructor() {
    super('Payment required to access this feature');
  }
}

export class SubscriptionLimitExceededError extends SubscriptionError {
  readonly code = 'SUBSCRIPTION_LIMIT_EXCEEDED';
  
  constructor(feature: string, limit: number) {
    super(`${feature} limit exceeded: ${limit}`);
  }
}

// Validation errors
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(
    field: string, 
    value: any, 
    constraint: string
  ) {
    super(`Validation failed for field '${field}': ${constraint}`);
    this.context = { field, value, constraint };
  }
}

// Infrastructure errors
export class InfrastructureError extends Error {
  readonly code = 'INFRASTRUCTURE_ERROR';
  readonly statusCode = 500;
  
  constructor(message: string, public readonly service: string) {
    super(`${service}: ${message}`);
    this.name = this.constructor.name;
  }
}

export class DatabaseError extends InfrastructureError {
  constructor(message: string) {
    super(message, 'Database');
  }
}

export class ExternalServiceError extends InfrastructureError {
  constructor(service: string, message: string) {
    super(message, service);
  }
}

// Rate limiting error
export class RateLimitExceededError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  
  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`);
  }
}

// LGPD/Privacy errors
export class PrivacyError extends DomainError {
  readonly code = 'PRIVACY_ERROR';
  readonly statusCode = 400;
}

export class ConsentRequiredError extends PrivacyError {
  readonly code = 'CONSENT_REQUIRED';
  
  constructor(dataType: string) {
    super(`User consent required for processing ${dataType}`);
  }
}

export class DataRetentionError extends PrivacyError {
  readonly code = 'DATA_RETENTION_ERROR';
  
  constructor(reason: string) {
    super(`Data retention policy violation: ${reason}`);
  }
}

// Error handler utility
export class ErrorHandler {
  static isDomainError(error: any): error is DomainError {
    return error instanceof DomainError;
  }
  
  static isInfrastructureError(error: any): error is InfrastructureError {
    return error instanceof InfrastructureError;
  }
  
  static getErrorResponse(error: Error): {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, any>;
  } {
    if (this.isDomainError(error)) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        context: error.context,
      };
    }
    
    if (this.isInfrastructureError(error)) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }
    
    // Generic error fallback
    return {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : error.message,
      statusCode: 500,
    };
  }
}