import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Debug endpoint para verificar se usuário existe e pode fazer login
 * GET /api/debug/check-user?email=admin@example.com
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' }, 
        { status: 400 }
      );
    }

    console.log('🔍 Checking user:', email);

    // Verificar se usuário existe
    const user = await getUserByEmail(email);
    
    console.log('User found:', !!user);
    
    if (!user) {
      return NextResponse.json({
        exists: false,
        email,
        message: 'User not found in database'
      });
    }

    // Verificar detalhes do usuário (sem expor a senha)
    const userDetails = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: !!user.emailVerified,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordStartsWith: user.password?.substring(0, 7) || 'N/A', // Apenas o início do hash para debug
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    console.log('User details:', userDetails);

    return NextResponse.json({
      exists: true,
      user: userDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ User check error:', error);
    return NextResponse.json(
      { 
        error: 'User check failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST endpoint para testar login
 * POST /api/debug/check-user
 * Body: { email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' }, 
        { status: 400 }
      );
    }

    console.log('🔐 Testing login for:', email);

    // Buscar usuário
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email
      });
    }

    // Testar senha
    const isPasswordValid = await verifyPassword(password, user.password || '');
    
    console.log('Password valid:', isPasswordValid);

    return NextResponse.json({
      success: isPasswordValid,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password
      },
      passwordTest: {
        provided: !!password,
        stored: !!user.password,
        valid: isPasswordValid
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Login test error:', error);
    return NextResponse.json(
      { 
        error: 'Login test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}