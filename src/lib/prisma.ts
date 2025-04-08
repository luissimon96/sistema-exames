import { PrismaClient } from '@prisma/client';

// Declaração global para o PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

// Criar uma instância do PrismaClient
const prisma = global.prisma || new PrismaClient();

// Em desenvolvimento, salvamos o cliente no objeto global para evitar
// múltiplas instâncias durante hot-reloading
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;
