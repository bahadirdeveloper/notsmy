'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toggleComplete, toggleFavorite, deleteNote } from '@/actions/notes';
import { useState } from 'react';
import type { Note, NoteType } from '@/types/note';

const TYPE_CONFIG: Record<NoteType, { icon: string; color: string; label: string }> = {
  task:    { icon: '▢', color: '#f59e0b', label: 'Görev' },
  meeting: { icon: '📅', color: '#8b5cf6', label: 'Toplantı' },
  idea:    { icon: '💡', color: '#06b6d4', label: 'Fikir' },
  note:    { icon: '📝', color: '#ec4899', label: 'Not' },
};

export function NoteCard({ note, onEdit }: { note: Note; onEdit: (note: Note) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(note.isCompleted);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = TYPE_CONFIG[note.type];

  async function handleToggleComplete() {
    setLocalCompleted(!localCompleted); // optimistic
    setIsPending(true);
    try {
      await toggleComplete(note.id);
    } catch {
      setLocalCompleted(note.isCompleted); // revert on error
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleFavorite() {
    await toggleFavorite(note.id);
  }

  async function handleDelete() {
    if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      await deleteNote(note.id);
      setMenuOpen(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors group',
        note.isFavorite
          ? 'bg-[#10b981]/5 border-[#10b981]/20'
          : 'bg-white/[0.03] border-white/[0.06]',
        localCompleted ? 'opacity-50' : '',
        isPending ? 'opacity-70' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/20 hover:text-white/40 cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
        aria-label="Sürükle"
      >
        ⠿
      </button>

      {/* Favorite toggle */}
      <button
        onClick={handleToggleFavorite}
        className="flex-shrink-0 text-base leading-none"
        aria-label={note.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
      >
        {note.isFavorite ? (
          <span className="text-[#10b981]">⭐</span>
        ) : (
          <span className="text-white/20 hover:text-white/50">☆</span>
        )}
      </button>

      {/* Type icon */}
      <span
        className="flex-shrink-0 text-xs"
        style={{ color: typeConfig.color }}
        title={typeConfig.label}
      >
        {typeConfig.icon}
      </span>

      {/* Complete toggle (only for tasks) + Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {note.type === 'task' && (
          <button
            onClick={handleToggleComplete}
            className="flex-shrink-0 w-4 h-4 rounded border border-white/20 hover:border-[#10b981]/50 flex items-center justify-center"
            aria-label={localCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
          >
            {localCompleted && <span className="text-[#10b981] text-xs">✓</span>}
          </button>
        )}
        <span
          className={[
            'truncate',
            localCompleted ? 'line-through text-white/40' : 'text-white/90',
          ].join(' ')}
        >
          {note.title}
        </span>
      </div>

      {/* Menu button */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/20 hover:text-white/60 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Seçenekler"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-6 z-20 bg-[#1a1a1a] border border-white/10 rounded-lg py-1 min-w-[120px] shadow-xl">
              <button
                onClick={() => { onEdit(note); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
              >
                Düzenle
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/5"
              >
                Sil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
