'use client';
import React, { useState } from 'react';
import { CicloItem, CicloItemTipo } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { itemAtingido, progressoDoItem, Ritmo } from '@/lib/ciclos';
import { Checkbox } from '@/components/ui/Checkbox';
import { IcEdit, IcTrash } from '@/components/ui/icons';
import { tinta, campoStyle, botaoPrimario, botaoLink } from './estilo';

export const descreverAlvo = (item: CicloItem) =>
  item.alvo === undefined ? '' : `${item.sentido === 'menos' ? '≤' : '≥'} ${item.alvo}${item.unidade ? ` ${item.unidade}` : ''}`;

// ── Formulário (novo e editar) ────────────────────────────────────────────────

export function ItemForm({ tipo, inicial, areaInicial, onSalvar, onCancelar }: {
  tipo: CicloItemTipo;
  inicial?: CicloItem;
  areaInicial?: string;   // item novo criado de dentro de uma área (tela do ano)
  onSalvar: (data: Omit<CicloItem, 'id' | 'feito' | 'atual'>) => void;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [areaId, setAreaId] = useState(inicial?.areaId ?? areaInicial ?? '');
  const [acumula, setAcumula] = useState(inicial?.acumula !== false);
  const [alvo, setAlvo] = useState(inicial?.alvo !== undefined ? String(inicial.alvo) : '');
  const [unidade, setUnidade] = useState(inicial?.unidade ?? '');
  const [sentido, setSentido] = useState<'mais' | 'menos'>(inicial?.sentido ?? 'mais');

  const alvoNum = Number(alvo.replace(',', '.'));
  const valido = titulo.trim().length > 0 && (tipo === 'meta' || (alvo.trim() !== '' && Number.isFinite(alvoNum)));

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      tipo,
      titulo: titulo.trim(),
      areaId: areaId || undefined,
      alvo: tipo === 'indicador' ? alvoNum : undefined,
      unidade: tipo === 'indicador' ? (unidade.trim() || undefined) : undefined,
      sentido: tipo === 'indicador' ? sentido : undefined,
      acumula: tipo === 'indicador' ? acumula : undefined,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); salvar(); }
    if (e.key === 'Escape') onCancelar();
  };

  const pequeno: React.CSSProperties = { ...campoStyle, padding: '7px 9px', fontSize: 12.5, width: 'auto' };

  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${tinta(6)}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        autoFocus
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={tipo === 'meta' ? 'ex: entregar o relatório do trimestre' : 'ex: horas de sono por noite'}
        style={{ ...campoStyle, padding: '8px 10px' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {tipo === 'indicador' && (
          <>
            <select value={sentido} onChange={e => setSentido(e.target.value as 'mais' | 'menos')} style={pequeno}>
              <option value="mais">pelo menos</option>
              <option value="menos">no máximo</option>
            </select>
            <input
              value={alvo}
              onChange={e => setAlvo(e.target.value)}
              onKeyDown={onKeyDown}
              inputMode="decimal"
              placeholder="alvo"
              style={{ ...pequeno, width: 70 }}
            />
            <input
              value={unidade}
              onChange={e => setUnidade(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="unidade"
              style={{ ...pequeno, width: 96 }}
            />
          </>
        )}
        <select value={areaId} onChange={e => setAreaId(e.target.value)} style={pequeno}>
          <option value="">sem área</option>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={onCancelar} style={{ ...botaoLink, color: 'var(--char-mute)', fontWeight: 400 }}>cancelar</button>
        <button onClick={salvar} disabled={!valido} style={{ ...botaoPrimario, padding: '6px 14px', opacity: valido ? 1 : 0.4 }}>
          {inicial ? 'salvar' : 'adicionar'}
        </button>
      </div>
      {tipo === 'indicador' && (
        // A linha inteira alterna — o Checkbox fica sem onChange pro clique não alternar duas vezes.
        <div onClick={() => setAcumula(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', width: 'fit-content' }}>
          <Checkbox checked={acumula} size={15} />
          <span style={{ fontSize: 12, color: 'var(--char-soft)' }}>
            acumula ao longo do período
            <span style={{ color: 'var(--char-mute)' }}> — mostra se você está no ritmo. Desmarque pra médias, como horas de sono.</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Valor atual de um indicador (digitável, grava ao sair do campo) ────────────

function ValorAtual({ item, onDefinir, onAjustar }: {
  item: CicloItem;
  onDefinir: (v: number | undefined) => void;
  onAjustar: (delta: number) => void;
}) {
  const [rascunho, setRascunho] = useState(item.atual !== undefined ? String(item.atual) : '');

  const confirmar = () => {
    const limpo = rascunho.trim().replace(',', '.');
    if (limpo === '') { if (item.atual !== undefined) onDefinir(undefined); return; }
    const n = Number(limpo);
    if (!Number.isFinite(n)) { setRascunho(item.atual !== undefined ? String(item.atual) : ''); return; }
    if (n !== item.atual) onDefinir(n);
  };

  const botao: React.CSSProperties = {
    width: 22, height: 22, borderRadius: 4, border: `1px solid ${tinta(22)}`, background: tinta(4),
    color: 'var(--ink)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <button onClick={() => onAjustar(-1)} style={botao} title="−1">−</button>
      <input
        value={rascunho}
        onChange={e => setRascunho(e.target.value)}
        onBlur={confirmar}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        inputMode="decimal"
        placeholder="–"
        title="valor medido até agora"
        style={{ ...campoStyle, width: 52, padding: '3px 6px', fontSize: 12.5, textAlign: 'center', resize: undefined }}
      />
      <button onClick={() => onAjustar(1)} style={botao} title="+1">+</button>
    </div>
  );
}

// ── Linha de item ─────────────────────────────────────────────────────────────

/** O que o ritmo diz, em palavras, e com que cor. */
function textoDoRitmo(r: Ritmo, item: CicloItem): { texto: string; cor: string } {
  const un = item.unidade ? ` ${item.unidade}` : '';
  const arred = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  switch (r.estado) {
    case 'sem_medida': return { texto: 'sem medição ainda', cor: 'var(--char-mute)' };
    case 'batido': return { texto: 'alvo batido', cor: 'var(--moss)' };
    case 'no_ritmo': return { texto: 'no ritmo', cor: 'var(--char-mute)' };
    case 'atras': return { texto: `atrás do ritmo · o ritmo pede ~${arred(r.esperado ?? 0)}${un}`, cor: 'var(--hanko)' };
    case 'folga': return { texto: `folga de ${arred((item.alvo ?? 0) - (item.atual ?? 0))}${un}`, cor: 'var(--char-mute)' };
    case 'acima': return { texto: 'acima do ritmo', cor: 'var(--hanko)' };
    case 'estourou': return { texto: 'passou do teto', cor: 'var(--hanko)' };
    case 'no_alvo': return { texto: 'no alvo', cor: 'var(--moss)' };
    case 'fora_do_alvo': return { texto: 'fora do alvo', cor: 'var(--char-mute)' };
  }
}

export function ItemLinha({ item, ritmo, onAlternar, onDefinirAtual, onAjustar, onEditar, onRemover }: {
  item: CicloItem;
  ritmo?: Ritmo | null;
  onAlternar: () => void;
  onDefinirAtual: (v: number | undefined) => void;
  onAjustar: (delta: number) => void;
  onEditar: () => void;
  onRemover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const atingido = itemAtingido(item);
  const area = AREAS.find(a => a.id === item.areaId);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmar(false); }}
      style={{ padding: '11px 0', borderBottom: `1px solid ${tinta(6)}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.tipo === 'meta' && <Checkbox checked={!!item.feito} onChange={onAlternar} size={17} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            {area && <span title={area.name} style={{ width: 7, height: 7, borderRadius: '50%', background: area.color, flexShrink: 0 }} />}
            <span style={{
              fontSize: 13.5,
              color: item.tipo === 'meta' && atingido ? 'var(--char-mute)' : 'var(--char)',
              textDecoration: item.tipo === 'meta' && atingido ? 'line-through' : 'none',
            }}>
              {item.titulo}
            </span>
            {item.tipo === 'indicador' && (
              <span style={{ fontSize: 11, color: atingido ? 'var(--moss)' : 'var(--char-mute)', fontWeight: atingido ? 600 : 400 }}>
                {descreverAlvo(item)}{atingido ? ' ✓' : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 48, justifyContent: 'flex-end' }}>
          {hovered && (confirmar ? (
            <>
              <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>apagar?</span>
              <button onClick={onRemover} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--hanko)', padding: '2px 5px' }}>sim</button>
              <button onClick={() => setConfirmar(false)} style={{ fontSize: 10.5, color: 'var(--char-mute)', padding: '2px 5px' }}>não</button>
            </>
          ) : (
            <>
              <button onClick={onEditar} title="editar" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcEdit size={12} stroke="var(--char-mute)" />
              </button>
              <button onClick={() => setConfirmar(true)} title="apagar" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcTrash size={12} stroke="var(--hanko)" />
              </button>
            </>
          ))}
        </div>

        {item.tipo === 'indicador' && (
          // key no valor: quando o +/− muda o número, o campo digitável recomeça a partir dele.
          <ValorAtual key={String(item.atual)} item={item} onDefinir={onDefinirAtual} onAjustar={onAjustar} />
        )}
      </div>

      {item.tipo === 'indicador' && (() => {
        // Teto que acumula (gasto) enche conforme se consome; o resto usa o progresso de sempre.
        const consumo = item.sentido === 'menos' && item.acumula !== false && item.alvo
          ? Math.min(1, (item.atual ?? 0) / item.alvo)
          : progressoDoItem(item);
        const ruim = ritmo && ['atras', 'acima', 'estourou'].includes(ritmo.estado);
        const txt = ritmo && textoDoRitmo(ritmo, item);
        return (
          <>
            <div style={{ position: 'relative', height: 5, borderRadius: 3, background: tinta(9), marginTop: 9 }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 3,
                width: `${consumo * 100}%`,
                background: ruim ? 'var(--hanko)' : atingido && item.sentido !== 'menos' ? 'var(--moss)' : 'var(--ink)',
                opacity: ruim ? 0.75 : 0.6,
                transition: 'width 0.3s ease',
              }} />
              {ritmo?.marca !== undefined && (
                <span title="onde o ritmo diz que você deveria estar hoje" style={{
                  position: 'absolute', top: -4, left: `${ritmo.marca * 100}%`, width: 2, height: 13,
                  borderRadius: 1, background: 'var(--char-soft)', transform: 'translateX(-1px)',
                }} />
              )}
            </div>
            {txt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 11, marginTop: 5 }}>
                <span style={{ color: txt.cor }}>{txt.texto}</span>
                <span style={{ color: 'var(--char-mute)' }}>
                  {item.acumula === false ? 'média — sem ritmo' : item.sentido === 'menos' ? 'teto do período' : 'acumula no período'}
                </span>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
