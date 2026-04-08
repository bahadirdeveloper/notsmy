'use client';

import { useState, useTransition, useEffect } from 'react';
import { createNote, updateNote } from '@/actions/notes';
import type { Note, NoteType } from '@/types/note';

const TYPE_OPTIONS: { value: NoteType; label: string; icon: string; color: string }[] = [
  { value: 'task',    label: 'Görev',    icon: '🔲', color: '#f59e0b' },
  { value: 'meeting', label: 'Toplantı', icon: '📅', color: '#8b5cf6' },
  { value: 'idea',    label: 'Fikir',    icon: '💡', color: '#06b6d4' },
  { value: 'note',    label: 'Not',      icon: '📝', color: '#ec4899' },
];

interface Props {
  workspaceId: string;
  defaultDate: string;
  editingNote?: Note | null;
  onClose: () => void;
  onNoteCreated?: (note: Note) => void;
  onNoteUpdated?: (note: Note) => void;
}

export function AddNoteModal({ workspaceId, defaultDate, editingNote, onClose, onNoteCreated, onNoteUpdated }: Props) {
  const [title, setTitle] = useState(editingNote?.title ?? '');
  const [content, setContent] = useState(editingNote?.content ?? '');
  const [type, setType] = useState<NoteType>(editingNote?.type ?? 'task');
  const [date, setDate] = useState(editingNote?.date ?? defaultDate);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Başlık gerekli');
      return;
    }

    startTransition(async () => {
      try {
        if (editingNote) {
          const updated = await updateNote(editingNote.id, { title: title.trim(), content: content || undefined, type, date });
          if (onNoteUpdated && updated) onNoteUpdated(updated as Note);
        } else {
          const created = await createNote({ title: title.trim(), content: content || undefined, type, date, workspaceId });
          if (onNoteCreated && created) onNoteCreated(created as Note);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 id="modal-title" className="text-white/90 font-medium text-sm">
              {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Type selector */}
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={[
                    'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs transition-all duration-200',
                    type === t.value
                      ? 'scale-[1.02] shadow-lg'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/35 hover:border-white/[0.12] hover:bg-white/[0.04]',
                  ].join(' ')}
                  style={type === t.value ? {
                    color: t.color,
                    borderColor: `${t.color}35`,
                    backgroundColor: `${t.color}12`,
                    boxShadow: `0 4px 20px ${t.color}15`,
                  } : {}}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Başlık..."
              autoFocus
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.04] transition-all"
            />

            {/* Content */}
            <textarea
              value={content ?? ''}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detay (opsiyonel)..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.04] resize-none transition-all"
            />

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.04] transition-all"
            />

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-sm bg-[#10b981] text-black font-medium rounded-lg hover:bg-[#0ea371] disabled:opacity-40 transition-all shadow-lg shadow-[#10b981]/20 hover:shadow-[#10b981]/30"
              >
                {isPending ? 'Kaydediliyor...' : editingNote ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
