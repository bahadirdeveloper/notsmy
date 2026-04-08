import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getNotes } from '@/actions/notes';
import { ensurePersonalWorkspace } from '@/actions/workspaces';
import { Navbar } from '@/components/Navbar';
import { ThreeDayViewWrapper } from '@/components/ThreeDayViewWrapper';

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

  const workspace = await ensurePersonalWorkspace();
  const workspaceId = params.workspace ?? workspace.id;

  const startDate = getDateFromOffset(offset);
  const endDate = getDateFromOffset(offset + 2);

  const notes = await getNotes(workspaceId, startDate, endDate);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar workspaceId={workspaceId} />

      <main className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-3">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <a
              href={offset === 0 ? '/' : `/?offset=0`}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                offset === 0
                  ? 'bg-[#10b981]/10 text-[#10b981] font-medium'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              Bugün
            </a>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <a
              href={`/?offset=${offset - 3}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </a>
            <span className="text-white/25 text-xs min-w-[60px] text-center tabular-nums">
              {offset === 0 ? '' : `${offset > 0 ? '+' : ''}${offset} gün`}
            </span>
            <a
              href={`/?offset=${offset + 3}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Filter + 3-day calendar */}
        <ThreeDayViewWrapper
          initialNotes={notes}
          workspaceId={workspaceId}
          startDate={startDate}
          typeFilter={null}
        />
      </main>
    </div>
  );
}
