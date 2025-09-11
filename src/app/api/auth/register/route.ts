import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';
import { rateLimit } from '@/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting - 5 registros por hora
    const rateLimitResponse = rateLimit(request, 5, 60 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Obter dados do corpo da requisição
    const { name, email, password } = await request.json();

    // Validar dados
    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos',
          message: 'Nome, email e senha são obrigatórios',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outra conta',
        }),
        {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar o usuário
    const user = await createUser({
      name,
      email,
      password,
    });

    // Remover a senha do objeto de resposta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Usuário registrado com sucesso',
        user: userWithoutPassword,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao registrar usuário',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
