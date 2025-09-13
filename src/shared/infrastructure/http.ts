/**
 * HTTP Infrastructure for Clean Architecture
 * Sistema Exames - Infrastructure Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ErrorHandler } from './errors';
import { logger, metrics } from './logger';

// HTTP Response utilities
export class HttpResponse {
  static success<T>(data: T, statusCode = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
    }, { status: statusCode });
  }

  static created<T>(data: T): NextResponse {
    return this.success(data, 201);
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  static error(error: Error, statusCode?: number): NextResponse {
    const errorResponse = ErrorHandler.getErrorResponse(error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        ...(process.env.NODE_ENV === 'development' && errorResponse.context && {
          context: errorResponse.context,
        }),
      },
    }, { 
      status: statusCode || errorResponse.statusCode,
    });
  }

  static validationError(message: string, field?: string): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        ...(field && { field }),
      },
    }, { status: 400 });
  }

  static unauthorized(message = 'Unauthorized'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    }, { status: 401 });
  }

  static forbidden(message = 'Forbidden'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    }, { status: 403 });
  }

  static notFound(message = 'Not found'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
    }, { status: 404 });
  }
}

// Request utilities
export class HttpRequest {
  static async getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
    try {
      const token = await getToken({ req: request });
      return token?.sub || null;
    } catch (error) {
      logger.warn('Failed to get authenticated user', {
        layer: 'api',
        error,
      });
      return null;
    }
  }

  static async parseJsonBody<T>(request: NextRequest): Promise<T> {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }

  static getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown';
  }

  static getCorrelationId(request: NextRequest): string {
    return request.headers.get('x-correlation-id') || crypto.randomUUID();
  }
}

// API Route handler wrapper with observability
export function withObservability(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    endpoint: string;
    method: string;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const correlationId = HttpRequest.getCorrelationId(request);
    const clientIp = HttpRequest.getClientIp(request);

    // Request logging
    logger.info('API request started', {
      layer: 'api',
      method: options.method,
      endpoint: options.endpoint,
      correlationId,
      clientIp,
      userAgent: HttpRequest.getUserAgent(request),
    });

    try {
      // Authentication check if required
      if (options.requireAuth) {
        const userId = await HttpRequest.getAuthenticatedUserId(request);
        if (!userId) {
          const duration = Date.now() - startTime;
          
          logger.warn('Unauthenticated API access attempt', {
            layer: 'api',
            method: options.method,
            endpoint: options.endpoint,
            correlationId,
            clientIp,
            duration,
          });

          metrics.counter('api_requests_total', {
            method: options.method,
            endpoint: options.endpoint,
            status: '401',
          }).inc();

          return HttpResponse.unauthorized();
        }
      }

      // Execute handler
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Success logging
      logger.info('API request completed', {
        layer: 'api',
        method: options.method,
        endpoint: options.endpoint,
        correlationId,
        statusCode: response.status,
        duration,
      });

      // Metrics
      metrics.counter('api_requests_total', {
        method: options.method,
        endpoint: options.endpoint,
        status: response.status.toString(),
      }).inc();

      metrics.histogram('api_request_duration_ms', {
        method: options.method,
        endpoint: options.endpoint,
      }).observe(duration);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Error logging
      logger.error('API request failed', {
        layer: 'api',
        method: options.method,
        endpoint: options.endpoint,
        correlationId,
        duration,
        error,
      });

      // Error metrics
      metrics.counter('api_requests_total', {
        method: options.method,
        endpoint: options.endpoint,
        status: '500',
      }).inc();

      metrics.counter('api_errors_total', {
        method: options.method,
        endpoint: options.endpoint,
        errorType: error.constructor.name,
      }).inc();

      return HttpResponse.error(error);
    }
  };
}

// Request validation utilities
export class RequestValidator {
  static validateRequired<T>(data: any, fields: (keyof T)[]): void {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Field '${String(field)}' is required`);
      }
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  static validateStringLength(
    value: string, 
    field: string, 
    min?: number, 
    max?: number
  ): void {
    if (min && value.length < min) {
      throw new Error(`${field} must be at least ${min} characters`);
    }
    if (max && value.length > max) {
      throw new Error(`${field} must be no more than ${max} characters`);
    }
  }

  static validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}

// Rate limiting utilities (placeholder for future implementation)
export class RateLimiter {
  static async checkLimit(
    request: NextRequest,
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    // TODO: Implement rate limiting logic
    // For now, always allow
    return true;
  }
}