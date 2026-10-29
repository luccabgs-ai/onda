'use client';
import { useState } from 'react';
import { CalendarEvent, Habito, PrioridadeRitual, Project, Task } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { estaAgendadoEm } from '@/lib/nutricao';
import { itensComHora, paraHora } from '@/lib/agenda';
import { tinta } from '@/components/organizacao/estilo';
import { Folha, OpcaoFolha, kicker, botaoContorno } from './ui';

/**
 * Folha "o que faria o dia valer?" — escolhe uma das 3 vitórias: escrever, um bloco ou evento
 * de hoje, uma tarefa ou um hábito. Devolve a vitória no formato do ritual.
 */
export default function EscolherVitoria({ numero, hoje, eventos, tasks, projects, habitos, onEscolher, onFechar }: {
  numero: number;                 // 0, 1 ou 2
  hoje: string;
  eventos: CalendarEvent[];
  tasks: Task[];
  projects: Project[];
  habitos: Habito[];
  onEscolher: (v: PrioridadeRitual) => void;
  onFechar: () => void;
}) {
  const [texto, setTexto] = useState('');
  const doDia = itensComHora(eventos, hoje);
  const abertas = tasks.filter(t => t.status !== 'concluido')
    .sort((a, b) => Number(b.status === 'em_andamento') - Number(a.status === 'em_andamento')
      || Number(!!b.dueDate && b.dueDate <= hoje) - Number(!!a.dueDate && a.dueDate <= hoje));
  const projeto = (t: Task) => projects.find(p => p.id === t.projectId);
  const grupo = (r: string) => <div style={{ ...kicker, margin: '14px 0 6px' }}>{r}</div>;

  return (
    <Folha sobre={`${['primeira', 'segunda', 'terceira'][numero]} vitória`} titulo="O que faria o dia valer?" onFechar={onFechar}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && texto.trim()) onEscolher({ origem: 'manual', texto: texto.trim() }); }}
          placeholder="escrever: ligar pro João…"
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: `1px solid ${tinta(18)}`, background: 'var(--card-bg)', fontSize: 16 }}
        />
        <button onClick={() => texto.trim() && onEscolher({ origem: 'manual', texto: texto.trim() })} style={botaoContorno}>ok</button>
      </div>

      {doDia.length > 0 && <>
        {grupo('na agenda de hoje')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {doDia.map(({ ev, ini }) => {
            const p = projects.find(x => x.id === ev.projectId);
            return (
              <OpcaoFolha key={ev.id} cor={ev.type === 'foco' ? p?.color : 'var(--ink)'} texto={`${ev.type === 'foco' ? '◷ ' : ''}${ev.title}`}
                detalhe={paraHora(ini)} onClick={() => onEscolher({ origem: 'evento', eventoId: ev.id })} />
            );
          })}
        </div>
      </>}

      {abertas.length > 0 && <>
        {grupo('tarefas')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {abertas.slice(0, 12).map(t => (
            <OpcaoFolha key={t.id} cor={projeto(t)?.color} texto={t.title}
              detalhe={t.dueDate && t.dueDate <= hoje ? (t.dueDate < hoje ? 'venceu' : 'prazo hoje') : projeto(t)?.title}
              onClick={() => onEscolher({ origem: 'task', taskId: t.id })} />
          ))}
        </div>
      </>}

      {habitos.some(h => estaAgendadoEm(h, hoje)) && <>
        {grupo('hábitos de hoje')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {habitos.filter(h => estaAgendadoEm(h, hoje)).map(h => (
            <OpcaoFolha key={h.id} cor={AREAS.find(a => a.id === h.areaId)?.color} texto={h.acao} detalhe="hábito"
              onClick={() => onEscolher({ origem: 'habito', habitoId: h.id })} />
          ))}
        </div>
      </>}
    </Folha>
  );
}
