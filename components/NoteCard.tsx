'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toggleComplete, toggleFavorite, deleteNote } from '@/actions/notes';
import { useState, useEffect } from 'react';
import type { Note, NoteType } from '@/types/note';

const TYPE_CONFIG: Record<NoteType, { icon: string; color: string; bg: string; label: string }> = {
  task:    { icon: '🔲', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Görev' },
  meeting: { icon: '📅', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Toplantı' },
  idea:    { icon: '💡', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Fikir' },
  note:    { icon: '📝', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', label: 'Not' },
};

export function NoteCard({ note, onEdit, onOpenDetail, onToggleFavorite, onToggleComplete, onDelete }: {
  note: Note;
  onEdit: (note: Note) => void;
  onOpenDetail?: (note: Note) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(note.isCompleted);

  // Sync with parent state changes
  useEffect(() => { setLocalCompleted(note.isCompleted); }, [note.isCompleted]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const typeConfig = TYPE_CONFIG[note.type];

  async function handleToggleComplete() {
    setLocalCompleted(!localCompleted);
    if (onToggleComplete) onToggleComplete(note.id);
    setIsPending(true);
    try {
      await toggleComplete(note.id);
    } catch {
      setLocalCompleted(note.isCompleted);
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleFavorite() {
    if (onToggleFavorite) onToggleFavorite(note.id);
    try {
      await toggleFavorite(note.id);
    } catch {
      // revert handled by revalidation
    }
  }

  async function handleDelete() {
    if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      setMenuOpen(false);
      if (onDelete) onDelete(note.id);
      await deleteNote(note.id);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-start gap-2 px-3 py-3 sm:py-2.5 rounded-xl sm:rounded-lg border transition-all duration-200 group relative',
        note.isFavorite
          ? 'bg-[#10b981]/[0.06] border-[#10b981]/25 hover:border-[#10b981]/40'
          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]',
        localCompleted ? 'opacity-50' : '',
        isPending ? 'opacity-70' : '',
        isDragging ? 'shadow-xl shadow-black/40 z-10' : '',
      ].join(' ')}
    >
      {/* Drag handle — wider tap target on mobile */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/30 hover:text-white/55 cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0 -ml-1 px-1 py-1 transition-colors"
        aria-label="Sürükle"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
        </svg>
      </button>

      {/* Favorite toggle — bigger tap target */}
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
        className="flex-shrink-0 p-1 -m-1 transition-transform hover:scale-110 active:scale-95"
        aria-label={note.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
      >
        {note.isFavorite ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/35 hover:text-white/70">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        )}
      </button>

      {/* Type badge */}
      <span
        className="flex-shrink-0 text-[11px] px-1.5 py-0.5 rounded-md font-medium mt-0.5"
        style={{ color: typeConfig.color, backgroundColor: typeConfig.bg }}
      >
        {typeConfig.icon}
      </span>

      {/* Content area — tapping this opens the detail view */}
      <div
        onClick={() => onOpenDetail?.(note)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail?.(note);
          }
        }}
        role={onOpenDetail ? 'button' : undefined}
        tabIndex={onOpenDetail ? 0 : undefined}
        aria-label={onOpenDetail ? `${note.title} detayını aç` : undefined}
        className="flex-1 min-w-0 flex flex-col gap-0.5 cursor-pointer -my-1 py-1"
      >
        <div className="flex items-center gap-2">
          {/* Complete toggle (only for tasks) — bigger tap target */}
          {note.type === 'task' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleComplete(); }}
              className={`flex-shrink-0 w-5 h-5 rounded border-[1.5px] transition-all ${
                localCompleted
                  ? 'bg-[#10b981] border-[#10b981]'
                  : 'border-white/40 hover:border-[#10b981]/60'
              } flex items-center justify-center`}
              aria-label={localCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
            >
              {localCompleted && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )}
          <span
            className={[
              'truncate leading-snug text-[15px] sm:text-sm',
              localCompleted ? 'line-through text-white/45' : 'text-white/95',
            ].join(' ')}
          >
            {note.title}
          </span>
        </div>

        {/* Content preview — hints there's more to see */}
        {note.content && !localCompleted && (
          <p className="text-white/55 text-[13px] sm:text-xs truncate leading-snug">{note.content}</p>
        )}
      </div>

      {/* Menu button — always visible on mobile, hover-only on desktop */}
      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/50 sm:text-white/0 sm:group-hover:text-white/50 hover:!text-white/80 p-1.5 -m-1 rounded transition-all"
          aria-label="Seçenekler"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 z-20 bg-[#191a21] border border-white/12 rounded-lg py-1 min-w-[140px] shadow-2xl shadow-black/50 animate-slide-down">
              <button
                onClick={() => { onEdit(note); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-white/85 hover:bg-white/[0.08] flex items-center gap-2 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Düzenle
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Sil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
