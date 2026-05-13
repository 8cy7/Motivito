import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { QRScannerScreen } from './QRScannerScreen';
import { PinSetupScreen } from './PinSetupScreen';
import { useAuth } from '../contexts/AuthContext';
import * as storage from '../services/storage';
import { isTablet } from '../utils/deviceUtils';
import { AppModal } from '../components/AppModal';

const IS_TABLET = isTablet();

interface LoginScreenProps {
  onParentLogin: () => void;
  onChildLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onParentLogin, onChildLogin }) => {
  const { width, height } = useWindowDimensions();
  const { loginParentWithPin, loginChild, linkChildDevice, savedEmail } = useAuth();

  // Responsive calculations
  const isLandscape = width > height;
  const shortSide = Math.min(width, height);
  const scale = shortSide / 375;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.6);

  const titleSize = Math.round(26 * clampedScale);
  const subtitleSize = Math.round(14 * clampedScale);
  const switchTextSize = Math.round(14 * clampedScale);
  const pinDotSize = Math.round(48 * clampedScale);
  const pinTextSize = Math.round(22 * clampedScale);
  const numpadTextSize = Math.round(24 * clampedScale);
  const buttonHeight = Math.round(54 * clampedScale);
  const spacing = Math.round(16 * clampedScale);

  const numpadMaxWidth = isLandscape ? 300 : 320;
  const numpadWidth = Math.min(width * 0.85, numpadMaxWidth);
  const buttonWidth = (numpadWidth - spacing * 2) / 3;

  // On tablet: always child mode (QR-linked device), no toggle
  const [userType, setUserType] = useState<'parent' | 'child'>(IS_TABLET ? 'child' : 'parent');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUnlinkedModal, setShowUnlinkedModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pendingChildToken, setPendingChildToken] = useState('');
  const [pendingChildName, setPendingChildName] = useState('');

  const maxPinLength = 4;
  const isChild = userType === 'child';

  const handleNumberPress = (num: string) => {
    if (pin.length < maxPinLength) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === maxPinLength) {
        setTimeout(() => handleLogin(newPin), 200);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const handleLogin = async (enteredPin: string) => {
    if (loading) return;
    setLoading(true);
    try {
      if (userType === 'parent') {
        // Parent login: email (saved) + 4-digit PIN
        const email = savedEmail;
        if (!email) {
          Alert.alert('خطأ', 'يرجى تسجيل الدخول بالبريد الإلكتروني أولاً');
          setPin('');
          setLoading(false);
          return;
        }
        await loginParentWithPin(email, enteredPin);
        onParentLogin();
      } else {
        // Child login: stored childId + PIN
        const childId = await storage.getChildId();
        if (!childId) {
          Alert.alert('تنبيه', 'لم يتم ربط الجهاز بعد. امسح رمز QR أولاً.');
          setPin('');
          setLoading(false);
          return;
        }
        await loginChild(childId, enteredPin);
        onChildLogin();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'رمز PIN غير صحيح';
      Alert.alert('خطأ', msg);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserType = () => {
    const newType = userType === 'parent' ? 'child' : 'parent';
    setUserType(newType);
    setPin('');
    if (newType === 'child') {
      // Check if child device is already linked
      storage.getChildId().then(id => {
        if (!id) {
          requestAnimationFrame(() => setShowUnlinkedModal(true));
        }
      });
    }
  };

  const handleOpenCamera = () => {
    setShowUnlinkedModal(false);
    setShowQRScanner(true);
  };

  // Called when QR scanner succeeds with a qrToken
  const handleQRScan = async (qrToken: string) => {
    setShowQRScanner(false);
    setLoading(true);
    try {
      const { requiresPinSetup, childToken } = await linkChildDevice(qrToken);
      if (requiresPinSetup) {
        // Need to set up PIN before we can proceed
        const childInfo = await storage.getChildInfo();
        setPendingChildToken(childToken);
        setPendingChildName(childInfo?.name || 'بطل');
        setShowPinSetup(true);
      } else {
        // Already has PIN → navigate to child dashboard
        onChildLogin();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'رمز QR غير صالح أو منتهي الصلاحية';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = () => {
    setShowQRScanner(false);
    setShowUnlinkedModal(true);
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    onChildLogin();
  };

  // PIN Dots Component
  const PinDots = () => (
    <View style={[styles.pinContainer, { gap: spacing }]}>
      {[...Array(maxPinLength)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.pinDot,
            {
              width: pinDotSize,
              height: pinDotSize,
              borderRadius: pinDotSize / 2,
              backgroundColor: i < pin.length
                ? (isChild ? '#FBBF24' : '#EC4899')
                : 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          {i < pin.length && (
            <Text style={[styles.pinText, { fontSize: pinTextSize }]}>●</Text>
          )}
        </View>
      ))}
    </View>
  );

  // Numpad Component
  const Numpad = () => {
    const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['✓', '0', '⌫']];
    return (
      <View style={[styles.numpad, { width: numpadWidth }]}>
        {keys.map((row, ri) => (
          <View key={ri} style={[styles.numpadRow, { gap: spacing / 2, marginBottom: spacing / 2 }]}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  styles.numpadButton,
                  {
                    width: buttonWidth,
                    height: buttonHeight,
                    borderRadius: buttonHeight / 4,
                    backgroundColor: key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  },
                ]}
                onPress={() => {
                  if (key === '⌫') handleDelete();
                  else if (key === '✓' && pin.length === maxPinLength) handleLogin(pin);
                  else if (key !== '✓') handleNumberPress(key);
                }}
                disabled={!key || loading}
                activeOpacity={0.6}
              >
                <Text style={[styles.numpadText, { fontSize: numpadTextSize }]}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  // Main Content (phone portrait — always parent mode)
  const MainContent = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: titleSize }]}>أهلاً ولي الأمر 👋</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize, marginBottom: spacing }]}>سعداء بعودتك</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFF" style={{ marginVertical: 32 }} />
      ) : (
        <>
          <PinDots />
          <Numpad />
        </>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={isChild ? ['#8B5CF6', '#A78BFA'] : ['#7C3AED', '#6366F1']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {isLandscape ? (
          <View style={styles.landscapeLayout}>
            <View style={styles.landscapeLeft}>
              <Text style={[styles.title, { fontSize: titleSize }]}>
                {IS_TABLET ? 'مرحباً يا بطل 🌟' : (isChild ? 'مرحباً يا بطل 🌟' : 'أهلاً ولي الأمر 👋')}
              </Text>
              <Text style={[styles.subtitle, { fontSize: subtitleSize, marginBottom: spacing * 2 }]}>
                {IS_TABLET ? 'جاهز لإنجازات جديدة؟' : (isChild ? 'جاهز لإنجازات جديدة؟' : 'سعداء بعودتك')}
              </Text>

              {IS_TABLET ? (
                // Tablet: QR link button instead of toggle switch
                <TouchableOpacity
                  onPress={handleOpenCamera}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingVertical: spacing,
                    paddingHorizontal: spacing * 1.5,
                    borderRadius: spacing,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.4)',
                    minWidth: 220,
                  }}
                >
                  <Text style={{ fontSize: Math.round(32 * clampedScale), marginBottom: spacing / 2 }}>📷</Text>
                  <Text style={{ fontSize: Math.round(16 * clampedScale), fontWeight: '700', color: '#FFF', textAlign: 'center' }}>
                    ربط الجهاز برمز QR
                  </Text>
                  <Text style={{ fontSize: Math.round(12 * clampedScale), color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }}>
                    امسح رمز QR من جهاز ولي الأمر
                  </Text>
                </TouchableOpacity>
              ) : (
                // Phone landscape: show toggle switch
                <View style={[styles.switchContainer, { maxWidth: 260, borderRadius: spacing }]}>
                  <TouchableOpacity
                    style={[styles.switchBtn, !isChild && styles.switchBtnActive, { borderRadius: spacing - 4 }]}
                    onPress={() => isChild && toggleUserType()}
                  >
                    <Text style={[styles.switchText, { fontSize: switchTextSize }, !isChild && styles.switchTextActive]}>
                      ولي الأمر 👨‍👩‍👧‍👦
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.switchBtn, isChild && styles.switchBtnActive, { borderRadius: spacing - 4 }]}
                    onPress={() => !isChild && toggleUserType()}
                  >
                    <Text style={[styles.switchText, { fontSize: switchTextSize }, isChild && styles.switchTextActive]}>
                      الطفل 🎯
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.landscapeRight}>
              {loading ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <>
                  <PinDots />
                  <View style={{ height: spacing }} />
                  <Numpad />
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.portraitLayout}>
            <MainContent />
          </View>
        )}
      </SafeAreaView>

      {/* Unlinked Modal */}
      <AppModal
        visible={showUnlinkedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnlinkedModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing,
        }}>
          <View style={{
            width: '100%',
            maxWidth: isLandscape ? 340 : 320,
            backgroundColor: '#8B5CF6',
            borderRadius: spacing,
            padding: spacing * 1.5,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: Math.round(20 * clampedScale),
              fontWeight: '700',
              color: '#FFF',
              marginBottom: spacing / 2,
              textAlign: 'center',
            }}>
              🔗 لم يتم الربط بعد
            </Text>

            <Text style={{
              fontSize: Math.round(14 * clampedScale),
              color: 'rgba(255,255,255,0.9)',
              marginBottom: spacing * 1.5,
              textAlign: 'center',
            }}>
              امسح رمز QR من جهاز ولي الأمر لربط هذا الجهاز
            </Text>

            <TouchableOpacity
              onPress={handleOpenCamera}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: '#FBBF24',
                paddingVertical: spacing * 0.8,
                borderRadius: spacing * 0.75,
                alignItems: 'center',
                marginBottom: spacing,
              }}
            >
              <Text style={{
                fontSize: Math.round(16 * clampedScale),
                fontWeight: '700',
                color: '#FFF',
              }}>
                📷 فتح الكاميرا لمسح QR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowUnlinkedModal(false)}
              style={{ paddingVertical: spacing / 2 }}
            >
              <Text style={{
                fontSize: Math.round(14 * clampedScale),
                fontWeight: '600',
                color: 'rgba(255,255,255,0.8)',
              }}>
                إغلاق
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>

      {/* QR Scanner */}
      {showQRScanner && (
        <AppModal visible animationType="slide">
          <QRScannerScreen onScan={handleQRScan} onCancel={handleCancelScan} />
        </AppModal>
      )}

      {/* PIN Setup (after QR scan when requiresPinSetup=true) */}
      {showPinSetup && (
        <AppModal visible animationType="slide">
          <PinSetupScreen
            childToken={pendingChildToken}
            childName={pendingChildName}
            onComplete={handlePinSetupComplete}
          />
        </AppModal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  portraitLayout: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  landscapeLayout: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: '5%',
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', width: '100%' },
  title: {
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 4,
    width: '100%',
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  switchText: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  switchTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pinDot: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pinText: {
    fontWeight: '700',
    color: '#FFF',
  },
  numpad: { alignItems: 'center' },
  numpadRow: { flexDirection: 'row' },
  numpadButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadText: {
    fontWeight: '700',
    color: '#FFF',
  },
});
