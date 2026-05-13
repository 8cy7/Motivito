import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APNS_TOKEN_KEY = '@apns_device_token';

// يُستدعى مرة واحدة عند بدء التطبيق
export function initNotifications() {
  PushNotificationIOS.addEventListener('register', async (deviceToken: string) => {
    await AsyncStorage.setItem(APNS_TOKEN_KEY, deviceToken);
  });

  PushNotificationIOS.addEventListener('registrationError', (err) => {
    console.warn('APNs registration error:', err);
  });

  PushNotificationIOS.requestPermissions({ alert: true, badge: true, sound: true })
    .catch(() => {});
}

// إرجاع الـ token المخزن
export async function getDeviceToken(): Promise<string | null> {
  return AsyncStorage.getItem(APNS_TOKEN_KEY);
}

// تسجيل callback يُستدعى فوراً إذا Token موجود، أو ينتظر حتى يصل
export async function onTokenReceived(callback: (token: string) => void) {
  const existing = await AsyncStorage.getItem(APNS_TOKEN_KEY);
  if (existing) {
    callback(existing);
    return;
  }
  // ينتظر حتى يصل التوكن
  const listener = async (token: string) => {
    await AsyncStorage.setItem(APNS_TOKEN_KEY, token);
    callback(token);
    PushNotificationIOS.removeEventListener('register');
  };
  PushNotificationIOS.addEventListener('register', listener);
}
