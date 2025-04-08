import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para atualizar seu tema',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter dados do corpo da requisição
    const { theme, accentColor } = await request.json();

    // Validar tema
    const validThemes = ['light', 'dark', 'system', 'custom'];
    if (theme && !validThemes.includes(theme)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Tema inválido',
          message: 'O tema especificado não é válido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar cor de destaque (formato hexadecimal)
    if (accentColor && !/^#([0-9A-F]{3}){1,2}$/i.test(accentColor)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Cor inválida',
          message: 'A cor de destaque deve estar no formato hexadecimal (#RRGGBB)',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (theme) {
      updateData.theme = theme;
    }

    if (accentColor) {
      updateData.accentColor = accentColor;
    }

    // Atualizar tema do usuário
    const updatedUser = await prisma.user.update({
      where: { email: token.email },
      data: updateData,
      select: {
        id: true,
        theme: true,
        accentColor: true,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Tema atualizado com sucesso',
        theme: updatedUser.theme,
        accentColor: updatedUser.accentColor,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar tema:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao atualizar tema',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
