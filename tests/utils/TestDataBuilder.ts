/**
 * Test Data Builder Utilities
 * Sistema Exames - Test Infrastructure
 */

import { User } from '../../src/domains/user/entities/User';
import { UserEmail, UserProfile, UserPreferences } from '../../src/domains/user/value-objects';

export class TestDataBuilder {
  
  /**
   * User Test Data Builders
   */
  static userBuilder() {
    return new UserBuilder();
  }

  /**
   * Value Object Test Data Builders
   */
  static emailBuilder() {
    return new EmailBuilder();
  }

  static profileBuilder() {
    return new ProfileBuilder();
  }

  static preferencesBuilder() {
    return new PreferencesBuilder();
  }
}

class UserBuilder {
  private id = crypto.randomUUID();
  private email = 'test@example.com';
  private name = 'Test User';
  private bio?: string;
  private imageUrl?: string;
  private theme: 'light' | 'dark' = 'light';
  private primaryColor = 'blue';
  private secondaryColor = 'gray';
  private isEmailVerified = false;
  private isTwoFactorEnabled = false;
  private subscriptionTier: 'free' | 'pro' | 'family' = 'free';
  private subscriptionStatus: 'active' | 'inactive' | 'cancelled' = 'inactive';
  private createdAt = new Date();
  private updatedAt = new Date();

  withId(id: string): UserBuilder {
    this.id = id;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.email = email;
    return this;
  }

  withName(name: string): UserBuilder {
    this.name = name;
    return this;
  }

  withBio(bio: string): UserBuilder {
    this.bio = bio;
    return this;
  }

  withImageUrl(imageUrl: string): UserBuilder {
    this.imageUrl = imageUrl;
    return this;
  }

  withTheme(theme: 'light' | 'dark'): UserBuilder {
    this.theme = theme;
    return this;
  }

  withColors(primary: string, secondary: string): UserBuilder {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
    return this;
  }

  withEmailVerified(verified = true): UserBuilder {
    this.isEmailVerified = verified;
    return this;
  }

  withTwoFactorEnabled(enabled = true): UserBuilder {
    this.isTwoFactorEnabled = enabled;
    return this;
  }

  withSubscription(tier: 'free' | 'pro' | 'family', status: 'active' | 'inactive' | 'cancelled' = 'active'): UserBuilder {
    this.subscriptionTier = tier;
    this.subscriptionStatus = status;
    return this;
  }

  withCreatedAt(date: Date): UserBuilder {
    this.createdAt = date;
    return this;
  }

  withUpdatedAt(date: Date): UserBuilder {
    this.updatedAt = date;
    return this;
  }

  // Convenience methods for common test scenarios
  asVerifiedUser(): UserBuilder {
    return this.withEmailVerified(true);
  }

  asProUser(): UserBuilder {
    return this.withSubscription('pro', 'active').withEmailVerified(true);
  }

  asFamilyUser(): UserBuilder {
    return this.withSubscription('family', 'active').withEmailVerified(true);
  }

  asSecureUser(): UserBuilder {
    return this.withEmailVerified(true).withTwoFactorEnabled(true);
  }

  asAdminUser(): UserBuilder {
    return this.withEmail('admin@example.com')
               .withName('Admin User')
               .withEmailVerified(true)
               .withTwoFactorEnabled(true)
               .withSubscription('family', 'active');
  }

