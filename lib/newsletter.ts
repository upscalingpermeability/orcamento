/**
 * Boletim Orçamentário Federal — AEB
 * Core: busca de manchetes via Claude + montagem do HTML do e-mail
 */

import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────
// Cores por tema
// ─────────────────────────────────────────────────────────

const THEME_COLOR: Record<string, string> = {
  LOA:    '#185FA5',
  LDO:    '#3B6D11',
  PPA:    '#854F0B',
  PLOA:   '#534AB7',
  FISCAL: '#7A4515',
};

const THEME_BG: Record<string, string> = {
  LOA:    '#E6F1FB',
  LDO:    '#EAF3DE',
  PPA:    '#FAEEDA',
  PLOA:   '#EEEDFE',
  FISCAL: '#FBF0E6',
};

// ─────────────────────────────────────────────────────────
// Logo AEB em base64
// ─────────────────────────────────────────────────────────

const AEB_LOGO_B64 =
  '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' +
  'f/9k=';

export const LOGO_SRC = `data:image/jpeg;base64,${AEB_LOGO_B64}`;

// ─────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────

export interface Manchete {
  titulo: string;
  veiculo: string;
  tema: string;
  resumo?: string;
  url: string;
}

export interface NewsletterData {
  data: string;
  sumario?: string;
  manchetes: Manchete[];
}

// ─────────────────────────────────────────────────────────
// 1. Busca de manchetes via Claude + web search
// ─────────────────────────────────────────────────────────

