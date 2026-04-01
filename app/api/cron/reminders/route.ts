import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes, notifications, workspaceMembers } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron (or manually with the secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // CRON_SECRET must be set in production
    return NextResponse.json({ error: 'Server misconfiguration: CRON_SECRET not set' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // Find notes where: type=task, not completed, reminder not sent,
  // and created more than 20 hours ago (within 24h window = give 4h warning)
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  const overdueNotes = await db
    .select({
      id: notes.id,
      title: notes.title,
      workspaceId: notes.workspaceId,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.type, 'task'),
        eq(notes.isCompleted, false),
        eq(notes.reminderSent, false),
        lt(notes.createdAt, twentyHoursAgo)
      )
    );

  if (overdueNotes.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No reminders needed' });
  }

  let processed = 0;

  for (const note of overdueNotes) {
    // Get all members of this workspace to notify
    const members = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, note.workspaceId));

    // Create notifications for each member
    if (members.length > 0) {
      await db.insert(notifications).values(
        members.map((m) => ({
          userId: m.userId,
          noteId: note.id,
          message: `"${note.title}" görevi tamamlanmadı — son 4 saatiniz!`,
          isRead: false,
        }))
      );
    }

    // Mark reminder as sent
    await db
      .update(notes)
      .set({ reminderSent: true })
      .where(eq(notes.id, note.id));

    processed++;
  }

  return NextResponse.json({
    processed,
    message: `${processed} hatırlatma gönderildi`,
    timestamp: now.toISOString(),
  });
}
