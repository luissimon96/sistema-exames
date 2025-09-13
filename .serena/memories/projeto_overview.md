# Sistema de Exames - Overview do Projeto

## Propósito
Aplicação web para gerenciamento de exames médicos que permite visualizar, analisar e acompanhar resultados de exames laboratoriais ao longo do tempo.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Banco**: PostgreSQL (Supabase), Prisma ORM
- **Autenticação**: NextAuth.js com Credentials Provider
- **Deployment**: Vercel
- **Outros**: bcrypt, Stripe, TypeScript

## Estrutura do Código
- `/src/app` - App Router do Next.js
- `/src/components` - Componentes reutilizáveis
- `/src/lib` - Utilitários e configurações
- `/src/utils` - Funções auxiliares
- `/prisma` - Schema e migrações do banco
- `/scripts` - Scripts de setup e testes

## Comandos Importantes
- `npm run dev` - Desenvolvimento
- `npm run build` - Build para produção
- `npm run lint` - Linting
- `npm run db:seed` - Seed do banco de dados
- `npx prisma generate` - Gerar cliente Prisma
- `npx prisma migrate deploy` - Executar migrações

## Credenciais de Teste
- Admin: admin@example.com / admin123
- Usuário: user@example.com / user123