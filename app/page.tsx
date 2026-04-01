import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getNotes } from '@/actions/notes';
import { ensurePersonalWorkspace } from '@/actions/workspaces';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { ThreeDayView } from '@/components/ThreeDayView';
import { AddNoteButton } from '@/components/AddNoteButton';

interface PageProps {
  searchParams: Promise<{ type?: string; offset?: string; workspace?: string }>;
}

function getDateFromOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const params = await searchParams;
  const offset = parseInt(params.offset ?? '0', 10);
  const typeFilter = params.type ?? null;

  const workspace = await ensurePersonalWorkspace();
  const workspaceId = params.workspace ?? workspace.id;

  const startDate = getDateFromOffset(offset);
  const endDate = getDateFromOffset(offset + 2);

  const notes = await getNotes(workspaceId, startDate, endDate);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar workspaceId={workspaceId} />

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Top controls */}
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
          <div className="ml-auto flex items-center gap-2 text-sm text-white/40">
            <a
              href={`/?offset=${offset - 3}${typeFilter ? `&type=${typeFilter}` : ''}`}
              className="px-2 py-1 rounded hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              ◀
            </a>
            <span className="text-xs">{offset === 0 ? 'Bu Hafta' : `${offset > 0 ? '+' : ''}${offset} gün`}</span>
            <a
              href={`/?offset=${offset + 3}${typeFilter ? `&type=${typeFilter}` : ''}`}
              className="px-2 py-1 rounded hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              ▶
            </a>
          </div>
        </div>

        {/* 3-day calendar */}
        <ThreeDayView
          initialNotes={notes}
          workspaceId={workspaceId}
          startDate={startDate}
          typeFilter={typeFilter}
        />

        {/* Floating add button */}
        <Suspense fallback={null}>
          <AddNoteButton workspaceId={workspaceId} defaultDate={startDate} />
        </Suspense>
      </main>
    </div>
  );
}
