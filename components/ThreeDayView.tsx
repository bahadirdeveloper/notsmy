'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DayColumn } from './DayColumn';
import { FilterBar } from './FilterBar';
import { reorderNotes, updateNote, toggleComplete, restoreNote } from '@/actions/notes';
import { useToast } from './Toast';
import type { Note } from '@/types/note';

interface ThreeDayViewProps {
  initialNotes: Note[];
  startDate: string;
  typeFilter: string | null;
  onRequestEdit: (note: Note) => void;
  onOpenDetail: (note: Note) => void;
  onRequestAdd: () => void;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function todays(): string {
  return new Date().toISOString().split('T')[0];
}

export function ThreeDayView({
  initialNotes,
  startDate,
  typeFilter: initialFilter,
  onRequestEdit,
  onOpenDetail,
  onRequestAdd,
}: ThreeDayViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [typeFilter, setTypeFilter] = useState(initialFilter ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Sync local state with fresh server data after RSC refresh (revalidatePath, navigation)
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const today = todays();
  const days = useMemo(
    () => [startDate, addDays(startDate, 1), addDays(startDate, 2)],
    [startDate]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Escape: blur search, clear query
      if (e.key === 'Escape') {
        if (isInput) {
          (target as HTMLInputElement).blur();
          setSearchQuery('');
        }
        return;
      }

      if (isInput) return;

      // / or Ctrl+K: focus search
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // N: new note
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onRequestAdd();
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onRequestAdd]);

  // --- Handlers ---
  const handleToggleFavorite = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  }, []);

  const handleToggleComplete = useCallback((id: string) => {
    setNotes((prev) => {
      const note = prev.find((n) => n.id === id);
      if (note && !note.isCompleted) {
        showToast('Görev tamamlandı', () => {
          // Undo: mark as incomplete again
          setNotes((p) => p.map((n) => (n.id === id ? { ...n, isCompleted: false } : n)));
          toggleComplete(id); // revert on server
        });
      }
      return prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n));
    });
  }, [showToast]);

  const handleDelete = useCallback((id: string) => {
    let deletedNote: Note | undefined;
    setNotes((prev) => {
      deletedNote = prev.find((n) => n.id === id);
      return prev.filter((n) => n.id !== id);
    });
    if (deletedNote) {
      const noteToRestore = deletedNote;
      showToast('Not silindi', () => {
        // Undo: restore with the original UUID so client/server stay in sync
        setNotes((prev) => [...prev, noteToRestore]);
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
          console.error('Failed to restore note', err);
          // Roll back the optimistic restore
          setNotes((prev) => prev.filter((n) => n.id !== noteToRestore.id));
          showToast('Geri alma başarısız');
        });
      });
    }
  }, [showToast]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNote = notes.find((n) => n.id === active.id);
    if (!activeNote) return;

    // Persistent tasks should never reach the calendar's DnD context, but guard anyway.
    if (activeNote.date === null) return;

    const overId = String(over.id);
    const isDropOnDay = days.includes(overId);

    if (isDropOnDay) {
      const targetDate = overId;
      if (targetDate === activeNote.date) return;
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNote.id ? { ...n, date: targetDate } : n))
      );
      await updateNote(activeNote.id, { date: targetDate });
      return;
    }

    const dayNotes = notes.filter((n) => n.date === activeNote.date && !n.isCompleted);
    const oldIdx = dayNotes.findIndex((n) => n.id === active.id);
    const newIdx = dayNotes.findIndex((n) => n.id === over.id);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

    const reordered = [...dayNotes];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    const updatedItems = reordered.map((n, i) => ({ ...n, sortOrder: i }));

    setNotes((prev) => {
      const otherNotes = prev.filter((n) => n.date !== activeNote.date || n.isCompleted);
      return [...otherNotes, ...updatedItems];
    });

    await reorderNotes(updatedItems.map((n) => ({ id: n.id, sortOrder: n.sortOrder })));
  }

  // Filter notes for search
  const filteredNotes = searchQuery
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  return (
    <>
      {/* Search bar — always visible */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Notlarda ara..."
          className="w-full bg-white/[0.045] border border-white/[0.09] rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-white text-[15px] sm:text-sm placeholder-white/40 focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.06] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
            aria-label="Aramayı temizle"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {searchQuery && (
        <p className="text-white/45 text-[11px] -mt-1.5 px-1">
          {filteredNotes.length} sonuç bulundu
        </p>
      )}

      {/* Filter bar */}
      <FilterBar current={typeFilter} onChange={setTypeFilter} />

      {/* Calendar */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white/[0.035] border border-white/[0.09] rounded-xl overflow-hidden shadow-xl shadow-black/20">
          {days.map((date) => (
            <DayColumn
              key={date}
              date={date}
              isToday={date === today}
              notes={filteredNotes.filter((n) => n.date === date)}
              typeFilter={typeFilter}
              onEdit={onRequestEdit}
              onOpenDetail={onOpenDetail}
              onToggleFavorite={handleToggleFavorite}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      {/* Keyboard hints */}
      <div className="hidden sm:flex items-center justify-center gap-4 text-white/35 text-[11px] py-1">
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/55 font-mono text-[10px]">N</kbd> yeni not</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/55 font-mono text-[10px]">/</kbd> ara</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/55 font-mono text-[10px]">Esc</kbd> kapat</span>
      </div>

      {/* FAB — bigger and more prominent on mobile */}
      <button
        onClick={onRequestAdd}
        className="fixed right-5 w-14 h-14 sm:w-14 sm:h-14 bg-[#10b981] text-black rounded-2xl shadow-xl shadow-[#10b981]/30 hover:shadow-[#10b981]/45 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-30 group"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Yeni not ekle"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:rotate-90 transition-transform duration-200">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </>
  );
}
