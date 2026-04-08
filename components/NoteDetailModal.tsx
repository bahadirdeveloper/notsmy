'use client';

import { useEffect, useState, useTransition } from 'react';
import { toggleComplete, toggleFavorite, deleteNote } from '@/actions/notes';
import type { Note, NoteType } from '@/types/note';

const TYPE_CONFIG: Record<NoteType, { icon: string; color: string; bg: string; label: string }> = {
  task:    { icon: '🔲', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Görev' },
  meeting: { icon: '📅', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Toplantı' },
  idea:    { icon: '💡', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: 'Fikir' },
  note:    { icon: '📝', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'Not' },
};

function formatLongDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD — parse in local time to avoid UTC shifting the day.
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface Props {
  note: Note;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NoteDetailModal({
  note,
  onClose,
  onEdit,
  onToggleFavorite,
  onToggleComplete,
  onDelete,
}: Props) {
  const [localNote, setLocalNote] = useState(note);
  const [isPending, startTransition] = useTransition();
  const typeConfig = TYPE_CONFIG[localNote.type];

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Keep local copy in sync if parent updates the note (e.g. after edit)
  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  function handleToggleFavorite() {
    const next = !localNote.isFavorite;
    setLocalNote((n) => ({ ...n, isFavorite: next }));
    onToggleFavorite?.(localNote.id);
    startTransition(async () => {
      try {
        await toggleFavorite(localNote.id);
      } catch {
        // revert local on failure
        setLocalNote((n) => ({ ...n, isFavorite: !next }));
      }
    });
  }

  function handleToggleComplete() {
    const next = !localNote.isCompleted;
    setLocalNote((n) => ({ ...n, isCompleted: next }));
    onToggleComplete?.(localNote.id);
    startTransition(async () => {
      try {
        await toggleComplete(localNote.id);
      } catch {
        setLocalNote((n) => ({ ...n, isCompleted: !next }));
      }
    });
  }

  function handleDelete() {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
    startTransition(async () => {
      try {
        onDelete?.(localNote.id);
        await deleteNote(localNote.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete note', err);
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — drops from the top on mobile (matches AddNoteModal so the
          mental model is the same), centered on desktop. */}
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          className="w-full sm:max-w-lg bg-[#15161d] border border-white/[0.1] sm:border rounded-b-3xl sm:rounded-2xl shadow-2xl shadow-black/60 animate-slide-down sm:animate-slide-up max-h-[100dvh] overflow-y-auto pointer-events-auto"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
        >

          {/* Header: type badge + close */}
          <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-3">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: typeConfig.color, backgroundColor: typeConfig.bg }}
            >
              <span className="text-sm">{typeConfig.icon}</span>
              {typeConfig.label}
            </span>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white/85 hover:bg-white/[0.08] transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Title — full, wraps, never truncates */}
          <div className="px-5">
            <h2
              id="detail-title"
              className={[
                'text-xl sm:text-lg font-semibold leading-snug break-words',
                localNote.isCompleted ? 'line-through text-white/55' : 'text-white',
              ].join(' ')}
            >
              {localNote.title}
            </h2>
            <p className="mt-1.5 text-white/55 text-xs">
              {formatLongDate(localNote.date)}
            </p>
          </div>

          {/* Content — preserves newlines, full text */}
          {localNote.content ? (
            <div className="px-5 mt-4">
              <p className="text-white/85 text-[15px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                {localNote.content}
              </p>
            </div>
          ) : (
            <div className="px-5 mt-3">
              <p className="text-white/40 text-[13px] italic">Detay yok</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 px-5 pb-5 flex flex-wrap items-center gap-2">
            {localNote.type === 'task' && (
              <button
                onClick={handleToggleComplete}
                disabled={isPending}
                className={[
                  'flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-[13px] sm:text-xs font-medium transition-all disabled:opacity-50 border',
                  localNote.isCompleted
                    ? 'bg-white/[0.07] text-white/85 border-white/[0.12] hover:bg-white/[0.1]'
                    : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/25',
                ].join(' ')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {localNote.isCompleted ? 'Tamamlanmadı' : 'Tamamlandı'}
              </button>
            )}

            <button
              onClick={handleToggleFavorite}
              disabled={isPending}
              className={[
                'flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-[13px] sm:text-xs font-medium transition-all disabled:opacity-50 border',
                localNote.isFavorite
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/25'
                  : 'bg-white/[0.05] text-white/80 border-white/[0.1] hover:bg-white/[0.09]',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={localNote.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {localNote.isFavorite ? 'Favoride' : 'Favori'}
            </button>

            <button
              onClick={() => { onEdit(localNote); onClose(); }}
              className="flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-[13px] sm:text-xs font-medium bg-white/[0.05] text-white/80 border border-white/[0.1] hover:bg-white/[0.09] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Düzenle
            </button>

            <button
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg text-[13px] sm:text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Sil
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
