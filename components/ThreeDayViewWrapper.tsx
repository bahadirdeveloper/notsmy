'use client';

import dynamic from 'next/dynamic';
import { ToastProvider } from './Toast';
import type { Note } from '@/types/note';

const ThreeDayView = dynamic(
  () => import('./ThreeDayView').then((m) => m.ThreeDayView),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden p-8 text-center text-white/30">
        Yükleniyor...
      </div>
    ),
  }
);

interface Props {
  initialNotes: Note[];
  workspaceId: string;
  startDate: string;
  typeFilter: string | null;
}

export function ThreeDayViewWrapper(props: Props) {
  return (
    <ToastProvider>
      <ThreeDayView {...props} />
    </ToastProvider>
  );
}
