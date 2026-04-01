'use client';

import { useState } from 'react';
import { AddNoteModal } from './AddNoteModal';

interface Props {
  workspaceId: string;
  defaultDate: string;
}

export function AddNoteButton({ workspaceId, defaultDate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#10b981] text-black rounded-full shadow-lg hover:bg-[#0ea371] transition-colors flex items-center justify-center text-xl font-bold z-30"
        aria-label="Yeni not ekle"
      >
        +
      </button>

      {open && (
        <AddNoteModal
          workspaceId={workspaceId}
          defaultDate={defaultDate}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
