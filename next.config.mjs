/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para HTTPS em desenvolvimento
  // Em produção, isso seria gerenciado pelo servidor/plataforma de hospedagem
  // Removido devServer pois não é suportado no Next.js 15+

  // Configurar pasta de uploads como estática
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },

  // Configurações de segurança para cabeçalhos HTTP
  async headers() {
    return [
      {
        // Aplicar a todas as rotas
        source: '/:path*',
        headers: [
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Habilitar proteções XSS no navegador
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Política de segurança de conteúdo
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
          },
          // Política de referenciador
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Política de recursos de permissão
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Strict-Transport-Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
