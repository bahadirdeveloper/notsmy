# Persistent (Day-Independent) Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent "general tasks" list (tasks not tied to a date) that appears in the empty right-side space on desktop and as a collapsible block on mobile, plus a minimal monthly completion stat card.

**Architecture:** Make `notes.date` nullable so `date IS NULL AND type = 'task'` represents a persistent task. Add two new server actions (`getPersistentTasks`, `getMonthlyStats`) and three new components (`PersistentTaskList`, `PersistentTaskRow`, `MonthlyStatsCard`). Restructure `app/page.tsx` into a 3-column grid and lift the shared edit/detail modal state into a new `PageShell` client wrapper so both the calendar and the persistent list open the same modals.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Drizzle ORM (Neon Postgres), NextAuth v5, dnd-kit (unchanged — persistent list has no DnD).

**Verification strategy:** The project has no test framework. Each task ends with `npm run lint` + `npm run build` passing and, where relevant, a manual preview check documented in the step.

**Spec:** `docs/superpowers/specs/2026-04-09-persistent-tasks-design.md`

---

## File Structure

**Create:**
- `components/PersistentTaskList.tsx` — client component, lists persistent tasks + "new task" button
- `components/PersistentTaskRow.tsx` — client component, single row (checkbox, title, favorite, delete). No dnd-kit — renders outside any `DndContext`.
- `components/MonthlyStatsCard.tsx` — server component, renders stats card in `full` or `compact` variant
- `components/PageShell.tsx` — client wrapper replacing `ThreeDayViewWrapper`. Owns shared `AddNoteModal` / `NoteDetailModal` state, lays out the 3-column grid, wraps everything in a single `ToastProvider`.

**Modify:**
- `db/schema.ts` — drop `.notNull()` on `notes.date`
- `types/note.ts` — change `date: string` to `date: string | null`
- `actions/notes.ts` — relax `NoteSchema.date`, add new actions, filter `date IS NULL` from `getNotes`, accept nullable date in `restoreNote`, `updateNote`
- `components/AddNoteModal.tsx` — add "Kalıcı görev (tarihsiz)" toggle, submit `date: null` when on
- `components/NoteDetailModal.tsx` — hide date row and show "Genel görev" badge when `date === null`
- `components/ThreeDayView.tsx` — adapt to receiving edit/detail handlers from parent instead of owning them; its restoreNote call must pass `date` as-is (can be null); keep drag-drop unchanged
- `components/NoteCard.tsx` — type-only change (accept `Note` with nullable date); no runtime use of `date` inside, so no functional change expected
- `app/page.tsx` — fetch persistent tasks + monthly stats in parallel, pass to new `PageShell`
- `components/ThreeDayViewWrapper.tsx` — delete (replaced by `PageShell`). Note: the wrapper file is DELETED in Task 12.

**Delete:**
- `components/ThreeDayViewWrapper.tsx` (after `PageShell` replaces it)

---

## Task 1: Database migration — make `notes.date` nullable

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Update the Drizzle schema**

Open `db/schema.ts`. In the `notes` table definition, change line 76 from:

```ts
date: date('date').notNull(),
```

to:

```ts
date: date('date'),
```

Leave the `notes_workspace_date_idx` index as-is — Postgres indexes NULLs by default and no query tuning is required.

- [ ] **Step 2: Push the schema change to the database**

Run: `npm run db:push`

Expected: drizzle-kit prompts for confirmation of the "alter column drop not null" change; answer yes. Command exits 0 with a success message.

- [ ] **Step 3: Verify in SQL**

Run via Neon MCP or `psql`:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'date';
```

Expected: `is_nullable = YES`.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts
git commit -m "feat(db): make notes.date nullable for persistent tasks"
```

---

## Task 2: Update `Note` type

**Files:**
- Modify: `types/note.ts`

- [ ] **Step 1: Change the date field type**

Open `types/note.ts` and replace the entire file contents with:

```ts
export type NoteType = 'task' | 'meeting' | 'idea' | 'note';

export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string | null;
  type: NoteType;
  /**
   * YYYY-MM-DD for day-scoped notes, or null for persistent tasks.
   * A null date is only valid when `type === 'task'`.
   */
  date: string | null;
  isCompleted: boolean;
  isFavorite: boolean;
  sortOrder: number;
}
```

