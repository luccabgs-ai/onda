import webpush from 'web-push';
import { db } from './db';

/**
 * Envio de notificações (Web Push) — só servidor. As chaves VAPID moram nas variáveis de
 * ambiente; sem elas o envio é desligado em vez de quebrar o build ou as rotas.
 */
const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privada = process.env.VAPID_PRIVATE_KEY;
export const pushConfigurado = !!(publica && privada);

let configurado = false;
function configurar() {
  if (configurado || !publica || !privada) return;
  // O "assunto" identifica quem envia pros serviços de push (Apple, Google) — o próprio site.
  webpush.setVapidDetails('https://onda-self.vercel.app', publica, privada);
  configurado = true;
}

export interface Notificacao {
  titulo: string;
  corpo: string;
  tag: string;
  url?: string;
}

interface InscricaoRow { endpoint: string; p256dh: string; auth: string }

/** Manda pra todos os aparelhos inscritos. Inscrição que o serviço diz não existir mais é apagada. */
export async function enviarParaTodos(n: Notificacao): Promise<{ enviadas: number; removidas: number }> {
  if (!pushConfigurado) throw new Error('chaves VAPID não configuradas');
  configurar();

  const { data, error } = await db.from('push_inscricoes').select('endpoint, p256dh, auth');
  if (error) throw new Error(error.message);

  let enviadas = 0;
  const mortas: string[] = [];
  await Promise.all((data as InscricaoRow[]).map(async i => {
    try {
      await webpush.sendNotification(
        { endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } },
        JSON.stringify(n),
        { TTL: 60 * 60 * 3 }, // se o celular estiver sem sinal, ainda vale entregar por 3h
      );
      enviadas++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) mortas.push(i.endpoint);
    }
  }));

  if (mortas.length) await db.from('push_inscricoes').delete().in('endpoint', mortas);
  return { enviadas, removidas: mortas.length };
}

/** Data de hoje no Brasil — o servidor da Vercel roda em UTC, e a noite (21h) já é amanhã lá. */
export const hojeNoBrasil = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
