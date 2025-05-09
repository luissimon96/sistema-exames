This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started


### Configuração do Banco de Dados

Este projeto usa o Supabase como banco de dados PostgreSQL. Siga os passos abaixo para configurar:

1. Crie uma conta no [Supabase](https://supabase.com/) e crie um novo projeto
2. Obtenha as credenciais de conexão (URL e chave anônima) no painel do Supabase
3. Configure as variáveis de ambiente no arquivo `.env.local`:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

4. Execute a migração do Prisma para criar as tabelas no Supabase:

```bash
npx prisma migrate deploy
```

5. Gere as chaves de segurança necessárias:

```bash
# Gerar chave para NextAuth
node scripts/generate-secret.js

# Gerar chave para tokens CSRF
node scripts/generate-csrf-key.js

# Gerar chave para criptografia de dados sensíveis
node scripts/generate-encryption-key.js
```

6. Configure os usuários iniciais:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup-supabase.ts
```

### Executando o Servidor de Desenvolvimento

Após configurar o banco de dados, execute o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

Você pode começar a editar a página modificando `app/page.tsx`. A página atualiza automaticamente conforme você edita o arquivo.

Este projeto usa [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) para otimizar e carregar automaticamente [Geist](https://vercel.com/font), uma nova família de fontes da Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy na Vercel

Este projeto está configurado para ser facilmente implantado na Vercel. Siga os passos abaixo:

1. Crie uma conta na [Vercel](https://vercel.com/) se ainda não tiver uma
2. Conecte seu repositório GitHub/GitLab/Bitbucket à Vercel
3. Configure as variáveis de ambiente na Vercel:
   - `DATABASE_URL`: URL de conexão do Supabase
   - `NEXTAUTH_URL`: URL da sua aplicação implantada
   - `NEXTAUTH_SECRET`: Chave secreta para o NextAuth
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `STRIPE_PUBLIC_KEY`: Chave pública do Stripe
   - `STRIPE_SECRET_KEY`: Chave secreta do Stripe
   - `STRIPE_WEBHOOK_SECRET`: Secret do webhook do Stripe
   - `STRIPE_PRO_PRICE_ID`: ID do preço do plano Pro no Stripe
   - `STRIPE_FULL_PRICE_ID`: ID do preço do plano Full no Stripe

4. Implante o projeto na Vercel
5. Execute a migração do banco de dados usando o CLI da Vercel:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

A maneira mais fácil de implantar seu aplicativo Next.js é usar a [Plataforma Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) dos criadores do Next.js.

Consulte nossa [documentação de implantação do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.

## Backlog do Projeto

### Visão Geral

O sistema atual é uma aplicação web para gerenciamento de exames médicos que permite aos usuários visualizar e analisar resultados de exames laboratoriais, acompanhar a evolução temporal de diferentes parâmetros, adicionar anotações e medicações associadas aos exames, exportar dados em formato Excel e comparar resultados entre diferentes exames.

### Pontos Fortes Atuais

1. Interface intuitiva e bem estruturada
2. Categorização eficiente dos diferentes tipos de exames
3. Visualização temporal que permite acompanhar a evolução dos parâmetros
4. Tratamento de diferentes formatos de datas nos exames
5. Sistema de anotações e registro de medicações
6. Exportação de dados para Excel
7. Visualização completa do texto original do exame

### Funcionalidades a Implementar

1. **Dashboard personalizado**
   - Painel inicial com resumo dos principais parâmetros e tendências
   - Alertas para valores fora do intervalo de referência
   - Widgets configuráveis pelo usuário

2. **Sistema de usuários e perfis**
   - Cadastro e autenticação de usuários
   - Perfis diferentes (paciente, médico, administrador)
   - Compartilhamento seguro de resultados entre médico e paciente

3. **Agenda de exames**
   - Calendário de exames futuros
   - Sistema de lembretes por e-mail ou notificação
   - Integração com Google Calendar/Apple Calendar

4. **Relatórios avançados**
   - Geração de relatórios personalizados
   - Análise estatística dos resultados ao longo do tempo
   - Exportação em formatos adicionais (PDF, CSV)

5. **Recomendações baseadas em IA**
   - Sugestões personalizadas baseadas nos resultados
   - Detecção de padrões atípicos ou tendências preocupantes
   - Recomendações de frequência ideal para novos exames

6. **Integração com dispositivos**
   - Sincronização com dispositivos de monitoramento (glicosímetros, monitores de pressão)
   - Importação automática de dados desses dispositivos

7. **Módulo de nutrição**
   - Recomendações nutricionais baseadas nos resultados
   - Planos alimentares personalizados
   - Rastreamento da influência da dieta nos resultados

8. **Aplicativo móvel**
   - Versão móvel com funcionalidades principais
   - Notificações push para novos resultados ou alertas
   - Visualização otimizada para dispositivos móveis

### Melhorias de Interface

1. **Modo escuro**
   - Implementar alternativa de tema escuro para melhor experiência em ambientes com pouca luz

2. **Visualização de dados mais interativa**
   - Gráficos interativos com zoom e ajustes
   - Animações para melhor compreensão de tendências

3. **Acessibilidade**
   - Melhorar suporte para leitores de tela
   - Opções de alto contraste e texto ampliado

### Melhorias Técnicas

1. **Performance**
   - Otimizar carregamento de dados grandes
   - Implementar paginação para conjuntos grandes de exames

2. **Segurança**
   - Criptografia de ponta a ponta para dados sensíveis
   - Conformidade com regulamentações de saúde (LGPD, HIPAA)

3. **Backup e recuperação**
   - Sistema automático de backup
   - Histórico de versões de documentos

### Novas Telas Propostas

1. **Tela de Dashboard**
   - Resumo visual dos principais indicadores de saúde
   - Gráficos de tendências dos últimos exames
   - Alertas para valores que necessitam atenção
   - Próximos exames agendados

2. **Tela de Perfil do Usuário**
   - Informações pessoais e histórico médico resumido
   - Configurações de preferências e notificações
   - Gestão de compartilhamento de dados

3. **Tela de Comparação Avançada**
   - Interface dedicada para comparação entre múltiplos exames
   - Visualização lado a lado de resultados
   - Gráficos comparativos

4. **Tela de Histórico Médico**
   - Linha do tempo de todos os eventos médicos
   - Exames, consultas, medicações e observações
   - Filtros e busca avançada

5. **Tela de Relatórios**
   - Geração de relatórios personalizados
   - Opções de visualização e exportação
   - Templates predefinidos para diferentes necessidades

6. **Tela de Agenda**
   - Calendário de exames e consultas
   - Sistema de lembretes e notificações
   - Integração com laboratórios parceiros

7. **Tela de Recomendações**
   - Sugestões personalizadas baseadas nos resultados
   - Artigos e informações relevantes sobre condições específicas
   - Planos de ação sugeridos

### Itens a Serem Modificados

1. Implementar um sistema de login e autenticação robusto
2. Adicionar funcionalidade completa de exportação para PDF
3. Melhorar o tratamento de erros e feedback ao usuário
4. Otimizar a lógica de processamento de exames para maior precisão
5. Implementar sistema de permissões para compartilhamento seguro
6. Adicionar suporte para mais tipos de exames e parâmetros
7. Melhorar a interface mobile com design responsivo avançado
8. Implementar sistema de notificações para alertas importantes
9. Adicionar funcionalidade de importação direta de laboratórios parceiros
10. Criar documentação detalhada para usuários e desenvolvedores
