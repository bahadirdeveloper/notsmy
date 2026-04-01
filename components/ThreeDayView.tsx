'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DayColumn } from './DayColumn';
import { reorderNotes, updateNote } from '@/actions/notes';
import { AddNoteModal } from './AddNoteModal';
import type { Note } from '@/types/note';

interface ThreeDayViewProps {
  initialNotes: Note[];
  workspaceId: string;
  startDate: string; // YYYY-MM-DD
  typeFilter: string | null;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todays(): string {
  return new Date().toISOString().split('T')[0];
}

export function ThreeDayView({ initialNotes, workspaceId, startDate, typeFilter }: ThreeDayViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const today = todays();
  const days = [startDate, addDays(startDate, 1), addDays(startDate, 2)];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNote = notes.find((n) => n.id === active.id);
    if (!activeNote) return;

    const overId = String(over.id);

    // Check if dropping on a day column (date string) vs a note
    const isDropOnDay = days.includes(overId);

    if (isDropOnDay) {
      // Cross-day move: just update the date, keep sort order
      const targetDate = overId;
      if (targetDate === activeNote.date) return;

      setNotes((prev) =>
        prev.map((n) => (n.id === activeNote.id ? { ...n, date: targetDate } : n))
      );
      await updateNote(activeNote.id, { date: targetDate });
      return;
    }

    // Same-day reorder
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

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          {days.map((date) => (
            <DayColumn
              key={date}
              date={date}
              label={formatDayLabel(date)}
              isToday={date === today}
              notes={notes.filter((n) => n.date === date)}
              typeFilter={typeFilter}
              onEdit={setEditingNote}
            />
          ))}
        </div>
      </DndContext>

      {editingNote && (
        <AddNoteModal
          workspaceId={workspaceId}
          editingNote={editingNote}
          defaultDate={editingNote.date}
          onClose={() => setEditingNote(null)}
        />
      )}
    </>
  );
}
