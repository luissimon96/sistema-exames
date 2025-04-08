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
  optimizeFonts: false,
  assetPrefix: '/',
  // Configurações para corrigir os avisos de preload
  staticPageGenerationTimeout: 90,
  compiler: {
    removeConsole: false,
  }
}

export default nextConfig
