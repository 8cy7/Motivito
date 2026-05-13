import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parentApi, childApi } from './api';
import { AxiosInstance } from 'axios';

const LAST_SEEN_PARENT = '@notif_last_seen_parent';
const LAST_SEEN_CHILD  = '@notif_last_seen_child';

let parentTimer: ReturnType<typeof setInterval> | null = null;
let childTimer:  ReturnType<typeof setInterval> | null = null;

async function poll(api: AxiosInstance, storageKey: string) {
  try {
    const { data } = await api.get('/api/notifications?limit=10');
    const notifications: any[] = data.notifications ?? [];
    if (!notifications.length) return;

    const lastSeen = await AsyncStorage.getItem(storageKey);

    // First run: just save the timestamp, don't show old notifications
    if (!lastSeen) {
      await AsyncStorage.setItem(storageKey, notifications[0].createdAt);
      return;
    }

    const newOnes = notifications.filter(
      n => !n.isRead && n.createdAt > lastSeen
    );

    // Update last seen to the newest
    await AsyncStorage.setItem(storageKey, notifications[0].createdAt);

    for (const n of newOnes) {
      PushNotificationIOS.scheduleLocalNotification({
        alertTitle:  n.title,
        alertBody:   n.body,
        fireDate:    new Date().toISOString(),
        isSilent:    false,
        applicationIconBadgeNumber: 1,
        userInfo: { id: n.id },
      });
    }
  } catch {
    // silent fail
  }
}

export function startParentPoller() {
  stopParentPoller();
  poll(parentApi, LAST_SEEN_PARENT);
  parentTimer = setInterval(() => poll(parentApi, LAST_SEEN_PARENT), 15_000);
}

export function stopParentPoller() {
  if (parentTimer) { clearInterval(parentTimer); parentTimer = null; }
}

export function startChildPoller() {
  stopChildPoller();
  poll(childApi, LAST_SEEN_CHILD);
  childTimer = setInterval(() => poll(childApi, LAST_SEEN_CHILD), 15_000);
}

export function stopChildPoller() {
  if (childTimer) { clearInterval(childTimer); childTimer = null; }
}
