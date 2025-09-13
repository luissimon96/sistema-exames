import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateCsrfToken } from './utils/csrf'

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

// Rotas que requerem papel de administrador
const adminRoutes = [
  '/api/exams/full-text',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/uploads')
  )

  // Verificar se a rota requer papel de administrador
  const isAdminRoute = adminRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Verificar token CSRF para requisições de modificação (POST, PUT, DELETE, PATCH)
  // Verificação obrigatória em todos os ambientes para segurança
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !pathname.startsWith('/api/auth')) {
    // Obter o token CSRF do cabeçalho ou do corpo da requisição
    const csrfToken = request.headers.get('X-CSRF-Token') ||
                      request.cookies.get('csrf_token')?.value

    // Se não houver token ou o token for inválido, retornar erro 403
    if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'CSRF token inválido',
          message: 'Token CSRF ausente ou inválido'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }

  // Registrar tentativas de CSRF sem dados sensíveis
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && process.env.NODE_ENV === 'development') {
    const csrfToken = request.headers.get('X-CSRF-Token') ||
                      request.cookies.get('csrf_token')?.value
    console.log(`[DEBUG] CSRF validation for ${method} ${pathname}:`, csrfToken ? 'Token present' : 'Token missing');
  }

  // Se for uma rota pública, continuar normalmente
  if (isPublicRoute || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Obter o token da sessão
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-que-deve-ser-substituido",
  })

  // Log estruturado sem dados sensíveis (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Route: ${pathname}, Auth:`, token ? 'authenticated' : 'unauthenticated')
    if (token) {
      console.log(`[Middleware] User role: ${token.role || 'user'}`)
    }
  }

  // Se não houver token e não for uma rota pública, redirecionar para login
  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Se for uma rota de administrador e o usuário não for admin, retornar 403
  if (isAdminRoute && token?.role !== 'admin') {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  return NextResponse.next()
}

// Configurar para quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos exceto:
     * 1. /api/auth (rotas de autenticação do NextAuth.js)
     * 2. /api/webhooks (webhooks externos)
     * 3. /_next (arquivos estáticos do Next.js)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (arquivos comuns)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
