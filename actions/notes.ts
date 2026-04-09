'use server';

import { db } from '@/db';
import { notes, workspaceMembers } from '@/db/schema';
import { auth } from '@/auth';
import { z } from 'zod';
import { eq, and, between, desc, asc, max, inArray, isNull, not, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

async function verifyNoteAccess(noteId: string, userId: string) {
  const [target] = await db
    .select({ workspaceId: notes.workspaceId })
    .from(notes)
    .where(eq(notes.id, noteId));
  if (!target) throw new Error('Note not found');

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, target.workspaceId), eq(workspaceMembers.userId, userId)));
  if (!membership) throw new Error('Forbidden');

  return target;
}

// Get notes for a date range
export async function getNotes(workspaceId: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new Error('Invalid date format');
  }

  // Verify membership
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)));
  if (!membership) throw new Error('Forbidden');

  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.workspaceId, workspaceId),
        not(isNull(notes.date)),
        between(notes.date, startDate, endDate),
      ),
    )
    .orderBy(asc(notes.sortOrder), desc(notes.createdAt));
}

// Create a new note
export async function createNote(data: z.infer<typeof NoteSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = NoteSchema.parse(data);

  // Verify workspace membership
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, parsed.workspaceId), eq(workspaceMembers.userId, session.user.id)));
  if (!membership) throw new Error('Forbidden: not a member of this workspace');

  // Get max sort_order for today + 1
  const dateFilter = parsed.date === null
    ? isNull(notes.date)
    : eq(notes.date, parsed.date);

  const [maxResult] = await db
    .select({ maxOrder: max(notes.sortOrder) })
    .from(notes)
    .where(and(eq(notes.workspaceId, parsed.workspaceId), dateFilter));

  const sortOrder = (maxResult?.maxOrder ?? -1) + 1;

  const [note] = await db
    .insert(notes)
    .values({
      ...parsed,
      createdBy: session.user.id,
      sortOrder,
    })
    .returning();

  revalidatePath('/');
  return note;
}

// Update a note
export async function updateNote(id: string, data: Partial<z.infer<typeof NoteSchema>>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await verifyNoteAccess(id, session.user.id);

  const parsed = NoteSchema.partial().parse(data);

  const [note] = await db
    .update(notes)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();

  revalidatePath('/');
  return note;
}

// Delete a note
export async function deleteNote(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await verifyNoteAccess(id, session.user.id);

  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath('/');
}

// Restore a deleted note (used by Toast undo). Re-uses the original UUID so
// the optimistic UI stays in sync without needing to swap IDs.
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

export async function restoreNote(data: z.infer<typeof RestoreSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = RestoreSchema.parse(data);

  // Verify workspace membership
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, parsed.workspaceId),
        eq(workspaceMembers.userId, session.user.id)
      )
    );
  if (!membership) throw new Error('Forbidden: not a member of this workspace');

  const [note] = await db
    .insert(notes)
    .values({
      id: parsed.id,
      workspaceId: parsed.workspaceId,
      title: parsed.title,
      content: parsed.content ?? null,
      type: parsed.type,
      date: parsed.date,
      isCompleted: parsed.isCompleted ?? false,
      isFavorite: parsed.isFavorite ?? false,
      sortOrder: parsed.sortOrder ?? 0,
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath('/');
  return note;
}

// Toggle completed status
export async function toggleComplete(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await verifyNoteAccess(id, session.user.id);

  const [current] = await db.select({ isCompleted: notes.isCompleted }).from(notes).where(eq(notes.id, id));
  if (!current) throw new Error('Note not found');

  const [note] = await db
    .update(notes)
    .set({ isCompleted: !current.isCompleted, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();

  revalidatePath('/');
  return note;
}

// Toggle favorite status
export async function toggleFavorite(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await verifyNoteAccess(id, session.user.id);

  const [current] = await db.select({ isFavorite: notes.isFavorite }).from(notes).where(eq(notes.id, id));
  if (!current) throw new Error('Note not found');

  const [note] = await db
    .update(notes)
    .set({ isFavorite: !current.isFavorite, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();

  revalidatePath('/');
  return note;
}

// Reorder notes (drag-and-drop)
export async function reorderNotes(items: { id: string; sortOrder: number }[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (items.length === 0) return;

  // Fetch all note workspaceIds and verify user has access to each
  const noteIds = items.map((i) => i.id);
  const noteRows = await db
    .select({ id: notes.id, workspaceId: notes.workspaceId })
    .from(notes)
    .where(inArray(notes.id, noteIds));

  // Make sure every requested note actually exists and belongs to a workspace
  // the caller is a member of. We verify membership for the union of workspaces
  // referenced by these notes — typically one.
  if (noteRows.length !== noteIds.length) {
    throw new Error('Some notes were not found');
  }

  const workspaceIds = [...new Set(noteRows.map((n) => n.workspaceId))];
  const memberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        inArray(workspaceMembers.workspaceId, workspaceIds),
        eq(workspaceMembers.userId, session.user.id)
      )
    );
  if (memberships.length !== workspaceIds.length) {
    throw new Error('Forbidden');
  }

  // Apply all updates atomically. The neon-http driver does not support the
  // transaction() callback API, but db.batch() sends every statement to Neon
  // in a single HTTP round-trip wrapped in a transaction on the server side.
  const now = new Date();
  if (items.length === 1) {
    const [item] = items;
    await db
      .update(notes)
      .set({ sortOrder: item.sortOrder, updatedAt: now })
      .where(eq(notes.id, item.id));
  } else {
    const [first, ...rest] = items;
    await db.batch([
      db.update(notes).set({ sortOrder: first.sortOrder, updatedAt: now }).where(eq(notes.id, first.id)),
      ...rest.map((item) =>
        db.update(notes).set({ sortOrder: item.sortOrder, updatedAt: now }).where(eq(notes.id, item.id))
      ),
    ]);
  }

  revalidatePath('/');
}

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

// Return { completed, total } task counts for a given month.
// Counts:
//   - day-scoped tasks whose date falls in the month
//   - persistent tasks (date IS NULL) — all open ones when viewing the current
//     month, plus those completed in the target month (attributed via updatedAt).
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
    .select({ isCompleted: notes.isCompleted })
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
