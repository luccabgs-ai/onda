'use client';
import { useState, useCallback } from 'react';
import { CalendarEvent } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar } from './gravacao';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function useCalendarStore() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/calendario');
      if (!r.ok) throw new Error('falha ao carregar calendário');
      const data: CalendarEvent[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setEvents(data);
    } finally {
      setLoaded(true);
    }
  });

  const createEvent = useCallback((data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const e: CalendarEvent = { ...data, id: uid(), createdAt: now(), updatedAt: now() };
    setEvents(ev => [...ev, e]);
    gravar('/api/calendario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    });
  }, []);

  const updateEvent = useCallback((id: string, data: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    setEvents(ev => ev.map(e => e.id === id ? { ...e, ...data, updatedAt: now() } : e));
    gravar(`/api/calendario/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(ev => ev.filter(e => e.id !== id));
    gravar(`/api/calendario/${id}`, { method: 'DELETE' });
  }, []);

  const getEventsForDate = useCallback((date: string) => {
    return events.filter(e => e.date === date || (e.endDate && e.date <= date && e.endDate >= date));
  }, [events]);

  return { events, loaded, erro, createEvent, updateEvent, deleteEvent, getEventsForDate };
}