- [ ] **Step 2: Typecheck the project**

Run: `npx tsc --noEmit`

Expected: TypeScript will report errors in every file that assumes `date` is always a string. Note the list — these are fixed in later tasks. The following files are expected to error: `actions/notes.ts`, `components/AddNoteModal.tsx`, `components/NoteDetailModal.tsx`, `components/ThreeDayView.tsx`, `app/page.tsx`. If errors appear in files NOT in this list, stop and investigate.

- [ ] **Step 3: Commit (known-broken state)**

The project temporarily does not typecheck. This is expected and gets fixed in Task 3.

```bash
git add types/note.ts
git commit -m "feat(types): allow null date on Note for persistent tasks"
```

---

## Task 3: Server actions — allow null date and add new actions

**Files:**
- Modify: `actions/notes.ts`

- [ ] **Step 1: Relax the zod schemas**

In `actions/notes.ts`, replace the `NoteSchema` definition (currently lines 10-16) with:

```ts
const NoteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  type: z.enum(['task', 'meeting', 'idea', 'note']),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD
    .nullable(),
  workspaceId: z.string().uuid(),
}).refine((v) => v.date !== null || v.type === 'task', {
  message: 'Only task notes may have a null date',
  path: ['date'],
});
```

- [ ] **Step 2: Relax the restore schema**

Replace the `RestoreSchema` definition (currently lines 126-136) with:

```ts
const RestoreSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().nullable().optional(),
  type: z.enum(['task', 'meeting', 'idea', 'note']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  isCompleted: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
}).refine((v) => v.date !== null || v.type === 'task', {
  message: 'Only task notes may have a null date',
  path: ['date'],
});
```

- [ ] **Step 3: Filter null dates out of `getNotes`**

Add the `isNull` import to the drizzle-orm import on line 7:

```ts
import { eq, and, between, desc, asc, max, inArray, isNull, not, gte, lte, sql } from 'drizzle-orm';
```

(`not`, `gte`, `lte`, and `sql` are used later in this task; add them all now.)

Then in `getNotes`, replace the `.where(...)` call (currently line 55) with:

```ts
.where(
  and(
    eq(notes.workspaceId, workspaceId),
    not(isNull(notes.date)),
    between(notes.date, startDate, endDate),
  ),
)
```

This prevents persistent tasks from leaking into the calendar view.

- [ ] **Step 4: Fix the `createNote` sortOrder query for null dates**

In `createNote`, the max-sort-order query (currently lines 74-77) uses `eq(notes.date, parsed.date)`. Replace those lines with:

```ts
const dateFilter = parsed.date === null
  ? isNull(notes.date)
  : eq(notes.date, parsed.date);

const [maxResult] = await db
  .select({ maxOrder: max(notes.sortOrder) })
  .from(notes)
  .where(and(eq(notes.workspaceId, parsed.workspaceId), dateFilter));
```

- [ ] **Step 5: Add `getPersistentTasks`**

Append to `actions/notes.ts` (after `reorderNotes`):

```ts
// Get all persistent (day-independent) tasks for a workspace.
export async function getPersistentTasks(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    );
  if (!membership) throw new Error('Forbidden');

  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.workspaceId, workspaceId),
        isNull(notes.date),
        eq(notes.type, 'task'),
      ),
    )
    .orderBy(asc(notes.isCompleted), asc(notes.sortOrder), desc(notes.createdAt));
}
```

- [ ] **Step 6: Add `getMonthlyStats`**

Append to `actions/notes.ts`:

