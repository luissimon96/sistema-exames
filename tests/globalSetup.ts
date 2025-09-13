/**
 * Global Jest Setup
 * Sistema Exames - Test Environment Setup
 */

export default async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret-key';
  
  // Database setup for integration tests
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    console.log('📊 Using test database');
  } else {
    console.log('⚠️  No test database configured - using mock repositories');
  }
  
  // Disable external services during tests
  process.env.DISABLE_STRIPE = 'true';
  process.env.DISABLE_EMAIL = 'true';
  process.env.DISABLE_SUPABASE = 'true';
  
  console.log('✅ Test environment ready');
}