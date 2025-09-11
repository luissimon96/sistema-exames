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
          message: 'Você precisa estar autenticado para atualizar suas redes sociais',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter dados do corpo da requisição
    const { 
      facebookUrl, 
      twitterUrl, 
      linkedinUrl, 
      instagramUrl, 
      githubUrl 
    } = await request.json();

    // Validar URLs
    const validateUrl = (url: string) => {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (
      !validateUrl(facebookUrl) || 
      !validateUrl(twitterUrl) || 
      !validateUrl(linkedinUrl) || 
      !validateUrl(instagramUrl) || 
      !validateUrl(githubUrl)
    ) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'URLs inválidas',
          message: 'Uma ou mais URLs são inválidas',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Atualizar redes sociais do usuário
    const updatedUser = await prisma.user.update({
      where: { email: token.email },
      data: {
        facebookUrl,
        twitterUrl,
        linkedinUrl,
        instagramUrl,
        githubUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        facebookUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        instagramUrl: true,
        githubUrl: true,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Redes sociais atualizadas com sucesso',
        socialLinks: {
          facebookUrl: updatedUser.facebookUrl,
          twitterUrl: updatedUser.twitterUrl,
          linkedinUrl: updatedUser.linkedinUrl,
          instagramUrl: updatedUser.instagramUrl,
          githubUrl: updatedUser.githubUrl,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao atualizar redes sociais:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao atualizar redes sociais',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
