import { createClient } from '@supabase/supabase-js';

/**
 * Client do Supabase usando a service_role key — só pode ser importado por código que roda
 * no servidor (rotas de API). Nunca importe isso de um arquivo 'use client'.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no .env.local');
}

export const db = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
