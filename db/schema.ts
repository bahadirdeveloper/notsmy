import { pgTable, uuid, varchar, text, boolean, integer, timestamp, date, pgEnum, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const noteTypeEnum = pgEnum('note_type', ['task', 'meeting', 'idea', 'note']);
export const memberRoleEnum = pgEnum('member_role', ['owner', 'member']);

// users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: timestamp('email_verified'),
  // Named 'image' (not 'avatar_url') for @auth/drizzle-adapter compatibility
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NextAuth required tables (accounts, sessions, verification_tokens)
export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// workspaces table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// workspace_members table (composite PK)
export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
}));

// notes table (main table)
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'),
  type: noteTypeEnum('type').default('note').notNull(),
  date: date('date').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  reminderSent: boolean('reminder_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Must explicitly set updatedAt: new Date() in every update query — no DB trigger
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceDateIdx: index('notes_workspace_date_idx').on(table.workspaceId, table.date),
  workspaceIdx: index('notes_workspace_idx').on(table.workspaceId),
}));

// notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  message: varchar('message', { length: 500 }).notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  notes: many(notes),
  notifications: many(notifications),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  notes: many(notes),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [notes.workspaceId], references: [workspaces.id] }),
  creator: one(users, { fields: [notes.createdBy], references: [users.id] }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  note: one(notes, { fields: [notifications.noteId], references: [notes.id] }),
}));
