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
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#10b981] text-black rounded-2xl shadow-lg shadow-[#10b981]/25 hover:shadow-[#10b981]/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-30 group"
        aria-label="Yeni not ekle"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:rotate-90 transition-transform duration-200">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
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
