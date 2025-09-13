import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * API Route para criar usuários de teste em produção
 * Endpoint: POST /api/admin/seed-production
 * Autorização: Bearer token com ADMIN_SECRET ou senha específica
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminSecret } = body;

    // Verificar autorização - usando senha específica para segurança
    const expectedSecret = process.env.ADMIN_SECRET || 'sistema-exames-seed-2024';
    
    if (adminSecret !== expectedSecret) {
      console.log('❌ Unauthorized seed attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' }, 
        { status: 401 }
      );
    }

    console.log('🔧 Starting production seed...');

    // Verificar se usuários já existem
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    const userExists = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
    });

    let created = [];

    // Criar usuário admin se não existir
    if (!adminExists) {
      const adminPassword = await hashPassword('admin123');
      const admin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
          emailVerified: new Date(),
          isActive: true,
        },
      });
      created.push({ type: 'admin', email: admin.email, id: admin.id });
      console.log('✅ Admin user created:', admin.id);
    } else {
      console.log('ℹ️ Admin user already exists:', adminExists.id);
    }

    // Criar usuário regular se não existir
    if (!userExists) {
      const userPassword = await hashPassword('user123');
      const user = await prisma.user.create({
        data: {
          name: 'Usuário',
          email: 'user@example.com',
          password: userPassword,
          role: 'user',
          emailVerified: new Date(),
          isActive: true,
        },
      });
      created.push({ type: 'user', email: user.email, id: user.id });
      console.log('✅ Regular user created:', user.id);
    } else {
      console.log('ℹ️ Regular user already exists:', userExists.id);
    }

    // Verificar se os usuários foram criados/existem
    const finalAdminCheck = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, role: true, password: true }
    });

    const finalUserCheck = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: { id: true, email: true, role: true, password: true }
    });

    console.log('🔍 Final verification:');
    console.log('Admin exists:', !!finalAdminCheck, finalAdminCheck?.id);
    console.log('User exists:', !!finalUserCheck, finalUserCheck?.id);

    return NextResponse.json({
      success: true,
      message: 'Production seed completed successfully',
      created,
      existing: {
        admin: !!adminExists,
        user: !!userExists
      },
      verification: {
        adminExists: !!finalAdminCheck,
        userExists: !!finalUserCheck,
        adminHasPassword: !!finalAdminCheck?.password,
        userHasPassword: !!finalUserCheck?.password
      }
    });

  } catch (error) {
    console.error('❌ Production seed error:', error);
    return NextResponse.json(
      { 
        error: 'Production seed failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint para verificar status dos usuários
export async function GET() {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    const userExists = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    return NextResponse.json({
      status: 'ok',
      users: {
        admin: adminExists || null,
        user: userExists || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' }, 
      { status: 500 }
    );
  }
}