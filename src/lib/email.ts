/**
 * Utilitário para envio de emails
 * 
 * Em uma implementação real, você usaria um serviço como SendGrid, Mailgun, etc.
 * Este é apenas um exemplo simplificado para demonstração.
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Envia um email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Em um ambiente de produção, você usaria um serviço de email real
    console.log('Enviando email:');
    console.log('Para:', options.to);
    console.log('Assunto:', options.subject);
    console.log('Texto:', options.text);
    
    // Simular um atraso para envio de email
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}
