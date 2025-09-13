#!/bin/bash

# 🚀 Script para Configurar Variáveis de Ambiente na Vercel
# Execute: chmod +x scripts/configure-vercel-env.sh && ./scripts/configure-vercel-env.sh

echo "🔧 Configurando variáveis de ambiente para produção na Vercel..."
echo ""

# Verificar se vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

echo "📋 IMPORTANTE: Antes de executar, atualize os valores abaixo:"
echo "   1. NEXTAUTH_URL: Seu domínio real (ex: https://meuapp.vercel.app)"
echo "   2. EMAIL_SERVER: Configuração SMTP real"
echo "   3. STRIPE_*: Chaves de produção do Stripe"
echo ""

read -p "✅ Já atualizou os valores? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "👆 Atualize os valores em .env.production primeiro!"
    exit 1
fi

echo "🌐 Configurando variáveis na Vercel..."

# NextAuth
echo "🔐 NextAuth..."
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production

# Database
echo "🗄️ Database..."
vercel env add DATABASE_URL production

# Supabase
echo "⚡ Supabase..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Security
echo "🛡️ Security..."
vercel env add ENCRYPTION_KEY production
vercel env add CSRF_SECRET production

# Email
echo "📧 Email..."
vercel env add EMAIL_SERVER production
vercel env add EMAIL_FROM production

# Stripe
echo "💳 Stripe..."
vercel env add STRIPE_PUBLIC_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_PRO_PRICE_ID production
vercel env add STRIPE_FULL_PRICE_ID production

echo ""
echo "✅ Variáveis configuradas! Execute:"
echo "   vercel --prod"
echo ""
echo "🔍 Para verificar:"
echo "   vercel env ls"