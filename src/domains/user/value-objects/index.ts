/**
 * User Domain Value Objects
 * Sistema Exames - User Domain
 */

import { ValueObject } from '../../../shared/types/base';
import { ValidationError } from '../../../shared/infrastructure/errors';

// User Email Value Object
export class UserEmail extends ValueObject<string> {
  private constructor(email: string) {
    super(email);
  }

  static create(email: string): UserEmail {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('email', email, 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('email', email, 'Invalid email format');
    }

    if (email.length > 254) {
      throw new ValidationError('email', email, 'Email is too long');
    }

    return new UserEmail(email.toLowerCase().trim());
  }

  get domain(): string {
    return this.value.split('@')[1];
  }

  get localPart(): string {
    return this.value.split('@')[0];
  }
}

// User Profile Value Object
export interface UserProfileProps {
  name: string;
  bio?: string;
  imageUrl?: string;
}

export class UserProfile extends ValueObject<UserProfileProps> {
  private constructor(props: UserProfileProps) {
    super(props);
  }

  static create(props: UserProfileProps): UserProfile {
    const { name, bio, imageUrl } = props;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('name', name, 'Name is required');
    }

    if (name.trim().length < 2) {
      throw new ValidationError('name', name, 'Name must be at least 2 characters');
    }

    if (name.length > 100) {
      throw new ValidationError('name', name, 'Name is too long (max 100 characters)');
    }

    if (bio && bio.length > 500) {
      throw new ValidationError('bio', bio, 'Bio is too long (max 500 characters)');
    }

    if (imageUrl && !UserProfile.isValidImageUrl(imageUrl)) {
      throw new ValidationError('imageUrl', imageUrl, 'Invalid image URL format');
    }

    return new UserProfile({
      name: name.trim(),
      bio: bio?.trim() || undefined,
      imageUrl: imageUrl?.trim() || undefined,
    });
  }

  private static isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  get name(): string {
    return this.value.name;
  }

  get bio(): string | undefined {
    return this.value.bio;
  }

  get imageUrl(): string | undefined {
    return this.value.imageUrl;
  }

  get initials(): string {
    return this.value.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get displayName(): string {
    return this.value.name;
  }
}

// User Preferences Value Object
export interface UserPreferencesProps {
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export class UserPreferences extends ValueObject<UserPreferencesProps> {
  private static readonly VALID_THEMES = ['light', 'dark'] as const;
  private static readonly VALID_COLORS = [
    'blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'gray'
  ] as const;

  private constructor(props: UserPreferencesProps) {
    super(props);
  }

  static create(props: UserPreferencesProps): UserPreferences {
    const { theme, primaryColor, secondaryColor } = props;

    if (!UserPreferences.VALID_THEMES.includes(theme)) {
      throw new ValidationError(
        'theme', 
        theme, 
        `Theme must be one of: ${UserPreferences.VALID_THEMES.join(', ')}`
      );
    }

    if (!UserPreferences.VALID_COLORS.includes(primaryColor as any)) {
      throw new ValidationError(
        'primaryColor',
        primaryColor,
        `Primary color must be one of: ${UserPreferences.VALID_COLORS.join(', ')}`
      );
    }

    if (!UserPreferences.VALID_COLORS.includes(secondaryColor as any)) {
      throw new ValidationError(
        'secondaryColor',
        secondaryColor,
        `Secondary color must be one of: ${UserPreferences.VALID_COLORS.join(', ')}`
      );
    }

    return new UserPreferences({
      theme,
      primaryColor,
      secondaryColor,
    });
  }

  get theme(): 'light' | 'dark' {
    return this.value.theme;
  }

  get primaryColor(): string {
    return this.value.primaryColor;
  }

  get secondaryColor(): string {
    return this.value.secondaryColor;
  }

  get cssVariables(): Record<string, string> {
    return {
      '--theme': this.value.theme,
      '--primary-color': this.value.primaryColor,
      '--secondary-color': this.value.secondaryColor,
    };
  }
}

// Password Value Object (for password operations)
export class Password extends ValueObject<string> {
  private constructor(hashedPassword: string) {
    super(hashedPassword);
  }

  static createFromPlaintext(plaintext: string): Password {
    Password.validatePassword(plaintext);
    
    // This would typically use bcrypt or similar
    const hashed = Password.hashPassword(plaintext);
    return new Password(hashed);
  }

  static createFromHash(hashedPassword: string): Password {
    if (!hashedPassword || hashedPassword.length === 0) {
      throw new ValidationError('password', hashedPassword, 'Password hash is required');
    }
    
    return new Password(hashedPassword);
  }

  private static validatePassword(password: string): void {
    if (!password || password.length === 0) {
      throw new ValidationError('password', password, 'Password is required');
    }

    if (password.length < 8) {
      throw new ValidationError('password', password, 'Password must be at least 8 characters');
    }

    if (password.length > 128) {
      throw new ValidationError('password', password, 'Password is too long');
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        'password',
        password,
        'Password must contain uppercase, lowercase, numbers, and special characters'
      );
    }

    // Check for common weak passwords
    const commonPasswords = ['password123', '12345678', 'qwerty123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      throw new ValidationError('password', password, 'Password is too common');
    }
  }

  private static hashPassword(plaintext: string): string {
    // In a real implementation, use bcrypt
    // return bcrypt.hashSync(plaintext, 12);
    return `hashed_${plaintext}`;
  }

  async verify(plaintext: string): Promise<boolean> {
    // In a real implementation, use bcrypt
    // return bcrypt.compare(plaintext, this.value);
    return this.value === `hashed_${plaintext}`;
  }

  get hash(): string {
    return this.value;
  }
}