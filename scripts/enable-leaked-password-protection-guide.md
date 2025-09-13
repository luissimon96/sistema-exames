# 🛡️ Guia: Habilitar Proteção contra Senhas Comprometidas

## Sobre a Proteção contra Senhas Comprometidas

A proteção contra senhas comprometidas do Supabase Auth verifica automaticamente as senhas dos usuários contra o banco de dados do HaveIBeenPwned.org, impedindo o uso de senhas que foram expostas em vazamentos de dados.

## ⚠️ Problema Identificado

**Status Atual**: `WARN - Leaked Password Protection Disabled`

O sistema Supabase Auth está atualmente configurado sem verificação de senhas comprometidas, permitindo que usuários usem senhas que foram expostas em vazamentos de dados conhecidos.

## 🔧 Como Habilitar

### Opção 1: Via Dashboard Supabase (Recomendado)

1. **Acesse o Dashboard Supabase**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Navegue até Authentication**
   - Selecione seu projeto: `sistema-exames`
   - No menu lateral, clique em **Authentication**

3. **Acesse as Configurações de Auth**
   - Clique na aba **Settings**
   - Procure por **Security** ou **Password Protection**

4. **Habilite a Proteção**
   - Encontre a opção "**Leaked Password Protection**"
   - Marque como **Enabled/Ativado**
   - Salve as alterações

### Opção 2: Via API Supabase Management (Avançado)

Se você tem acesso à API de Management do Supabase, pode habilitar via API:

```bash
# Exemplo de configuração via Management API
curl -X PATCH "https://api.supabase.com/v1/projects/zzsfjjcsrllngszylnwi/config/auth" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "GOTRUE_PASSWORD_LEAKED_PASSWORD_PROTECTION": true
  }'
```

## 🎯 Benefícios da Habilitação

### ✅ **Segurança Aprimorada**
- Previne uso de senhas comprometidas conhecidas
- Reduz risco de ataques de credential stuffing
- Protege contas de usuários proativamente

### ✅ **Experiência do Usuário**
- Feedback imediato durante o cadastro
- Orientação para criação de senhas mais seguras
- Proteção transparente sem impacto na usabilidade

### ✅ **Conformidade**
- Alinhado com boas práticas de segurança
- Atende recomendações de frameworks como OWASP
- Resolve warning do Supabase Database Linter

## 📋 Verificação da Configuração

Após habilitar, você pode verificar se a configuração está ativa:

### Via Dashboard
- Authentication > Settings > Security
- Confirme que "Leaked Password Protection" está **Enabled**

### Via API
```bash
curl -X GET "https://zzsfjjcsrllngszylnwi.supabase.co/auth/v1/settings" \
  -H "apikey: YOUR_ANON_KEY"
```

### Via Teste de Senha
1. Tente criar um usuário com senha conhecidamente comprometida (ex: "password123")
2. O sistema deve rejeitar com mensagem informando que a senha foi comprometida

## 🔄 Impacto nos Usuários Existentes

- **Usuários existentes**: Não são afetados imediatamente
- **Novos usuários**: Proteção aplicada no cadastro
- **Mudança de senha**: Proteção aplicada na atualização

## 🚨 Considerações Importantes

### **Performance**
- Verificações são feitas via hash (não expõe senha real)
- Impacto mínimo na performance de autenticação
- Verificação apenas em momentos de cadastro/mudança

### **Privacidade**
- HaveIBeenPwned usa k-anonymity para proteção
- Senha real nunca é enviada externamente
- Apenas prefixo do hash SHA-1 é consultado

## 📊 Monitoramento

Após habilitação, monitore:
- Taxa de rejeição de senhas comprometidas
- Feedback dos usuários sobre experiência de cadastro
- Logs de autenticação para erros relacionados

## 🎯 Próximos Passos

1. **Imediato**: Habilitar via Dashboard Supabase
2. **Validação**: Testar com senha comprometida conhecida
3. **Monitoramento**: Verificar impacto nos novos cadastros
4. **Documentação**: Atualizar documentação de usuário se necessário

---

**⚡ Ação Requerida**: Esta configuração deve ser feita manualmente através do Dashboard Supabase ou API de Management, pois não é controlada via variáveis de ambiente do projeto.