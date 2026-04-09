# Persistent (Day-Independent) Tasks — Design

**Date:** 2026-04-09
**Status:** Approved, ready for implementation plan

## Problem

The 3-day calendar view shows day-scoped notes. On desktop, the left and right areas next to the calendar are empty. Users also want a general "to-do list" that is NOT tied to a specific day — tasks that stay visible until completed, regardless of date. Finally, they want a simple monthly completion signal ("this month I finished X/Y tasks") for motivation.

## Goals

1. Let users create tasks that are not tied to a date and see them in a dedicated, always-visible list.
2. Use the empty desktop space to surface these tasks without hurting the mobile experience.
3. Show a minimal monthly task-completion stat for motivation.
4. Keep the change small: reuse the existing `notes` table, types, and actions.

## Non-Goals (YAGNI)

- Historical month-by-month charts or a dedicated `/stats` page.
- Drag-and-drop between persistent tasks and the day calendar.
- Persistent support for `meeting` / `idea` / `note` types — only `task`.
- Per-day grouping or recurring-task logic.

## Data Model

Make `notes.date` nullable. Semantics:

- `date IS NOT NULL` → day-scoped (existing behavior, unchanged).
- `date IS NULL AND type = 'task'` → persistent (general) task.
- `date IS NULL` combined with any other type is invalid and must be rejected at the server action layer.

### Migration

```sql
ALTER TABLE notes ALTER COLUMN date DROP NOT NULL;
```

- Existing rows are untouched.
- The `notes_workspace_date_idx` composite index keeps working with nullable columns (Postgres indexes NULLs by default); no new index required.
- Drizzle schema: change `date('date').notNull()` to `date('date')` in `db/schema.ts`.

### Type changes

```ts
// types/note.ts
export type Note = {
  // ...
  date: string | null; // null = persistent task
};
```

Every consumer of `note.date` must handle `null`. Call sites that assume a string (sorting, formatting, drag-and-drop date targeting) will be audited during implementation.

## Server Actions (`actions/notes.ts`)

### Changes to existing actions

