'use client';

import { useEffect, useState } from 'react';

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Only ask once and only if not decided yet
    if (permission !== 'default') return;
    if (!('Notification' in window)) return;

    // Wait 30 seconds before asking (don't bombard on first visit)
    const timer = setTimeout(() => {
      Notification.requestPermission().then((result) => {
        setPermission(result);
      });
    }, 30000);

    return () => clearTimeout(timer);
  }, [permission]);

  return null;
}

// Utility to send a local push notification
export function sendLocalNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: tag ?? 'notsmy',
      silent: false,
    });
  } catch {
    // Notification constructor may fail in some contexts
  }
}
