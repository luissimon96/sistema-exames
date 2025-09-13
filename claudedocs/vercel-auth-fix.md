# Fix para Autenticação na Vercel - Sistema de Exames

## 🚨 Problema Identificado

O erro `CredentialsSignin` na produção (Vercel) ocorre porque **os usuários de teste não existem no banco de dados de produção**. O script de seed não é executado automaticamente durante o deploy.

## 🔧 Soluções Implementadas

### 1. API Endpoint para Seed Manual
**Endpoint:** `POST /api/admin/seed-production`

```bash
# Executar via curl
curl -X POST https://seu-dominio.vercel.app/api/admin/seed-production \
  -H "Content-Type: application/json" \
  -d '{"adminSecret": "sistema-exames-seed-2024"}'
```

### 2. Script Manual de Seed
**Arquivo:** `scripts/seed-production-manual.ts`

```bash
# Executar localmente (com DATABASE_URL da produção)
DATABASE_URL="postgresql://..." npx tsx scripts/seed-production-manual.ts
```

### 3. Endpoint de Debug
**Verificar usuário:** `GET /api/debug/check-user?email=admin@example.com`
**Testar login:** `POST /api/debug/check-user` com `{email, password}`

## ⚡ Passos para Corrigir na Vercel

### Opção A: Via API (Recomendado)
1. Fazer deploy das mudanças
2. Acessar: `https://seu-dominio.vercel.app/api/admin/seed-production`
3. POST com `{"adminSecret": "sistema-exames-seed-2024"}`
4. Verificar: `GET /api/debug/check-user?email=admin@example.com`

### Opção B: Via Script Manual
1. Copiar DATABASE_URL da Vercel
2. Executar localmente:
   ```bash
   DATABASE_URL="sua_url_completa" npx tsx scripts/seed-production-manual.ts
   ```

### Opção C: Build Command na Vercel
Alterar Build Command no dashboard da Vercel:
```bash
prisma generate && prisma migrate deploy && npm run db:seed && npm run build
```

## 🧪 Verificações de Debug

### 1. Verificar se usuário existe
```bash
curl "https://seu-dominio.vercel.app/api/debug/check-user?email=admin@example.com"
```

### 2. Testar login programaticamente
```bash
curl -X POST https://seu-dominio.vercel.app/api/debug/check-user \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

## 📋 Credenciais de Teste
- **Admin:** admin@example.com / admin123
- **Usuário:** user@example.com / user123

## 🔍 Melhorias de Logging

Adicionados logs detalhados no NextAuth para capturar:
- Ambiente de execução
- Status da conexão com banco
- Detalhes dos erros de autenticação
- Verificação de variáveis de ambiente

## 🎯 Próximos Passos

1. **Deploy imediato** das mudanças
2. **Executar seed** via API endpoint
3. **Testar login** com credenciais de teste
4. **Monitorar logs** da Vercel para confirmação
5. **Implementar seed automático** no build (futuro)

---

**Status:** ✅ Soluções implementadas, aguardando deploy e teste