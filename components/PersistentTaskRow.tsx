'use client';

import { useState, useEffect } from 'react';
import { toggleComplete, toggleFavorite, deleteNote } from '@/actions/notes';
import type { Note } from '@/types/note';

interface Props {
  note: Note;
  onOpenDetail: (note: Note) => void;
  onToggleFavorite: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PersistentTaskRow({
  note,
  onOpenDetail,
  onToggleFavorite,
  onToggleComplete,
  onDelete,
}: Props) {
  const [localCompleted, setLocalCompleted] = useState(note.isCompleted);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setLocalCompleted(note.isCompleted);
  }, [note.isCompleted]);

  async function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !localCompleted;
    setLocalCompleted(next);
    onToggleComplete(note.id);
    setIsPending(true);
    try {
      await toggleComplete(note.id);
    } catch {
      setLocalCompleted(!next);
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFavorite(note.id);
    try {
      await toggleFavorite(note.id);
    } catch {
      // revert handled by revalidation
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    onDelete(note.id);
    try {
      await deleteNote(note.id);
    } catch {
      // revert handled by revalidation
    }
  }

  return (
    <div
      onClick={() => onOpenDetail(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(note);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${note.title} detayını aç`}
      className={[
        'flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 group cursor-pointer',
        note.isFavorite
          ? 'bg-[#10b981]/[0.06] border-[#10b981]/25 hover:border-[#10b981]/40'
          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]',
        localCompleted ? 'opacity-50' : '',
        isPending ? 'opacity-70' : '',
      ].join(' ')}
    >
      {/* Complete checkbox */}
      <button
        onClick={handleToggleComplete}
        className={`flex-shrink-0 w-5 h-5 rounded border-[1.5px] transition-all ${
          localCompleted
            ? 'bg-[#10b981] border-[#10b981]'
            : 'border-white/40 hover:border-[#10b981]/60'
        } flex items-center justify-center`}
        aria-label={localCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
      >
        {localCompleted && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        className={[
          'flex-1 min-w-0 truncate leading-snug text-[14px]',
          localCompleted ? 'line-through text-white/45' : 'text-white/95',
        ].join(' ')}
      >
        {note.title}
      </span>

      {/* Favorite */}
      <button
        onClick={handleToggleFavorite}
        className="flex-shrink-0 p-1 -m-1 transition-transform hover:scale-110 active:scale-95"
        aria-label={note.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
      >
        {note.isFavorite ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/35 hover:text-white/70">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 p-1 -m-1 text-white/0 group-hover:text-white/45 hover:!text-red-400 transition-all"
        aria-label="Sil"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
