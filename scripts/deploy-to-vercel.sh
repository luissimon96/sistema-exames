#!/bin/bash

# 🚀 Script Completo de Deploy para Vercel
# Execute: chmod +x scripts/deploy-to-vercel.sh && ./scripts/deploy-to-vercel.sh

set -e  # Parar em caso de erro

echo "🚀 Deploy do Sistema de Exames para Vercel"
echo "==========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto!"
    exit 1
fi

# 1. Verificar dependências
echo "📦 1. Verificando dependências..."
if ! command -v vercel &> /dev/null; then
    echo "🔧 Instalando Vercel CLI..."
    npm install -g vercel
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado! Instale o Git primeiro."
    exit 1
fi

# 2. Verificar status do Git
echo ""
echo "📝 2. Verificando status do Git..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Há mudanças não commitadas. Fazendo commit..."
    git add .
    git commit -m "feat: configure production environment for Vercel deployment

- Add production environment variables (.env.production)
- Configure NextAuth redirect callback for production
- Add Vercel deployment and configuration scripts
- Update Supabase Auth URLs documentation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo "✅ Commit realizado"
else
    echo "✅ Git está limpo"
fi

# 3. Build de teste local
echo ""
echo "🔨 3. Testando build local..."
npm run build
echo "✅ Build local bem-sucedido"

# 4. Configurar projeto Vercel (se necessário)
echo ""
echo "⚙️ 4. Configurando projeto Vercel..."

if [ ! -f ".vercel/project.json" ]; then
    echo "🆕 Primeiro deploy - configurando projeto..."
    vercel --yes
else
    echo "✅ Projeto já configurado"
fi

# 5. Configurar variáveis de ambiente
echo ""
echo "🔧 5. Configurando variáveis de ambiente..."
echo "📋 IMPORTANTE: Você precisa configurar manualmente:"
echo ""
echo "   1. Acesse: https://vercel.com/dashboard"
echo "   2. Selecione seu projeto"
echo "   3. Vá em Settings → Environment Variables"
echo "   4. Configure as seguintes variáveis para PRODUCTION:"
echo ""

# Ler variáveis do .env.production
if [ -f ".env.production" ]; then
    echo "📄 Variáveis encontradas em .env.production:"
    echo "----------------------------------------"
    while IFS= read -r line; do
        if [[ $line =~ ^[A-Z] ]] && [[ $line == *"="* ]]; then
            var_name=$(echo "$line" | cut -d'=' -f1)
            echo "   ✓ $var_name"
        fi
    done < .env.production
    echo ""
else
    echo "⚠️  Arquivo .env.production não encontrado!"
fi

echo "💡 Dica: Use o script configure-vercel-env.sh para automação"
echo ""

# 6. Deploy
echo "🚀 6. Fazendo deploy para produção..."
echo "   Executando: vercel --prod"
echo ""

read -p "🤔 Continuar com o deploy? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    
    echo ""
    echo "🎉 Deploy concluído!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. ✅ Verificar se a aplicação está funcionando"
    echo "   2. 🔧 Configurar URLs no Supabase (veja: scripts/configure-supabase-auth-urls.md)"
    echo "   3. 🧪 Testar autenticação em produção"
    echo "   4. 📊 Monitorar logs: vercel logs"
    echo ""
    
    # Obter URL do projeto
    if command -v vercel &> /dev/null; then
        PROJECT_URL=$(vercel --scope=team ls 2>/dev/null | grep "$(basename $(pwd))" | awk '{print $2}' | head -1)
        if [ -n "$PROJECT_URL" ]; then
            echo "🌐 URL da aplicação: https://$PROJECT_URL"
        fi
    fi
    
else
    echo "❌ Deploy cancelado"
    exit 1
fi

echo ""
echo "🔍 Para verificar o deploy:"
echo "   vercel logs --follow"
echo ""
echo "🛠️ Para configurações adicionais:"
echo "   - Supabase Auth URLs: scripts/configure-supabase-auth-urls.md"
echo "   - Variáveis ambiente: scripts/configure-vercel-env.sh"
echo ""
echo "✨ Deploy finalizado com sucesso!"