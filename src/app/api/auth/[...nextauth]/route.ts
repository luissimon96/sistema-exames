import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { verifyPassword, getUserByEmail } from "@/lib/auth";

// Configuração para envio de emails
const emailConfig = {
  server: process.env.EMAIL_SERVER,
  from: process.env.EMAIL_FROM,
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        code: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        console.log('=== AUTHORIZE FUNCTION CALLED ===');
        console.log('Credentials received:', { email: credentials?.email, password: credentials?.password ? '***' : 'MISSING' });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password');
          return null;
        }

        console.log('Environment check:');
        console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
        console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);

        let user;
        let isPasswordValid = false;
        
        try {
          // Encontrar o usuário pelo email
          user = await getUserByEmail(credentials.email);

          console.log('Tentativa de login:', credentials.email);
          console.log('Usuário encontrado no DB:', !!user);
          
          if (user) {
            console.log('User details:', {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              hasPassword: !!user.password
            });
          }

          // Verificar se o usuário existe e a senha está correta
          isPasswordValid = user ? await verifyPassword(credentials.password, user.password || '') || false : false;
          console.log('Senha válida:', isPasswordValid);
        } catch (dbError) {
          console.error('Database error in authorize:', dbError);
          return null;
        }

        // Verificar autenticação de dois fatores, se estiver habilitada
        if (user?.twoFactorEnabled) {
          // Verificar se o código 2FA foi fornecido
          if (!credentials.code) {
            throw new Error('2FA_REQUIRED');
          }

          // Verificar o código 2FA
          // Em uma implementação real, use uma biblioteca como 'otplib'
          // Este é apenas um exemplo simplificado
          const isValidCode = credentials.code === '123456'; // Simplificado para teste

          if (!isValidCode) {
            throw new Error('INVALID_2FA_CODE');
          }
        }

        if (isPasswordValid && user) {
          // Atualizar dados de login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              lastActivity: new Date(),
              loginCount: { increment: 1 },
            },
          });

          // Registrar atividade de login
          await prisma.activity.create({
            data: {
              userId: user.id,
              action: 'login',
              details: 'Login bem-sucedido',
              ipAddress: req?.headers?.['x-forwarded-for']?.toString() || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown',
            },
          });

          // Retornar apenas os dados necessários (não incluir a senha)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },
    }),
    EmailProvider({
      server: emailConfig.server,
      from: emailConfig.from,
      maxAge: 24 * 60 * 60, // 24 horas
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      // Adicionar o papel (role) e ID do usuário ao token
      if (user) {
        console.log('JWT callback - user:', user.email, 'role:', user.role, 'id:', user.id);
        token.role = user.role;
        token.id = user.id; // Adiciona o ID do usuário ao token
      }
      return token;
    },
    async session({ session, token }) {
      // Adicionar o papel (role) e ID do usuário à sessão a partir do token
      if (session.user) {
        console.log('Session callback - user:', session.user.email, 'token role:', token.role, 'token id:', token.id);
        session.user.role = token.role as string;
        session.user.id = token.id as string; // Adiciona o ID do usuário à sessão
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-que-deve-ser-substituido",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
