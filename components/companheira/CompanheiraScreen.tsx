'use client';
import React, { useState, useRef, useEffect } from 'react';
import { AREAS, TODAY } from '@/lib/data';
import { Hanko } from '@/components/ui/Hanko';
import { IcSend } from '@/components/ui/icons';

// ── Respostas contextuais (mock) ──────────────────────────────────────────────
const respostaPara = (msg: string): string[] => {
  const m = msg.toLowerCase();

  if (/(semana|planej)/.test(m)) return [
    'Olha, sua semana tá com forma. Profissional puxando forte (82%) — provavelmente porque Atlas e Boreal tão concorrendo. Saúde firme em 74% por causa da sequência de treino.',
    'Os pontos que merecem atenção: Social tá em 42%, Desenvolvimento em 18%. Sugestão concreta: bloqueie 30min hoje à noite pra ligar pros pais (já tá na agenda às 20:30) e marque algo de meditação ou leitura pra quarta. Quer que eu monte a agenda?',
  ];

  if (/(abandon|esquec|negligenc|qual.+rea)/.test(m)) return [
    'A mais negligenciada agora é Desenvolvimento — 9 dias sem atividade, 18% nutrida. Você marcou no check-in de quinta passada que queria voltar pra meditação, e isso ficou pra trás.',
    'Não é cobrança. É observação. Quer que a gente desenhe um próximo passo bem pequeno aí — tipo só agendar a sessão, sem nada mais?',
  ];

  if (/(travad|preso|paralis|sem.nimo|cansad)/.test(m)) return [
    'Faz sentido. Você marcou energia 4 hoje, mas tá vindo de uma semana com Boreal pesando. Cansaço acumulado é real.',
    'Quando você diz travado, é mais "não sei o que fazer" ou "sei mas não tô conseguindo começar"? A resposta muda o caminho.',
  ];

  if (/(prioridad|hoje|3 coisas)/.test(m)) return [
    'Suas três pra hoje: 1) corte por segmento da Atlas pra Clara (profissional), 2) lista 4 de Estatística II — regressão (faculdade), 3) treino A — peito e tríceps (saúde, já feito ✓).',
    'Se eu fosse sugerir uma ordem: faz a Atlas de manhã com energia fresca, almoça, e a estatística depois do 1:1 das 14h. O treino tá feito — celebra essa.',
  ];

  if (/(driva|trabalh|profission|mover|feimec)/.test(m)) return [
    'No profissional você tá com 3 frentes abertas: lookalike Atlas (65% feito, vence dia 7), limpeza Boreal (30%, vence 12), e o manual de CS (15%, vence 30).',
    'A Atlas é a que mais aperta. Quer que a gente quebre o que falta nela em 3 blocos?',
  ];

  if (/(treino|saúde|saude|skincare|sono)/.test(m)) return [
    'Saúde tá viva. Treino em 12 dias de streak (sua maior sequência do ano), skincare AM em 8 dias. O PM de skincare ainda tá oscilando — só 4 dias.',
    'Costuma ser o cansaço da noite que faz cair, ou esquecimento mesmo? Se for esquecimento, posso te lembrar às 22h.',
  ];

  if (/(obrigad|valeu|brigad)/.test(m)) return ['imagina. tô aqui sempre que precisar.'];

  if (/(boa noite|tchau|até)/.test(m)) return ['boa noite, Lucca. lembra de fechar o dia quando der.'];

  if (/(ajuda|ajud|socorro)/.test(m)) return [
    'Tô aqui. Me conta um pouco mais — é sobre o dia de hoje, a semana, ou algo que tá rondando há mais tempo?',
  ];

  return [
    'Me conta mais. Tô tentando entender se isso conecta com alguma das suas áreas — ou se é algo que ainda não cabe em nenhuma.',
    'Você pode me dizer também: tá pedindo pra eu te ajudar a pensar, ou pra te ajudar a fazer?',
  ];
};

const SUGESTOES = [
  'me ajuda a planejar a semana',
  'tô me sentindo travado em desenvolvimento',
  'qual área tô abandonando?',
  'me lembra das prioridades de hoje',
];

