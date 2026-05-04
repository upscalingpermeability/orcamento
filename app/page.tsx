'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────

interface SendResult {
  email: string;
  name: string;
  status: number;
  ok: boolean;
  error?: string;
}

interface ApiResponse {
  ok?: boolean;
  manchetes?: number;
  enviados?: number;
  erros?: number;
  data?: string;
  assunto?: string;
  resultados?: SendResult[];
  error?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ─────────────────────────────────────────────────────────
// Constantes visuais
// ─────────────────────────────────────────────────────────

const BRAND = {
  navy:   '#03234e',
  gold:   '#EFC010',
  blue:   '#185FA5',
  white:  '#ffffff',
  bg:     '#f0f2f5',
  card:   '#ffffff',
};

// ─────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 18,
      height: 18,
      border: '2.5px solid rgba(255,255,255,0.4)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      verticalAlign: 'middle',
      marginRight: 8,
    }} />
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 20,
      letterSpacing: '0.06em',
    }}>
      {children}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BRAND.card,
      borderRadius: 14,
      padding: '28px 32px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{
      flex: 1,
      background: '#f8f9fc',
      borderRadius: 10,
      padding: '16px 20px',
      textAlign: 'center',
      border: '1px solid #eaecf0',
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: BRAND.navy, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [status, setStatus]     = useState<Status>('idle');
  const [result, setResult]     = useState<ApiResponse | null>(null);
  const [elapsed, setElapsed]   = useState<number>(0);

  const topics = (process.env.NEXT_PUBLIC_TOPICS ?? 'LOA, LDO, PPA');

  async function handleEnviar() {
    setStatus('loading');
    setResult(null);
    const t0 = Date.now();

    try {
      const res  = await fetch('/api/newsletter', { method: 'POST' });
      const data: ApiResponse = await res.json();
      setElapsed(Math.round((Date.now() - t0) / 1000));

      if (!res.ok || data.error) {
        setStatus('error');
        setResult(data);
      } else {
        setStatus(data.erros === 0 ? 'success' : 'error');
        setResult(data);
      }
    } catch (err: unknown) {
      setElapsed(Math.round((Date.now() - t0) / 1000));
      setStatus('error');
      setResult({ error: err instanceof Error ? err.message : 'Erro desconhecido.' });
    }
  }

  const agora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.35s ease; }
        .send-btn {
          background: ${BRAND.blue};
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: background 0.18s, transform 0.12s;
          letter-spacing: 0.01em;
        }
        .send-btn:hover:not(:disabled) { background: #1450a0; transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .result-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .result-row:last-child { border-bottom: none; }
      `}</style>

      {/* ── Cabeçalho ─────────────────────────────────── */}
      <header style={{ background: BRAND.navy, borderBottom: `4px solid ${BRAND.gold}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            🛰️
          </div>
          <div>
            <h1 style={{ color: BRAND.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
              Boletim Orçamentário Federal
            </h1>
            <p style={{ color: '#85B7EB', fontSize: 12, margin: '2px 0 0' }}>
              Agência Espacial Brasileira — AEB · Divisão de Planejamento Orçamentário e Financeiro
            </p>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ──────────────────────────────────── */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Configuração atual */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 6 }}>
                CONFIGURAÇÃO ATUAL
              </p>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
                🕐 Agendamento automático: <strong>07:30 BRT · segunda a sexta</strong>
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {topics.split(',').map((t) => (
                  <Badge key={t} color="#185FA5" bg="#E6F1FB">{t.trim()}</Badge>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#aaa', textAlign: 'right', lineHeight: 1.6 }}>
              <div>{agora}</div>
              <div style={{ marginTop: 4 }}>
                <Badge color="#3B6D11" bg="#EAF3DE">● online</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Disparo manual */}
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>
            DISPARO MANUAL
          </p>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
            Clique abaixo para gerar o boletim agora e enviar imediatamente para todos os destinatários configurados.
            O processo leva cerca de 30–60 segundos.
          </p>
          <button
            className="send-btn"
            onClick={handleEnviar}
            disabled={status === 'loading'}
          >
            {status === 'loading' && <Spinner />}
            {status === 'loading' ? 'Gerando e enviando…' : '📧 Gerar e Enviar Agora'}
          </button>
        </Card>

        {/* Resultado */}
        {result && (
          <Card
            key={JSON.stringify(result)}
            style={{ borderLeft: `4px solid ${status === 'success' ? '#3B6D11' : '#c0392b'}` }}
          >
            <div className="fade-in">
              {result.error ? (
                <>
                  <p style={{ fontWeight: 700, color: '#c0392b', marginBottom: 8 }}>❌ Erro ao processar</p>
                  <pre style={{ fontSize: 12, color: '#666', background: '#fafafa', padding: 14, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {result.error}
                  </pre>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 700, color: status === 'success' ? '#3B6D11' : '#c0392b', marginBottom: 16 }}>
                    {status === 'success' ? '✅ Boletim enviado com sucesso!' : '⚠️ Enviado com erros'}
                  </p>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <StatBox label="Manchetes" value={result.manchetes ?? 0} icon="📰" />
                    <StatBox label="Enviados"  value={result.enviados  ?? 0} icon="✅" />
                    <StatBox label="Erros"     value={result.erros     ?? 0} icon="❌" />
                    <StatBox label="Tempo"     value={`${elapsed}s`}         icon="⏱️" />
                  </div>

                  {/* Assunto */}
                  {result.assunto && (
                    <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
                      <strong>Assunto:</strong> {result.assunto}
                    </p>
                  )}

                  {/* Lista de destinatários */}
                  {result.resultados && result.resultados.length > 0 && (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>
                        DESTINATÁRIOS
                      </p>
                      {result.resultados.map((r) => (
                        <div key={r.email} className="result-row">
                          <span style={{ fontSize: 16 }}>{r.ok ? '✅' : '❌'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{r.email}</div>
                          </div>
                          <Badge
                            color={r.ok ? '#3B6D11' : '#c0392b'}
                            bg={r.ok ? '#EAF3DE' : '#fdecea'}
                          >
                            HTTP {r.status || 'ERR'}
                          </Badge>
                          {r.error && (
                            <div style={{ fontSize: 11, color: '#c0392b', maxWidth: 200, wordBreak: 'break-word' }}>
                              {r.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Como funciona */}
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 14 }}>
            COMO FUNCIONA
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['🕐', 'Agendamento', 'Vercel Cron dispara automaticamente às 07:30 BRT nos dias úteis.'],
              ['🔍', 'Busca', 'Claude pesquisa manchetes do dia sobre LOA, LDO e PPA na web.'],
              ['✍️', 'Análise',  'IA organiza, prioriza e redige resumos de impacto para cada notícia.'],
              ['📧', 'Envio',    'SendGrid entrega o boletim personalizado para cada destinatário.'],
            ].map(([icon, label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 20, marginTop: 1 }}>{icon}</div>
                <div>
                  <strong style={{ fontSize: 13, color: BRAND.navy }}>{label}</strong>
                  <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </main>

      {/* ── Rodapé ────────────────────────────────────── */}
      <footer style={{ borderTop: `2px solid ${BRAND.gold}`, background: BRAND.navy, marginTop: 8 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#85B7EB' }}>
            Divisão de Planejamento Orçamentário e Financeiro · AEB
          </p>
          <p style={{ fontSize: 11, color: '#4a6fa5' }}>
            Boletim gerado por IA · Vercel + Claude + SendGrid
          </p>
        </div>
      </footer>
    </>
  );
}
