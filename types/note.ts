export type NoteType = 'task' | 'meeting' | 'idea' | 'note';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  type: NoteType;
  date: string;
  isCompleted: boolean;
  isFavorite: boolean;
  sortOrder: number;
}
