/**
 * User Domain Entity
 * Sistema Exames - User Domain
 */

import { Entity } from '../../../shared/types/base';
import { UserEmail, UserProfile, UserPreferences } from '../value-objects';
import { 
  UserProfileUpdatedEvent, 
  UserEmailVerifiedEvent 
} from '../../../shared/infrastructure/events';

export interface UserProps {
  id: string;
  email: UserEmail;
  profile: UserProfile;
  preferences: UserPreferences;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  subscriptionTier: 'free' | 'pro' | 'family';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<string> {
  private props: UserProps;
  private events: any[] = [];

  constructor(props: UserProps) {
    super(props.id);
    this.props = props;
  }

  // Factory methods
  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(data: any): User {
    return new User({
      id: data.id,
      email: UserEmail.create(data.email),
      profile: UserProfile.create({
        name: data.name,
        bio: data.bio,
        imageUrl: data.image,
      }),
      preferences: UserPreferences.create({
        theme: data.theme || 'light',
        primaryColor: data.primaryColor || 'blue',
        secondaryColor: data.secondaryColor || 'gray',
      }),
      isEmailVerified: data.emailVerified || false,
      isTwoFactorEnabled: data.twoFactorEnabled || false,
      subscriptionTier: data.subscriptionTier || 'free',
      subscriptionStatus: data.subscriptionStatus || 'inactive',
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  // Getters
  get email(): UserEmail {
    return this.props.email;
  }

  get profile(): UserProfile {
    return this.props.profile;
  }

  get preferences(): UserPreferences {
    return this.props.preferences;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get isTwoFactorEnabled(): boolean {
    return this.props.isTwoFactorEnabled;
  }

  get subscriptionTier(): string {
    return this.props.subscriptionTier;
  }

  get subscriptionStatus(): string {
    return this.props.subscriptionStatus;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  updateProfile(profileData: {
    name?: string;
    bio?: string;
    imageUrl?: string;
  }): void {
    const updatedFields: string[] = [];
    
    if (profileData.name !== undefined && profileData.name !== this.props.profile.name) {
      updatedFields.push('name');
    }
    
    if (profileData.bio !== undefined && profileData.bio !== this.props.profile.bio) {
      updatedFields.push('bio');
    }
    
    if (profileData.imageUrl !== undefined && profileData.imageUrl !== this.props.profile.imageUrl) {
      updatedFields.push('imageUrl');
    }

    if (updatedFields.length === 0) {
      return; // No changes to make
    }

    this.props.profile = UserProfile.create({
      name: profileData.name ?? this.props.profile.name,
      bio: profileData.bio ?? this.props.profile.bio,
      imageUrl: profileData.imageUrl ?? this.props.profile.imageUrl,
    });

    this.props.updatedAt = new Date();

    // Emit domain event
    this.addEvent(new UserProfileUpdatedEvent(
      this.getId(),
      updatedFields,
      { userId: this.getId() }
    ));
  }

  updatePreferences(preferencesData: {
    theme?: 'light' | 'dark';
    primaryColor?: string;
    secondaryColor?: string;
  }): void {
    this.props.preferences = UserPreferences.create({
      theme: preferencesData.theme ?? this.props.preferences.theme,
      primaryColor: preferencesData.primaryColor ?? this.props.preferences.primaryColor,
      secondaryColor: preferencesData.secondaryColor ?? this.props.preferences.secondaryColor,
    });

    this.props.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this.props.isEmailVerified) {
      return; // Already verified
    }

    this.props.isEmailVerified = true;
    this.props.updatedAt = new Date();

    // Emit domain event
    this.addEvent(new UserEmailVerifiedEvent(
      this.getId(),
      { userId: this.getId() }
    ));
  }

  enableTwoFactor(): void {
    if (this.props.isTwoFactorEnabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    this.props.isTwoFactorEnabled = true;
    this.props.updatedAt = new Date();
  }

  disableTwoFactor(): void {
    if (!this.props.isTwoFactorEnabled) {
      throw new Error('Two-factor authentication is already disabled');
    }

    this.props.isTwoFactorEnabled = false;
    this.props.updatedAt = new Date();
  }

  updateSubscription(tier: 'free' | 'pro' | 'family', status: 'active' | 'inactive' | 'cancelled'): void {
    this.props.subscriptionTier = tier;
    this.props.subscriptionStatus = status;
    this.props.updatedAt = new Date();
  }

  // Business rule: Can user access pro features?
  canAccessProFeatures(): boolean {
    return this.props.subscriptionTier !== 'free' && 
           this.props.subscriptionStatus === 'active';
  }

  // Business rule: Can user manage family accounts?
  canManageFamilyAccounts(): boolean {
    return this.props.subscriptionTier === 'family' && 
           this.props.subscriptionStatus === 'active';
  }

  // Business rule: Maximum uploads per month based on subscription
  getMaxUploadsPerMonth(): number {
    switch (this.props.subscriptionTier) {
      case 'free':
        return 5;
      case 'pro':
        return 50;
      case 'family':
        return 200;
      default:
        return 5;
    }
  }

  // Convert to persistence format
  toPersistence(): any {
    return {
      id: this.getId(),
      email: this.props.email.value,
      name: this.props.profile.name,
      bio: this.props.profile.bio,
      image: this.props.profile.imageUrl,
      theme: this.props.preferences.theme,
      primaryColor: this.props.preferences.primaryColor,
      secondaryColor: this.props.preferences.secondaryColor,
      emailVerified: this.props.isEmailVerified,
      twoFactorEnabled: this.props.isTwoFactorEnabled,
      subscriptionTier: this.props.subscriptionTier,
      subscriptionStatus: this.props.subscriptionStatus,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  // Convert to API response format
  toResponse(): any {
    return {
      id: this.getId(),
      email: this.props.email.value,
      profile: {
        name: this.props.profile.name,
        bio: this.props.profile.bio,
        imageUrl: this.props.profile.imageUrl,
      },
      preferences: {
        theme: this.props.preferences.theme,
        primaryColor: this.props.preferences.primaryColor,
        secondaryColor: this.props.preferences.secondaryColor,
      },
      emailVerified: this.props.isEmailVerified,
      twoFactorEnabled: this.props.isTwoFactorEnabled,
      subscription: {
        tier: this.props.subscriptionTier,
        status: this.props.subscriptionStatus,
        maxUploadsPerMonth: this.getMaxUploadsPerMonth(),
        canAccessProFeatures: this.canAccessProFeatures(),
        canManageFamilyAccounts: this.canManageFamilyAccounts(),
      },
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  // Event management
  private addEvent(event: any): void {
    this.events.push(event);
  }

  getUncommittedEvents(): any[] {
    return [...this.events];
  }

  markEventsAsCommitted(): void {
    this.events = [];
  }
}