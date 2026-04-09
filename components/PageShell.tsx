'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ToastProvider, useToast } from './Toast';
import { PersistentTaskList } from './PersistentTaskList';
import { MonthlyStatsCard } from './MonthlyStatsCard';
import { AddNoteModal } from './AddNoteModal';
import { NoteDetailModal } from './NoteDetailModal';
import type { Note } from '@/types/note';

const ThreeDayView = dynamic(
  () => import('./ThreeDayView').then((m) => m.ThreeDayView),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden p-8 text-center text-white/30">
        Yükleniyor...
      </div>
    ),
  },
);

interface Props {
  initialNotes: Note[];
  initialPersistentTasks: Note[];
  workspaceId: string;
  startDate: string;
  monthlyStats: { completed: number; total: number };
  statsYear: number;
  statsMonth: number;
}

function PageShellInner({
  initialNotes,
  initialPersistentTasks,
  workspaceId,
  startDate,
  monthlyStats,
  statsYear,
  statsMonth,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [addPersistent, setAddPersistent] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const { showToast } = useToast();

  const handleOpenDetail = useCallback((note: Note) => setDetailNote(note), []);

  const handleRequestAddPersistent = useCallback(() => {
    setAddPersistent(true);
    setShowAdd(true);
  }, []);

  const handleRequestAddDayScoped = useCallback(() => {
    setAddPersistent(false);
    setShowAdd(true);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,680px)_320px] gap-4 lg:gap-6 items-start">
      {/* Left column — reserved for future content */}
      <aside className="hidden lg:block" aria-hidden="true" />

      {/* Middle column — mobile gets the persistent list on top */}
      <main className="flex flex-col gap-3.5 min-w-0">
        {/* Mobile: persistent tasks collapsible at the top */}
        <details open className="lg:hidden">
          <summary className="list-none cursor-pointer select-none mb-2">
            <span className="text-white/85 text-[13px] font-semibold uppercase tracking-wide">
              Genel Görevler ({initialPersistentTasks.filter((t) => !t.isCompleted).length})
            </span>
          </summary>
          <PersistentTaskList
            initialTasks={initialPersistentTasks}
            onOpenDetail={handleOpenDetail}
            onRequestAdd={handleRequestAddPersistent}
          />
        </details>

        <ThreeDayView
          initialNotes={initialNotes}
          workspaceId={workspaceId}
          startDate={startDate}
          typeFilter={null}
          onRequestEdit={setEditingNote}
          onOpenDetail={handleOpenDetail}
          onRequestAdd={handleRequestAddDayScoped}
        />

        {/* Mobile: compact stats below calendar */}
        <div className="lg:hidden">
          <MonthlyStatsCard
            completed={monthlyStats.completed}
            total={monthlyStats.total}
            year={statsYear}
            month={statsMonth}
            variant="compact"
          />
        </div>
      </main>

      {/* Right column — desktop only */}
      <aside className="hidden lg:flex lg:flex-col gap-4">
        <PersistentTaskList
          initialTasks={initialPersistentTasks}
          onOpenDetail={handleOpenDetail}
          onRequestAdd={handleRequestAddPersistent}
        />
        <MonthlyStatsCard
          completed={monthlyStats.completed}
          total={monthlyStats.total}
          year={statsYear}
          month={statsMonth}
          variant="full"
        />
      </aside>

      {/* Shared Add modal */}
      {showAdd && (
        <AddNoteModal
          workspaceId={workspaceId}
          defaultDate={startDate}
          defaultPersistent={addPersistent}
          onClose={() => {
            setShowAdd(false);
            setAddPersistent(false);
          }}
          onNoteCreated={() => {
            showToast(addPersistent ? 'Kalıcı görev eklendi' : 'Not eklendi');
          }}
        />
      )}

      {/* Shared Edit modal */}
      {editingNote && (
        <AddNoteModal
          workspaceId={workspaceId}
          editingNote={editingNote}
          defaultDate={editingNote.date ?? startDate}
          onClose={() => setEditingNote(null)}
          onNoteUpdated={(updated) => {
            setDetailNote((prev) =>
              prev && prev.id === updated.id ? updated : prev,
            );
            showToast('Not güncellendi');
          }}
        />
      )}

      {/* Shared Detail modal */}
      {detailNote && (
        <NoteDetailModal
          note={detailNote}
          onClose={() => setDetailNote(null)}
          onEdit={(n) => setEditingNote(n)}
        />
      )}
    </div>
  );
}

export function PageShell(props: Props) {
  return (
    <ToastProvider>
      <PageShellInner {...props} />
    </ToastProvider>
  );
}
