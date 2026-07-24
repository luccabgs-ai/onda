'use client';
import React, { useState, useEffect, useRef } from 'react';
import { CronometroPreset } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao } from '@/lib/cronometroSessaoStore';
import { CronometroClock } from './CronometroClock';
import CronometroFormModal from './CronometroFormModal';
import { Card } from '@/components/ui/Card';
import { IcTimer, IcEdit, IcTrash, IcArrowR } from '@/components/ui/icons';

interface Props {
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
}

function formatarDuracao(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

function formatMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function PresetCard({
  preset, onStart, onEdit, onDelete,
}: {
  preset: CronometroPreset;
  onStart: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const area = AREAS.find(a => a.id === preset.areaId);
  const color = area?.color ?? 'var(--ink)';
  const totalMin = duracaoTotalMin(preset.fases);
  const rounds = preset.fases.filter(f => f.tipo === 'foco').length;
  const focoFase = preset.fases.find(f => f.tipo === 'foco');
  const descansoFase = preset.fases.find(f => f.tipo === 'descanso');

  return (
    <Card
      onClick={onStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{
        padding: '16px 18px',
        cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
        position: 'relative',
        transition: 'transform 0.12s, box-shadow 0.12s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 20px -8px rgba(20,38,74,0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 500, marginBottom: 4 }}>
            {preset.nome}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>
            {rounds > 1
              ? `${rounds}× ${focoFase?.minutos}min/${descansoFase?.minutos ?? 0}min · ${formatarDuracao(totalMin)} no total`
              : `${formatarDuracao(totalMin)} de foco`}
            {area && ` · ${area.name}`}
          </div>
        </div>

        {(onEdit || onDelete) && hovered ? (
          confirmDelete ? (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>apagar?</span>
              <button onClick={() => onDelete?.()} style={{ fontSize: 11, fontWeight: 600, color: 'var(--hanko)', padding: '2px 6px' }}>sim</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, color: 'var(--char-mute)', padding: '2px 6px' }}>não</button>
            </div>
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              {onEdit && (
                <button onClick={onEdit} title="editar" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)' }}>
                  <IcEdit size={13} stroke="var(--char-mute)" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => setConfirmDelete(true)} title="apagar" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hanko)' }}>
                  <IcTrash size={13} stroke="var(--hanko)" />
                </button>
              )}
            </div>
          )
        ) : (
          <IcArrowR size={15} stroke="var(--char-mute)" />
        )}
      </div>
    </Card>
  );
}

