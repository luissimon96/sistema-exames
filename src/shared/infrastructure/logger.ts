/**
 * Structured logging infrastructure for observability
 * Sistema Exames - Observability Layer
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  domain?: string;
  usecase?: string;
  layer?: 'domain' | 'infrastructure' | 'api' | 'ui';
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

class StructuredLogger implements Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      service: 'sistema-exames',
      environment: process.env.NODE_ENV || 'development',
    };

    if (context?.error) {
      return {
        ...baseLog,
        ...context,
        error: {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack,
        },
      };
    }

    return { ...baseLog, ...context };
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(this.formatLog(LogLevel.DEBUG, message, context), null, 2));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(JSON.stringify(this.formatLog(LogLevel.INFO, message, context)));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify(this.formatLog(LogLevel.WARN, message, context)));
  }

  error(message: string, context?: LogContext): void {
    console.error(JSON.stringify(this.formatLog(LogLevel.ERROR, message, context)));
  }
}

// Health check interface
export interface HealthCheck {
  name: string;
  check(): Promise<boolean>;
  timeout?: number;
}

// Metrics interface
export interface Metrics {
  counter(name: string, labels?: Record<string, string>): {
    inc(value?: number): void;
  };
  histogram(name: string, labels?: Record<string, string>): {
    observe(value: number): void;
  };
  gauge(name: string, labels?: Record<string, string>): {
    set(value: number): void;
  };
}

// Simple in-memory metrics implementation for development
class SimpleMetrics implements Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private gauges = new Map<string, number>();

  counter(name: string, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    return {
      inc: (value = 1) => {
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
        logger.debug('Counter incremented', {
          metric: name,
          labels,
          value: current + value,
        });
      },
    };
  }

  histogram(name: string, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    return {
      observe: (value: number) => {
        const current = this.histograms.get(key) || [];
        current.push(value);
        this.histograms.set(key, current);
        logger.debug('Histogram observation', {
          metric: name,
          labels,
          value,
        });
      },
    };
  }

  gauge(name: string, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    return {
      set: (value: number) => {
        this.gauges.set(key, value);
        logger.debug('Gauge set', {
          metric: name,
          labels,
          value,
        });
      },
    };
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    const labelStr = labels ? JSON.stringify(labels) : '';
    return `${name}${labelStr}`;
  }

  // Development helper to view metrics
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(this.histograms),
      gauges: Object.fromEntries(this.gauges),
    };
  }
}

// Singleton instances
export const logger: Logger = new StructuredLogger();
export const metrics: Metrics = new SimpleMetrics();

// Performance measurement helper
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  const timer = metrics.histogram('operation_duration_ms', {
    operation,
    domain: context?.domain || 'unknown',
  });

  return fn()
    .then((result) => {
      const duration = Date.now() - start;
      timer.observe(duration);
      logger.info('Operation completed', {
        ...context,
        operation,
        duration,
        status: 'success',
      });
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - start;
      timer.observe(duration);
      logger.error('Operation failed', {
        ...context,
        operation,
        duration,
        status: 'error',
        error,
      });
      throw error;
    });
}