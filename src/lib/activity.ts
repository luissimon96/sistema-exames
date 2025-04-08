import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

/**
 * Registra uma atividade do usuário
 * @param userId ID do usuário
 * @param action Tipo de ação (login, logout, upload, update_profile, etc.)
 * @param details Detalhes adicionais sobre a ação
 * @param request Objeto de requisição para obter IP e User Agent
 */
export async function logActivity(
  userId: string,
  action: string,
  details: string,
  request?: NextRequest | Request
) {
  try {
    let ipAddress = 'unknown';
    let userAgent = 'unknown';

    if (request) {
      // Obter IP
      if (request.headers) {
        const forwardedFor = request.headers.get('x-forwarded-for');
        if (forwardedFor) {
          ipAddress = forwardedFor.toString().split(',')[0].trim();
        } else {
          ipAddress = request.headers.get('x-real-ip') || 'unknown';
        }

        // Obter User Agent
        userAgent = request.headers.get('user-agent') || 'unknown';
      }
    }

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    });

    // Atualizar lastActivity do usuário
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivity: new Date() },
    });

    return true;
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    return false;
  }
}

/**
 * Tipos de ações para registro de atividades
 */
export const ActivityTypes = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  UPDATE_PROFILE: 'update_profile',
  CHANGE_PASSWORD: 'change_password',
  UPLOAD: 'upload',
  DELETE: 'delete',
  VERIFY_EMAIL: 'verify_email',
  ENABLE_2FA: 'enable_2fa',
  DISABLE_2FA: 'disable_2fa',
  EXPORT_DATA: 'export_data',
  ADMIN_ACTION: 'admin_action',
};
