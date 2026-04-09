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
