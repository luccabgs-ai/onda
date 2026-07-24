'use client';
import React, { useState } from 'react';
import { IcSun, IcMoon, IcClose, IcArrowR, IcCheck } from '@/components/ui/icons';
import { EnergyScale } from '@/components/hoje/EnergyScale';

interface RitualFormProps {
  kind: 'morning' | 'evening';
  onClose: () => void;
  onSubmit: () => void;
}

const ritualInput: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,253,247,0.7)',
  border: '1px solid rgba(27,54,93,0.15)',
  borderRadius: 4,
  fontSize: 15,
  color: 'var(--char)',
  fontFamily: 'inherit',
  resize: 'none',
};

const PetalRipple = () => (
  <div style={{ position: 'relative', width: 80, height: 80 }}>
    <svg width="80" height="80" viewBox="0 0 80 80">
      {[0, 0.6, 1.2].map((d, i) => (
        <circle key={i} cx="40" cy="40" r="14" fill="none"
          stroke="var(--hanko)" strokeWidth="1" opacity="0"
          style={{
            animation: `ripple 2.4s ${d}s ease-out infinite`,
            transformOrigin: '40px 40px',
          }} />
      ))}
      <g transform="translate(40 40)">
        <path d="M0 -16 C 6 -10, 6 6, 0 14 C -6 6, -6 -10, 0 -16 Z" fill="var(--hanko)" opacity="0.85" />
      </g>
    </svg>
  </div>
);

export default function RitualForm({ kind, onClose, onSubmit }: RitualFormProps) {
  const morning = kind === 'morning';
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [vit, setVit] = useState(['', '', '']);
  const [done, setDone] = useState(false);

  const cfg = morning
    ? {
        title: 'Check-in matinal',
        jp: '朝の儀式',
        steps: [
          { kind: 'energy', q: 'Como você acordou hoje?', sub: 'Sem julgamento. Só observa.' },
          { kind: 'text',   q: 'Qual sua intenção pro dia?', sub: 'Uma frase. A âncora pra quando o dia tentar te puxar.' },
          { kind: 'three',  q: 'Quais 3 coisas seriam vitória hoje?', sub: 'Seja específico. Pequenas vitórias contam.' },
        ],
      }
    : {
        title: 'Check-out noturno',
        jp: '夜の儀式',
        steps: [
          { kind: 'energy', q: 'Como foi o dia?', sub: 'Olhando pra trás, agora.' },
          { kind: 'text',   q: 'O que funcionou?', sub: 'Vale tudo — uma decisão, uma pausa, uma pessoa.' },
          { kind: 'text2',  q: 'O que carrega pra amanhã?', sub: 'Algo que ficou pendente, ou uma intenção que continua.' },
        ],
      };

  const cur = cfg.steps[step];
  const last = step === cfg.steps.length - 1;

  const next = () => {
    if (last) {
      setDone(true);
      setTimeout(() => onSubmit(), 1900);
    } else {
      setStep(step + 1);
    }
  };

  const canAdvance = () => {
    if (cur.kind === 'energy') return true;
    if (cur.kind === 'text')   return text1.trim().length > 0;
    if (cur.kind === 'text2')  return text2.trim().length > 0;
    if (cur.kind === 'three')  return vit.every(v => v.trim().length > 0);
    return true;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20,38,74,0.55)',
      backdropFilter: 'blur(4px)',
      zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{
        background: 'var(--washi)',
        border: '1px solid rgba(27,54,93,0.18)',
        borderRadius: 8,
        width: 'min(640px, 100%)',
        position: 'relative',
        boxShadow: '0 30px 80px -20px rgba(20,38,74,0.45)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: morning ? 'rgba(245,239,224,0.5)' : 'rgba(27,54,93,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {morning
              ? <IcSun size={18} stroke="var(--ink)" />
              : <IcMoon size={18} stroke="var(--ink)" />
            }
            <div>
              <div style={{
                fontSize: 11, color: 'var(--char-mute)',
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                {cfg.jp}
              </div>
              <h3 className="serif" style={{ fontSize: 20, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
                {cfg.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 4,
              border: '1px solid rgba(27,54,93,0.10)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--char-soft)',
            }}
          >
            <IcClose size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '14px 28px 0', display: 'flex', gap: 6 }}>
          {cfg.steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2,
              background: i <= step ? 'var(--ink)' : 'rgba(27,54,93,0.12)',
              borderRadius: 999,
              transition: 'background 0.35s',
            }} />
          ))}
        </div>

        {/* Step body */}
        {!done && (
          <div key={step} style={{ padding: '28px 32px 8px', minHeight: 280 }}>
            <div style={{
              fontSize: 11, color: 'var(--char-mute)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              passo {step + 1} de {cfg.steps.length}
            </div>
            <h2 className="serif" style={{
              fontSize: 30, color: 'var(--ink)',
              margin: '0 0 8px', fontWeight: 500,
              lineHeight: 1.2, fontStyle: 'italic',
            }}>
              {cur.q}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--char-soft)', margin: '0 0 24px' }}>
              {cur.sub}
            </p>

            {cur.kind === 'energy' && (
              <EnergyScale value={energy} onChange={setEnergy} />
            )}
            {cur.kind === 'text' && (
              <textarea
                autoFocus
                value={text1}
                onChange={e => setText1(e.target.value)}
                placeholder="Escreve aqui…"
                rows={3}
                style={ritualInput}
              />
            )}
            {cur.kind === 'text2' && (
              <textarea
                autoFocus
                value={text2}
                onChange={e => setText2(e.target.value)}
                placeholder="Escreve aqui…"
                rows={3}
                style={ritualInput}
              />
            )}
            {cur.kind === 'three' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vit.map((v, i) => (
                  <input
                    key={i}
                    autoFocus={i === 0}
                    value={v}
                    onChange={e => { const c = [...vit]; c[i] = e.target.value; setVit(c); }}
                    placeholder={['primeira vitória…', 'segunda…', 'terceira…'][i]}
                    style={{ ...ritualInput, padding: '12px 14px' } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Done state */}
        {done && (
          <div style={{
            padding: '60px 32px',
            textAlign: 'center',
            minHeight: 280,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <PetalRipple />
            <div className="serif" style={{
              fontSize: 28, color: 'var(--ink)',
              marginTop: 24, fontStyle: 'italic', fontWeight: 500,
            }}>
              feito.
            </div>
            <div style={{ fontSize: 13, color: 'var(--char-soft)', marginTop: 6 }}>
              {morning ? 'a manhã agora carrega sua intenção.' : 'descanse — amanhã segue.'}
            </div>
          </div>
        )}

        {/* Footer */}
        {!done && (
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid rgba(27,54,93,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              style={{ fontSize: 12, color: 'var(--char-mute)', padding: '6px 8px' }}
            >
              {step === 0 ? 'cancelar' : '← voltar'}
            </button>
            <button
              disabled={!canAdvance()}
              onClick={next}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px',
                background: canAdvance() ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
                color: 'var(--washi)',
                borderRadius: 4,
                fontSize: 13, fontWeight: 500,
                transition: 'all 0.2s',
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
              }}
            >
              {last ? (morning ? 'começar o dia' : 'fechar o dia') : 'continuar'}
              <IcArrowR size={14} stroke="var(--washi)" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
