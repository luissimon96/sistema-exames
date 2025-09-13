/**
 * Base types and interfaces for Clean Architecture implementation
 * Sistema Exames - Shared Kernel
 */

// Domain Entity base class
export abstract class Entity<T> {
  protected constructor(protected readonly id: T) {}

  public getId(): T {
    return this.id;
  }

  public equals(entity: Entity<T>): boolean {
    return this.id === entity.getId();
  }
}

// Value Object base class
export abstract class ValueObject<T> {
  constructor(protected readonly value: T) {}

  public getValue(): T {
    return this.value;
  }

  public equals(vo: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(vo.getValue());
  }
}

// Domain Event interface
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
}

// Result pattern for error handling
export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  public static success<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  public static failure<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  public getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }
}

// Use Case interface
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Result<Output>>;
}

// Repository base interface
export interface Repository<T extends Entity<any>> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// Event Bus interface
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;
}

// Specification pattern for business rules
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
}