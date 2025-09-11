import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  try {
    // Obter o caminho do arquivo
    const filePath = path.join(process.cwd(), 'uploads', ...pathSegments);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determinar o tipo MIME com base na extensão do arquivo
    const extension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    // Retornar o arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
