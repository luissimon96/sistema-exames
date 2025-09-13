#!/bin/bash

# 🔍 Script para Verificar Configuração da Vercel
# Execute: chmod +x scripts/verify-vercel-config.sh && ./scripts/verify-vercel-config.sh

echo "🔍 Verificando Configuração da Vercel"
echo "====================================="
echo ""

# Verificar se vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado!"
    echo "📦 Instale com: npm install -g vercel"
    exit 1
fi

echo "📋 1. Listando variáveis de ambiente..."
echo ""

# Listar variáveis de ambiente
echo "🔧 Variáveis configuradas na Vercel:"
vercel env ls

echo ""
echo "📊 2. Verificando variáveis críticas..."

# Função para verificar se uma variável existe
check_env_var() {
    local var_name=$1
    local result=$(vercel env ls | grep "^$var_name" | wc -l)
    
    if [ $result -gt 0 ]; then
        echo "   ✅ $var_name: Configurada"
    else
        echo "   ❌ $var_name: AUSENTE"
        return 1
    fi
}

# Verificar variáveis críticas
missing_vars=0

check_env_var "NEXTAUTH_URL" || ((missing_vars++))
check_env_var "NEXTAUTH_SECRET" || ((missing_vars++))
check_env_var "DATABASE_URL" || ((missing_vars++))
check_env_var "NEXT_PUBLIC_SUPABASE_URL" || ((missing_vars++))
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || ((missing_vars++))

echo ""
echo "📈 3. Resumo da verificação:"
echo "   🎯 Variáveis ausentes: $missing_vars"

if [ $missing_vars -eq 0 ]; then
    echo "   ✅ Todas as variáveis críticas estão configuradas!"
    echo ""
    echo "🧪 4. Testando conectividade..."
    
    # Obter URL do projeto
    PROJECT_INFO=$(vercel ls 2>/dev/null | grep "$(basename $(pwd))")
    if [ -n "$PROJECT_INFO" ]; then
        PROJECT_URL=$(echo "$PROJECT_INFO" | awk '{print $2}' | head -1)
        echo "   🌐 URL do projeto: https://$PROJECT_URL"
        
        # Testar endpoints básicos
        echo "   🔍 Testando /api/auth/providers..."
        if curl -s -f "https://$PROJECT_URL/api/auth/providers" > /dev/null; then
            echo "   ✅ NextAuth providers: Acessível"
        else
            echo "   ❌ NextAuth providers: Inacessível"
        fi
        
        echo "   🔍 Testando /api/auth/session..."
        if curl -s -f "https://$PROJECT_URL/api/auth/session" > /dev/null; then
            echo "   ✅ NextAuth session: Acessível"
        else
            echo "   ❌ NextAuth session: Inacessível"
        fi
    fi
    
else
    echo "   ⚠️  Variáveis de ambiente ausentes detectadas!"
    echo ""
    echo "🔧 Para corrigir:"
    echo "   1. Configure as variáveis ausentes na Vercel Dashboard"
    echo "   2. Ou use: ./scripts/configure-vercel-env.sh"
    echo "   3. Depois: git push (para trigger redeploy)"
fi

echo ""
echo "📞 5. Comandos úteis:"
echo "   vercel logs --follow     # Ver logs em tempo real"
echo "   vercel env add VAR_NAME  # Adicionar variável"
echo "   vercel --prod            # Redeploy manual"

echo ""
if [ $missing_vars -eq 0 ]; then
    echo "🎉 Configuração parece estar correta!"
    echo "   Se ainda há problemas, verifique os logs: vercel logs"
else
    echo "🚨 Configure as variáveis ausentes primeiro!"
fi