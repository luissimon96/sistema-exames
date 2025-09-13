/**
 * Update User Profile Use Case Tests
 * Sistema Exames - Application Layer Tests
 */

import { UpdateUserProfileUseCase } from '../../../../src/domains/user/use-cases/UpdateUserProfileUseCase';
import { MockUserRepository } from '../../../utils/MockRepository';
import { TestDataBuilder } from '../../../utils/TestDataBuilder';
import { UserNotFoundError, ValidationError, AuthorizationError } from '../../../../src/shared/infrastructure/errors';

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new UpdateUserProfileUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.reset();
  });

  describe('Successful Updates', () => {
    test('should update user profile successfully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withName('Original Name')
        .withBio('Original bio')
        .build();
      
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Updated Name',
          bio: 'Updated bio',
          imageUrl: 'https://example.com/image.jpg',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
      
      const response = result.getValue();
      expect(response.user.profile.name).toBe('Updated Name');
      expect(response.user.profile.bio).toBe('Updated bio');
      expect(response.user.profile.imageUrl).toBe('https://example.com/image.jpg');
      expect(response.updatedFields).toEqual(['name', 'bio', 'imageUrl']);
    });

    test('should update only provided fields', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withName('Original Name')
        .withBio('Original bio')
        .build();
      
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Updated Name',
          // bio and imageUrl not provided
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
      
      const response = result.getValue();
      expect(response.user.profile.name).toBe('Updated Name');
      expect(response.user.profile.bio).toBe('Original bio'); // Unchanged
      expect(response.updatedFields).toEqual(['name']);
    });

    test('should handle no changes gracefully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withName('Same Name')
        .build();
      
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Same Name', // No actual change
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
      
      const response = result.getValue();
      expect(response.updatedFields).toEqual([]);
    });
  });

  describe('Authorization', () => {
    test('should reject when user tries to update another user\'s profile', async () => {
      // Arrange
      const targetUser = TestDataBuilder.userBuilder().build();
      const requestingUser = TestDataBuilder.userBuilder().build();
      
      mockRepository.addUser(targetUser);
      mockRepository.addUser(requestingUser);

      const request = {
        userId: targetUser.getId(),
        requestingUserId: requestingUser.getId(), // Different user
        profileData: {
          name: 'Hacked Name',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(AuthorizationError);
      expect(result.getError().message).toContain('Users can only update their own profiles');
    });

    test('should allow user to update their own profile', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(), // Same user
        profileData: {
          name: 'Self Updated Name',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Validation', () => {
    test('should reject empty profile data', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {}, // No data provided
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
      expect(result.getError().message).toContain('At least one profile field must be provided');
    });

    test('should reject invalid name', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: '', // Empty name
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
    });

    test('should reject name that is too short', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'A', // Too short
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
    });

    test('should reject name that is too long', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'A'.repeat(101), // Too long
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
    });

    test('should reject bio that is too long', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Valid Name',
          bio: 'B'.repeat(501), // Too long
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
    });

    test('should reject invalid image URL', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Valid Name',
          imageUrl: 'not-a-valid-url',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
    });

    test('should accept valid image URL', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Valid Name',
          imageUrl: 'https://example.com/image.jpg',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle user not found', async () => {
      // Arrange
      const request = {
        userId: 'non-existent-id',
        requestingUserId: 'non-existent-id',
        profileData: {
          name: 'Some Name',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(UserNotFoundError);
    });

    test('should handle repository errors', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const repositoryError = new Error('Database connection failed');
      mockRepository.simulateError('save', repositoryError);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Updated Name',
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(repositoryError);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null bio gracefully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Valid Name',
          bio: null as any, // Null bio
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
    });

    test('should handle empty string bio', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: 'Valid Name',
          bio: '', // Empty bio
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
    });

    test('should trim whitespace from name', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);

      const request = {
        userId: user.getId(),
        requestingUserId: user.getId(),
        profileData: {
          name: '  Valid Name  ', // With whitespace
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const response = result.getValue();
      expect(response.user.profile.name).toBe('Valid Name'); // Trimmed
    });
  });
});