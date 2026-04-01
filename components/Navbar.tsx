import { auth, signOut } from '@/auth';
import { getWorkspaces } from '@/actions/workspaces';
import { getUnreadCount, getNotifications } from '@/actions/notifications';
import { NotificationBell } from '@/components/NotificationBell';
import Image from 'next/image';

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
    <nav className="flex items-center justify-between px-4 py-3 border-b border-[#10b981]/15 bg-[#10b981]/[0.02]">
      {/* Left: Logo + Workspace */}
      <div className="flex items-center gap-3">
        <span className="text-[#10b981] font-semibold text-lg">📋 Notsmy</span>
        {(allWorkspaces.length > 0) && (
          <>
            <span className="text-white/20">|</span>
            {allWorkspaces.length > 1 ? (
              <div className="flex items-center gap-1">
                {allWorkspaces.map((w) => (
                  <a
                    key={w.id}
                    href={`/?workspace=${w.id}`}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      w.id === workspaceId
                        ? 'text-[#10b981] bg-[#10b981]/10'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {w.name}
                  </a>
                ))}
              </div>
            ) : currentWorkspace ? (
              <span className="text-white/50 text-sm">{currentWorkspace.name}</span>
            ) : null}
          </>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <NotificationBell unreadCount={unreadCount} notifications={notifs} />

        {/* User avatar + sign out */}
        {session?.user && (
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button
              type="submit"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Çıkış yap"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center text-black text-xs font-bold">
                  {(session.user.name ?? session.user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </nav>
  );
}
