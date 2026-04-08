'use server';

import { db } from '@/db';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { auth } from '@/auth';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Get all workspaces for the current user
export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const members = await db
    .select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.user.id));

  return members.map((m) => m.workspace);
}

// Create a new workspace
export async function createWorkspace(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = z.string().min(1).max(255).parse(name);

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: parsed, ownerId: session.user.id })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: session.user.id,
    role: 'owner',
  });

  revalidatePath('/');
  return workspace;
}

// Ensure personal workspace exists (called on first login / page load).
// Two concurrent first-page-load requests for a brand-new user could race
// here and both try to create the workspace. We re-check after a failed
// create to recover gracefully instead of throwing.
export async function ensurePersonalWorkspace() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Check for workspace owned by this user (not just any membership)
  const [ownedWorkspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, session.user.id));

  if (ownedWorkspace) return ownedWorkspace;

  try {
    return await createWorkspace('Kişisel Workspace');
  } catch (err) {
    // If a parallel request created it first, fall back to the existing one
    const [existing] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, session.user.id));
    if (existing) return existing;
    throw err;
  }
}

// Invite a member to a workspace by email
export async function inviteMember(workspaceId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify current user is owner
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id)
      )
    );

  if (!membership || membership.role !== 'owner') {
    throw new Error('Only workspace owners can invite members');
  }

  // Find user by email
  const [invitee] = await db.select().from(users).where(eq(users.email, email));
  if (!invitee) throw new Error('User not found. They must sign up first.');

  // Check not already a member
  const [existing] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, invitee.id)
      )
    );
  if (existing) throw new Error('User is already a member');

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: invitee.id,
    role: 'member',
  });

  revalidatePath('/');
}
