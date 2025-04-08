import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Gera um hash seguro para a senha
 */
export async function hashPassword(password: string): Promise<string> {
  // Em produção, use bcrypt ou Argon2
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hashedPassword;
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
 * Gera um token para redefinição de senha
 */
export async function generatePasswordResetToken(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = uuidv4();
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
 * Verifica o código de autenticação de dois fatores
 */
export function verifyTwoFactorCode(secret: string, token: string): boolean {
  // Em uma implementação real, use uma biblioteca como 'otplib'
  // Este é apenas um exemplo simplificado
  const expectedToken = CryptoJS.HmacSHA1(
    Math.floor(Date.now() / 30000).toString(),
    secret
  ).toString().substring(0, 6);

  return token === expectedToken;
}

/**
 * Gera um código de verificação de 6 dígitos
 */
export function generateVerificationCode(): string {
  // Gerar um código de 6 dígitos
  return Math.floor(100000 + Math.random() * 900000).toString();
}
