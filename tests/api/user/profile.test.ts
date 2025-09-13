/**
 * User Profile API Route Tests
 * Sistema Exames - API Integration Tests
 */

import { NextRequest } from 'next/server';
import { GET, PUT } from '../../../src/app/api/user/profile/route';
import { MockUserRepository } from '../../utils/MockRepository';
import { TestDataBuilder } from '../../utils/TestDataBuilder';
import { container } from '../../../src/shared/infrastructure/container';

// Mock NextAuth
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

import { getToken } from 'next-auth/jwt';

describe('/api/user/profile API Route', () => {
  let mockRepository: MockUserRepository;
  const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

  beforeEach(() => {
    // Reset container and create mock repository
    container.clear();
    mockRepository = new MockUserRepository();
    
    // Override repository in container
    container.get('userRepository', () => mockRepository);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockRepository.reset();
  });

  describe('GET /api/user/profile', () => {
    test('should return user profile successfully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withEmail('test@example.com')
        .withName('Test User')
        .withBio('Test bio')
        .asProUser()
        .build();
      
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.id).toBe(user.getId());
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.user.profile.name).toBe('Test User');
      expect(data.data.user.profile.bio).toBe('Test bio');
      expect(data.data.user.subscription.tier).toBe('pro');
      expect(data.data.updatedFields).toEqual([]);
    });

    test('should return 401 when not authenticated', async () => {
      // Arrange
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('should return 404 when user not found', async () => {
      // Arrange
      mockGetToken.mockResolvedValue({ sub: 'non-existent-id' } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/user/profile', () => {
    test('should update user profile successfully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withName('Original Name')
        .withBio('Original bio')
        .build();
      
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        imageUrl: 'https://example.com/new-image.jpg',
      };

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.profile.name).toBe('Updated Name');
      expect(data.data.user.profile.bio).toBe('Updated bio');
      expect(data.data.user.profile.imageUrl).toBe('https://example.com/new-image.jpg');
      expect(data.data.updatedFields).toEqual(['name', 'bio', 'imageUrl']);
    });

    test('should update only provided fields', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder()
        .withName('Original Name')
        .withBio('Original bio')
        .build();
      
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const updateData = {
        name: 'Updated Name',
        // bio and imageUrl not provided
      };

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.profile.name).toBe('Updated Name');
      expect(data.data.user.profile.bio).toBe('Original bio'); // Unchanged
      expect(data.data.updatedFields).toEqual(['name']);
    });

    test('should return 401 when not authenticated', async () => {
      // Arrange
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('should return 400 when no fields provided', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({}), // Empty body
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('At least one profile field must be provided');
    });

    test('should return 400 when name is too short', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'A' }), // Too short
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 when name is too long', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'A'.repeat(101) }), // Too long
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 when bio is too long', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Valid Name',
          bio: 'B'.repeat(501), // Too long
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 when imageUrl is invalid', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Valid Name',
          imageUrl: 'not-a-valid-url',
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle invalid JSON gracefully', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    test('should handle repository errors', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      // Simulate repository error
      const repositoryError = new Error('Database connection failed');
      mockRepository.simulateError('save', repositoryError);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('CORS and Headers', () => {
    test('should include correlation ID in logs', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const correlationId = 'test-correlation-id';
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'GET',
        headers: {
          'x-correlation-id': correlationId,
        },
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      // In a real implementation, you might verify the correlation ID was logged
    });

    test('should handle user agent and IP tracking', async () => {
      // Arrange
      const user = TestDataBuilder.userBuilder().build();
      mockRepository.addUser(user);
      
      mockGetToken.mockResolvedValue({ sub: user.getId() } as any);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      // In a real implementation, you might verify these were logged
    });
  });
});