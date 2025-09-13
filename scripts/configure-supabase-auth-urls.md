# 🔧 Configurar URLs de Autenticação no Supabase

## 🎯 Objetivo
Configurar corretamente as URLs de autenticação no Supabase para produção na Vercel.

## 📋 Configurações Necessárias

### **1. Site URL (URL Principal)**
```
https://sistema-exames.vercel.app
```
*⚠️ Substitua pelo seu domínio real da Vercel*

### **2. Redirect URLs (URLs de Redirecionamento)**
```
https://sistema-exames.vercel.app/api/auth/callback/*
https://sistema-exames.vercel.app/api/auth/callback/credentials
https://sistema-exames.vercel.app/api/auth/callback/email
https://sistema-exames.vercel.app/login
https://sistema-exames.vercel.app/dashboard
```

## 🚀 Passo-a-Passo

### **Passo 1: Acessar Dashboard Supabase**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `sistema-exames`

### **Passo 2: Navegar para Authentication**
1. No menu lateral esquerdo, clique em **"Authentication"**
2. Clique na aba **"Settings"**
3. Procure por **"URL Configuration"** ou **"Site Settings"**

### **Passo 3: Configurar Site URL**
1. Encontre o campo **"Site URL"**
2. Digite: `https://sistema-exames.vercel.app`
3. ⚠️ **IMPORTANTE**: Substitua pelo seu domínio real

### **Passo 4: Configurar Redirect URLs**
1. Encontre **"Redirect URLs"** ou **"Additional Redirect URLs"**
2. Adicione cada URL da lista acima, uma por linha:
   ```
   https://sistema-exames.vercel.app/api/auth/callback/*
   https://sistema-exames.vercel.app/api/auth/callback/credentials
   https://sistema-exames.vercel.app/api/auth/callback/email
   https://sistema-exames.vercel.app/login
   https://sistema-exames.vercel.app/dashboard
   ```

### **Passo 5: Salvar Configurações**
1. Clique em **"Save"** ou **"Update"**
2. Aguarde confirmação de sucesso

## 🔍 Verificação

### **Teste Local → Produção**
1. **Local**: `http://localhost:3000/api/auth/callback/*`
2. **Produção**: `https://SEU-DOMINIO.vercel.app/api/auth/callback/*`

### **Verificar Configuração**
Execute este comando para verificar:
```bash
curl -s "https://zzsfjjcsrllngszylnwi.supabase.co/auth/v1/settings" | jq
```

## ⚠️ Problemas Comuns

### **Erro: redirect_uri não permitido**
- **Causa**: URL não está na lista de redirects permitidos
- **Solução**: Adicionar a URL exata na configuração

### **Erro: NEXTAUTH_URL mismatch**
- **Causa**: NEXTAUTH_URL diferente da Site URL
- **Solução**: Garantir que ambas sejam idênticas

### **Erro: CORS/CSP**
- **Causa**: Domínio não autorizado
- **Solução**: Verificar Site URL e Redirect URLs

## 🎯 Resultado Esperado

Após configuração correta:
- ✅ Login funcionará em produção
- ✅ Redirects funcionarão corretamente
- ✅ Sem erros de CORS ou redirect_uri
- ✅ NextAuth.js integrará perfeitamente com Supabase

## 📞 Suporte

Se tiver problemas:
1. Verifique logs do Vercel: `vercel logs`
2. Consulte documentação: https://supabase.com/docs/guides/auth
3. Teste localmente primeiro: `npm run dev`

---

**🔒 Lembre-se**: Sempre use HTTPS em produção!