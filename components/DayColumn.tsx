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
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`flex flex-col items-center min-w-[40px] ${isToday ? 'text-[#10b981]' : 'text-white/30'}`}>
          <span className="text-[11px] font-semibold leading-none tracking-wide">{weekday}</span>
          <span className={`text-xl font-bold leading-tight mt-0.5 tabular-nums ${isToday ? '' : 'text-white/55'}`}>{dayNum}</span>
        </div>

        {isToday && (
          <span className="bg-[#10b981] text-black text-[10px] font-bold px-2 py-1 rounded-full tracking-wider">
            BUGÜN
          </span>
        )}

        <span className="ml-auto text-white/25 text-xs tabular-nums">
          {filtered.length > 0 ? `${filtered.length} öğe` : ''}
        </span>
      </div>

      {/* Notes list */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="px-3 sm:px-4 pb-3 flex flex-col gap-2 sm:gap-1.5 min-h-[52px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 gap-1.5">
              <span className="text-white/10 text-2xl">
                {isToday ? '🌟' : '📭'}
              </span>
              <span className="text-white/20 text-xs">
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
