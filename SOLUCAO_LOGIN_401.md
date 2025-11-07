# 🚨 Solução: Erro 401 no Login (CredentialsSignin)

## ❌ **Problema Identificado**
```
POST https://sistema-exames.vercel.app/api/auth/callback/credentials 401 (Unauthorized)
Erro: CredentialsSignin - Status 401
```

## 🎯 **Causa Principal**
**Variáveis de ambiente não configuradas corretamente na Vercel em produção**

## ⚡ **Solução Imediata**

### **1. Configurar Variáveis na Vercel** 

Acesse: https://vercel.com/dashboard → seu-projeto → Settings → Environment Variables

**Adicione estas variáveis EXATAMENTE**:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://sistema-exames.vercel.app
NEXTAUTH_SECRET=xNbjA659I6tnrTp6GJQsVK4oCLKDRoob33qos2pCYsg=

# Database Connection  
DATABASE_URL=postgresql://postgres:Wg97Skr2Wg97Skr2--@db.zzsfjjcsrllngszylnwi.supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zzsfjjcsrllngszylnwi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6c2ZqamNzcmxsbmdzenlsbndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjEwMTQsImV4cCI6MjA1OTQzNzAxNH0.tulXeuoSDwZei0UkzgggUvFw9-zOhMOH16YSqibqBJc

# Additional Security Keys (opcional mas recomendado)
ENCRYPTION_KEY=sua-chave-de-criptografia-muito-forte-aqui
CSRF_SECRET=sua-chave-csrf-muito-forte-aqui
```

**⚠️ IMPORTANTE**: 
- Environment: **Production**
- NEXTAUTH_URL deve ser exatamente o seu domínio Vercel (sem "/" no final)
- NEXTAUTH_SECRET deve ser uma string forte (use a fornecida acima)

### **2. Forçar Redeploy**

Após configurar as variáveis:

```bash
git commit --allow-empty -m "fix: configure production environment variables"
git push origin master
```

### **3. Verificação Imediata**

Aguarde o deploy (2-3 minutos) e teste:

1. **Acesse**: https://sistema-exames.vercel.app/api/auth/providers
   - **Esperado**: JSON com providers disponíveis
   
2. **Teste login**: https://sistema-exames.vercel.app/login
   - **Email**: luissimon96@gmail.com
   - **Password**: sua-senha

## 🔍 **Diagnóstico Adicional**

### **Ver logs de produção**:
```bash
# Instalar CLI Vercel (se não tem)
npm i -g vercel

# Ver logs em tempo real
vercel logs --follow

# Buscar erros específicos
vercel logs | grep -i "authorize\|database\|nextauth"
```

### **Verificar configuração atual**:
```bash
# Listar variáveis configuradas
vercel env ls

# Ver valores (cuidado - mostra valores reais)
vercel env pull .env.production
```

## 🎯 **Por que está acontecendo**

1. **NEXTAUTH_URL incorreto/ausente** → NextAuth não consegue processar callbacks
2. **NEXTAUTH_SECRET ausente** → JWT tokens inválidos
3. **DATABASE_URL incorreto** → Prisma não consegue conectar ao Supabase
4. **Diferença Local vs Produção** → .env.local funciona, variáveis Vercel não

## ✅ **Confirmação de Sucesso**

Após aplicar a solução:

1. **Login funciona** sem erro 401
2. **Console logs** mostram autenticação bem-sucedida
3. **Redirecionamento** para dashboard após login
4. **Session ativa** no navegador

## 🚨 **Se ainda não funcionar**

1. **Verificar ortografia** das variáveis (case-sensitive)
2. **Confirmar domínio** exato no NEXTAUTH_URL
3. **Testar conexão** Supabase isoladamente
4. **Checar logs Vercel** para erros específicos

---

**Status**: 🔧 **AGUARDANDO CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE**