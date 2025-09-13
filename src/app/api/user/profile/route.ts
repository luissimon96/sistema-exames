/**
 * User Profile API Route - Clean Architecture Implementation
 * Sistema Exames - API Layer
 */

import { NextRequest } from 'next/server';
import { 
  HttpResponse, 
  HttpRequest, 
  withObservability, 
  RequestValidator 
} from '../../../../shared/infrastructure/http';
import { getUpdateUserProfileUseCase } from '../../../../shared/infrastructure/container';
import { logger } from '../../../../shared/infrastructure/logger';

// Request/Response DTOs
interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  imageUrl?: string;
}

interface UpdateProfileResponse {
  user: {
    id: string;
    email: string;
    profile: {
      name: string;
      bio?: string;
      imageUrl?: string;
    };
    preferences: {
      theme: string;
      primaryColor: string;
      secondaryColor: string;
    };
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    subscription: {
      tier: string;
      status: string;
      maxUploadsPerMonth: number;
      canAccessProFeatures: boolean;
      canManageFamilyAccounts: boolean;
    };
    createdAt: string;
    updatedAt: string;
  };
  updatedFields: string[];
}

// GET handler - Get user profile
async function handleGetProfile(request: NextRequest) {
  const userId = await HttpRequest.getAuthenticatedUserId(request);
  if (!userId) {
    return HttpResponse.unauthorized();
  }

  try {
    const updateUserProfileUseCase = getUpdateUserProfileUseCase();
    const userRepository = updateUserProfileUseCase['userRepository']; // Access via use case
    
    const user = await userRepository.findById(userId);
    if (!user) {
      return HttpResponse.notFound('User not found');
    }

    const responseData: UpdateProfileResponse = {
      user: user.toResponse(),
      updatedFields: [], // Not applicable for GET
    };

    return HttpResponse.success(responseData);

  } catch (error) {
    logger.error('Failed to get user profile', {
      domain: 'user',
      layer: 'api',
      userId,
      error,
    });

    return HttpResponse.error(error);
  }
}

// PUT handler - Update user profile
async function handleUpdateProfile(request: NextRequest) {
  const userId = await HttpRequest.getAuthenticatedUserId(request);
  if (!userId) {
    return HttpResponse.unauthorized();
  }

  try {
    // Parse and validate request body
    const body = await HttpRequest.parseJsonBody<UpdateProfileRequest>(request);
    
    // Basic validation
    if (!body || Object.keys(body).length === 0) {
      return HttpResponse.validationError('At least one profile field must be provided');
    }

    // Validate individual fields if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return HttpResponse.validationError('Name must be a string', 'name');
      }
      RequestValidator.validateStringLength(body.name.trim(), 'Name', 2, 100);
    }

    if (body.bio !== undefined && body.bio !== null) {
      if (typeof body.bio !== 'string') {
        return HttpResponse.validationError('Bio must be a string', 'bio');
      }
      RequestValidator.validateStringLength(body.bio, 'Bio', 0, 500);
    }

    if (body.imageUrl !== undefined && body.imageUrl !== null && body.imageUrl.trim().length > 0) {
      if (typeof body.imageUrl !== 'string') {
        return HttpResponse.validationError('Image URL must be a string', 'imageUrl');
      }
      RequestValidator.validateUrl(body.imageUrl);
    }

    // Execute use case
    const updateUserProfileUseCase = getUpdateUserProfileUseCase();
    const result = await updateUserProfileUseCase.execute({
      userId,
      requestingUserId: userId,
      profileData: {
        name: body.name,
        bio: body.bio,
        imageUrl: body.imageUrl,
      },
    });

    if (result.isFailure()) {
      return HttpResponse.error(result.getError());
    }

    const { user, updatedFields } = result.getValue();
    
    const responseData: UpdateProfileResponse = {
      user: user.toResponse(),
      updatedFields,
    };

    logger.info('User profile updated successfully', {
      domain: 'user',
      layer: 'api',
      userId,
      updatedFields,
    });

    return HttpResponse.success(responseData);

  } catch (error) {
    logger.error('Failed to update user profile', {
      domain: 'user',
      layer: 'api',
      userId,
      error,
    });

    return HttpResponse.error(error);
  }
}

// Export route handlers with observability
export const GET = withObservability(handleGetProfile, {
  requireAuth: true,
  endpoint: '/api/user/profile',
  method: 'GET',
});

export const PUT = withObservability(handleUpdateProfile, {
  requireAuth: true,
  endpoint: '/api/user/profile',
  method: 'PUT',
});