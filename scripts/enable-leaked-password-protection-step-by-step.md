# 🛡️ Guia Passo-a-Passo: Habilitar Proteção contra Senhas Comprometidas

## ⚠️ Status Atual
**WARN**: `auth_leaked_password_protection` - Leaked Password Protection Disabled

## 🎯 Objetivo
Habilitar verificação automática de senhas contra a base de dados HaveIBeenPwned.org para prevenir uso de senhas comprometidas.

## 📋 Pré-requisitos
- Acesso à conta Supabase como proprietário/admin do projeto
- Projeto: `sistema-exames` (ID: zzsfjjcsrllngszylnwi)

---

## 🚀 Passo-a-Passo Detalhado

### **Passo 1: Acessar o Dashboard Supabase**

1. **Abra o navegador** e vá para: https://supabase.com/dashboard
2. **Faça login** na sua conta Supabase
   - Use GitHub, SSO ou email/senha conforme configurado
3. **Aguarde o carregamento** do dashboard

### **Passo 2: Selecionar o Projeto**

1. **Localize o projeto** `sistema-exames` na lista de projetos
2. **Clique no projeto** para acessá-lo
3. **Confirme** que você está no projeto correto verificando:
   - URL contém: `zzsfjjcsrllngszylnwi`
   - Nome do projeto: "sistema-exames"

### **Passo 3: Navegar para Authentication**

1. **No menu lateral esquerdo**, localize e clique em **"Authentication"**
2. **Aguarde** o carregamento da seção de autenticação
3. **Verifique** que você está na seção correta (ícone de usuário/chave)

### **Passo 4: Acessar Settings de Auth**

1. **Dentro de Authentication**, procure pela aba **"Settings"**
2. **Clique em Settings** (pode estar no topo ou lateral)
3. **Aguarde** o carregamento das configurações

### **Passo 5: Localizar Password Security**

1. **Role a página** procurando por uma seção chamada:
   - **"Password Security"** ou
   - **"Security"** ou  
   - **"Password Settings"**

2. **Procure especificamente** por:
   - "Leaked Password Protection"
   - "HaveIBeenPwned"
   - "Compromised Password Detection"

### **Passo 6: Habilitar a Proteção**

1. **Encontre o toggle/checkbox** para "Leaked Password Protection"
2. **Ative a opção** (toggle ON ou marque checkbox)
3. **Confirme** que a configuração mostra:
   - Status: **Enabled** ou **Ativado**
   - Pode aparecer uma descrição sobre HaveIBeenPwned.org

### **Passo 7: Salvar Configurações**

1. **Procure por botão** "Save", "Update" ou "Salvar"
2. **Clique para salvar** as alterações
3. **Aguarde confirmação** (mensagem de sucesso ou similar)

---

## ✅ **Verificação da Configuração**

### **Método 1: Via Dashboard**
- Retorne às configurações de Authentication
- Confirme que "Leaked Password Protection" está **Enabled**

### **Método 2: Via API**
```bash
curl -X GET "https://zzsfjjcsrllngszylnwi.supabase.co/auth/v1/settings" \
  -H "apikey: YOUR_ANON_KEY"
```

### **Método 3: Teste Prático**
1. Tente criar um usuário com senha comprometida conhecida:
   - "password123"
   - "123456789" 
   - "qwerty123"

2. **Resultado esperado**: Sistema deve rejeitar com mensagem sobre senha comprometida

---

## 🔍 **Localizações Alternativas**

Se não encontrar na seção principal, verifique:

### **Opção A: Auth > Policies**
- Authentication → Policies → Password Policies

### **Opção B: Auth > Configuration** 
- Authentication → Configuration → Security Settings

### **Opção C: Project Settings**
- Settings (projeto) → Authentication → Security

### **Opção D: Auth Providers**
- Authentication → Providers → Email → Security Settings

---

## 🆘 **Solução de Problemas**

### **Não encontro a opção**
- Verifique se você tem permissões de admin no projeto
- Tente atualizar a página (F5)
- Limpe o cache do navegador

### **Opção está desabilitada/cinza**
- Confirme que você é o proprietário do projeto
- Verifique se há restrições de plano (improvável)

### **Erro ao salvar**
- Verifique conexão com internet
- Tente novamente após alguns segundos
- Contate suporte Supabase se persistir

---

## 📊 **Após Habilitação**

### **Benefícios Imediatos**
- ✅ Novos usuários não podem usar senhas comprometidas
- ✅ Warning do Supabase Database Linter será resolvido
- ✅ Segurança do sistema elevada

### **Monitoramento**
- Acompanhe tentativas de senhas rejeitadas nos logs
- Monitor taxa de rejeição para ajustar políticas se necessário

---

## 🎯 **Confirmação Final**

Após completar todos os passos:

1. ✅ **Dashboard mostra**: "Leaked Password Protection: Enabled"
2. ✅ **Teste prático**: Senhas comprometidas são rejeitadas  
3. ✅ **API settings**: Retorna configuração ativa
4. ✅ **Warning resolvido**: Database linter não mostra mais o warning

---

## 📞 **Suporte Adicional**

Se precisar de ajuda adicional:
- **Documentação**: https://supabase.com/docs/guides/auth/password-security
- **Suporte**: https://supabase.com/support
- **Community**: https://github.com/supabase/supabase/discussions

**Status esperado após conclusão**: ✅ `auth_leaked_password_protection` RESOLVED