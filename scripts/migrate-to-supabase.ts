import { PrismaClient as SQLitePrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

// Definir o tipo para o cliente SQLite
const SQLitePrisma = new SQLitePrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db', // Caminho para o banco de dados SQLite
    },
  },
});

// Definir o tipo para o cliente PostgreSQL
const PostgresPrisma = new SQLitePrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // URL do Supabase
    },
  },
});

async function main() {
  try {
    console.log('Iniciando migração para o Supabase...');

    // 1. Migrar usuários
    console.log('Migrando usuários...');
    const users = await SQLitePrisma.user.findMany();
    
    for (const user of users) {
      // Verificar se o usuário já existe no Postgres
      const existingUser = await PostgresPrisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Criar o usuário no Postgres
        await PostgresPrisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            password: user.password,
            role: user.role,
            isActive: user.isActive,
            resetToken: user.resetToken,
            resetTokenExpiry: user.resetTokenExpiry,
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            lastLogin: user.lastLogin,
            lastActivity: user.lastActivity,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            theme: user.theme,
            accentColor: user.accentColor,
            loginCount: user.loginCount,
            totalUploads: user.totalUploads,
            totalExams: user.totalExams,
            stripeCustomerId: user.stripeCustomerId,
            subscriptionId: user.subscriptionId,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionPeriodStart: user.subscriptionPeriodStart,
            subscriptionPeriodEnd: user.subscriptionPeriodEnd,
            subscriptionCanceledAt: user.subscriptionCanceledAt,
          },
        });
        console.log(`Usuário migrado: ${user.email}`);
      } else {
        console.log(`Usuário já existe: ${user.email}`);
      }
    }

    // 2. Migrar sessões
    console.log('Migrando sessões...');
    const sessions = await SQLitePrisma.session.findMany();
    
    for (const session of sessions) {
      // Verificar se a sessão já existe no Postgres
      const existingSession = await PostgresPrisma.session.findUnique({
        where: { id: session.id },
      });

      if (!existingSession) {
        // Criar a sessão no Postgres
        await PostgresPrisma.session.create({
          data: {
            id: session.id,
            sessionToken: session.sessionToken,
            userId: session.userId,
            expires: session.expires,
          },
        });
        console.log(`Sessão migrada: ${session.id}`);
      } else {
        console.log(`Sessão já existe: ${session.id}`);
      }
    }

    // 3. Migrar contas
    console.log('Migrando contas...');
    const accounts = await SQLitePrisma.account.findMany();
    
    for (const account of accounts) {
      // Verificar se a conta já existe no Postgres
      const existingAccount = await PostgresPrisma.account.findFirst({
        where: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      });

      if (!existingAccount) {
        // Criar a conta no Postgres
        await PostgresPrisma.account.create({
          data: {
            id: account.id,
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });
        console.log(`Conta migrada: ${account.provider}:${account.providerAccountId}`);
      } else {
        console.log(`Conta já existe: ${account.provider}:${account.providerAccountId}`);
      }
    }

    // 4. Migrar atividades
    console.log('Migrando atividades...');
    const activities = await SQLitePrisma.activity.findMany();
    
    for (const activity of activities) {
      // Verificar se a atividade já existe no Postgres
      const existingActivity = await PostgresPrisma.activity.findUnique({
        where: { id: activity.id },
      });

      if (!existingActivity) {
        // Criar a atividade no Postgres
        await PostgresPrisma.activity.create({
          data: {
            id: activity.id,
            userId: activity.userId,
            action: activity.action,
            details: activity.details,
            createdAt: activity.createdAt,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
          },
        });
        console.log(`Atividade migrada: ${activity.id}`);
      } else {
        console.log(`Atividade já existe: ${activity.id}`);
      }
    }

    // 5. Criar usuários padrão se não existirem
    console.log('Verificando usuários padrão...');
    
    // Verificar se o usuário admin existe
    const adminEmail = 'admin@example.com';
    const admin = await PostgresPrisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      console.log('Criando usuário admin...');
      const adminPassword = await hashPassword('admin123');
      await PostgresPrisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isActive: true,
        },
      });
      console.log('Usuário admin criado com sucesso!');
    }

    // Verificar se o usuário regular existe
    const userEmail = 'user@example.com';
    const regularUser = await PostgresPrisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!regularUser) {
      console.log('Criando usuário regular...');
      const userPassword = await hashPassword('user123');
      await PostgresPrisma.user.create({
        data: {
          name: 'Usuário',
          email: userEmail,
          password: userPassword,
          role: 'user',
          isActive: true,
        },
      });
      console.log('Usuário regular criado com sucesso!');
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    // Fechar as conexões
    await SQLitePrisma.$disconnect();
    await PostgresPrisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Erro durante a execução:', e);
    process.exit(1);
  });
