import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Tamanho máximo de arquivo (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para fazer upload de imagens',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o content-type é multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Content-Type inválido',
          message: 'A requisição deve ser multipart/form-data',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter o arquivo da requisição
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Arquivo não encontrado',
          message: 'Nenhum arquivo foi enviado',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Arquivo muito grande',
          message: `O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar tipo de arquivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Tipo de arquivo inválido',
          message: 'Apenas imagens JPEG, PNG e GIF são permitidas',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar diretório para armazenar as imagens
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Gerar nome de arquivo único
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Salvar o arquivo
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // URL relativa para a imagem
    const imageUrl = `/uploads/${fileName}`;

    // Atualizar o perfil do usuário com a nova imagem
    const user = await prisma.user.update({
      where: { email: token.email },
      data: {
        image: imageUrl,
      },
      select: {
        id: true,
        image: true,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Imagem enviada com sucesso',
        image: user.image,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao fazer upload de imagem',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
