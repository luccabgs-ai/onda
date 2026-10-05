import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Ciclo, CicloEscala, CicloItem } from '@/lib/types';

interface CicloRow {
  id: string;
  escala: CicloEscala;
  inicio: string;
  fim: string;
  foco: string | null;
  itens: CicloItem[] | null;
  meio_nota: string | null;
  meio_em: string | null;
  nota: number | null;
  funcionou: string | null;
  nao_funcionou: string | null;
  levar: string | null;
  fechado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

function rowToCiclo(row: CicloRow): Ciclo {
  return {
    id: row.id,
    escala: row.escala,
    inicio: row.inicio,
    fim: row.fim,
    foco: row.foco ?? undefined,
    itens: row.itens ?? [],
    meioNota: row.meio_nota ?? undefined,
    meioEm: row.meio_em ?? undefined,
    nota: row.nota ?? undefined,
    funcionou: row.funcionou ?? undefined,
    naoFuncionou: row.nao_funcionou ?? undefined,
    levar: row.levar ?? undefined,
    fechadoEm: row.fechado_em ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET() {
  const { data, error } = await db.from('ciclos').select('*').order('inicio', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as CicloRow[]).map(rowToCiclo));
}