- **`createNote`**: `date` becomes optional. Validation: if `date` is omitted/null, `type` MUST be `'task'`, otherwise throw. If `date` is present, behavior is unchanged.
- **`updateNote`**: accepts `date: string | null`. Same validation rule (null only allowed when the note's resulting type is `'task'`).
- **`getNotes(range)`** (the day-range fetch used by `app/page.tsx`): explicitly filter out `date IS NULL` so persistent tasks never leak into the calendar view.
- **`restoreNote`**: accept nullable date (needed for undo of a deleted persistent task).

### New actions

- **`getPersistentTasks(workspaceId)`** — returns all rows where `workspace_id = ? AND date IS NULL AND type = 'task'`, ordered by `isCompleted ASC, sortOrder ASC, createdAt DESC`. Auth check: requester must be a workspace member.
- **`getMonthlyStats(workspaceId, year, month)`** — returns `{ completed: number, total: number }` for rows where `type = 'task'` and either:
  - `date` is in `[year-month-01, year-month-last]`, OR
  - `date IS NULL` AND the task was completed in that month (use `updated_at` as the completion timestamp for persistent tasks; for open persistent tasks, count them in the "current" month only).

  For the first implementation, keep the rule simple and explicit:
  - **Total** = day-scoped tasks whose `date` falls in the target month + ALL open persistent tasks (only when viewing the current month) + persistent tasks completed in the target month.
  - **Completed** = the subset of Total where `isCompleted = true`.

  Only the current month is ever requested by the UI in this iteration, so the edge cases for past months don't need to be exercised yet — but the action should still return correct numbers if called with the current month.

## UI

### Desktop layout (`lg:` and up)

Update the page grid to three columns:

```
lg:grid-cols-[1fr_minmax(0,680px)_320px]
```

- **Left (1fr):** empty, reserved for future use.
- **Middle (`minmax(0, 680px)`):** existing 3-day calendar, search, filter bar, keyboard hints.
- **Right (`320px`):** new `PersistentTaskList` followed by `MonthlyStatsCard`.

### Mobile layout (`< lg`)

- At the top of the page, above the search bar, a collapsible `<details open>` element labeled "Genel Görevler (N)" containing `PersistentTaskList`.
- Below the calendar, a compact version of `MonthlyStatsCard` (single row: "Nisan 2026 — 12/20" with the progress bar).

### `components/PersistentTaskList.tsx` (client)

Responsibilities:

- Render the list of persistent tasks passed in as a prop. Keep local state in sync with props via `useEffect` (same pattern as `ThreeDayView`).
- Each row: checkbox (toggles `isCompleted`), title, favorite star, delete button. Completed tasks drop to the bottom, rendered with reduced opacity and a strikethrough — matching `NoteCard`'s existing completed styling.
- Inline "+ Yeni görev" button at the bottom that opens `AddNoteModal` preconfigured with `type='task'` and the persistent toggle ON.
- Tapping a row opens `NoteDetailModal` (same as `DayColumn`).
- Reuses `useToast`, `toggleComplete`, `deleteNote`, `restoreNote` from the existing actions — no new optimistic patterns.
- No drag-and-drop in this iteration.

Props:
```ts
{
  workspaceId: string;
  initialTasks: Note[];
  onOpenDetail: (note: Note) => void;
  onEdit: (note: Note) => void;
}
```

The parent (`app/page.tsx` or a small client wrapper) owns the shared edit/detail modals so both `ThreeDayView` and `PersistentTaskList` open the same modal instances.

### `components/MonthlyStatsCard.tsx` (server component)

- Receives `{ completed, total, year, month }` as props (fetched in the page).
- Renders a small card: month label in Turkish (`"Nisan 2026"`), `"X / Y tamamlandı"`, and a thin emerald progress bar (`bg-[#10b981]`) sized by `completed / total`.
- If `total === 0`: render a muted "Bu ay henüz görev yok" message instead of a zero-width bar.
- Mobile variant: same data, single-row horizontal layout. Pass a `variant: 'full' | 'compact'` prop.

### `components/AddNoteModal.tsx` updates

- When the selected type is `task`, show a toggle: **"Kalıcı görev (tarihsiz)"**. Default state:
  - OFF when the modal is opened from the calendar or from the FAB.
  - ON when the modal is opened from `PersistentTaskList`'s "+ Yeni görev" button.
- When the toggle is ON, hide the date picker and submit with `date: null`.
- When editing a persistent task, the toggle starts ON and can be turned OFF (which requires picking a date before saving).
- When the user changes the type away from `task` while the toggle is ON, automatically turn the toggle OFF and re-show the date picker.

### `components/NoteDetailModal.tsx` updates

- If `note.date === null`: hide the date row and show a small "Genel görev" badge next to the type chip.
- Everything else (complete, favorite, edit, delete) stays identical.

### `components/NoteCard.tsx`

- Currently assumes `note.date` is a string. Audit and make it safe for `null` — specifically any date formatting inside the card. If the card is never rendered for persistent tasks directly (the persistent list uses its own row component), this may reduce to a type-only change. Decide during implementation after reading the file.

## Page wiring (`app/page.tsx`)

- In parallel with the existing 3-day fetch, call `getPersistentTasks(workspaceId)` and `getMonthlyStats(workspaceId, currentYear, currentMonth)`.
- Pass results into a client wrapper that owns the shared `AddNoteModal` / `NoteDetailModal` state and renders `ThreeDayView` + `PersistentTaskList` + `MonthlyStatsCard` in the grid.
- The existing `ThreeDayViewWrapper` may need to expand into a broader `PageShell` wrapper that holds the modals — decide during implementation, don't over-abstract.

## Edge cases

- **Creating a persistent task while offline / failed create**: same optimistic + toast pattern as existing notes.
- **Toggling a persistent task completed**: identical to day-scoped toggle, uses `toggleComplete`. The monthly stats number is derived from server data, so after toggle the page should `router.refresh()` to re-read the stats. In-list state is optimistic for the checkbox itself.
- **Deleting a persistent task**: undo via the existing toast pattern. `restoreNote` must accept `date: null`.
- **Calendar drag-and-drop onto a day column**: not applicable — persistent tasks live outside the `DndContext` in a separate subtree.
- **Search**: the existing search box in `ThreeDayView` only searches day-scoped notes. In this iteration, persistent tasks are NOT included in that search. Document this in the spec; if users complain, extend later.
- **Filter bar**: the type filter in `ThreeDayView` controls the calendar only and does not affect `PersistentTaskList`.

## Testing / verification

After implementation, verify in the preview:

1. Create a persistent task from `PersistentTaskList` — appears in the list, does NOT appear in the calendar.
2. Create a day-scoped task from the FAB — appears in the calendar, NOT in the persistent list.
3. Toggle a persistent task complete — strikethrough + moves to bottom; stats card number increments after refresh.
4. Delete + undo a persistent task — restored with original id.
5. Resize to mobile viewport — collapsible section appears at top, compact stats below calendar.
6. Edit a persistent task → turn off the "Kalıcı görev" toggle → save → task moves to the selected date on the calendar and disappears from the persistent list.
7. Edit a day-scoped task → turn on the toggle → save → task moves to the persistent list.

## Out of scope / follow-ups

- Search across persistent tasks.
- Historical month stats / chart page.
- Drag persistent tasks onto calendar days.
- Recurring tasks.
- Left-sidebar content (kept empty for now).
