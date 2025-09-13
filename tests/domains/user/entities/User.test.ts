/**
 * User Entity Unit Tests
 * Sistema Exames - Domain Layer Tests
 */

import { User } from '../../../../src/domains/user/entities/User';
import { UserEmail, UserProfile, UserPreferences } from '../../../../src/domains/user/value-objects';
import { TestDataBuilder, TestData } from '../../../utils/TestDataBuilder';

describe('User Entity', () => {
  describe('Factory Methods', () => {
    test('should create user with valid data', () => {
      const user = TestDataBuilder.userBuilder()
        .withEmail('test@example.com')
        .withName('John Doe')
        .build();

      expect(user.getId()).toBeValidUUID();
      expect(user.email.value).toBe('test@example.com');
      expect(user.profile.name).toBe('John Doe');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should create user from persistence data', () => {
      const persistenceData = TestDataBuilder.userBuilder()
        .withId('test-id')
        .withEmail('test@example.com')
        .withName('Jane Doe')
        .buildPersistenceData();

      const user = User.fromPersistence(persistenceData);

      expect(user.getId()).toBe('test-id');
      expect(user.email.value).toBe('test@example.com');
      expect(user.profile.name).toBe('Jane Doe');
    });
  });

  describe('Profile Management', () => {
    let user: User;

    beforeEach(() => {
      user = TestDataBuilder.userBuilder()
        .withName('Original Name')
        .withBio('Original bio')
        .build();
    });

    test('should update profile with new data', () => {
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a moment to ensure timestamp difference
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      user.updateProfile({
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(user.profile.name).toBe('Updated Name');
      expect(user.profile.bio).toBe('Updated bio');
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('user.profile.updated');

      jest.useRealTimers();
    });

    test('should not update profile when no changes are made', () => {
      const originalUpdatedAt = user.updatedAt;
      const originalName = user.profile.name;

      user.updateProfile({
        name: originalName, // Same as current name
      });

      expect(user.updatedAt).toEqual(originalUpdatedAt);
      expect(user.getUncommittedEvents()).toHaveLength(0);
    });

    test('should track which fields were updated', () => {
      user.updateProfile({
        name: 'New Name',
        imageUrl: 'https://example.com/new-image.jpg',
        // bio not provided - should not be updated
      });

      const events = user.getUncommittedEvents();
      expect(events[0].updatedFields).toEqual(['name', 'imageUrl']);
    });

    test('should handle partial profile updates', () => {
      const originalBio = user.profile.bio;

      user.updateProfile({
        name: 'Only Name Updated',
      });

      expect(user.profile.name).toBe('Only Name Updated');
      expect(user.profile.bio).toBe(originalBio); // Should remain unchanged
    });
  });

  describe('Email Verification', () => {
    test('should verify email successfully', () => {
      const user = TestDataBuilder.userBuilder()
        .withEmailVerified(false)
        .build();

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
      
      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('user.email.verified');
    });

    test('should not emit event if email already verified', () => {
      const user = TestDataBuilder.userBuilder()
        .withEmailVerified(true)
        .build();

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Two-Factor Authentication', () => {
    test('should enable two-factor authentication', () => {
      const user = TestDataBuilder.userBuilder()
        .withTwoFactorEnabled(false)
        .build();

      user.enableTwoFactor();

      expect(user.isTwoFactorEnabled).toBe(true);
    });

    test('should disable two-factor authentication', () => {
      const user = TestDataBuilder.userBuilder()
        .withTwoFactorEnabled(true)
        .build();

      user.disableTwoFactor();

      expect(user.isTwoFactorEnabled).toBe(false);
    });

    test('should throw error when enabling already enabled 2FA', () => {
      const user = TestDataBuilder.userBuilder()
        .withTwoFactorEnabled(true)
        .build();

      expect(() => user.enableTwoFactor()).toThrow('Two-factor authentication is already enabled');
    });

    test('should throw error when disabling already disabled 2FA', () => {
      const user = TestDataBuilder.userBuilder()
        .withTwoFactorEnabled(false)
        .build();

      expect(() => user.disableTwoFactor()).toThrow('Two-factor authentication is already disabled');
    });
  });

  describe('Subscription Management', () => {
    test('should update subscription tier and status', () => {
      const user = TestDataBuilder.userBuilder()
        .withSubscription('free', 'inactive')
        .build();

      user.updateSubscription('pro', 'active');

      expect(user.subscriptionTier).toBe('pro');
      expect(user.subscriptionStatus).toBe('active');
    });

    test('should correctly determine pro feature access', () => {
      const freeUser = TestDataBuilder.userBuilder()
        .withSubscription('free', 'active')
        .build();

      const proUser = TestDataBuilder.userBuilder()
        .withSubscription('pro', 'active')
        .build();

      const inactiveProUser = TestDataBuilder.userBuilder()
        .withSubscription('pro', 'inactive')
        .build();

      expect(freeUser.canAccessProFeatures()).toBe(false);
      expect(proUser.canAccessProFeatures()).toBe(true);
      expect(inactiveProUser.canAccessProFeatures()).toBe(false);
    });

    test('should correctly determine family account management access', () => {
      const freeUser = TestDataBuilder.userBuilder()
        .withSubscription('free', 'active')
        .build();

      const proUser = TestDataBuilder.userBuilder()
        .withSubscription('pro', 'active')
        .build();

      const familyUser = TestDataBuilder.userBuilder()
        .withSubscription('family', 'active')
        .build();

      expect(freeUser.canManageFamilyAccounts()).toBe(false);
      expect(proUser.canManageFamilyAccounts()).toBe(false);
      expect(familyUser.canManageFamilyAccounts()).toBe(true);
    });

    test('should return correct upload limits based on subscription', () => {
      const freeUser = TestDataBuilder.userBuilder()
        .withSubscription('free', 'active')
        .build();

      const proUser = TestDataBuilder.userBuilder()
        .withSubscription('pro', 'active')
        .build();

      const familyUser = TestDataBuilder.userBuilder()
        .withSubscription('family', 'active')
        .build();

      expect(freeUser.getMaxUploadsPerMonth()).toBe(5);
      expect(proUser.getMaxUploadsPerMonth()).toBe(50);
      expect(familyUser.getMaxUploadsPerMonth()).toBe(200);
    });
  });

  describe('Preferences Management', () => {
    test('should update user preferences', () => {
      const user = TestDataBuilder.userBuilder()
        .withTheme('light')
        .withColors('blue', 'gray')
        .build();

      user.updatePreferences({
        theme: 'dark',
        primaryColor: 'purple',
      });

      expect(user.preferences.theme).toBe('dark');
      expect(user.preferences.primaryColor).toBe('purple');
      expect(user.preferences.secondaryColor).toBe('gray'); // Unchanged
    });
  });

  describe('Data Conversion', () => {
    test('should convert to persistence format', () => {
      const user = TestDataBuilder.userBuilder()
        .withId('test-id')
        .withEmail('test@example.com')
        .withName('Test User')
        .withBio('Test bio')
        .build();

      const persistenceData = user.toPersistence();

      expect(persistenceData).toEqual({
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        image: undefined,
        theme: 'light',
        primaryColor: 'blue',
        secondaryColor: 'gray',
        emailVerified: false,
        twoFactorEnabled: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    test('should convert to API response format', () => {
      const user = TestDataBuilder.userBuilder()
        .withEmail('test@example.com')
        .withName('Test User')
        .asProUser()
        .build();

      const response = user.toResponse();

      expect(response).toEqual({
        id: expect.any(String),
        email: 'test@example.com',
        profile: {
          name: 'Test User',
          bio: undefined,
          imageUrl: undefined,
        },
        preferences: {
          theme: 'light',
          primaryColor: 'blue',
          secondaryColor: 'gray',
        },
        emailVerified: true,
        twoFactorEnabled: false,
        subscription: {
          tier: 'pro',
          status: 'active',
          maxUploadsPerMonth: 50,
          canAccessProFeatures: true,
          canManageFamilyAccounts: false,
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('Event Management', () => {
    test('should track uncommitted events', () => {
      const user = TestDataBuilder.userBuilder().build();

      user.updateProfile({ name: 'New Name' });
      user.verifyEmail();

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('user.profile.updated');
      expect(events[1].eventType).toBe('user.email.verified');
    });

    test('should clear events when marked as committed', () => {
      const user = TestDataBuilder.userBuilder().build();

      user.updateProfile({ name: 'New Name' });
      expect(user.getUncommittedEvents()).toHaveLength(1);

      user.markEventsAsCommitted();
      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Entity Equality', () => {
    test('should be equal when IDs match', () => {
      const id = 'same-id';
      const user1 = TestDataBuilder.userBuilder().withId(id).build();
      const user2 = TestDataBuilder.userBuilder().withId(id).withName('Different Name').build();

      expect(user1.equals(user2)).toBe(true);
    });

    test('should not be equal when IDs differ', () => {
      const user1 = TestDataBuilder.userBuilder().withId('id-1').build();
      const user2 = TestDataBuilder.userBuilder().withId('id-2').build();

      expect(user1.equals(user2)).toBe(false);
    });
  });
});