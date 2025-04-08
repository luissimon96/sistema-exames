import CryptoJS from 'crypto-js';

// Chave de criptografia - em produção, isso deve vir de variáveis de ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'uma-chave-secreta-muito-segura-que-deve-ser-substituida';

/**
 * Criptografa dados sensíveis
 * @param data Dados a serem criptografados
 * @returns Dados criptografados em formato de string
 */
export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Descriptografa dados sensíveis
 * @param encryptedData Dados criptografados
 * @returns Dados descriptografados ou null se falhar
 */
export function decryptData(encryptedData: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    return null;
  }
}

/**
 * Criptografa um objeto JSON
 * @param data Objeto a ser criptografado
 * @returns Dados criptografados em formato de string
 */
export function encryptObject(data: any): string {
  const jsonString = JSON.stringify(data);
  return encryptData(jsonString);
}

/**
 * Descriptografa um objeto JSON
 * @param encryptedData Dados criptografados
 * @returns Objeto descriptografado ou null se falhar
 */
export function decryptObject<T>(encryptedData: string): T | null {
  try {
    const jsonString = decryptData(encryptedData);
    if (!jsonString) return null;
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Erro ao descriptografar objeto:', error);
    return null;
  }
}
