import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { publicApi, parentApi, childApi } from '../services/api';
import * as storage from '../services/storage';
import { initNotifications, getDeviceToken, onTokenReceived } from '../services/fcm';
import {
  startParentPoller, stopParentPoller,
  startChildPoller,  stopChildPoller,
} from '../services/notificationPoller';

// =============================================
// Types
// =============================================

export interface ParentInfo {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
}

export interface ChildInfo {
  id: string;
  parentId: string;
  name: string;
  avatar: string;
  gender: 'boy' | 'girl';
  color: string;
  level: number;
  xp: number;
  stars: number;
}

type AuthScreen = 'loading' | 'parentAuth' | 'parentPin' | 'childMode';

interface AuthContextType {
  // State
  screen: AuthScreen;
  parentInfo: ParentInfo | null;
  childInfo: ChildInfo | null;
  isParentLoggedIn: boolean;
  isChildLoggedIn: boolean;
  savedEmail: string;

  // Parent Auth
  registerParent: (name: string, email: string, password: string, parentPin: string) => Promise<void>;
  loginParentWithPassword: (email: string, password: string) => Promise<void>;
  loginParentWithPin: (email: string, parentPin: string) => Promise<void>;
  logoutParent: () => Promise<void>;

  // Child Auth
  linkChildDevice: (qrToken: string, fcmToken?: string) => Promise<{ requiresPinSetup: boolean; childToken: string; childId: string }>;
  setupChildPin: (childToken: string, pin: string) => Promise<void>;
  loginChild: (childId: string, pin: string) => Promise<void>;
  logoutChild: () => void;

  // Helper
  refreshParentInfo: () => Promise<void>;
  refreshChildInfo: () => Promise<void>;
  updateChildStars: (newStars: number) => void;
}

