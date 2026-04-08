'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAllAsRead } from '@/actions/notifications';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  noteId: string | null;
  createdAt: Date;
}

interface Props {
  unreadCount: number;
  notifications: Notification[];
}

export function NotificationBell({ unreadCount, notifications }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all relative"
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-[#10b981] text-black text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center pointer-events-none px-0.5">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-72 bg-[#161618] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-down">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-white/60 text-xs font-medium">Bildirimler</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-[#10b981] text-[10px] hover:underline font-medium disabled:opacity-50"
                >
                  Tümünü okundu işaretle
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                  <span className="text-white/10 text-2xl">🔔</span>
                  <span className="text-white/20 text-xs">Bildirim yok</span>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/[0.03] text-xs transition-colors hover:bg-white/[0.02] ${
                      n.isRead ? 'text-white/25' : 'text-white/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="inline-block w-1.5 h-1.5 bg-[#10b981] rounded-full mt-1 flex-shrink-0" />}
                      <span className={!n.isRead ? '' : 'ml-3.5'}>{n.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
