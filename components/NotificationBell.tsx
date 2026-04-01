'use client';

import { useState } from 'react';
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
  const [open, setOpen] = useState(false);

  async function handleMarkAllRead() {
    await markAllAsRead();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white/40 hover:text-white/70 text-base p-1"
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
      >
        🔔
      </button>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-[#10b981] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
              <span className="text-white/70 text-sm font-medium">Bildirimler</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[#10b981] text-xs hover:underline">
                  Tümünü okundu işaretle
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-white/25 text-sm">Bildirim yok</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-3 py-2.5 border-b border-white/[0.04] text-xs ${
                      n.isRead ? 'text-white/30' : 'text-white/70'
                    }`}
                  >
                    {!n.isRead && <span className="inline-block w-1.5 h-1.5 bg-[#10b981] rounded-full mr-1.5 mb-0.5" />}
                    {n.message}
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
