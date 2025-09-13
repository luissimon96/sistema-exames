/**
 * Event-driven architecture infrastructure
 * Sistema Exames - Domain Events System
 */

import { DomainEvent, EventBus } from '../types/base';
import { logger, metrics } from './logger';

// Event metadata
export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  timestamp: Date;
}

// Enhanced domain event with metadata
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly metadata: EventMetadata;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    metadata?: Partial<EventMetadata>
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
    this.metadata = {
      timestamp: this.occurredAt,
      ...metadata,
    };
  }
}

// Event handler interface
export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  eventType: string;
}

// In-memory event bus implementation
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();
  private eventStore: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Store event for audit/replay purposes
      this.eventStore.push(event);
      
      // Get handlers for this event type
      const eventHandlers = this.handlers.get(event.eventType) || [];
      
      logger.info('Publishing domain event', {
        domain: 'events',
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        handlersCount: eventHandlers.length,
      });

      // Execute handlers in parallel
      const handlerPromises = eventHandlers.map(async (handler) => {
        try {
          await handler.handle(event);
          
          metrics.counter('domain_events_handled_total', {
            eventType: event.eventType,
            handler: handler.constructor.name,
            status: 'success',
          }).inc();

        } catch (error) {
          logger.error('Event handler failed', {
            domain: 'events',
            eventType: event.eventType,
            eventId: event.eventId,
            handler: handler.constructor.name,
            error,
          });

          metrics.counter('domain_events_handled_total', {
            eventType: event.eventType,
            handler: handler.constructor.name,
            status: 'error',
          }).inc();

          throw error;
        }
      });

      await Promise.all(handlerPromises);

      const duration = Date.now() - startTime;
      metrics.histogram('domain_event_publish_duration_ms', {
        eventType: event.eventType,
      }).observe(duration);

    } catch (error) {
      logger.error('Failed to publish domain event', {
        domain: 'events',
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    logger.info('Event handler subscribed', {
      domain: 'events',
      eventType,
      handler: handler.constructor.name,
    });
  }

  // Development utilities
  getEventStore(): DomainEvent[] {
    return [...this.eventStore];
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  clearEventStore(): void {
    this.eventStore = [];
  }
}

// User domain events
export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('user.registered', userId, metadata);
  }
}

export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly updatedFields: string[],
    metadata?: Partial<EventMetadata>
  ) {
    super('user.profile.updated', userId, metadata);
  }
}

export class UserEmailVerifiedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('user.email.verified', userId, metadata);
  }
}

// Authentication events
export class UserLoggedInEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly loginMethod: 'email' | 'oauth',
    public readonly ipAddress?: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('auth.user.logged_in', userId, metadata);
  }
}

export class TwoFactorEnabledEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('auth.two_factor.enabled', userId, metadata);
  }
}

export class TwoFactorDisabledEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('auth.two_factor.disabled', userId, metadata);
  }
}

// Subscription events
export class SubscriptionCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly subscriptionId: string,
    public readonly planType: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('subscription.created', userId, metadata);
  }
}

export class SubscriptionCancelledEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly subscriptionId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super('subscription.cancelled', userId, metadata);
  }
}

// Activity logging event handler
export class ActivityLoggingHandler implements EventHandler<DomainEvent> {
  eventType = '*'; // Handle all events

  async handle(event: DomainEvent): Promise<void> {
    // This would integrate with your existing activity logging
    logger.info('Domain event logged for audit', {
      domain: 'audit',
      eventType: event.eventType,
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      timestamp: event.occurredAt,
    });

    // Increment activity counter
    metrics.counter('user_activities_total', {
      eventType: event.eventType,
    }).inc();
  }
}

// Export singleton event bus
export const eventBus = new InMemoryEventBus();

// Auto-register activity logging handler
eventBus.subscribe('*', new ActivityLoggingHandler());