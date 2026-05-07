/**
 * Boletim Orçamentário Federal — AEB
 *
 * GET  /api/newsletter  →  chamado pelo cron do Vercel (requer CRON_SECRET)
 * POST /api/newsletter  →  disparado manualmente pelo dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { buscarManchetes } from '@/lib/newsletter';
import { enviarParaTodos, parseRecipients } from '@/lib/sendgrid';

// Valida as variáveis obrigatórias
function checkEnv(): string | null {
  for (const v of ['OPENROUTER_API_KEY', 'SENDGRID_API_KEY', 'FROM_EMAIL', 'RECIPIENTS']) {
    if (!process.env[v]) return v;
  }
  return null;
}

async function executar() {
  const missing = checkEnv();
  if (missing) {
    return NextResponse.json(
      { error: `Variável de ambiente não configurada: ${missing}` },
      { status: 500 },
    );
  }

  const topics = (process.env.TOPICS ?? 'LOA,LDO,PPA')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const recipients = parseRecipients();
    const dados      = await buscarManchetes(topics);
    const n          = dados.manchetes?.length ?? 0;

    const hoje   = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const assunto = `📋 Boletim Orçamentário AEB — ${hoje}`;

    const resultados = await enviarParaTodos(assunto, dados, recipients, topics);
    const okCount    = resultados.filter((r) => r.ok).length;
    const errCount   = resultados.length - okCount;

    return NextResponse.json({
      ok: errCount === 0,
      manchetes: n,
      enviados: okCount,
      erros: errCount,
      data: hoje,
      assunto,
      resultados,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — invocado pelo cron do Vercel
export async function GET(req: NextRequest) {
  // Verifica o token do cron (Vercel envia Authorization: Bearer <CRON_SECRET>)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }
  return executar();
}

// POST — disparado manualmente pelo dashboard
export async function POST(req: NextRequest) {
  // Verifica a origem da requisição (mesma origem = dashboard)
  const origin = req.headers.get('origin') ?? '';
  const host   = req.headers.get('host')   ?? '';
  const isSameOrigin =
    !origin || origin.includes(host) || host.includes('localhost');

  if (!isSameOrigin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return executar();
}
