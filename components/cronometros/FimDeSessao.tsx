'use client';
import { useState } from 'react';
import { Habito, Project, SessaoFoco, Task } from '@/lib/types';
import { formatarMinutos, somaMinutos } from '@/lib/focoStore';
import { BotoesContador, formatarValor } from '@/components/projetos/ProgressoTarefa';
import { Checkbox } from '@/components/ui/Checkbox';
import { tinta } from '@/components/organizacao/estilo';

interface Props {
  blocos: SessaoFoco[];          // blocos gravados da sessão que acabou
  encerradaCedo: boolean;
  task?: Task;                    // a tarefa como está agora (pode ter sido apagada)
  project?: Project;
  habito?: Habito;                // o hábito ligado à sessão
  habitoFeito: boolean;           // já marcado hoje (no fim natural, foi marcado sozinho)
  onGuardar: (nota: string | undefined, concluirTarefa: boolean, marcarHabito: boolean) => void;
  onDefinirContador: (valor: number) => void;
  onFazerDeNovo?: () => void;
}

/**
 * Fim da sessão: quanto tempo foi e em quê, "o que avançou?" e, se for o caso, concluir a tarefa.
 * Hábito ligado: no fim natural ele já foi marcado; encerrada cedo, a marcação vem oferecida.
 */
export default function FimDeSessao({ blocos, encerradaCedo, task, project, habito, habitoFeito, onGuardar, onDefinirContador, onFazerDeNovo }: Props) {
  const [nota, setNota] = useState('');
  const [concluir, setConcluir] = useState(false);
  const [marcarHabito, setMarcarHabito] = useState(true);
  const oferecerHabito = !!habito && !habitoFeito;
  const guardar = (comNota: boolean) => onGuardar(comNota ? nota.trim() || undefined : undefined, concluir, oferecerHabito && marcarHabito);
  const total = somaMinutos(blocos);
  const ultimo = blocos[blocos.length - 1];
  const emQue = task?.title ?? ultimo?.taskTitulo ?? ultimo?.rotulo;
  const mensuravel = task && task.valorAlvo !== undefined;
  const podeConcluir = task && !mensuravel && task.status !== 'concluido';

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 24 }}>
      <span className="jp" style={{ fontSize: 36, color: 'var(--hanko)' }}>了</span>
      <h2 className="serif" style={{ fontSize: 30, fontStyle: 'italic', color: 'var(--ink)', margin: '4px 0', fontWeight: 500 }}>
        {encerradaCedo ? 'Sessão encerrada' : 'Foco concluído'}
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--char-soft)', margin: '0 0 18px' }}>
        <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(total)}</strong>
        {' em '}<em>{emQue ?? 'foco livre'}</em>{project && <> · {project.title}</>}
        {blocos.length > 1 && <span style={{ color: 'var(--char-mute)' }}> ({blocos.length} blocos)</span>}
      </p>

      <textarea
        autoFocus
        value={nota}
        onChange={e => setNota(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardar(true); } }}
        rows={2}
        placeholder="O que avançou? (opcional)"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 6, border: `1px solid ${tinta(18)}`,
          background: 'var(--card-bg)', fontSize: 15, color: 'var(--char)', resize: 'none', fontFamily: 'inherit',
        }}
      />

      {mensuravel && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left',
          padding: '12px 14px', marginTop: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8,
        }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13.5, color: 'var(--char)' }}>{task.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>
              {formatarValor(task.valorAtual ?? 0)}/{formatarValor(task.valorAlvo!)}{task.unidade ? ` ${task.unidade}` : ''}
            </span>
          </span>
          <BotoesContador atual={task.valorAtual ?? 0} alvo={task.valorAlvo!} onDefinir={onDefinirContador} grande />
        </div>
      )}

      {podeConcluir && (
        // A linha inteira alterna; o Checkbox fica sem onChange pro clique não contar duas vezes.
        <div
          onClick={() => setConcluir(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left',
            padding: '12px 14px', marginTop: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--char)' }}>
            <Checkbox checked={concluir} size={18} /> Concluir a tarefa
          </span>
          <span style={{ fontSize: 12, color: 'var(--char-mute)' }}>vai pra Concluído</span>
        </div>
      )}

      {habito && (habitoFeito ? (
        <p style={{ fontSize: 13, color: 'var(--moss)', margin: '12px 0 0' }}>✓ &ldquo;{habito.acao}&rdquo; marcado como feito hoje</p>
      ) : (
        // A linha inteira alterna; o Checkbox fica sem onChange pro clique não contar duas vezes.
        <div
          onClick={() => setMarcarHabito(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left',
            padding: '12px 14px', marginTop: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--char)' }}>
            <Checkbox checked={marcarHabito} size={18} /> Marcar &ldquo;{habito.acao}&rdquo; como feito hoje
          </span>
          <span style={{ fontSize: 12, color: 'var(--char-mute)' }}>hábito</span>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button
          onClick={() => guardar(false)}
          style={{ padding: '9px 20px', border: `1px solid ${tinta(22)}`, borderRadius: 999, fontSize: 13.5, color: 'var(--char-soft)' }}
        >
          Pular
        </button>
        <button
          onClick={() => guardar(true)}
          style={{ padding: '9px 22px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 999, fontSize: 13.5, fontWeight: 600 }}
        >
          Guardar
        </button>
      </div>
      {onFazerDeNovo && (
        <button onClick={onFazerDeNovo} style={{ marginTop: 14, fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>
          guardar e fazer de novo
        </button>
      )}
    </div>
  );
}
