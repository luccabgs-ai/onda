'use client';
import { useEffect, useState } from 'react';
import { CronometroPreset } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao, presetDaSessao } from '@/lib/cronometroSessaoStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { CronometroClock } from '@/components/cronometros/CronometroClock';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, botaoCheio, botaoContorno, Cabecalho, Secao, Vazio, NotaPc } from './ui';

interface Props {
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  habitsStore: ReturnType<typeof useHabitsStore>;
}

const duracao = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h}h` : `${h}h${m}`;
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function descrever(p: CronometroPreset) {
  const rodadas = p.fases.filter(f => f.tipo === 'foco').length;
  const foco = p.fases.find(f => f.tipo === 'foco');
  const descanso = p.fases.find(f => f.tipo === 'descanso');
  return rodadas > 1
    ? `${rodadas}× ${foco?.minutos}/${descanso?.minutos ?? 0} min · ${duracao(duracaoTotalMin(p.fases))}`
    : `${duracao(duracaoTotalMin(p.fases))} de foco`;
}

/** O relógio da sessão em andamento. Só mostra — avançar de fase e tocar o sino é do CronometroNotificacao. */
function Relogio({ preset, sessaoStore, nomeHabito }: { preset: CronometroPreset; sessaoStore: Props['sessaoStore']; nomeHabito?: string }) {
  const { sessao, pausar, retomar, avancarFase, reiniciarFase, parar } = sessaoStore;
  const [restanteMs, setRestanteMs] = useState(0);
  const [confirmarFim, setConfirmarFim] = useState(false);

  // Date.now() não pode rodar no render — o efeito recalcula o restante e guarda em estado.
  useEffect(() => {
    const tick = () => {
      if (!sessao) return;
      setRestanteMs(sessao.pausado ? sessao.pausadoRestanteMs ?? 0 : Math.max(0, new Date(sessao.faseTerminaEm).getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao]);

  if (!sessao) return null;
  const cor = AREAS.find(a => a.id === preset.areaId)?.color ?? 'var(--ink)';
  const fase = preset.fases[sessao.faseIndex];
  const progresso = 1 - restanteMs / (fase.minutos * 60 * 1000);
  const ultima = sessao.faseIndex === preset.fases.length - 1;

  return (
    <div style={{ ...cartao, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 15px 16px' }}>
      <div style={kicker}>{preset.nome}</div>
      {nomeHabito && <div style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 3 }}>conclui “{nomeHabito}” ao terminar</div>}
      <div style={{ width: '100%', maxWidth: 270, aspectRatio: '1', margin: '6px 0 2px' }}>
        <CronometroClock
          size={270}
          progresso={progresso}
          tempoLabel={mmss(restanteMs)}
          faseLabel={fase.tipo === 'foco' ? 'Foco' : 'Descanso'}
          faseJp={fase.tipo === 'foco' ? '集中' : '休憩'}
          color={cor}
          paused={sessao.pausado}
        />
      </div>
      {preset.fases.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {preset.fases.map((f, i) => (
            <span key={i} style={{
              width: i === sessao.faseIndex ? 9 : 6, height: i === sessao.faseIndex ? 9 : 6, borderRadius: '50%',
              background: i <= sessao.faseIndex ? cor : tinta(15), opacity: i < sessao.faseIndex ? 0.5 : 1,
            }} />
          ))}
        </div>
      )}
      <button onClick={() => (sessao.pausado ? retomar() : pausar())} style={{ ...botaoCheio, background: cor, color: 'white' }}>
        {sessao.pausado ? 'Retomar' : 'Pausar'}
      </button>
      <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
        <button onClick={() => reiniciarFase(preset)} style={{ ...botaoContorno, flex: 1 }}>Reiniciar fase</button>
        {!ultima && <button onClick={() => avancarFase(preset)} style={{ ...botaoContorno, flex: 1 }}>Pular fase</button>}
      </div>
      {confirmarFim ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, fontSize: 13 }}>
          <span style={{ color: 'var(--hanko)' }}>Encerrar sem concluir?</span>
          <button onClick={parar} style={{ fontWeight: 600, color: 'var(--hanko)', minHeight: 36 }}>sim</button>
          <button onClick={() => setConfirmarFim(false)} style={{ color: 'var(--char-mute)', minHeight: 36 }}>não</button>
        </div>
      ) : (
        <button onClick={() => setConfirmarFim(true)} style={{ marginTop: 12, minHeight: 36, fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>
          Encerrar sessão
        </button>
      )}
    </div>
  );
}

export default function FocoCelular({ cronometrosStore, sessaoStore, habitsStore }: Props) {
  const { presets, loaded } = cronometrosStore;
  const { sessao, iniciar } = sessaoStore;
  // presetDaSessao: também acha a sessão avulsa de um bloco do calendário.
  const ativo = sessao ? presetDaSessao(sessao, presets) : undefined;
  const nomeHabito = (p?: CronometroPreset) => p?.habitoId ? habitsStore.habitos.find(h => h.id === p.habitoId)?.acao : undefined;
  const ordenados = [...presets].sort((a, b) => Number(!!b.pronto) - Number(!!a.pronto));

  return (
    <div>
      <Cabecalho sobre="cronômetro" titulo="Foco" />

      {ativo && <Relogio preset={ativo} sessaoStore={sessaoStore} nomeHabito={nomeHabito(ativo)} />}

      <Secao titulo={ativo ? 'outros blocos' : 'começar um bloco'} primeira={!ativo}>
        {!loaded ? <Vazio>carregando…</Vazio> : ordenados.length === 0 ? <Vazio>Nenhum cronômetro ainda.</Vazio> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ordenados.map(p => {
              const cor = AREAS.find(a => a.id === p.areaId)?.color ?? 'var(--ink)';
              const habito = nomeHabito(p);
              const bloqueado = !!sessao;
              return (
                <button
                  key={p.id}
                  onClick={() => !bloqueado && iniciar(p)}
                  disabled={bloqueado}
                  style={{
                    ...cartao, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                    borderLeft: `3px solid ${cor}`, opacity: bloqueado && p.id !== ativo?.id ? 0.55 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1.2 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 2 }}>
                      {descrever(p)}{habito && ` · conclui “${habito}”`}
                    </div>
                  </div>
                  {!bloqueado && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Começar</span>}
                </button>
              );
            })}
          </div>
        )}
        {sessao && <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: '8px 2px 0' }}>Encerre a sessão atual pra começar outra.</p>}
      </Secao>

      <NotaPc>Criar e editar cronômetros continua no computador, por enquanto.</NotaPc>
    </div>
  );
}
