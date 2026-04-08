import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes, notifications, workspaceMembers } from '@/db/schema';
import { and, eq, lt, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron (or manually with the secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/reminders] CRON_SECRET is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD (UTC)
  // Find today's tasks: not completed, reminder not sent,
  // and created more than 20 hours ago (within 24h window = give 4h warning)
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  try {
    const overdueNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        workspaceId: notes.workspaceId,
      })
      .from(notes)
      .where(
        and(
          eq(notes.type, 'task'),
          eq(notes.date, today),
          eq(notes.isCompleted, false),
          eq(notes.reminderSent, false),
          lt(notes.createdAt, twentyHoursAgo)
        )
      );

    if (overdueNotes.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No reminders needed' });
    }

    // Fetch ALL members for the affected workspaces in one query
    const workspaceIds = [...new Set(overdueNotes.map((n) => n.workspaceId))];
    const membershipRows = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
      })
      .from(workspaceMembers)
      .where(inArray(workspaceMembers.workspaceId, workspaceIds));

    // Group members by workspaceId for fast lookup
    const membersByWorkspace = new Map<string, string[]>();
    for (const row of membershipRows) {
      const list = membersByWorkspace.get(row.workspaceId) ?? [];
      list.push(row.userId);
      membersByWorkspace.set(row.workspaceId, list);
    }

    // Build all notification rows in memory
    const notificationRows: { userId: string; noteId: string; message: string; isRead: boolean }[] = [];
    for (const note of overdueNotes) {
      const members = membersByWorkspace.get(note.workspaceId) ?? [];
      for (const userId of members) {
        notificationRows.push({
          userId,
          noteId: note.id,
          message: `"${note.title}" görevi tamamlanmadı — son 4 saatiniz!`,
          isRead: false,
        });
      }
    }

    // Insert notifications + mark reminders as sent in a single batch
    const noteIds = overdueNotes.map((n) => n.id);
    if (notificationRows.length > 0) {
      await db.batch([
        db.insert(notifications).values(notificationRows),
        db.update(notes).set({ reminderSent: true }).where(inArray(notes.id, noteIds)),
      ]);
    } else {
      // Still mark reminder as sent so we don't reprocess them next hour
      await db.update(notes).set({ reminderSent: true }).where(inArray(notes.id, noteIds));
    }

    return NextResponse.json({
      processed: overdueNotes.length,
      notifications: notificationRows.length,
      message: `${overdueNotes.length} hatırlatma gönderildi`,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[cron/reminders] failed:', err);
    return NextResponse.json(
      { error: 'Internal error', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
