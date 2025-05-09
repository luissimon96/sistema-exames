import { createClient } from '@supabase/supabase-js';

// Criar um cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou chave anônima não definidas. O cliente Supabase não funcionará corretamente.');
}

// Criar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