export async function buscarManchetes(topics: string[]): Promise<NewsletterData> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const hoje = new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const topicsStr = topics.join(', ');

  const prompt = `Você é um jornalista especializado em orçamento público federal brasileiro.
Hoje é ${hoje}. Busque as principais manchetes e notícias de HOJE sobre: ${topicsStr}.

Retorne SOMENTE um JSON válido, sem texto extra, sem blocos de código markdown:
{
  "data": "${hoje}",
  "sumario": "Parágrafo de 2-3 frases resumindo o cenário do dia em orçamento público.",
  "manchetes": [
    {
      "titulo":  "Título completo da manchete",
      "veiculo": "Nome do veículo ou fonte",
      "tema":    "LOA | LDO | PPA | PLOA | FISCAL",
      "resumo":  "Análise breve de 1-2 frases sobre o impacto da notícia.",
      "url":     "URL real da matéria"
    }
  ]
}

Inclua de 5 a 8 manchetes, ordenadas por relevância e impacto.
Priorize: Agência Brasil, Valor Econômico, Folha de S.Paulo, Estadão,
Poder360, GOV.BR, Câmara dos Deputados, Senado Federal, TCU, STN.
Retorne APENAS o JSON puro.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.messages.create as any)({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });

  const fullText = (response.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');

  let clean = fullText.trim();
  if (clean.startsWith('```')) {
    const parts = clean.split('```');
    clean = parts[1] ?? clean;
    if (clean.startsWith('json')) clean = clean.slice(4);
  }
  clean = clean.trim().replace(/`+$/, '').trim();

  return JSON.parse(clean) as NewsletterData;
}

// ─────────────────────────────────────────────────────────
// 2. Montagem do HTML do e-mail
// ─────────────────────────────────────────────────────────

export function buildEmailHtml(
  data: NewsletterData,
  recipientName: string,
  topics: string[],
): string {
  // ── Bloco de cada manchete ───────────────────────────────
  const manchetesHtml = data.manchetes
    .map((m) => {
      const tema = m.tema ?? 'LOA';
      const cor  = THEME_COLOR[tema] ?? '#185FA5';
      const bg   = THEME_BG[tema]   ?? '#E6F1FB';

      const resumoHtml = m.resumo
        ? `<tr><td style="font-size:13px;color:#555;line-height:1.6;
              font-family:Arial,sans-serif;padding-bottom:6px;">
              ${m.resumo}
           </td></tr>`
        : '';

      return `
      <tr>
        <td style="padding:0 0 24px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom:7px;">
                <span style="display:inline-block;background:${bg};color:${cor};
                  font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;
                  letter-spacing:0.08em;font-family:Arial,sans-serif;">${tema}</span>
                <span style="font-size:11px;color:#999;margin-left:8px;
                  font-family:Arial,sans-serif;">${m.veiculo ?? ''}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:7px;">
                <a href="${m.url ?? '#'}"
                   style="font-size:17px;font-weight:700;color:#111;
                     text-decoration:none;line-height:1.35;
                     font-family:Georgia,serif;display:block;">
                  ${m.titulo}
                </a>
              </td>
            </tr>
            ${resumoHtml}
            <tr>
              <td style="padding-bottom:8px;">
                <a href="${m.url ?? '#'}"
                   style="font-size:12px;color:${cor};
                     text-decoration:none;font-family:Arial,sans-serif;">
                  Ler matéria completa →
                </a>
              </td>
            </tr>
            <tr>
              <td><div style="height:0.5px;background:#ebebeb;"></div></td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');

  // ── Bloco de sumário executivo ───────────────────────────
  const sumarioBlock = data.sumario
    ? `<tr>
        <td style="padding:0 36px 22px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background:#f8f7f5;border-left:3px solid #185FA5;
                  border-radius:0 6px 6px 0;padding:14px 16px;">
                <p style="font-size:13px;color:#444;line-height:1.65;
                    margin:0;font-family:Arial,sans-serif;font-style:italic;">
                  ${data.sumario}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Boletim Orçamentário AEB — ${data.data}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;">
<table cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:#f0f2f5;padding:28px 0;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="600"
           style="max-width:600px;background:#ffffff;border-radius:14px;
                  overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

      <!-- ═══ CABEÇALHO ═══ -->
      <tr>
        <td style="background:#03234e;padding:0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="background:#EFC010;height:4px;"></td></tr>
            <tr>
              <td style="padding:22px 36px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;width:90px;">
                      <img src="${LOGO_SRC}" alt="AEB" width="80"
                           style="display:block;filter:brightness(0) invert(1);opacity:0.95;">
                    </td>
                    <td style="vertical-align:middle;padding-left:18px;
                        border-left:1px solid rgba(255,255,255,0.2);">
                      <p style="color:#B5D4F4;font-size:10px;letter-spacing:0.14em;
                          text-transform:uppercase;margin:0 0 4px;font-family:Arial,sans-serif;">
                        BOLETIM DIÁRIO · ${data.data}
                      </p>
                      <h1 style="color:#ffffff;font-size:20px;margin:0 0 3px;
                          font-family:Georgia,serif;font-weight:normal;line-height:1.2;">
                        Orçamento Federal em Foco
                      </h1>
                      <p style="color:#85B7EB;font-size:12px;margin:0;font-family:Arial,sans-serif;">
                        ${topics.join(' · ')}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ═══ SAUDAÇÃO ═══ -->
      <tr>
        <td style="padding:24px 36px 10px;">
          <p style="font-size:14px;color:#333;margin:0;font-family:Arial,sans-serif;">
            Bom dia, <strong>${recipientName}</strong>.
            Confira as principais manchetes do dia:
          </p>
        </td>
      </tr>

      <!-- ═══ SUMÁRIO EXECUTIVO ═══ -->
      ${sumarioBlock}

      <!-- ═══ MANCHETES ═══ -->
      <tr>
        <td style="padding:4px 36px 8px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;
              text-transform:uppercase;color:#bbbbbb;margin:0 0 20px;
              font-family:Arial,sans-serif;">
            MANCHETES DO DIA
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${manchetesHtml}
          </table>
        </td>
      </tr>

      <!-- ═══ RODAPÉ ═══ -->
      <tr>
        <td style="background:#f4f6f9;padding:0;border-top:1px solid #e8eaed;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="background:#EFC010;height:2px;"></td></tr>
            <tr>
              <td style="padding:18px 36px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <p style="font-size:12px;font-weight:600;color:#03234e;
                          margin:0 0 3px;font-family:Arial,sans-serif;">
                        Elaborado por: Divisão de Planejamento Orçamentário e Financeiro
                      </p>
                      <p style="font-size:11px;color:#888888;margin:0 0 2px;
                          font-family:Arial,sans-serif;">
                        Agência Espacial Brasileira — AEB
                      </p>
                      <p style="font-size:10px;color:#aaaaaa;margin:0;
                          font-family:Arial,sans-serif;">
                        Boletim gerado automaticamente por IA ·
                        Enviado conforme agendamento configurado
                      </p>
                    </td>
                    <td style="vertical-align:middle;text-align:right;width:54px;">
                      <img src="${LOGO_SRC}" alt="AEB" width="44"
                           style="display:block;margin-left:auto;opacity:0.30;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
