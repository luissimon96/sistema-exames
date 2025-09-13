/**
 * Global Jest Teardown
 * Sistema Exames - Test Environment Cleanup
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Cleanup test database if needed
  if (process.env.TEST_DATABASE_URL) {
    // Here you would clean up test database
    console.log('📊 Test database cleanup completed');
  }
  
  // Reset environment variables
  delete process.env.DISABLE_STRIPE;
  delete process.env.DISABLE_EMAIL;
  delete process.env.DISABLE_SUPABASE;
  
  console.log('✅ Test environment cleanup completed');
}