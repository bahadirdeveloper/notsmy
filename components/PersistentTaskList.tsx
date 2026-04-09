'use client';

import { useState, useEffect } from 'react';
import { PersistentTaskRow } from './PersistentTaskRow';
import { restoreNote } from '@/actions/notes';
import { useToast } from './Toast';
import type { Note } from '@/types/note';

interface Props {
  initialTasks: Note[];
  onOpenDetail: (note: Note) => void;
  onRequestAdd: () => void;
}

export function PersistentTaskList({
  initialTasks,
  onOpenDetail,
  onRequestAdd,
}: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const { showToast } = useToast();

  // Sync with fresh server data after revalidation / router.refresh.
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleToggleFavorite = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)),
    );
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
  };

  const handleDelete = (id: string) => {
    let deleted: Note | undefined;
    setTasks((prev) => {
      deleted = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });
    if (!deleted) return;
    const noteToRestore = deleted;
    showToast('Görev silindi', () => {
      setTasks((prev) => [...prev, noteToRestore]);
      restoreNote({
        id: noteToRestore.id,
        workspaceId: noteToRestore.workspaceId,
        title: noteToRestore.title,
        content: noteToRestore.content,
        type: noteToRestore.type,
        date: noteToRestore.date,
        isCompleted: noteToRestore.isCompleted,
        isFavorite: noteToRestore.isFavorite,
        sortOrder: noteToRestore.sortOrder,
      }).catch((err) => {
        console.error('Failed to restore task', err);
        setTasks((prev) => prev.filter((t) => t.id !== noteToRestore.id));
        showToast('Geri alma başarısız');
      });
    });
  };

  // Sort: incomplete first, then completed; each group by sortOrder
  const sorted = [...tasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });

  const openCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <section
      aria-labelledby="persistent-tasks-heading"
      className="bg-white/[0.035] border border-white/[0.09] rounded-xl p-3.5 shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h2
          id="persistent-tasks-heading"
          className="text-white/85 text-[13px] font-semibold uppercase tracking-wide"
        >
          Genel Görevler
          <span className="ml-2 text-white/40 font-normal">{openCount}</span>
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.length === 0 ? (
          <p className="text-white/40 text-[13px] italic px-1 py-3 text-center">
            Henüz kalıcı görev yok
          </p>
        ) : (
          sorted.map((task) => (
            <PersistentTaskRow
              key={task.id}
              note={task}
              onOpenDetail={onOpenDetail}
              onToggleFavorite={handleToggleFavorite}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onRequestAdd}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/[0.14] text-white/55 text-[13px] hover:border-[#10b981]/40 hover:text-[#10b981] hover:bg-[#10b981]/[0.05] transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Yeni görev
      </button>
    </section>
  );
}