interface Message {
  role: 'ai' | 'me';
  text: string;
  time: string;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ── Bubbles ───────────────────────────────────────────────────────────────────
const Bubble = ({ m }: { m: Message }) => {
  const me = m.role === 'me';
  return (
    <div style={{
      display: 'flex',
      justifyContent: me ? 'flex-end' : 'flex-start',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      {!me && (
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          <Hanko size={32} label="話" />
        </div>
      )}
      <div style={{
        maxWidth: '70%',
        background: me ? 'var(--ink)' : 'rgba(255,253,247,0.9)',
        color: me ? 'var(--washi)' : 'var(--char)',
        border: me ? 'none' : '1px solid rgba(27,54,93,0.10)',
        padding: '12px 16px',
        borderRadius: me ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
        fontSize: 14,
        lineHeight: 1.6,
      }}>
        {m.text}
        <div style={{
          fontSize: 10,
          color: me ? 'rgba(245,239,224,0.50)' : 'var(--char-mute)',
          marginTop: 6,
          letterSpacing: '0.05em',
        }}>
          {m.time}
        </div>
      </div>
    </div>
  );
};

const ThinkingBubble = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <Hanko size={32} label="話" />
    <div style={{
      background: 'rgba(255,253,247,0.9)',
      border: '1px solid rgba(27,54,93,0.10)',
      padding: '14px 18px',
      borderRadius: '2px 12px 12px 12px',
      display: 'flex',
      gap: 5,
      alignItems: 'center',
    }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <span key={i} style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'var(--ink-mist)',
          display: 'inline-block',
          animation: `drift 1.2s ${d}s ease-in-out infinite`,
          opacity: 0.6,
        }} />
      ))}
    </div>
  </div>
);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CompanheiraScreen() {
  const introText = `Bom dia, Lucca. Vi que você fez check-in com energia 4 e definiu sua intenção como "${TODAY.intencao}" Suas três vitórias de hoje são Atlas, lista 4 de estatística, e o treino A. Quer que a gente desenhe a ordem do dia juntos, ou prefere conversar sobre alguma área?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: introText, time: '08:42' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (txt?: string) => {
    const t = (txt ?? input).trim();
    if (!t) return;
    const time = now();
    setMessages(m => [...m, { role: 'me', text: t, time }]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const replies = respostaPara(t);
      const replyTime = now();
      replies.forEach((r, idx) => {
        setTimeout(() => {
          setMessages(m => [...m, { role: 'ai', text: r, time: replyTime }]);
          if (idx === replies.length - 1) setThinking(false);
        }, idx * 700);
      });
    }, 900);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showSuggestions = messages.length <= 2;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 56px 0',
      maxWidth: 920,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28, flexShrink: 0 }}>
        <div style={{
          fontSize: 10, color: 'var(--char-mute)',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          uma presença que escuta
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Companheira
          </h1>
          <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>
            伴走
          </span>
        </div>
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 8,
        }}
      >
        {messages.map((m, i) => <Bubble key={i} m={m} />)}
        {thinking && <ThinkingBubble />}
      </div>

      {/* Suggestion pills */}
      {showSuggestions && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          padding: '12px 0 10px',
          flexShrink: 0,
        }}>
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid rgba(27,54,93,0.15)',
                background: 'rgba(255,253,247,0.7)',
                color: 'var(--char-soft)',
                fontSize: 12,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(27,54,93,0.35)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--char)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(27,54,93,0.15)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--char-soft)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{
        flexShrink: 0,
        marginBottom: 24,
        marginTop: showSuggestions ? 0 : 8,
        padding: '12px 16px',
        borderRadius: 6,
        border: '1px solid rgba(27,54,93,0.15)',
        background: 'rgba(255,253,247,0.75)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="conta pra mim…"
          rows={1}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            resize: 'none',
            fontSize: 14,
            color: 'var(--char)',
            lineHeight: 1.5,
            minHeight: 22,
            maxHeight: 120,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim()}
          style={{
            width: 36, height: 36,
            borderRadius: 4,
            background: input.trim() ? 'var(--ink)' : 'rgba(27,54,93,0.08)',
            color: input.trim() ? 'var(--washi)' : 'var(--char-mute)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            cursor: input.trim() ? 'pointer' : 'default',
          }}
        >
          <IcSend size={14} stroke={input.trim() ? 'var(--washi)' : 'var(--char-mute)'} />
        </button>
      </div>
    </div>
  );
}
