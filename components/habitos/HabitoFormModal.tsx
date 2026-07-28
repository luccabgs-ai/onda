'use client';
import React, { useState } from 'react';
import { AncoraTipo, Habito } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { DOW_LABELS, TODOS_OS_DIAS } from '@/lib/nutricao';
import { IcClose, IcArrowR, IcSun, IcMoon, IcHabito } from '@/components/ui/icons';

interface HabitoFormModalProps {
  habito?: Habito;
  habitosExistentes: Habito[];
  onClose: () => void;
  onSave: (data: {
    identidade: string;
    areaId: string;
    acao: string;
    metaAtual: string;
    ancoraTipo: AncoraTipo;
    ancoraHabitoId?: string;
    ancoraTexto?: string;
    diasSemana: number[];
    horario?: string;
    local?: string;
  }) => void;
}

const DIAS_UTEIS = [1, 2, 3, 4, 5];
const FIM_DE_SEMANA = [0, 6];

const mesmoConjunto = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,253,247,0.7)',
  border: '1px solid rgba(27,54,93,0.15)',
  borderRadius: 4,
  fontSize: 15,
  color: 'var(--char)',
  fontFamily: 'inherit',
};

export default function HabitoFormModal({ habito, habitosExistentes, onClose, onSave }: HabitoFormModalProps) {
  const isEdit = !!habito;
  const [step, setStep] = useState(0);
  const [identidade, setIdentidade] = useState(habito?.identidade ?? '');
  const [areaId, setAreaId] = useState(habito?.areaId ?? '');
  const [acao, setAcao] = useState(habito?.acao ?? '');
  const [meta, setMeta] = useState(habito?.metaAtual ?? '');
  const [ancoraTipo, setAncoraTipo] = useState<AncoraTipo>(habito?.ancoraTipo ?? 'nenhuma');
  const [ancoraHabitoId, setAncoraHabitoId] = useState<string | undefined>(habito?.ancoraHabitoId);
  const [ancoraTexto, setAncoraTexto] = useState(habito?.ancoraTexto ?? '');
  const [diasSemana, setDiasSemana] = useState<number[]>(habito?.diasSemana ?? TODOS_OS_DIAS);
  const [horario, setHorario] = useState(habito?.horario ?? '');
  const [local, setLocal] = useState(habito?.local ?? '');

  const opcoesHabito = habitosExistentes.filter(h => h.id !== habito?.id);

  const steps = [
    { kind: 'identidade', q: 'Que tipo de pessoa você quer ser?', sub: 'Um hábito é, antes de tudo, um voto para essa identidade.' },
    { kind: 'area', q: 'Qual Área da sua vida esse voto nutre?', sub: 'Cada voto cumprido fortalece o eixo correspondente na Bússola.' },
    { kind: 'acao', q: 'Qual a evidência concreta desse voto?', sub: 'A ação do dia — pequena, específica. Ela é secundária à identidade, mas é o que você de fato faz.' },
    { kind: 'frequencia', q: 'Em quais dias esse voto acontece?', sub: 'Todo dia, alguns dias fixos da semana — o que fizer sentido pra esse hábito.' },
    { kind: 'ancora', q: 'Onde esse hábito se pendura?', sub: '"Depois de [âncora], eu faço [hábito]." Pode pendurar num momento do Ritual, ou deixar livre.' },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  const canAdvance = () => {
    if (cur.kind === 'identidade') return identidade.trim().length > 0;
    if (cur.kind === 'area') return areaId.length > 0;
    if (cur.kind === 'acao') return acao.trim().length > 0 && meta.trim().length > 0;
    if (cur.kind === 'frequencia') return diasSemana.length > 0;
    if (cur.kind === 'ancora') {
      if (ancoraTipo === 'habito') return !!ancoraHabitoId;
      if (ancoraTipo === 'outro') return ancoraTexto.trim().length > 0;
      return true;
    }
    return true;
  };

  const toggleDia = (d: number) => {
    setDiasSemana(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  };

  const next = () => {
    if (last) {
      onSave({
        identidade: identidade.trim(),
        areaId,
        acao: acao.trim(),
        metaAtual: meta.trim(),
        ancoraTipo,
        ancoraHabitoId: ancoraTipo === 'habito' ? ancoraHabitoId : undefined,
        ancoraTexto: ancoraTipo === 'outro' ? ancoraTexto.trim() : undefined,
        diasSemana,
        horario: horario.trim() || undefined,
        local: local.trim() || undefined,
      });
    } else {
      setStep(step + 1);
    }
  };

  const selectedArea = AREAS.find(a => a.id === areaId);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,38,74,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--washi)',
          border: '1px solid rgba(27,54,93,0.18)',
          borderRadius: 8,
          width: 'min(620px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px -20px rgba(20,38,74,0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(245,239,224,0.5)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {isEdit ? 'editar hábito' : 'novo voto'}
            </div>
            <h3 className="serif" style={{ fontSize: 20, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? 'Editar hábito' : 'Criar hábito'}
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 4, border: '1px solid rgba(27,54,93,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-soft)' }}>
            <IcClose size={14} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ padding: '14px 28px 0', display: 'flex', gap: 6, flexShrink: 0 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i <= step ? 'var(--ink)' : 'rgba(27,54,93,0.12)', borderRadius: 999, transition: 'background 0.35s' }} />
          ))}
        </div>

        {/* Body */}
        <div key={step} style={{ padding: '28px 32px 8px', minHeight: 280, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            passo {step + 1} de {steps.length}
          </div>
          <h2 className="serif" style={{ fontSize: 26, color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500, lineHeight: 1.25, fontStyle: 'italic' }}>
            {cur.q}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--char-soft)', margin: '0 0 24px', lineHeight: 1.6 }}>
            {cur.sub}
          </p>

          {cur.kind === 'identidade' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--char-mute)', marginBottom: 8 }}>Ser alguém que…</div>
              <input
                autoFocus
                value={identidade}
                onChange={e => setIdentidade(e.target.value.startsWith('Ser alguém que') ? e.target.value : `Ser alguém que ${e.target.value.replace(/^ser alguém que\s*/i, '')}`)}
                placeholder="Ser alguém que cuida da saúde"
                style={inputStyle}
              />
            </div>
          )}

          {cur.kind === 'area' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AREAS.map(area => {
                const active = areaId === area.id;
                return (
                  <button
                    key={area.id}
                    onClick={() => setAreaId(area.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 999,
                      fontSize: 13, fontWeight: 500,
                      border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                      background: active ? area.color : 'transparent',
                      color: active ? 'white' : 'var(--char-soft)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.8)' : area.color }} />
                    {area.name}
                  </button>
                );
              })}
            </div>
          )}

          {cur.kind === 'acao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 6 }}>A ação</div>
                <input
                  autoFocus
                  value={acao}
                  onChange={e => setAcao(e.target.value)}
                  placeholder="Treinar"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 6 }}>Meta inicial — pequena, sem pressa</div>
                <input
                  value={meta}
                  onChange={e => setMeta(e.target.value)}
                  placeholder="30 minutos"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 6 }}>Horário — opcional</div>
                  <input
                    type="time"
                    value={horario}
                    onChange={e => setHorario(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 6 }}>Local — opcional</div>
                  <input
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    placeholder="Academia"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {cur.kind === 'frequencia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Todo dia', dias: TODOS_OS_DIAS },
                  { label: 'Dias de semana', dias: DIAS_UTEIS },
                  { label: 'Fim de semana', dias: FIM_DE_SEMANA },
                ].map(preset => {
                  const active = mesmoConjunto(diasSemana, preset.dias);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setDiasSemana(preset.dias)}
                      style={{
                        padding: '8px 14px', borderRadius: 999,
                        fontSize: 12.5, fontWeight: 500,
                        border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--washi)' : 'var(--char-soft)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 10 }}>ou escolha os dias</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DOW_LABELS.map((label, d) => {
                    const active = diasSemana.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDia(d)}
                        title={label}
                        style={{
                          width: 40, height: 40, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                          border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                          background: active ? 'var(--ink)' : 'transparent',
                          color: active ? 'var(--washi)' : 'var(--char-soft)',
                          cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
                        }}
                      >
                        {label.slice(0, 1).toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: 0, fontStyle: 'italic' }}>
                {diasSemana.length === 0
                  ? 'escolha ao menos um dia'
                  : diasSemana.length === 7
                    ? 'esse voto é esperado todo dia'
                    : `esse voto é esperado: ${[...diasSemana].sort().map(d => DOW_LABELS[d]).join(', ')}`}
              </p>
            </div>
          )}

          {cur.kind === 'ancora' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setAncoraTipo('ritual_manha')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                  border: ancoraTipo === 'ritual_manha' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: ancoraTipo === 'ritual_manha' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <IcSun size={16} stroke="var(--ink)" />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Depois do Ritual da manhã</div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>logo após abrir o dia</div>
                </div>
              </button>
              <button
                onClick={() => setAncoraTipo('ritual_noite')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                  border: ancoraTipo === 'ritual_noite' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: ancoraTipo === 'ritual_noite' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <IcMoon size={16} stroke="var(--ink)" />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Depois do Ritual da noite</div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>logo após fechar o dia</div>
                </div>
              </button>

              <button
                onClick={() => setAncoraTipo('habito')}
                disabled={opcoesHabito.length === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                  border: ancoraTipo === 'habito' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: ancoraTipo === 'habito' ? 'rgba(27,54,93,0.05)' : 'transparent',
                  opacity: opcoesHabito.length === 0 ? 0.45 : 1,
                  cursor: opcoesHabito.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <IcHabito size={16} stroke="var(--ink)" />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Depois de outro hábito</div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>
                    {opcoesHabito.length === 0 ? 'crie outro hábito primeiro pra poder empilhar' : 'empilha nesse hábito já existente'}
                  </div>
                </div>
              </button>

              {ancoraTipo === 'habito' && opcoesHabito.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 26 }}>
                  {opcoesHabito.map(h => {
                    const active = ancoraHabitoId === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setAncoraHabitoId(h.id)}
                        style={{
                          padding: '7px 14px', borderRadius: 999,
                          fontSize: 12.5, fontWeight: 500,
                          border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                          background: active ? 'var(--ink)' : 'transparent',
                          color: active ? 'var(--washi)' : 'var(--char-soft)',
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                      >
                        {h.acao}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setAncoraTipo('outro')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                  border: ancoraTipo === 'outro' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: ancoraTipo === 'outro' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Outro</div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>escreva a âncora do seu jeito</div>
                </div>
              </button>

              {ancoraTipo === 'outro' && (
                <input
                  autoFocus
                  value={ancoraTexto}
                  onChange={e => setAncoraTexto(e.target.value)}
                  placeholder="ex: depois de escovar os dentes"
                  style={{ ...inputStyle, marginLeft: 26, width: 'calc(100% - 26px)' }}
                />
              )}

              <button
                onClick={() => setAncoraTipo('nenhuma')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                  border: ancoraTipo === 'nenhuma' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: ancoraTipo === 'nenhuma' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Sem âncora por enquanto</div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>vota quando lembrar</div>
                </div>
              </button>
            </div>
          )}

          {cur.kind === 'identidade' && identidade.trim() && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 14, fontStyle: 'italic' }}>
              preview: <span style={{ color: selectedArea?.color ?? 'var(--ink)' }}>{identidade}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(27,54,93,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{ fontSize: 12, color: 'var(--char-mute)', padding: '6px 8px' }}>
            {step === 0 ? 'cancelar' : '← voltar'}
          </button>
          <button
            disabled={!canAdvance()}
            onClick={next}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px',
              background: canAdvance() ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
              color: 'var(--washi)', borderRadius: 4,
              fontSize: 13, fontWeight: 500,
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
            }}
          >
            {last ? (isEdit ? 'Salvar' : 'Criar hábito') : 'continuar'}
            <IcArrowR size={14} stroke="var(--washi)" />
          </button>
        </div>
      </div>
    </div>
  );
}
