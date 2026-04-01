'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { NoteCard } from './NoteCard';
import type { Note } from '@/types/note';

interface DayColumnProps {
  date: string; // YYYY-MM-DD
  label: string; // 'Bugün', '1 Nisan', etc.
  isToday: boolean;
  notes: Note[];
  typeFilter: string | null;
  onEdit: (note: Note) => void;
}

export function DayColumn({ date, label, isToday, notes, typeFilter, onEdit }: DayColumnProps) {
  const { setNodeRef } = useDroppable({ id: date });

  // Sort: favorites first, then by sortOrder, completed last
  const filtered = notes
    .filter((n) => !typeFilter || n.type === typeFilter)
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  const ids = filtered.map((n) => n.id);

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      {/* Day header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {isToday ? (
          <span className="bg-[#10b981] text-black text-[10px] font-bold px-2 py-0.5 rounded">
            BUGÜN
          </span>
        ) : null}
        <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-white/60'}`}>
          {label}
        </span>
        <span className="ml-auto text-white/25 text-xs">{filtered.length} öge</span>
      </div>

      {/* Notes list */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="px-4 pb-3 flex flex-col gap-1.5 min-h-[40px]">
          {filtered.length === 0 ? (
            <div className="text-white/20 text-xs py-2 text-center">Henüz not yok</div>
          ) : (
            filtered.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={onEdit} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
