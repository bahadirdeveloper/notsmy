'use server';

import { db } from '@/db';
import { notes, workspaceMembers } from '@/db/schema';
import { auth } from '@/auth';
import { z } from 'zod';
import { eq, and, between, desc, asc, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const NoteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  type: z.enum(['task', 'meeting', 'idea', 'note']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  workspaceId: z.string().uuid(),
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
    .where(and(eq(notes.workspaceId, workspaceId), between(notes.date, startDate, endDate)))
    .orderBy(asc(notes.sortOrder), desc(notes.createdAt));
}

// Create a new note
export async function createNote(data: z.infer<typeof NoteSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = NoteSchema.parse(data);

  // Get max sort_order for today + 1
  const [maxResult] = await db
    .select({ maxOrder: max(notes.sortOrder) })
    .from(notes)
    .where(and(eq(notes.workspaceId, parsed.workspaceId), eq(notes.date, parsed.date)));

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

  // Verify access using first item's workspace (all items should be in same workspace)
  await verifyNoteAccess(items[0].id, session.user.id);

  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx.update(notes).set({ sortOrder: item.sortOrder, updatedAt: new Date() }).where(eq(notes.id, item.id));
    }
  });

  revalidatePath('/');
}
