/**
 * Boletim Orçamentário Federal — AEB
 * Envio de e-mails via SendGrid
 */

import sgMail from '@sendgrid/mail';
import { buildEmailHtml, type NewsletterData } from './newsletter';

export interface Recipient {
  email: string;
  name: string;
}

export interface SendResult {
  email: string;
  name: string;
  status: number;
  ok: boolean;
  error?: string;
}

/**
 * Lê a variável RECIPIENTS e retorna lista de destinatários.
 * Formato: "email1:Nome,email2:Nome2"
 */
export function parseRecipients(): Recipient[] {
  const raw = (process.env.RECIPIENTS ?? '').trim();
  if (!raw) {
    throw new Error(
      'Configure a variável de ambiente RECIPIENTS.\n' +
      'Exemplo: "joao@aeb.gov.br:João Silva,maria@aeb.gov.br:Maria Costa"',
    );
  }

  return raw.split(',').map((entry) => {
    entry = entry.trim();
    const colonIdx = entry.indexOf(':');
    if (colonIdx !== -1) {
      return {
        email: entry.slice(0, colonIdx).trim(),
        name:  entry.slice(colonIdx + 1).trim(),
      };
    }
    return { email: entry, name: 'Leitor' };
  });
}

/**
 * Envia um e-mail individual e personalizado para cada destinatário.
 */
export async function enviarParaTodos(
  assunto: string,
  dados: NewsletterData,
  recipients: Recipient[],
  topics: string[],
): Promise<SendResult[]> {
  const apiKey = process.env.SENDGRID_API_KEY ?? '';
  if (!apiKey) throw new Error('SENDGRID_API_KEY não configurada.');
  sgMail.setApiKey(apiKey);

  const fromEmail = process.env.FROM_EMAIL ?? '';
  const fromName  = process.env.FROM_NAME  ?? 'Boletim Orçamentário AEB';

  const resultados: SendResult[] = [];

  for (const r of recipients) {
    const html = buildEmailHtml(dados, r.name, topics);
    try {
      const [res] = await sgMail.send({
        from:    { email: fromEmail, name: fromName },
        to:      { email: r.email,   name: r.name },
        subject: assunto,
        html,
      });
      const status = res.statusCode;
      const ok     = status === 200 || status === 202;
      resultados.push({ email: r.email, name: r.name, status, ok });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      resultados.push({ email: r.email, name: r.name, status: 0, ok: false, error: msg });
    }
  }

  return resultados;
}