// =============================================
// Context
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<AuthScreen>('loading');
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [savedEmail, setSavedEmail] = useState('');

  // On mount: init push notifications + check stored tokens
  useEffect(() => {
    initNotifications();
    checkStoredAuth();
  }, []);

  // Start/stop parent poller based on login state
  useEffect(() => {
    if (parentInfo) {
      startParentPoller();
    } else {
      stopParentPoller();
    }
    return () => stopParentPoller();
  }, [!!parentInfo]);

  // Start/stop child poller based on login state
  useEffect(() => {
    if (childInfo) {
      startChildPoller();
    } else {
      stopChildPoller();
    }
    return () => stopChildPoller();
  }, [!!childInfo]);

  async function checkStoredAuth() {
    try {
      const token = await storage.getParentAccessToken();
      const email = await storage.getParentEmail();
      const info = await storage.getParentInfo();

      if (email) setSavedEmail(email);

      if (token && info) {
        setParentInfo(info);
        setScreen('parentPin'); // Has saved session → show PIN unlock screen
      } else {
        setScreen('parentAuth'); // No session → show register/login
      }
    } catch {
      setScreen('parentAuth');
    }
  }

  // =============================================
  // Parent: Register
  // =============================================
  async function registerParent(name: string, email: string, password: string, parentPin: string) {
    const res = await publicApi.post('/api/auth/register', { name, email, password, parentPin });
    const { parent, accessToken, refreshToken } = res.data;

    await storage.saveParentTokens(accessToken, refreshToken);
    await storage.saveParentEmail(email);
    await storage.saveParentInfo(parent);

    setSavedEmail(email);
    setParentInfo(parent);
    setScreen('parentPin');

    onTokenReceived((token) => {
      parentApi.post('/api/notifications/fcm-token', { fcmToken: token }).catch(() => {});
    });
  }

  // =============================================
  // Parent: Login with email + password
  // =============================================
  async function loginParentWithPassword(email: string, password: string) {
    const res = await publicApi.post('/api/auth/login', { email, password });
    const { parent, accessToken, refreshToken } = res.data;

    await storage.saveParentTokens(accessToken, refreshToken);
    await storage.saveParentEmail(email);
    await storage.saveParentInfo(parent);

    setSavedEmail(email);
    setParentInfo(parent);
    setScreen('parentPin');

    onTokenReceived((token) => {
      parentApi.post('/api/notifications/fcm-token', { fcmToken: token }).catch(() => {});
    });
  }

  // =============================================
  // Parent: Login with email + 4-digit PIN (quick unlock)
  // =============================================
  async function loginParentWithPin(email: string, parentPin: string) {
    const res = await publicApi.post('/api/auth/login/pin', { email, parentPin });
    const { parent, accessToken, refreshToken } = res.data;

    await storage.saveParentTokens(accessToken, refreshToken);
    await storage.saveParentInfo(parent);

    setParentInfo(parent);
    setScreen('childMode');

    onTokenReceived((token) => {
      parentApi.post('/api/notifications/fcm-token', { fcmToken: token }).catch(() => {});
    });
  }

  // =============================================
  // Parent: Logout
  // =============================================
  async function logoutParent() {
    try {
      const refreshToken = await storage.getParentRefreshToken();
      if (refreshToken) {
        await publicApi.post('/api/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await storage.clearParentData();
      setParentInfo(null);
      setScreen('parentAuth');
    }
  }

  // =============================================
  // Child: Link device via QR token
  // =============================================
  async function linkChildDevice(qrToken: string, fcmToken?: string) {
    const res = await publicApi.post('/api/children/link-device', {
      token: qrToken,
      fcmToken,
    });
    const { child, accessToken, requiresPinSetup } = res.data;

    // Save child data to storage
    await storage.saveChildData(accessToken, child, child.id);
    setChildInfo(child);

    return { requiresPinSetup, childToken: accessToken, childId: child.id };
  }

  // =============================================
  // Child: Setup PIN after QR scan (first time)
  // =============================================
  async function setupChildPin(childToken: string, pin: string) {
    // Use child token for this request (not parent token)
    const res = await publicApi.post(
      '/api/children/setup-pin',
      { pin },
      { headers: { Authorization: `Bearer ${childToken}` } }
    );

    // After PIN setup, we get confirmation; child is now ready
    const currentChild = await storage.getChildInfo();
    if (currentChild) {
      await storage.saveChildData(childToken, currentChild, currentChild.id);
    }

    return res.data;
  }

  // =============================================
  // Child: Login with childId + PIN
  // =============================================
  async function loginChild(childId: string, pin: string) {
    const res = await publicApi.post('/api/auth/child/login', { childId, pin });
    const { child, accessToken } = res.data;

    const storedInfo = await storage.getChildInfo();
    const fullChild = storedInfo ? { ...storedInfo, ...child } : child;

    await storage.saveChildData(accessToken, fullChild, fullChild.id);
    setChildInfo(fullChild);

    onTokenReceived((token) => {
      childApi.post('/api/children/fcm-token', { fcmToken: token }).catch(() => {});
    });
  }

  // =============================================
  // Child: Logout
  // =============================================
  function logoutChild() {
    storage.clearChildData();
    setChildInfo(null);
  }

  // =============================================
  // Refresh parent info from backend
  // =============================================
  async function refreshParentInfo() {
    try {
      const res = await parentApi.get('/api/auth/me');
      setParentInfo(res.data);
      await storage.saveParentInfo(res.data);
    } catch {}
  }

  async function refreshChildInfo() {
    try {
      const res = await childApi.get('/api/children/me');
      const fresh = res.data;
      const stored = await storage.getChildInfo();
      const merged = stored ? { ...stored, ...fresh } : fresh;
      setChildInfo(merged);
      const token = await storage.getChildAccessToken();
      if (token) await storage.saveChildData(token, merged, merged.id).catch(() => {});
    } catch {}
  }

  function updateChildStars(newStars: number) {
    if (!childInfo) return;
    const updated = { ...childInfo, stars: newStars };
    setChildInfo(updated);
    // Persist updated stars without touching the token
    storage.getChildAccessToken().then(token => {
      if (token) storage.saveChildData(token, updated, updated.id).catch(() => {});
    });
  }

  const isParentLoggedIn = !!parentInfo;
  const isChildLoggedIn = !!childInfo;

  return (
    <AuthContext.Provider
      value={{
        screen,
        parentInfo,
        childInfo,
        isParentLoggedIn,
        isChildLoggedIn,
        savedEmail,
        registerParent,
        loginParentWithPassword,
        loginParentWithPin,
        logoutParent,
        linkChildDevice,
        setupChildPin,
        loginChild,
        logoutChild,
        refreshParentInfo,
        refreshChildInfo,
        updateChildStars,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
