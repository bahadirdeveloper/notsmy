'use client';

import { useState, useTransition, useEffect } from 'react';
import { createNote, updateNote } from '@/actions/notes';
import type { Note, NoteType } from '@/types/note';

const TYPE_OPTIONS: { value: NoteType; label: string; icon: string; color: string }[] = [
  { value: 'task',    label: 'Görev',    icon: '▢', color: '#f59e0b' },
  { value: 'meeting', label: 'Toplantı', icon: '📅', color: '#8b5cf6' },
  { value: 'idea',    label: 'Fikir',    icon: '💡', color: '#06b6d4' },
  { value: 'note',    label: 'Not',      icon: '📝', color: '#ec4899' },
];

interface Props {
  workspaceId: string;
  defaultDate: string;
  editingNote?: Note | null;
  onClose: () => void;
}

export function AddNoteModal({ workspaceId, defaultDate, editingNote, onClose }: Props) {
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
          await updateNote(editingNote.id, { title: title.trim(), content: content || undefined, type, date });
        } else {
          await createNote({ title: title.trim(), content: content || undefined, type, date, workspaceId });
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
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 id="modal-title" className="text-white font-medium text-sm">
              {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white/70 text-lg leading-none">×</button>
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
                    'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors',
                    type === t.value
                      ? 'border-current bg-current/10'
                      : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20',
                  ].join(' ')}
                  style={type === t.value ? { color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}15` } : {}}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Başlık..."
                autoFocus
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#10b981]/50"
              />
            </div>

            {/* Content */}
            <div>
              <textarea
                value={content ?? ''}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detay (opsiyonel)..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#10b981]/50 resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#10b981]/50"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-white/50 hover:text-white/80"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm bg-[#10b981] text-black font-medium rounded-lg hover:bg-[#0ea371] disabled:opacity-50 transition-colors"
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
