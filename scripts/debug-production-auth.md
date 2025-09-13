# 🔧 Debug: Falha de Autenticação em Produção

## ❌ **Erro Atual**
```
Status: 401 - CredentialsSignin
/api/auth/callback/credentials: Failed to load resource
```

## 🎯 **Diagnóstico Rápido**

### **1. Verificar Variáveis de Ambiente na Vercel**

**Acesse**: https://vercel.com/dashboard → Projeto → Settings → Environment Variables

**Verificar se existem**:
```
✅ NEXTAUTH_URL = https://seu-dominio.vercel.app
✅ NEXTAUTH_SECRET = (seu secret)
✅ DATABASE_URL = (string conexão Supabase)
✅ NEXT_PUBLIC_SUPABASE_URL = https://zzsfjjcsrllngszylnwi.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = (sua chave)
```

### **2. Configurar Variáveis Manualmente**

Se não existem, adicione uma por vez:

**NEXTAUTH_URL**:
```
Name: NEXTAUTH_URL
Value: https://SEU-DOMINIO-REAL.vercel.app
Environment: Production
```

**NEXTAUTH_SECRET**:
```
Name: NEXTAUTH_SECRET  
Value: xNbjA659I6tnrTp6GJQsVK4oCLKDRoob33qos2pCYsg=
Environment: Production
```

**DATABASE_URL**:
```
Name: DATABASE_URL
Value: postgresql://postgres:Wg97Skr2Wg97Skr2--@db.zzsfjjcsrllngszylnwi.supabase.co:5432/postgres
Environment: Production
```

### **3. Verificar Logs de Produção**

```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs específicos do erro
vercel logs | grep -i "authorize\|database\|nextauth"
```

### **4. Teste de Conectividade**

**API de Status**:
- https://seu-dominio.vercel.app/api/auth/providers
- https://seu-dominio.vercel.app/api/auth/session

**Resultado Esperado**:
```json
// /api/auth/providers
{
  "credentials": {
    "id": "credentials",
    "name": "Credentials",
    "type": "credentials"
  }
}
```

## 🚨 **Correções Imediatas**

### **Cenário 1: Variáveis não configuradas**
1. Configure todas as variáveis na Vercel
2. Redeploy: `git commit --allow-empty -m "trigger redeploy" && git push`

### **Cenário 2: NEXTAUTH_URL incorreto**
1. Verifique se é exatamente: `https://seu-dominio.vercel.app`
2. Sem "/" no final
3. Protocolo HTTPS obrigatório

### **Cenário 3: Database inacessível**
1. Teste conexão Supabase: `scripts/verify-leaked-password-protection.ts`
2. Verifique se IP Vercel está permitido no Supabase

## 🔧 **Script de Verificação Automática**

Execute localmente para comparar:

```bash
# Configuração local
npm run dev
# Teste: http://localhost:3000/login

# Configuração produção
node scripts/test-production-auth.js
```

## 🎯 **Próximos Passos**

1. **Verificar variáveis** → Configurar se ausentes
2. **Testar logs** → `vercel logs`
3. **Redeploy** → `git push` (após configurar variáveis)
4. **Testar novamente** → Login em produção

---

**⚡ Ação mais provável**: Variáveis de ambiente não estão configuradas na Vercel!