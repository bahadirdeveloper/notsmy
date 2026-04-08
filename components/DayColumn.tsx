'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { NoteCard } from './NoteCard';
import type { Note } from '@/types/note';

interface DayColumnProps {
  date: string;
  isToday: boolean;
  notes: Note[];
  typeFilter: string;
  onEdit: (note: Note) => void;
  onToggleFavorite: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DayColumn({ date, isToday, notes, typeFilter, onEdit, onToggleFavorite, onToggleComplete, onDelete }: DayColumnProps) {
  const { setNodeRef } = useDroppable({ id: date });

  const filtered = notes
    .filter((n) => !typeFilter || n.type === typeFilter)
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  const ids = filtered.map((n) => n.id);

  // Extract day number for the big date display
  const dayNum = parseInt(date.split('-')[2], 10);
  const d = new Date(date + 'T00:00:00');
  const weekday = d.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase();

  return (
    <div className={`border-b border-white/[0.04] last:border-b-0 transition-colors ${isToday ? 'bg-[#10b981]/[0.02]' : ''}`}>
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`flex flex-col items-center min-w-[36px] ${isToday ? 'text-[#10b981]' : 'text-white/30'}`}>
          <span className="text-[10px] font-medium leading-none">{weekday}</span>
          <span className={`text-lg font-bold leading-tight ${isToday ? '' : 'text-white/50'}`}>{dayNum}</span>
        </div>

        {isToday && (
          <span className="bg-[#10b981] text-black text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
            BUGÜN
          </span>
        )}

        <span className="ml-auto text-white/20 text-[11px] tabular-nums">
          {filtered.length > 0 ? `${filtered.length} öğe` : ''}
        </span>
      </div>

      {/* Notes list */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="px-4 pb-3 flex flex-col gap-1.5 min-h-[44px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 gap-1">
              <span className="text-white/10 text-lg">
                {isToday ? '🌟' : '📭'}
              </span>
              <span className="text-white/15 text-[11px]">
                {isToday ? 'Bugüne bir not ekle' : 'Henüz not yok'}
              </span>
            </div>
          ) : (
            filtered.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={onEdit} onToggleFavorite={onToggleFavorite} onToggleComplete={onToggleComplete} onDelete={onDelete} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
