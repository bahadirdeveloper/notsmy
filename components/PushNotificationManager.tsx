'use client';

import { useEffect, useState } from 'react';

// Returns true when the page is running as an installed PWA. iOS only delivers
// web push to standalone-installed apps, and asking for notification permission
// in a regular Safari tab is annoying and pointless on iOS.
function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari uses a non-standard navigator.standalone flag
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Other browsers expose display-mode: standalone via matchMedia
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  return iosStandalone || displayStandalone;
}

export function PushNotificationManager() {
  // Read the current permission once on mount via lazy initial state.
  // Calling setState inside a useEffect would trigger a cascading render.
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  });

  useEffect(() => {
    // Only ask once and only if not decided yet
    if (permission !== 'default') return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    // Don't ask for permission unless the user installed the app. This avoids
    // a confusing OS-level prompt on a fresh page visit, and matches iOS push
    // requirements (web push only works after "Add to Home Screen").
    if (!isStandalonePWA()) return;

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
