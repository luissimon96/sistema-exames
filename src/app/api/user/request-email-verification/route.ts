import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { generateVerificationCode } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para solicitar verificação de email',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o email já está verificado
    if (user.emailVerified) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Email já verificado',
          message: 'Seu email já está verificado',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar código de verificação (6 dígitos)
    const verificationCode = generateVerificationCode();

    // Salvar código de verificação no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: verificationCode,
        resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      },
    });

    // Enviar email com código de verificação
    await sendEmail({
      to: user.email,
      subject: 'Verificação de Email - Sistema de Exames',
      text: `Seu código de verificação é: ${verificationCode}. Este código expira em 30 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verificação de Email</h2>
          <p>Olá ${user.name || 'usuário'},</p>
          <p>Seu código de verificação é:</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>Este código expira em 30 minutos.</p>
          <p>Se você não solicitou esta verificação, por favor ignore este email.</p>
          <p>Atenciosamente,<br>Equipe do Sistema de Exames</p>
        </div>
      `,
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'request_email_verification',
        details: 'Solicitação de verificação de email',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Código de verificação enviado com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao solicitar verificação de email:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao solicitar verificação de email',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
