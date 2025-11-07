/**
 * Database Verification API Endpoint
 * 
 * This endpoint can be called in production to verify database connectivity
 * Access: https://your-domain.vercel.app/api/verify-database
 * 
 * Security: Only accessible in development or with specific header
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

interface DatabaseStatus {
  timestamp: string;
  environment: string;
  database: {
    connected: boolean;
    url: string;
    error?: string;
  };
  tables: {
    accessible: boolean;
    errors: string[];
  };
  statistics: {
    users: number;
    sessions: number;
    accounts: number;
    activities: number;
  } | null;
  targetUser: {
    email: string;
    exists: boolean;
    details?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DatabaseStatus | { error: string }>
) {
  // Security check - only allow in development or with specific header
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasDebugHeader = req.headers['x-debug-database'] === 'true';
  
  if (!isDevelopment && !hasDebugHeader) {
    return res.status(403).json({ 
      error: 'Access denied. This endpoint is only available in development or with debug header.' 
    });
  }

  const prisma = new PrismaClient();
  const targetEmail = 'luissimon96@gmail.com';
  
  const status: DatabaseStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    database: {
      connected: false,
      url: maskDatabaseUrl(process.env.DATABASE_URL || '')
    },
    tables: {
      accessible: false,
      errors: []
    },
    statistics: null,
    targetUser: {
      email: targetEmail,
      exists: false
    }
  };

  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    status.database.connected = true;
    console.log('✅ Database connection successful');

    // Test table accessibility
    try {
      const tableTests = await Promise.allSettled([
        prisma.user.findFirst(),
        prisma.session.findFirst(),
        prisma.account.findFirst(),
        prisma.activity.findFirst(),
        prisma.verificationToken.findFirst()
      ]);

      const tables = ['User', 'Session', 'Account', 'Activity', 'VerificationToken'];
      
      tableTests.forEach((result, index) => {
        if (result.status === 'rejected') {
          status.tables.errors.push(`${tables[index]}: ${result.reason.message}`);
        }
      });

      status.tables.accessible = status.tables.errors.length === 0;
      console.log(`✅ Tables accessible: ${status.tables.accessible}`);

    } catch (error) {
      status.tables.errors.push(`Table check failed: ${error}`);
      console.error('❌ Table accessibility check failed:', error);
    }

    // Get database statistics
    if (status.tables.accessible) {
      try {
        const [userCount, sessionCount, accountCount, activityCount] = await Promise.all([
          prisma.user.count(),
          prisma.session.count(),
          prisma.account.count(),
          prisma.activity.count()
        ]);

        status.statistics = {
          users: userCount,
          sessions: sessionCount,
          accounts: accountCount,
          activities: activityCount
        };
        
        console.log(`📊 Statistics - Users: ${userCount}, Sessions: ${sessionCount}`);

      } catch (error) {
        console.error('❌ Failed to get statistics:', error);
      }
    }

    // Check for target user
    try {
      const user = await prisma.user.findUnique({
        where: { email: targetEmail },
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
        status.targetUser.exists = true;
        status.targetUser.details = user;
        console.log(`✅ Target user found: ${targetEmail}`);
      } else {
        console.log(`❌ Target user not found: ${targetEmail}`);
      }

    } catch (error) {
      console.error('❌ Error checking target user:', error);
    }

  } catch (error) {
    status.database.connected = false;
    status.database.error = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection failed:', error);

  } finally {
    await prisma.$disconnect();
  }

  // Add creation suggestion if user doesn't exist
  if (status.database.connected && !status.targetUser.exists) {
    console.log('💡 Suggestion: Create target user with POST request to this endpoint');
  }

  // Handle POST request to create user
  if (req.method === 'POST' && status.database.connected && !status.targetUser.exists) {
    try {
      const newPrisma = new PrismaClient();
      const newUser = await newPrisma.user.create({
        data: {
          email: targetEmail,
          name: 'Luis Simon',
          role: 'user',
          isActive: true
        }
      });

      status.targetUser.exists = true;
      status.targetUser.details = newUser;
      
      await newPrisma.$disconnect();
      console.log(`✅ Created target user: ${targetEmail}`);

    } catch (error) {
      console.error('❌ Failed to create user:', error);
    }
  }

  return res.status(200).json(status);
}

function maskDatabaseUrl(url: string): string {
  if (!url) return 'Not configured';
  
  // Mask password for security
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}