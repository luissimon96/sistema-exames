import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetToken, getUserByEmail } from '@/lib/auth';
import { rateLimit } from '@/utils/rate-limit';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting - 3 solicitações por hora
    const rateLimitResponse = rateLimit(request, 3, 60 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Obter email do corpo da requisição
    const { email } = await request.json();

    if (!email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Email não fornecido',
          message: 'Por favor, forneça um email válido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o usuário existe
    const user = await getUserByEmail(email);
    
    // Por segurança, não informamos se o email existe ou não
    // Apenas retornamos sucesso, mesmo se o email não existir
    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar token de redefinição de senha
    const token = await generatePasswordResetToken(email);
    
    if (!token) {
      throw new Error('Erro ao gerar token de redefinição de senha');
    }

    // Configurar transporte de email
    const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as string);

    // URL de redefinição de senha
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Enviar email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Redefinição de Senha - Sistema de Exames',
      text: `Você solicitou a redefinição de senha. Clique no link a seguir para redefinir sua senha: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Redefinição de Senha</h2>
          <p>Você solicitou a redefinição de senha para sua conta no Sistema de Exames.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          <p>Este link é válido por 2 horas.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 12px;">
            Este é um email automático, por favor não responda.
          </p>
        </div>
      `,
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao processar solicitação de redefinição de senha:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar solicitação',
        message: 'Ocorreu um erro ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
