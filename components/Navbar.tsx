import { auth, signOut } from '@/auth';
import { getWorkspaces } from '@/actions/workspaces';
import { getUnreadCount } from '@/actions/notifications';
import Image from 'next/image';

interface NavbarProps {
  workspaceId: string;
}

export async function Navbar({ workspaceId }: NavbarProps) {
  const session = await auth();
  const [allWorkspaces, unreadCount] = await Promise.all([
    getWorkspaces(),
    getUnreadCount(),
  ]);
  const currentWorkspace = allWorkspaces.find((w) => w.id === workspaceId) ?? allWorkspaces[0];

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b border-[#10b981]/15 bg-[#10b981]/[0.02]">
      {/* Left: Logo + Workspace */}
      <div className="flex items-center gap-3">
        <span className="text-[#10b981] font-semibold text-lg">📋 Notsmy</span>
        {currentWorkspace && (
          <>
            <span className="text-white/20">|</span>
            <span className="text-white/50 text-sm">{currentWorkspace.name}</span>
          </>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button className="text-white/40 hover:text-white/70 text-base p-1">
            🔔
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#10b981] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

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
