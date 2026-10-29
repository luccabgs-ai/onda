'use client';
import React, { useState } from 'react';
import { Habito, RitualRegistro } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { toDateStr } from '@/lib/nutricao';
import { IcSun, IcMoon, IcCheck, IcArrowR } from '@/components/ui/icons';
import { Card } from '@/components/ui/Card';
import RitualForm, { RitualRespostas } from './RitualForm';

const ENERGY_LABELS = ['exausto', 'baixa', 'morna', 'firme', 'cheia'];

// ── Energy bars (vertical) ────────────────────────────────────────────────────
const EnergyBars = ({ value }: { value: number }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <div
        key={n}
        style={{
          width: 5,
          height: 14,
          borderRadius: 1,
          background: n <= value ? 'var(--ink)' : 'rgba(27,54,93,0.12)',
        }}
      />
    ))}
  </div>
);

// ── Ritual card (manhã / noite) ───────────────────────────────────────────────
const RitualCard = ({
  kind,
  done,
  onStart,
  anchoredHabitos,
}: {
  kind: 'morning' | 'evening';
  done: boolean;
  onStart: () => void;
  anchoredHabitos: Habito[];
}) => {
  const morning = kind === 'morning';

  return (
    <Card style={{ padding: '28px 30px', position: 'relative', overflow: 'hidden', minHeight: 200 }}>
      {/* Night wave background */}
      {!morning && (
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0.05, pointerEvents: 'none',
          }}
        >
          <path d="M0 160 C 80 145, 160 175, 240 160 S 400 150, 400 160 L 400 200 L 0 200 Z" fill="var(--ink)" />
          <path d="M0 175 C 80 160, 160 190, 240 175 S 400 165, 400 175 L 400 200 L 0 200 Z" fill="var(--ink)" opacity="1.5" />
          <circle cx="340" cy="50" r="20" fill="none" stroke="var(--ink)" strokeWidth="0.8" opacity="3" />
        </svg>
      )}

      {/* Moon circle decoration (noite only) */}
      {!morning && (
        <div style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: '50%',
          border: '1px solid rgba(27,54,93,0.15)',
          opacity: 0.5,
        }} />
      )}

      <div style={{ position: 'relative' }}>
        {/* Header label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {morning
            ? <IcSun size={15} stroke="var(--ink)" sw={1.5} />
            : <IcMoon size={15} stroke="var(--ink)" sw={1.5} />
          }
          <div style={{
            fontSize: 11, color: 'var(--ink)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            {morning ? 'manhã' : 'noite'}
          </div>
        </div>

        {/* Title */}
        <h3 className="serif" style={{
          fontSize: 26, color: 'var(--ink)',
          margin: '0 0 10px', fontWeight: 500, fontStyle: 'italic',
        }}>
          {morning ? 'Abrir o dia' : 'Fechar o dia'}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 13.5, color: 'var(--char-soft)',
          lineHeight: 1.6, margin: '0 0 22px', maxWidth: 360,
        }}>
          {morning
            ? '3 perguntas pra entrar no dia com clareza: como você acordou, qual sua intenção, e que vitórias contariam.'
            : '3 perguntas pra processar o dia: o que funcionou, o que travou, e o que continua amanhã.'}
        </p>

        {done ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--moss)',
          }}>
            <IcCheck size={15} stroke="var(--moss)" sw={2} /> feito hoje
          </div>
        ) : (
          <button
            onClick={onStart}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: 'var(--ink)', color: 'var(--washi)',
              borderRadius: 5,
              fontSize: 13, fontWeight: 500,
              transition: 'opacity 0.2s',
            }}
          >
            Começar <IcArrowR size={14} stroke="var(--washi)" />
          </button>
        )}

        {anchoredHabitos.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(27,54,93,0.08)' }}>
            <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
              ancorados aqui
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {anchoredHabitos.map(h => {
                const area = AREAS.find(a => a.id === h.areaId);
                return (
                  <span key={h.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, padding: '3px 9px', borderRadius: 999,
                    background: `${area?.color ?? 'var(--ink)'}14`,
                    color: area?.color ?? 'var(--ink)', fontWeight: 500,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: area?.color ?? 'var(--ink)' }} />
                    {h.acao}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Timeline row ──────────────────────────────────────────────────────────────
// Um dia do histórico: o registro da manhã e/ou da noite daquele dia.
interface DiaVista {
  data: string; // 'YYYY-MM-DD'
  manha?: RitualRegistro;
  noite?: RitualRegistro;
}

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DOW_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const TimelineRow = ({ dia }: { dia: DiaVista }) => {
  const d = new Date(dia.data + 'T12:00:00');
  const energia = dia.noite?.energia ?? dia.manha?.energia ?? 0;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Date column */}
      <div style={{ width: 54, flexShrink: 0, textAlign: 'right', paddingTop: 2 }}>
        <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1, fontWeight: 500 }}>
          {d.getDate()} {MESES_ABREV[d.getMonth()]}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--char-mute)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2,
        }}>
          {DOW_ABREV[d.getDay()]}
        </div>
      </div>

      {/* Timeline dot */}
      <div style={{ position: 'relative', width: 28, flexShrink: 0, paddingTop: 5, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--washi)',
          border: '1.5px solid rgba(27,54,93,0.30)',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 28 }}>
        {/* Energy */}
        {energia > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EnergyBars value={energia} />
            <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>
              energia · {ENERGY_LABELS[energia - 1]}
            </div>
          </div>
        )}

        {/* Intention */}
        {dia.manha?.intencao && (
          <p className="serif" style={{
            fontSize: 16, color: 'var(--char)',
            margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.4,
          }}>
            &ldquo;{dia.manha.intencao}&rdquo;
          </p>
        )}

        {/* funcionou + carrega */}
        {dia.noite && (
          <div style={{ display: 'flex', gap: 32, fontSize: 12, color: 'var(--char-soft)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--moss)', fontWeight: 500 }}>funcionou · </span>
              {dia.noite.funcionou}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--hanko)', fontWeight: 500 }}>carrega · </span>
              {dia.noite.carrega}
            </div>
          </div>
        )}
        {!dia.noite && (
          <div style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic' }}>
            sem check-out noturno nesse dia
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
interface RitualScreenProps {
  habitsStore: ReturnType<typeof useHabitsStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
}

export default function RitualScreen({ habitsStore, rituaisStore, projectsStore, calendarStore }: RitualScreenProps) {
  const [ritualKind, setRitualKind] = useState<'morning' | 'evening' | null>(null);

  const { registros, salvarRitual, registroDe } = rituaisStore;
  const hojeStr = toDateStr(new Date());
  const manhaFeita = !!registroDe(hojeStr, 'manha');
  const noiteFeita = !!registroDe(hojeStr, 'noite');

  const handleSubmit = (respostas: RitualRespostas) => {
    if (ritualKind) {
      salvarRitual({
        data: hojeStr,
        tipo: ritualKind === 'morning' ? 'manha' : 'noite',
        ...respostas,
      });
    }
    setRitualKind(null);
  };

  // Agrupa manhã e noite do mesmo dia numa linha só, mais recente primeiro, últimos 7 dias com registro.
  const dias: DiaVista[] = [];
  for (const r of [...registros].sort((a, b) => b.data.localeCompare(a.data))) {
    let dia = dias.find(d => d.data === r.data);
    if (!dia && dias.length >= 7) continue;
    if (!dia) { dia = { data: r.data }; dias.push(dia); }
    if (r.tipo === 'manha') dia.manha = r;
    else if (r.tipo === 'noite') dia.noite = r;
  }

  const habitosManha = habitsStore.habitos.filter(h => h.ancoraTipo === 'ritual_manha');
  const habitosNoite = habitsStore.habitos.filter(h => h.ancoraTipo === 'ritual_noite');

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 1080, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10, color: 'var(--char-mute)',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          o coração do app
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Ritual
          </h1>
          <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>
            儀式
          </span>
        </div>
        <p style={{
          fontSize: 14, color: 'var(--char-soft)',
          maxWidth: 560, marginTop: 12, lineHeight: 1.65,
        }}>
          Duas pausas curtas — uma na abertura do dia, outra no fechamento. É aqui que o app deixa
          de ser ferramenta e vira companhia.{' '}
          <em>Nenhum app organiza você se você nunca senta com ele.</em>
        </p>
      </div>

      {/* Two ritual cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 56 }}>
        <RitualCard kind="morning" done={manhaFeita} onStart={() => setRitualKind('morning')} anchoredHabitos={habitosManha} />
        <RitualCard kind="evening" done={noiteFeita} onStart={() => setRitualKind('evening')} anchoredHabitos={habitosNoite} />
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 10, color: 'var(--char-mute)',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          os últimos sete dias
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 className="serif" style={{ fontSize: 28, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Histórico
          </h2>
          <span className="jp" style={{ fontSize: 14, color: 'var(--char-mute)', opacity: 0.7 }}>
            記録
          </span>
        </div>
      </div>

      {/* Timeline list */}
      {dias.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', marginTop: 24 }}>
          nenhum ritual registrado ainda — o histórico nasce no primeiro check-in.
        </p>
      ) : (
        <div style={{ position: 'relative', marginTop: 24 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: 68,
            top: 6,
            bottom: 6,
            width: 1,
            background: 'linear-gradient(to bottom, transparent, rgba(27,54,93,0.18), transparent)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {dias.map(dia => (
              <TimelineRow key={dia.data} dia={dia} />
            ))}
          </div>
        </div>
      )}

      {/* Ritual form modal */}
      {ritualKind && (
        <RitualForm
          kind={ritualKind}
          onClose={() => setRitualKind(null)}
          onSubmit={handleSubmit}
          hoje={hojeStr}
          eventos={calendarStore.events}
          tasks={projectsStore.tasks}
          projects={projectsStore.projects}
          habitos={habitsStore.habitos}
        />
      )}
    </div>
  );
}
