#!/usr/bin/env ts-node

/**
 * Database Connection Test Script
 * Tests connectivity and verifies database setup
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

interface DatabaseStats {
  userCount: number;
  sessionCount: number;
  accountCount: number;
  activityCount: number;
}

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
}

class DatabaseTester {
  private prisma: PrismaClient;
  private supabase: any;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Initialize Supabase client if variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async testPrismaConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Prisma connection...');
      console.log(`📍 Database URL: ${this.maskDatabaseUrl(process.env.DATABASE_URL)}`);
      
      // Test basic connection
      await this.prisma.$connect();
      console.log('✅ Prisma connection successful');

      // Test raw query
      const result = await this.prisma.$queryRaw`SELECT NOW() as current_time`;
      console.log('✅ Raw query test successful:', result);

      return true;
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      return false;
    }
  }

  async testSupabaseConnection(): Promise<boolean> {
    if (!this.supabase) {
      console.log('⚠️ Supabase client not initialized (missing environment variables)');
      return false;
    }

    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test connection with a simple query
      const { data, error } = await this.supabase
        .from('User')
        .select('count(*)')
        .limit(1);

      if (error) throw error;

      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
  }

  async getDatabaseStats(): Promise<DatabaseStats | null> {
    try {
      console.log('📊 Gathering database statistics...');
      
      const [userCount, sessionCount, accountCount, activityCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.session.count(),
        this.prisma.account.count(),
        this.prisma.activity.count()
      ]);

      const stats: DatabaseStats = {
        userCount,
        sessionCount,
        accountCount,
        activityCount
      };

      console.log('📈 Database Statistics:');
      console.log(`   👥 Users: ${stats.userCount}`);
      console.log(`   🎫 Sessions: ${stats.sessionCount}`);
      console.log(`   🔗 Accounts: ${stats.accountCount}`);
      console.log(`   📋 Activities: ${stats.activityCount}`);

      return stats;
    } catch (error) {
      console.error('❌ Failed to gather database statistics:', error);
      return null;
    }
  }

  async findUser(email: string): Promise<UserInfo | null> {
    try {
      console.log(`🔍 Searching for user: ${email}`);
      
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        }
      });

      if (user) {
        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Last Login: ${user.lastLogin?.toISOString() || 'Never'}`);
        return user;
      } else {
        console.log('❌ User not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error searching for user:', error);
      return null;
    }
  }

  async createUser(email: string, name?: string): Promise<UserInfo | null> {
    try {
      console.log(`👤 Creating user: ${email}`);
      
      const user = await this.prisma.user.create({
        data: {
          email,
          name: name || null,
          role: 'user',
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        }
      });

      console.log('✅ User created successfully:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      return user;
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      return null;
    }
  }

  async listAllUsers(): Promise<UserInfo[]> {
    try {
      console.log('👥 Listing all users...');
      
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`📋 Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`);
      });

      return users;
    } catch (error) {
      console.error('❌ Failed to list users:', error);
      return [];
    }
  }

  async checkDatabaseTables(): Promise<boolean> {
    try {
      console.log('🔍 Checking database tables...');
      
      // Check if main tables exist by trying to count records
      const tableChecks = await Promise.allSettled([
        this.prisma.user.findFirst(),
        this.prisma.session.findFirst(),
        this.prisma.account.findFirst(),
        this.prisma.activity.findFirst(),
        this.prisma.verificationToken.findFirst()
      ]);

      const tables = ['User', 'Session', 'Account', 'Activity', 'VerificationToken'];
      
      tableChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`   ✅ ${tables[index]} table accessible`);
        } else {
          console.log(`   ❌ ${tables[index]} table error:`, result.reason.message);
        }
      });

      return tableChecks.every(result => result.status === 'fulfilled');
    } catch (error) {
      console.error('❌ Error checking database tables:', error);
      return false;
    }
  }

  private maskDatabaseUrl(url: string | undefined): string {
    if (!url) return 'Not set';
    
    // Mask password in database URL for security
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting Database Connectivity Test');
  console.log('=====================================');
  
  const tester = new DatabaseTester();
  
  try {
    // Environment check
    console.log('🔧 Environment Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   DATABASE_URL: ${tester['maskDatabaseUrl'](process.env.DATABASE_URL)}`);
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
    console.log('');

    // Test connections
    const prismaOk = await tester.testPrismaConnection();
    console.log('');
    
    const supabaseOk = await tester.testSupabaseConnection();
    console.log('');

    if (!prismaOk) {
      console.log('❌ Cannot proceed without Prisma connection');
      return;
    }

    // Check tables
    const tablesOk = await tester.checkDatabaseTables();
    console.log('');

    // Get database statistics
    const stats = await tester.getDatabaseStats();
    console.log('');

    // List all users
    const users = await tester.listAllUsers();
    console.log('');

    // Check for specific user
    const targetEmail = 'luissimon96@gmail.com';
    const targetUser = await tester.findUser(targetEmail);
    console.log('');

    // Create user if not found
    if (!targetUser && process.argv.includes('--create-user')) {
      console.log(`🎯 Creating target user: ${targetEmail}`);
      await tester.createUser(targetEmail, 'Luis Simon');
      console.log('');
    }

    // Summary
    console.log('📋 Test Summary:');
    console.log('================');
    console.log(`   Prisma Connection: ${prismaOk ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Supabase Connection: ${supabaseOk ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Database Tables: ${tablesOk ? '✅ All accessible' : '❌ Some issues'}`);
    console.log(`   Total Users: ${stats?.userCount || 'Unknown'}`);
    console.log(`   Target User (${targetEmail}): ${targetUser ? '✅ Exists' : '❌ Not found'}`);
    
    if (prismaOk && tablesOk) {
      console.log('');
      console.log('🎉 Database is ready for production!');
    } else {
      console.log('');
      console.log('⚠️ Database issues detected. Check the errors above.');
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await tester.disconnect();
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}