import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

/**
 * Gera um hash seguro para a senha usando bcrypt
 * @param password - A senha em texto plano
 * @returns Hash bcrypt da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Recomendado para segurança alta
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica se a senha está correta usando bcrypt
 * @param password - A senha em texto plano
 * @param hashedPassword - O hash bcrypt armazenado
 * @returns True se a senha estiver correta
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Cria um novo usuário
 */
export async function createUser({
  name,
  email,
  password,
  role = 'user',
}: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    },
  });
}

/**
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });
}

/**
 * Busca um usuário pelo ID
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

/**
 * Gera um token criptograficamente seguro para redefinição de senha
 */
export async function generatePasswordResetToken(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  // Usar randomBytes para token criptograficamente seguro
  const token = randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 2); // Token válido por 2 horas

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expires,
    },
  });

  return token;
}

/**
 * Verifica se um token de redefinição de senha é válido
 */
export async function verifyPasswordResetToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  return user;
}

/**
 * Redefine a senha do usuário
 */
export async function resetPassword(token: string, newPassword: string) {
  const user = await verifyPasswordResetToken(token);
  if (!user) return false;

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return true;
}

/**
 * Gera um segredo para autenticação de dois fatores usando otplib
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Ativa a autenticação de dois fatores para um usuário
 */
export async function enableTwoFactorAuth(userId: string, secret: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    },
  });
}

/**
 * Desativa a autenticação de dois fatores para um usuário
 */
export async function disableTwoFactorAuth(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
}

/**
 * Verifica o código de autenticação de dois fatores usando otplib (RFC 6238)
 * @param secret - O segredo base32 compartilhado
 * @param token - O código de 6 dígitos fornecido pelo usuário
 * @returns True se o token for válido
 */
export function verifyTwoFactorCode(secret: string, token: string): boolean {
  try {
    // Usar window de 1 para permitir tolerância de tempo (±30 segundos)
    // Configurar opções do authenticator
    authenticator.options = { window: 1 };
    return authenticator.verify({ 
      token: token.replace(/\s/g, ''), // Remove espaços
      secret: secret
    });
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
}

/**
 * Gera uma URL para QR Code do authenticator app
 * @param user - Dados do usuário (nome e email)
 * @param secret - O segredo compartilhado
 * @param serviceName - Nome do serviço (padrão: Sistema de Exames)
 * @returns URL otpauth:// para gerar QR code
 */
export function generateQRCodeURL(
  user: { name: string; email: string },
  secret: string,
  serviceName: string = 'Sistema de Exames'
): string {
  return authenticator.keyuri(
    user.email,
    serviceName,
    secret
  );
}

/**
 * Gera um código de verificação de 6 dígitos criptograficamente seguro
 */
export function generateVerificationCode(): string {
  // Usar randomBytes para geração segura
  const randomValue = randomBytes(4).readUInt32BE(0);
  return (100000 + (randomValue % 900000)).toString();
}