```ts
// Return { completed, total } task counts for a given month.
// Counts:
//   - day-scoped tasks whose date falls in the month
//   - persistent tasks (date IS NULL) — all open ones in the current month,
//     plus those completed in any earlier month get attributed to the month
//     of their updated_at timestamp.
export async function getMonthlyStats(
  workspaceId: string,
  year: number,
  month: number, // 1-12
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    );
  if (!membership) throw new Error('Forbidden');

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayDate = new Date(year, month, 0); // day 0 of next month = last day of this month
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(
    lastDayDate.getDate(),
  ).padStart(2, '0')}`;

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;

  // Day-scoped tasks whose date is in the month.
  const dayScoped = await db
    .select({
      isCompleted: notes.isCompleted,
    })
    .from(notes)
    .where(
      and(
        eq(notes.workspaceId, workspaceId),
        eq(notes.type, 'task'),
        not(isNull(notes.date)),
        gte(notes.date, firstDay),
        lte(notes.date, lastDay),
      ),
    );

  // Persistent tasks. For the current month we count every persistent task.
  // For past months we only count persistent tasks that were completed within
  // that month (attributed via updated_at).
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1); // exclusive upper bound

  const persistent = isCurrentMonth
    ? await db
        .select({ isCompleted: notes.isCompleted })
        .from(notes)
        .where(
          and(
            eq(notes.workspaceId, workspaceId),
            eq(notes.type, 'task'),
            isNull(notes.date),
          ),
        )
    : await db
        .select({ isCompleted: notes.isCompleted })
        .from(notes)
        .where(
          and(
            eq(notes.workspaceId, workspaceId),
            eq(notes.type, 'task'),
            isNull(notes.date),
            eq(notes.isCompleted, true),
            gte(notes.updatedAt, monthStart),
            sql`${notes.updatedAt} < ${monthEnd}`,
          ),
        );

  const rows = [...dayScoped, ...persistent];
  const total = rows.length;
  const completed = rows.filter((r) => r.isCompleted).length;
  return { completed, total };
}
```

- [ ] **Step 7: Typecheck `actions/notes.ts`**

Run: `npx tsc --noEmit`

Expected: errors in `actions/notes.ts` should be GONE. Errors remaining in `components/AddNoteModal.tsx`, `components/NoteDetailModal.tsx`, `components/ThreeDayView.tsx`, and `app/page.tsx` are expected and fixed in later tasks.

- [ ] **Step 8: Commit**

```bash
git add actions/notes.ts
git commit -m "feat(actions): support nullable date, add getPersistentTasks and getMonthlyStats"
```

---

## Task 4: `AddNoteModal` — persistent toggle

**Files:**
- Modify: `components/AddNoteModal.tsx`

- [ ] **Step 1: Add `defaultPersistent` prop and state**

In the `Props` interface, add after `defaultDate`:

```ts
defaultPersistent?: boolean;
```

Update the component signature to destructure it with a default of `false`:

```ts
export function AddNoteModal({
  workspaceId,
  defaultDate,
  defaultPersistent = false,
  editingNote,
  onClose,
  onNoteCreated,
  onNoteUpdated,
}: Props) {
```

Add a new piece of state next to the other `useState` calls (after the `date` state line):

```ts
const [isPersistent, setIsPersistent] = useState(
  editingNote ? editingNote.date === null : defaultPersistent,
);
```

- [ ] **Step 2: Auto-clear the toggle when type is not `task`**

Immediately below the `useState` calls, add:

```ts
useEffect(() => {
  if (type !== 'task' && isPersistent) {
    setIsPersistent(false);
  }
}, [type, isPersistent]);
```

- [ ] **Step 3: Update the submit handler to send nullable date**

Replace the body of `handleSubmit`'s try block (the `if (editingNote) { ... } else { ... } onClose();` block) with:

```ts
const payloadDate = isPersistent ? null : date;

if (editingNote) {
  const updated = await updateNote(editingNote.id, {
    title: title.trim(),
    content: content || undefined,
    type,
    date: payloadDate,
  });
  if (onNoteUpdated && updated) onNoteUpdated(updated as Note);
} else {
  const created = await createNote({
    title: title.trim(),
    content: content || undefined,
    type,
    date: payloadDate,
    workspaceId,
  });
  if (onNoteCreated && created) onNoteCreated(created as Note);
}
onClose();
```

- [ ] **Step 4: Add the toggle UI and conditionally hide the date input**

Find the date input block (currently lines 147-155). Replace it with:

```tsx
{/* Persistent toggle — only meaningful for tasks */}
{type === 'task' && (
  <label className="flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-xl bg-white/[0.045] border border-white/[0.1] cursor-pointer select-none">
    <input
      type="checkbox"
      checked={isPersistent}
      onChange={(e) => setIsPersistent(e.target.checked)}
      className="w-4 h-4 accent-[#10b981]"
    />
    <span className="text-white/85 text-[15px] sm:text-sm">
      Kalıcı görev (tarihsiz)
    </span>
  </label>
)}

{/* Date — hidden when the task is persistent */}
{!isPersistent && (
  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    min="2020-01-01"
    max="2099-12-31"
    className="w-full bg-white/[0.045] border border-white/[0.1] rounded-xl px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.06] transition-all disabled:opacity-50"
  />
)}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`

Expected: errors in `AddNoteModal.tsx` should be GONE.

- [ ] **Step 6: Commit**

```bash
git add components/AddNoteModal.tsx
git commit -m "feat(ui): add persistent task toggle to AddNoteModal"
```

---

## Task 5: `NoteDetailModal` — handle null date

**Files:**
- Modify: `components/NoteDetailModal.tsx`

- [ ] **Step 1: Conditionally render the date line**

Find the date paragraph (currently lines 155-157):

```tsx
<p className="mt-1.5 text-white/55 text-xs">
  {formatLongDate(localNote.date)}
</p>
```

Replace with:

```tsx
{localNote.date ? (
  <p className="mt-1.5 text-white/55 text-xs">
    {formatLongDate(localNote.date)}
  </p>
) : (
  <p className="mt-1.5 text-[#10b981] text-xs font-medium">
    Genel görev
  </p>
)}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: errors in `NoteDetailModal.tsx` should be GONE.

- [ ] **Step 3: Commit**

```bash
git add components/NoteDetailModal.tsx
git commit -m "feat(ui): show 'Genel görev' label when note has no date"
```

---

## Task 6: `ThreeDayView` — type-safety for nullable date

**Files:**
- Modify: `components/ThreeDayView.tsx`

- [ ] **Step 1: Fix the `handleNoteCreated` diffDays calculation**

Find the block starting `// If the created note is within the current 3-day view` (currently around line 116). Replace the entire `handleNoteCreated` body with:

```ts
const handleNoteCreated = useCallback((note: Note) => {
  // Persistent tasks have no date — nothing to show in the calendar.
  if (note.date === null) {
    showToast('Kalıcı görev eklendi');
    router.refresh();
    return;
  }

  // If the created note is within the current 3-day view, show it optimistically.
  if (days.includes(note.date)) {
    setNotes((prev) => [...prev, note]);
    showToast('Not eklendi');
    return;
  }

  // Compute offset so note.date lands on day 1 of the new view
  const t = todays();
  const [ty, tm, td] = t.split('-').map(Number);
  const [ny, nm, nd] = note.date.split('-').map(Number);
  const msPerDay = 86400000;
  const diffDays = Math.round(
    (Date.UTC(ny, nm - 1, nd) - Date.UTC(ty, tm - 1, td)) / msPerDay
  );

  const label = new Date(note.date + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
  });
  showToast(`Not ${label} tarihine eklendi`);

  const target = diffDays === 0 ? '/' : `/?offset=${diffDays}`;
  router.push(target);
  router.refresh();
}, [days, router, showToast]);
```

- [ ] **Step 2: Fix `handleDelete` restore call to allow null date**

Find the `restoreNote({ ... })` call inside `handleDelete` (currently around line 177). The existing code passes `date: noteToRestore.date` — this is correct once `restoreNote` accepts a nullable string (done in Task 3). No code change needed, but verify the block still reads:

```ts
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
  // ... unchanged
});
```

- [ ] **Step 3: Fix drag-drop to ignore persistent tasks**

In `handleDragEnd`, find the two places where `activeNote.date` is read. Replace the entire `handleDragEnd` function with:

```ts
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
```

- [ ] **Step 4: Fix edit modal default date**

Find the `editingNote` AddNoteModal render (currently around line 331). Replace its `defaultDate` prop from:

```tsx
defaultDate={editingNote.date}
```

to:

```tsx
defaultDate={editingNote.date ?? startDate}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`

Expected: errors in `ThreeDayView.tsx` should be GONE. Only `app/page.tsx` errors should remain.

- [ ] **Step 6: Commit**

```bash
git add components/ThreeDayView.tsx
git commit -m "fix(ui): make ThreeDayView safe for nullable note dates"
```

---

## Task 7: `PersistentTaskRow` component

**Files:**
- Create: `components/PersistentTaskRow.tsx`

- [ ] **Step 1: Create the row component**

Create `components/PersistentTaskRow.tsx` with the following contents:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no new errors introduced by this file.

- [ ] **Step 3: Commit**

```bash
git add components/PersistentTaskRow.tsx
git commit -m "feat(ui): add PersistentTaskRow component"
```

---

## Task 8: `PersistentTaskList` component

**Files:**
- Create: `components/PersistentTaskList.tsx`

- [ ] **Step 1: Create the list component**

Create `components/PersistentTaskList.tsx` with the following contents:

```tsx
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

  // Sort: incomplete first (by sortOrder), then completed (by updatedAt desc-ish via existing order)
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/PersistentTaskList.tsx
git commit -m "feat(ui): add PersistentTaskList component"
```

---

## Task 9: `MonthlyStatsCard` component

**Files:**
- Create: `components/MonthlyStatsCard.tsx`

- [ ] **Step 1: Create the stats card**

Create `components/MonthlyStatsCard.tsx` with the following contents:

```tsx
import type { FC } from 'react';

interface Props {
  completed: number;
  total: number;
  year: number;
  month: number; // 1-12
  variant?: 'full' | 'compact';
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const MonthlyStatsCard: FC<Props> = ({
  completed,
  total,
  year,
  month,
  variant = 'full',
}) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const label = `${MONTH_NAMES_TR[month - 1]} ${year}`;

  if (variant === 'compact') {
    return (
      <div className="bg-white/[0.035] border border-white/[0.09] rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-white/70 text-[12px]">{label}</span>
            <span className="text-white/90 text-[13px] font-semibold tabular-nums">
              {completed}/{total}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Aylık görev istatistiği"
      className="bg-white/[0.035] border border-white/[0.09] rounded-xl p-4 shadow-xl shadow-black/20"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-white/70 text-[12px] uppercase tracking-wide font-semibold">
          {label}
        </h3>
        <span className="text-white/90 text-[15px] font-semibold tabular-nums">
          {completed}/{total}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-2 text-white/40 text-[12px] italic">
          Bu ay henüz görev yok
        </p>
      ) : (
        <>
          <div className="mt-3 h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-white/50 text-[11px]">%{pct} tamamlandı</p>
        </>
      )}
    </section>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/MonthlyStatsCard.tsx
git commit -m "feat(ui): add MonthlyStatsCard component"
```

---

## Task 10: `PageShell` — shared modal owner and 3-column grid

**Files:**
- Create: `components/PageShell.tsx`

- [ ] **Step 1: Create the shell**

Create `components/PageShell.tsx` with the following contents:

```tsx
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

  // After create/update/delete of a persistent task, refresh from server so
  // the stats card stays accurate.
  const refreshFromServer = useCallback(() => {
    // router.refresh would re-run the RSC tree; we rely on revalidatePath('/')
    // inside the server actions. Nothing else to do here — the page re-renders.
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
          onRequestAdd={() => {
            setAddPersistent(false);
            setShowAdd(true);
          }}
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
            refreshFromServer();
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
            refreshFromServer();
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
```

Note: `ThreeDayView` currently does NOT accept `onRequestEdit`, `onOpenDetail`, or `onRequestAdd` props — Task 11 adds them.

- [ ] **Step 2: Do NOT typecheck yet**

The project will have errors until Task 11 updates `ThreeDayView`'s signature. Proceed directly to commit.

- [ ] **Step 3: Commit**

```bash
git add components/PageShell.tsx
git commit -m "feat(ui): add PageShell with 3-column grid and shared modals"
```

---

## Task 11: `ThreeDayView` — accept lifted modal props

**Files:**
- Modify: `components/ThreeDayView.tsx`

- [ ] **Step 1: Update the props interface**

Replace the existing `ThreeDayViewProps` interface with:

```ts
interface ThreeDayViewProps {
  initialNotes: Note[];
  workspaceId: string;
  startDate: string;
  typeFilter: string | null;
  onRequestEdit: (note: Note) => void;
  onOpenDetail: (note: Note) => void;
  onRequestAdd: () => void;
}
```

- [ ] **Step 2: Remove locally-owned modal state**

Delete the following `useState` lines near the top of the component body:

```ts
const [editingNote, setEditingNote] = useState<Note | null>(null);
const [detailNote, setDetailNote] = useState<Note | null>(null);
const [showAddModal, setShowAddModal] = useState(false);
```

Update the destructure on the component signature:

```ts
export function ThreeDayView({
  initialNotes,
  workspaceId,
  startDate,
  typeFilter: initialFilter,
  onRequestEdit,
  onOpenDetail,
  onRequestAdd,
}: ThreeDayViewProps) {
```

- [ ] **Step 3: Replace every local modal trigger**

- Replace every `setShowAddModal(true)` with `onRequestAdd()`.
- Replace every `setEditingNote(...)` (other than deletions above) with `onRequestEdit(...)`.
- Replace every `setDetailNote(...)` with `onOpenDetail(...)`.

Specifically:
- In the `handleKeyDown` keyboard-shortcut effect, `setShowAddModal(true)` on the `N` key becomes `onRequestAdd()`.
- In the `<DayColumn>` props, `onEdit={setEditingNote}` becomes `onEdit={onRequestEdit}` and `onOpenDetail={setDetailNote}` becomes `onOpenDetail={onOpenDetail}`.
- The FAB button's `onClick` becomes `onClick={onRequestAdd}`.

- [ ] **Step 4: Delete the three modal render blocks at the bottom**

Delete the entire `{showAddModal && <AddNoteModal ... />}`, `{editingNote && <AddNoteModal ... />}`, and `{detailNote && <NoteDetailModal ... />}` blocks (currently the last ~40 lines of the JSX return). `PageShell` now owns these.

- [ ] **Step 5: Remove now-unused imports**

Delete the following imports at the top of the file:

```ts
import { AddNoteModal } from './AddNoteModal';
import { NoteDetailModal } from './NoteDetailModal';
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`

Expected: all errors in `ThreeDayView.tsx` should be gone. Only `app/page.tsx` errors remain.

- [ ] **Step 7: Commit**

```bash
git add components/ThreeDayView.tsx
git commit -m "refactor(ui): lift AddNoteModal/NoteDetailModal out of ThreeDayView"
```

---

## Task 12: Wire up `app/page.tsx` and delete `ThreeDayViewWrapper`

**Files:**
- Modify: `app/page.tsx`
- Delete: `components/ThreeDayViewWrapper.tsx`

- [ ] **Step 1: Update `app/page.tsx` to fetch persistent tasks and stats**

Replace the entire contents of `app/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getNotes, getPersistentTasks, getMonthlyStats } from '@/actions/notes';
import { ensurePersonalWorkspace } from '@/actions/workspaces';
import { Navbar } from '@/components/Navbar';
import { PageShell } from '@/components/PageShell';

interface PageProps {
  searchParams: Promise<{ type?: string; offset?: string; workspace?: string }>;
}

function getDateFromOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const params = await searchParams;
  const offset = parseInt(params.offset ?? '0', 10);

  const workspace = await ensurePersonalWorkspace();
  const workspaceId = params.workspace ?? workspace.id;

  const startDate = getDateFromOffset(offset);
  const endDate = getDateFromOffset(offset + 2);

  const now = new Date();
  const statsYear = now.getFullYear();
  const statsMonth = now.getMonth() + 1;

  const [notes, persistentTasks, monthlyStats] = await Promise.all([
    getNotes(workspaceId, startDate, endDate),
    getPersistentTasks(workspaceId),
    getMonthlyStats(workspaceId, statsYear, statsMonth),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar workspaceId={workspaceId} />

      <main className="max-w-7xl mx-auto px-4 py-5 pb-28">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-3.5 max-w-2xl lg:max-w-none lg:pl-0 lg:pr-0 mx-auto lg:mx-0">
          <div className="flex items-center gap-1">
            <Link
              href={offset === 0 ? '/' : `/?offset=0`}
              className={`text-[13px] sm:text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition-all ${
                offset === 0
                  ? 'bg-[#10b981]/15 text-[#10b981] font-medium border border-[#10b981]/25'
                  : 'text-white/65 hover:text-white/95 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              Bugün
            </Link>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href={`/?offset=${offset - 3}`}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white/90 hover:bg-white/[0.06] active:bg-white/[0.1] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <span className="text-white/55 text-[13px] sm:text-xs min-w-[60px] text-center tabular-nums">
              {offset === 0 ? '' : `${offset > 0 ? '+' : ''}${offset} gün`}
            </span>
            <Link
              href={`/?offset=${offset + 3}`}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white/90 hover:bg-white/[0.06] active:bg-white/[0.1] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </div>

        <PageShell
          initialNotes={notes}
          initialPersistentTasks={persistentTasks}
          workspaceId={workspaceId}
          startDate={startDate}
          monthlyStats={monthlyStats}
          statsYear={statsYear}
          statsMonth={statsMonth}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Delete `ThreeDayViewWrapper.tsx`**

Run: `rm components/ThreeDayViewWrapper.tsx`

Verify nothing else imports it:

```bash
grep -r "ThreeDayViewWrapper" --include='*.ts' --include='*.tsx' .
```

Expected: no matches.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`

Expected: ZERO errors.

Run: `npm run lint`

Expected: passes.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/ThreeDayViewWrapper.tsx
git commit -m "feat(ui): wire up PageShell in app/page.tsx with persistent tasks and stats"
```

---

## Task 13: Manual verification in the preview

**Files:** (none — verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: server starts on http://localhost:3000 with no runtime errors in the console.

- [ ] **Step 2: Sign in and open the app**

Open http://localhost:3000 in a browser. Sign in if needed.

- [ ] **Step 3: Create a persistent task**

In the right sidebar (desktop) or the mobile top section, click "Yeni görev". The modal opens with type `task` and the "Kalıcı görev (tarihsiz)" toggle ON. Enter title "Test kalıcı 1" and save.

Expected: task appears in the persistent list, does NOT appear in any day column of the calendar.

- [ ] **Step 4: Create a day-scoped task via the FAB**

Click the green + FAB. Modal opens with toggle OFF and the date picker visible. Enter title "Test günlük 1" and save.

Expected: task appears in today's column, does NOT appear in the persistent list.

- [ ] **Step 5: Toggle the persistent task complete**

Click the checkbox next to "Test kalıcı 1".

Expected: strikethrough applied, task moves to the bottom of the list, opacity drops. Refresh the page — state persists.

- [ ] **Step 6: Verify stats card**

Look at the "Nisan 2026" card. The `X/Y` counter should include both the persistent and day-scoped tasks created above, with 1 of them marked complete.

- [ ] **Step 7: Convert a day-scoped task to persistent via edit**

Click "Test günlük 1" to open the detail modal, click Düzenle. In the add modal, turn the "Kalıcı görev" toggle ON. Save.

Expected: "Test günlük 1" disappears from today's column and appears in the persistent list.

- [ ] **Step 8: Convert a persistent task back to a date**

Open "Test kalıcı 1" → Düzenle → turn the toggle OFF → pick today's date → Save.

Expected: task disappears from the persistent list and appears in today's column.

- [ ] **Step 9: Delete + undo a persistent task**

Hover the first persistent task, click the trash icon, confirm. A toast with "Geri al" appears. Click undo.

Expected: task reappears with the same id.

- [ ] **Step 10: Mobile check**

Resize the browser to <1024px or open DevTools mobile view. Verify:
- The "Genel Görevler" collapsible appears above the calendar (open by default).
- The compact stats card appears below the calendar.
- The calendar layout is unchanged.

- [ ] **Step 11: Clean up test data**

Delete all test tasks created during verification.

- [ ] **Step 12: Stop the dev server** — Ctrl-C.

- [ ] **Step 13: Commit (no code changes)**

This task has no file changes; nothing to commit. Proceed to Task 14.

---

## Task 14: Final build verification

**Files:** (none)

- [ ] **Step 1: Run lint, typecheck, and build in sequence**

```bash
npm run lint && npx tsc --noEmit && npm run build
```

Expected: all three commands exit 0.

- [ ] **Step 2: Confirm clean git status**

Run: `git status`

Expected: nothing to commit, working tree clean.

- [ ] **Step 3: Summarize the branch**

Run: `git log --oneline main..HEAD` (or `git log --oneline -20` if not on a feature branch).

Expected: a clean sequence of commits, one per task, matching the order above.

---

## Out of Scope (not in this plan)

- Search across persistent tasks (the existing calendar search bar only searches day-scoped notes).
- Historical month stats / charts / `/stats` page.
- Drag-and-drop between the persistent list and calendar days.
- Recurring tasks.
- Content for the left sidebar column.
