import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getNotes, getPersistentTasks, getMonthlyStats } from '@/actions/notes';
import { ensurePersonalWorkspace } from '@/actions/workspaces';
import { Navbar } from '@/components/Navbar';
import { PageShell } from '@/components/PageShell';

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

  const now = new Date();
  const statsYear = now.getFullYear();
  const statsMonth = now.getMonth() + 1;

  const [notes, persistentTasks, monthlyStats] = await Promise.all([
    getNotes(workspaceId, startDate, endDate),
    getPersistentTasks(workspaceId),
    getMonthlyStats(workspaceId, statsYear, statsMonth),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar workspaceId={workspaceId} />

      <main className="max-w-7xl mx-auto px-4 py-5 pb-28">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1">
            <Link
              href={offset === 0 ? '/' : `/?offset=0`}
              className={`text-[13px] sm:text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition-all ${
                offset === 0
                  ? 'bg-[#10b981]/15 text-[#10b981] font-medium border border-[#10b981]/25'
                  : 'text-white/65 hover:text-white/95 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              Bugün
            </Link>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href={`/?offset=${offset - 3}`}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white/90 hover:bg-white/[0.06] active:bg-white/[0.1] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <span className="text-white/55 text-[13px] sm:text-xs min-w-[60px] text-center tabular-nums">
              {offset === 0 ? '' : `${offset > 0 ? '+' : ''}${offset} gün`}
            </span>
            <Link
              href={`/?offset=${offset + 3}`}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white/90 hover:bg-white/[0.06] active:bg-white/[0.1] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </div>

        <PageShell
          initialNotes={notes}
          initialPersistentTasks={persistentTasks}
          workspaceId={workspaceId}
          startDate={startDate}
          monthlyStats={monthlyStats}
          statsYear={statsYear}
          statsMonth={statsMonth}
        />
      </main>
    </div>
  );
}