function CronometroRunner({
  preset, sessaoStore,
}: {
  preset: CronometroPreset;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
}) {
  const { sessao, pausar, retomar, avancarFase, reiniciarFase, parar } = sessaoStore;
  const [remainingMs, setRemainingMs] = useState(0);

  // Date.now() é impuro — não pode ser chamado durante o render. Ele mora só aqui dentro do
  // efeito, que recalcula o tempo restante a cada 250ms e guarda o resultado em estado puro.
  // Só exibe — avançar de fase e tocar o sino é responsabilidade do CronometroNotificacao,
  // que roda sempre (independente da tela ativa), não só enquanto esse componente tá montado.
  useEffect(() => {
    const tick = () => {
      if (!sessao) return;
      if (sessao.pausado) {
        setRemainingMs(sessao.pausadoRestanteMs ?? 0);
        return;
      }
      const remaining = new Date(sessao.faseTerminaEm).getTime() - Date.now();
      setRemainingMs(Math.max(0, remaining));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao]);

  if (!sessao) return null;

  const area = AREAS.find(a => a.id === preset.areaId);
  const color = area?.color ?? 'var(--ink)';
  const faseAtual = preset.fases[sessao.faseIndex];
  const faseDurMs = faseAtual.minutos * 60 * 1000;
  const progresso = 1 - remainingMs / faseDurMs;
  const isLastFase = sessao.faseIndex === preset.fases.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
        {preset.nome}
      </div>

      <CronometroClock
        size={320}
        progresso={progresso}
        tempoLabel={formatMMSS(remainingMs)}
        faseLabel={faseAtual.tipo === 'foco' ? 'Foco' : 'Descanso'}
        faseJp={faseAtual.tipo === 'foco' ? '集中' : '休憩'}
        color={color}
        paused={sessao.pausado}
      />

      {/* Indicador de rodadas */}
      {preset.fases.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          {preset.fases.map((f, i) => (
            <span
              key={i}
              title={f.tipo === 'foco' ? `Foco · ${f.minutos}min` : `Descanso · ${f.minutos}min`}
              style={{
                width: i === sessao.faseIndex ? 9 : 6,
                height: i === sessao.faseIndex ? 9 : 6,
                borderRadius: '50%',
                background: i <= sessao.faseIndex ? color : 'rgba(27,54,93,0.15)',
                opacity: i === sessao.faseIndex ? 1 : i < sessao.faseIndex ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <button
          onClick={() => (sessao.pausado ? retomar() : pausar())}
          style={{
            padding: '10px 26px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: color, color: 'white',
          }}
        >
          {sessao.pausado ? 'Retomar' : 'Pausar'}
        </button>
        <button
          onClick={() => reiniciarFase(preset)}
          style={{ padding: '10px 18px', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)', border: '1px solid rgba(27,54,93,0.18)' }}
        >
          Reiniciar fase
        </button>
        {!isLastFase && (
          <button
            onClick={() => avancarFase(preset)}
            style={{ padding: '10px 18px', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)', border: '1px solid rgba(27,54,93,0.18)' }}
          >
            Pular fase
          </button>
        )}
      </div>

      <button
        onClick={parar}
        style={{ marginTop: 18, fontSize: 12, color: 'var(--char-mute)', textDecoration: 'underline' }}
      >
        Encerrar sessão
      </button>
    </div>
  );
}

export default function CronometrosScreen({ cronometrosStore, sessaoStore }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CronometroPreset | null>(null);
  const [justCompleted, setJustCompleted] = useState<CronometroPreset | null>(null);

  const { presets, createPreset, updatePreset, deletePreset } = cronometrosStore;
  const { sessao, iniciar, parar } = sessaoStore;

  const presetAtivo = sessao ? presets.find(p => p.id === sessao.presetId) ?? null : null;

  // Detecta quando uma sessão termina naturalmente (chegou ao fim da última fase) pra mostrar
  // uma mensagem de conclusão em vez de voltar direto pra lista sem feedback nenhum.
  const prevSessaoRef = useRef(sessao);
  useEffect(() => {
    if (prevSessaoRef.current && !sessao) {
      const preset = presets.find(p => p.id === prevSessaoRef.current!.presetId);
      const eraUltimaFase = preset && prevSessaoRef.current!.faseIndex === preset.fases.length - 1;
      const restante = prevSessaoRef.current!.pausado
        ? prevSessaoRef.current!.pausadoRestanteMs ?? 1
        : new Date(prevSessaoRef.current!.faseTerminaEm).getTime() - Date.now();
      if (preset && eraUltimaFase && restante <= 250) setJustCompleted(preset);
    }
    prevSessaoRef.current = sessao;
  }, [sessao, presets]);

  const prontos = presets.filter(p => p.pronto);
  const customizados = presets.filter(p => !p.pronto);

  const handleSaveCreate = (data: { nome: string; fases: CronometroPreset['fases']; areaId?: string }) => {
    createPreset(data);
    setShowCreate(false);
  };

  const handleSaveEdit = (data: { nome: string; fases: CronometroPreset['fases']; areaId?: string }) => {
    if (editing) updatePreset(editing.id, data);
    setEditing(null);
  };

  if (justCompleted) {
    const area = AREAS.find(a => a.id === justCompleted.areaId);
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '70vh', justifyContent: 'center' }}>
        <span className="jp" style={{ fontSize: 34, color: area?.color ?? 'var(--ink)', marginBottom: 10 }}>了</span>
        <h2 className="serif" style={{ fontSize: 28, color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500, fontStyle: 'italic' }}>
          Sessão concluída
        </h2>
        <p style={{ fontSize: 14, color: 'var(--char-soft)', marginBottom: 24 }}>
          {justCompleted.nome} — {formatarDuracao(duracaoTotalMin(justCompleted.fases))} de dedicação.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setJustCompleted(null); iniciar(justCompleted); }}
            style={{ padding: '10px 22px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 999, fontSize: 13.5, fontWeight: 600 }}
          >
            Fazer de novo
          </button>
          <button
            onClick={() => setJustCompleted(null)}
            style={{ padding: '10px 22px', border: '1px solid rgba(27,54,93,0.18)', borderRadius: 999, fontSize: 13.5, color: 'var(--char-soft)' }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (sessao && presetAtivo) {
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
        <CronometroRunner preset={presetAtivo} sessaoStore={sessaoStore} />
      </div>
    );
  }

  // Sessão órfã — o preset foi apagado enquanto rodava.
  if (sessao && !presetAtivo) {
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--char-mute)', fontStyle: 'italic', marginBottom: 16 }}>
          O cronômetro dessa sessão não existe mais.
        </p>
        <button onClick={parar} style={{ padding: '8px 18px', border: '1px solid rgba(27,54,93,0.18)', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)' }}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
            tempo dedicado, com intenção
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>Cronômetros</h1>
            <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>集中</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--char-soft)', maxWidth: 560, marginTop: 12, lineHeight: 1.65 }}>
            Escolha um cronômetro pronto ou crie o seu — blocos de foco corridos, ou rodadas
            no estilo Pomodoro, com descanso entre elas.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500, flexShrink: 0 }}
        >
          + Novo cronômetro
        </button>
      </div>

      {/* Prontos */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 12 }}>
          Prontos pra começar
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {prontos.map(p => (
            <PresetCard key={p.id} preset={p} onStart={() => iniciar(p)} />
          ))}
        </div>
      </div>

      {/* Customizados */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 12 }}>
          Seus cronômetros
        </div>
        {customizados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, gap: 10, border: '1.5px dashed rgba(27,54,93,0.15)', borderRadius: 8 }}>
            <IcTimer size={28} stroke="var(--char-mute)" sw={1} />
            <div style={{ fontSize: 13, color: 'var(--char-mute)' }}>nenhum cronômetro seu ainda</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {customizados.map(p => (
              <PresetCard
                key={p.id}
                preset={p}
                onStart={() => iniciar(p)}
                onEdit={() => setEditing(p)}
                onDelete={() => deletePreset(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      {showCreate && (
        <CronometroFormModal onClose={() => setShowCreate(false)} onSave={handleSaveCreate} />
      )}
      {editing && (
        <CronometroFormModal preset={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
