'use server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Get unread notification count
export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [result] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      )
    );

  return result.value;
}

// Get all notifications for current user
export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

// Mark a notification as read
export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id) // ensure user owns this notification
      )
    );

  revalidatePath('/');
}

// Mark all notifications as read
export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      )
    );

  revalidatePath('/');
}
