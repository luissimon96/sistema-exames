/**
 * Update User Profile Use Case
 * Sistema Exames - User Domain
 */

import { UseCase, Result } from '../../../shared/types/base';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../entities/User';
import { UserProfile } from '../value-objects';
import { 
  UserNotFoundError, 
  ValidationError,
  AuthorizationError 
} from '../../../shared/infrastructure/errors';
import { logger, metrics } from '../../../shared/infrastructure/logger';

export interface UpdateUserProfileRequest {
  userId: string;
  requestingUserId: string; // For authorization
  profileData: {
    name?: string;
    bio?: string;
    imageUrl?: string;
  };
}

export interface UpdateUserProfileResponse {
  user: User;
  updatedFields: string[];
}

export class UpdateUserProfileUseCase implements UseCase<UpdateUserProfileRequest, UpdateUserProfileResponse> {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: UpdateUserProfileRequest): Promise<Result<UpdateUserProfileResponse>> {
    const startTime = Date.now();
    
    try {
      logger.info('Executing update user profile use case', {
        domain: 'user',
        usecase: 'update-profile',
        userId: request.userId,
        requestingUserId: request.requestingUserId,
        fields: Object.keys(request.profileData).filter(key => request.profileData[key] !== undefined),
      });

      // Authorization check - users can only update their own profiles
      // (unless requesting user is admin - this could be extended)
      if (request.userId !== request.requestingUserId) {
        logger.warn('Unauthorized profile update attempt', {
          domain: 'user',
          usecase: 'update-profile',
          userId: request.userId,
          requestingUserId: request.requestingUserId,
        });

        metrics.counter('user_profile_update_attempts_total', {
          status: 'unauthorized',
        }).inc();

        return Result.failure(new AuthorizationError(
          'Users can only update their own profiles'
        ));
      }

      // Validate input data
      const validationResult = this.validateProfileData(request.profileData);
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.getError());
      }

      // Find user
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        logger.warn('User not found for profile update', {
          domain: 'user',
          usecase: 'update-profile',
          userId: request.userId,
        });

        metrics.counter('user_profile_update_attempts_total', {
          status: 'user_not_found',
        }).inc();

        return Result.failure(new UserNotFoundError(request.userId));
      }

      // Store original profile for comparison
      const originalProfile = user.profile;

      // Update profile (domain logic handles validation and events)
      user.updateProfile(request.profileData);

      // Determine what fields were actually updated
      const updatedFields = this.getUpdatedFields(originalProfile, user.profile, request.profileData);

      // If no fields were actually updated, return early
      if (updatedFields.length === 0) {
        logger.debug('No profile changes detected', {
          domain: 'user',
          usecase: 'update-profile',
          userId: request.userId,
        });

        metrics.counter('user_profile_update_attempts_total', {
          status: 'no_changes',
        }).inc();

        return Result.success({
          user,
          updatedFields: [],
        });
      }

      // Save user (repository handles events)
      const savedUser = await this.userRepository.save(user);

      const duration = Date.now() - startTime;

      logger.info('User profile updated successfully', {
        domain: 'user',
        usecase: 'update-profile',
        userId: request.userId,
        updatedFields,
        duration,
      });

      metrics.counter('user_profile_update_attempts_total', {
        status: 'success',
      }).inc();

      metrics.histogram('user_profile_update_duration_ms').observe(duration);

      // Track field-specific updates
      updatedFields.forEach(field => {
        metrics.counter('user_profile_fields_updated_total', {
          field,
        }).inc();
      });

      return Result.success({
        user: savedUser,
        updatedFields,
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Failed to update user profile', {
        domain: 'user',
        usecase: 'update-profile',
        userId: request.userId,
        duration,
        error,
      });

      metrics.counter('user_profile_update_attempts_total', {
        status: 'error',
      }).inc();

      return Result.failure(error);
    }
  }

  private validateProfileData(profileData: any): Result<void> {
    try {
      // Validate that at least one field is being updated
      const hasUpdates = Object.values(profileData).some(value => value !== undefined);
      if (!hasUpdates) {
        return Result.failure(new ValidationError(
          'profileData',
          profileData,
          'At least one profile field must be provided for update'
        ));
      }

      // Validate individual fields using value object validation
      if (profileData.name !== undefined || profileData.bio !== undefined || profileData.imageUrl !== undefined) {
        // Create a temporary profile to validate the data
        // We need existing data for validation, so we'll validate each field individually
        
        if (profileData.name !== undefined) {
          if (!profileData.name || profileData.name.trim().length === 0) {
            return Result.failure(new ValidationError('name', profileData.name, 'Name cannot be empty'));
          }
          
          if (profileData.name.trim().length < 2) {
            return Result.failure(new ValidationError('name', profileData.name, 'Name must be at least 2 characters'));
          }
          
          if (profileData.name.length > 100) {
            return Result.failure(new ValidationError('name', profileData.name, 'Name is too long (max 100 characters)'));
          }
        }

        if (profileData.bio !== undefined && profileData.bio !== null && profileData.bio.length > 500) {
          return Result.failure(new ValidationError('bio', profileData.bio, 'Bio is too long (max 500 characters)'));
        }

        if (profileData.imageUrl !== undefined && profileData.imageUrl !== null && profileData.imageUrl.trim().length > 0) {
          try {
            new URL(profileData.imageUrl);
          } catch {
            return Result.failure(new ValidationError('imageUrl', profileData.imageUrl, 'Invalid image URL format'));
          }
        }
      }

      return Result.success(undefined);

    } catch (error) {
      return Result.failure(error);
    }
  }

  private getUpdatedFields(
    originalProfile: UserProfile,
    newProfile: UserProfile,
    requestData: any
  ): string[] {
    const updatedFields: string[] = [];

    if (requestData.name !== undefined && originalProfile.name !== newProfile.name) {
      updatedFields.push('name');
    }

    if (requestData.bio !== undefined && originalProfile.bio !== newProfile.bio) {
      updatedFields.push('bio');
    }

    if (requestData.imageUrl !== undefined && originalProfile.imageUrl !== newProfile.imageUrl) {
      updatedFields.push('imageUrl');
    }

    return updatedFields;
  }
}