  build(): User {
    const props = {
      id: this.id,
      email: UserEmail.create(this.email),
      profile: UserProfile.create({
        name: this.name,
        bio: this.bio,
        imageUrl: this.imageUrl,
      }),
      preferences: UserPreferences.create({
        theme: this.theme,
        primaryColor: this.primaryColor,
        secondaryColor: this.secondaryColor,
      }),
      isEmailVerified: this.isEmailVerified,
      isTwoFactorEnabled: this.isTwoFactorEnabled,
      subscriptionTier: this.subscriptionTier,
      subscriptionStatus: this.subscriptionStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    return new User(props);
  }

  buildPersistenceData(): any {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      bio: this.bio,
      image: this.imageUrl,
      theme: this.theme,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      emailVerified: this.isEmailVerified,
      twoFactorEnabled: this.isTwoFactorEnabled,
      subscriptionTier: this.subscriptionTier,
      subscriptionStatus: this.subscriptionStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class EmailBuilder {
  private email = 'test@example.com';

  withEmail(email: string): EmailBuilder {
    this.email = email;
    return this;
  }

  withDomain(domain: string): EmailBuilder {
    const localPart = this.email.split('@')[0];
    this.email = `${localPart}@${domain}`;
    return this;
  }

  withLocalPart(localPart: string): EmailBuilder {
    const domain = this.email.split('@')[1];
    this.email = `${localPart}@${domain}`;
    return this;
  }

  // Test data generators
  asGmail(): EmailBuilder {
    return this.withDomain('gmail.com');
  }

  asOutlook(): EmailBuilder {
    return this.withDomain('outlook.com');
  }

  asCorporate(): EmailBuilder {
    return this.withDomain('company.com');
  }

  withRandomEmail(): EmailBuilder {
    const randomId = Math.random().toString(36).substring(7);
    return this.withEmail(`test${randomId}@example.com`);
  }

  build(): UserEmail {
    return UserEmail.create(this.email);
  }

  buildString(): string {
    return this.email;
  }
}

class ProfileBuilder {
  private name = 'Test User';
  private bio?: string;
  private imageUrl?: string;

  withName(name: string): ProfileBuilder {
    this.name = name;
    return this;
  }

  withBio(bio: string): ProfileBuilder {
    this.bio = bio;
    return this;
  }

  withImageUrl(imageUrl: string): ProfileBuilder {
    this.imageUrl = imageUrl;
    return this;
  }

  // Test scenarios
  withLongName(): ProfileBuilder {
    this.name = 'A'.repeat(100); // Max length
    return this;
  }

  withLongBio(): ProfileBuilder {
    this.bio = 'B'.repeat(500); // Max length
    return this;
  }

  withCompleteProfile(): ProfileBuilder {
    this.name = 'John Doe';
    this.bio = 'Software engineer passionate about healthcare technology';
    this.imageUrl = 'https://example.com/avatar.jpg';
    return this;
  }

  build(): UserProfile {
    return UserProfile.create({
      name: this.name,
      bio: this.bio,
      imageUrl: this.imageUrl,
    });
  }
}

class PreferencesBuilder {
  private theme: 'light' | 'dark' = 'light';
  private primaryColor = 'blue';
  private secondaryColor = 'gray';

  withTheme(theme: 'light' | 'dark'): PreferencesBuilder {
    this.theme = theme;
    return this;
  }

  withPrimaryColor(color: string): PreferencesBuilder {
    this.primaryColor = color;
    return this;
  }

  withSecondaryColor(color: string): PreferencesBuilder {
    this.secondaryColor = color;
    return this;
  }

  withColors(primary: string, secondary: string): PreferencesBuilder {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
    return this;
  }

  // Test scenarios
  asDarkTheme(): PreferencesBuilder {
    return this.withTheme('dark');
  }

  asLightTheme(): PreferencesBuilder {
    return this.withTheme('light');
  }

  withCustomColors(): PreferencesBuilder {
    return this.withColors('purple', 'pink');
  }

  build(): UserPreferences {
    return UserPreferences.create({
      theme: this.theme,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
    });
  }
}

// Export common test data
export const TestData = {
  // Common test dates
  dates: {
    past: new Date('2023-01-01'),
    recent: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    now: new Date(),
    future: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  },

  // Common test emails
  emails: {
    valid: 'test@example.com',
    admin: 'admin@example.com',
    user: 'user@example.com',
    gmail: 'test@gmail.com',
    outlook: 'test@outlook.com',
  },

  // Common test names
  names: {
    short: 'Jo',
    normal: 'John Doe',
    long: 'A'.repeat(100),
    special: 'José María',
    unicode: '李小明',
  },

  // Common test UUIDs
  ids: {
    user: '123e4567-e89b-12d3-a456-426614174000',
    admin: '987fcdeb-51a2-43d1-9f12-345678901234',
    random: () => crypto.randomUUID(),
  },
};