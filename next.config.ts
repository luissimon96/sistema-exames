/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    // Adicionar configuração para otimizar preload
    optimizeCss: true,
    // Evitar preload de recursos não utilizados
    adjustFontFallbacks: true,
    scrollRestoration: true
  },
  serverExternalPackages: ['pdf-parse'],
  webpack: (config, { isServer }) => {
    // Adicionar polyfill para crypto no lado do servidor
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('crypto');
    }
    return config;
  },
  optimizeFonts: false,
  assetPrefix: '/',
  // Configurações para corrigir os avisos de preload
  staticPageGenerationTimeout: 90,
  compiler: {
    removeConsole: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  }
}

export default nextConfig
