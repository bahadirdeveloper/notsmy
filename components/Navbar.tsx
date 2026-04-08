import { auth, signOut } from '@/auth';
import { getWorkspaces } from '@/actions/workspaces';
import { getUnreadCount, getNotifications } from '@/actions/notifications';
import { NotificationBell } from '@/components/NotificationBell';
import Image from 'next/image';
import Link from 'next/link';

interface NavbarProps {
  workspaceId: string;
}

export async function Navbar({ workspaceId }: NavbarProps) {
  const session = await auth();
  const [allWorkspaces, unreadCount, notifs] = await Promise.all([
    getWorkspaces(),
    getUnreadCount(),
    getNotifications(),
  ]);
  const currentWorkspace = allWorkspaces.find((w) => w.id === workspaceId) ?? allWorkspaces[0];

  return (
    <nav
      className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
    >
      {/* Left: Logo + Workspace */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#10b981] flex items-center justify-center text-black font-bold text-sm group-hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-shadow">
            N
          </div>
          <span className="text-white/90 font-semibold text-sm hidden sm:inline">Notsmy</span>
        </Link>

        {allWorkspaces.length > 0 && (
          <>
            <div className="w-px h-5 bg-white/[0.08]" />
            {allWorkspaces.length > 1 ? (
              <div className="flex items-center gap-1">
                {allWorkspaces.map((w) => (
                  <Link
                    key={w.id}
                    href={`/?workspace=${w.id}`}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                      w.id === workspaceId
                        ? 'text-[#10b981] bg-[#10b981]/10 font-medium'
                        : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
                    }`}
                  >
                    {w.name}
                  </Link>
                ))}
              </div>
            ) : currentWorkspace ? (
              <span className="text-white/40 text-xs font-medium">{currentWorkspace.name}</span>
            ) : null}
          </>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        <NotificationBell unreadCount={unreadCount} notifications={notifs} />

        {session?.user && (
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button
              type="submit"
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors group"
              title="Çıkış yap"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={26}
                  height={26}
                  className="rounded-full ring-1 ring-white/10 group-hover:ring-[#10b981]/30 transition-all"
                />
              ) : (
                <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-black text-[10px] font-bold">
                  {(session.user.name ?? session.user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-white/40 text-xs hidden sm:inline group-hover:text-white/60 transition-colors">
                {session.user.name?.split(' ')[0]}
              </span>
            </button>
          </form>
        )}
      </div>
    </nav>
  );
}
