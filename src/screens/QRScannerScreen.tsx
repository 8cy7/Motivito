import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

interface QRScannerScreenProps {
  onScan: (qrToken: string) => void;
  onCancel: () => void;
}

// Extract token from QR data format: "motivito://link?token=<uuid>"
function extractToken(qrData: string): string | null {
  try {
    const match = qrData.match(/[?&]token=([a-f0-9-]{36})/i);
    if (match) return match[1];
    // Accept raw UUID too
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(qrData.trim())) {
      return qrData.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ onScan, onCancel }) => {
  const { width, height } = useWindowDimensions();
  const [manualToken, setManualToken] = useState('');
  const scannedRef = useRef(false);

  const shortSide = Math.min(width, height);
  const scale = shortSide / 375;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.6);

  const titleSize = Math.round(22 * clampedScale);
  const subtitleSize = Math.round(13 * clampedScale);
  const buttonTextSize = Math.round(15 * clampedScale);
  const spacing = Math.round(16 * clampedScale);

  // Vision Camera hooks
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    scannedRef.current = false;
  }, []);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (scannedRef.current) return;
      if (codes.length === 0) return;
      const raw = codes[0].value;
      if (!raw) return;
      const token = extractToken(raw);
      if (!token) return;
      scannedRef.current = true;
      onScan(token);
    },
  });

  const handleManualSubmit = () => {
    const trimmed = manualToken.trim();
    const token = extractToken(trimmed);
    if (!token) {
      Alert.alert('خطأ', 'الرمز غير صالح. تأكد من نسخ الرابط كاملاً من تطبيق الوالد.');
      return;
    }
    onScan(token);
  };

  // Shared manual input section used in all fallback screens
  const ManualInputSection = () => (
    <View style={[styles.manualSection, { paddingHorizontal: spacing, paddingTop: spacing }]}>
      <Text style={[styles.manualLabel, { fontSize: subtitleSize, marginBottom: spacing * 0.5 }]}>
        أو الصق رابط الربط هنا:
      </Text>
      <TextInput
        style={[
          styles.tokenInput,
          {
            fontSize: Math.round(13 * clampedScale),
            borderRadius: spacing * 0.75,
            padding: spacing * 0.75,
            marginBottom: spacing * 0.75,
            width: '100%',
            maxWidth: 480,
          },
        ]}
        placeholder="motivito://link?token=..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={manualToken}
        onChangeText={setManualToken}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleManualSubmit}
      />
      <TouchableOpacity
        onPress={handleManualSubmit}
        style={[
          styles.scanButton,
          {
            paddingVertical: spacing * 0.75,
            borderRadius: spacing * 0.75,
            width: '100%',
            maxWidth: 480,
          },
        ]}
      >
        <Text style={[styles.scanButtonText, { fontSize: buttonTextSize }]}>✅ تأكيد الربط</Text>
      </TouchableOpacity>
    </View>
  );

  // ---- Permission not granted ----
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#8B5CF6' }]} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centeredContent}
          >
            <Text style={[styles.title, { fontSize: titleSize, marginBottom: spacing }]}>
              📷 مسح رمز QR
            </Text>
            <Text style={[styles.subtitle, { fontSize: subtitleSize, marginBottom: spacing, textAlign: 'center' }]}>
              يحتاج التطبيق إذن الكاميرا لمسح رمز QR
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              style={[styles.scanButton, { paddingVertical: spacing * 0.9, paddingHorizontal: spacing * 2, borderRadius: spacing * 0.75, marginBottom: spacing * 1.5 }]}
            >
              <Text style={[styles.scanButtonText, { fontSize: buttonTextSize }]}>السماح بالكاميرا</Text>
            </TouchableOpacity>
            <ManualInputSection />
            <TouchableOpacity onPress={onCancel} style={{ marginTop: spacing }}>
              <Text style={[styles.backButtonText, { fontSize: buttonTextSize }]}>↩️ رجوع</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Camera device not available ----
  if (!device) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#8B5CF6' }]} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centeredContent}
          >
            <Text style={[styles.title, { fontSize: titleSize, marginBottom: spacing }]}>
              📷 الكاميرا غير متاحة
            </Text>
            <ManualInputSection />
            <TouchableOpacity onPress={onCancel} style={{ marginTop: spacing }}>
              <Text style={[styles.backButtonText, { fontSize: buttonTextSize }]}>↩️ رجوع</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Live camera scanner with inline manual field ----
  const frameSize = Math.min(width, height) * 0.45;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Full-screen camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      {/* Dark overlay */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        {/* Top dark band */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />

        {/* Middle row: dark | clear frame | dark */}
        <View style={{ flexDirection: 'row', height: frameSize }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View style={[styles.scanFrame, { width: frameSize, height: frameSize }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </View>

        {/* Bottom band: hint + manual input */}
        <View style={{
          backgroundColor: 'rgba(0,0,0,0.82)',
          alignItems: 'center',
          paddingTop: spacing,
          paddingBottom: spacing * 1.5,
          paddingHorizontal: spacing,
        }}>
          <Text style={[styles.hintText, { fontSize: subtitleSize, marginBottom: spacing * 0.75 }]}>
            وجّه الكاميرا نحو رمز QR
          </Text>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 480, marginBottom: spacing * 0.75 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: Math.round(12 * clampedScale), marginHorizontal: 8, fontWeight: '600' }}>
              أو أدخل الرابط يدوياً
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>

          {/* Manual input row */}
          <View style={{
            flexDirection: 'row',
            width: '100%',
            maxWidth: 480,
            alignItems: 'center',
          }}>
            <TextInput
              style={[
                styles.tokenInput,
                {
                  flex: 1,
                  fontSize: Math.round(12 * clampedScale),
                  borderRadius: spacing * 0.6,
                  paddingHorizontal: spacing * 0.75,
                  paddingVertical: spacing * 0.6,
                  marginRight: 8,
                  minHeight: 0,
                },
              ]}
              placeholder="motivito://link?token=..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity
              onPress={handleManualSubmit}
              style={[
                styles.confirmBtn,
                {
                  paddingVertical: spacing * 0.6,
                  paddingHorizontal: spacing * 0.9,
                  borderRadius: spacing * 0.6,
                },
              ]}
            >
              <Text style={[styles.scanButtonText, { fontSize: Math.round(14 * clampedScale) }]}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Header bar */}
      <SafeAreaView style={styles.headerBar} pointerEvents="box-none">
        <View style={[styles.headerRow, { paddingHorizontal: spacing, paddingTop: spacing / 2 }]}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancelBtn, { padding: spacing * 0.75, borderRadius: spacing * 0.5 }]}
          >
            <Text style={[styles.cancelText, { fontSize: Math.round(14 * clampedScale) }]}>✕ إلغاء</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: titleSize }]}>📷 مسح QR</Text>
          <View style={{ width: 70 }} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#FBBF24';

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  overlay: { flexDirection: 'column' },
  scanFrame: {
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  headerBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualSection: {
    width: '100%',
    alignItems: 'center',
  },
  manualLabel: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  title: { fontWeight: '700', color: '#FFF', textAlign: 'center' },
  subtitle: { fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  hintText: { fontWeight: '600', color: '#FFF', textAlign: 'center' },
  cancelBtn: { backgroundColor: 'rgba(0,0,0,0.4)' },
  cancelText: { color: '#FFF', fontWeight: '600' },
  scanButton: { backgroundColor: '#FBBF24', alignItems: 'center' },
  confirmBtn: { backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center' },
  scanButtonText: { fontWeight: '700', color: '#1a1a1a' },
  backButtonText: { fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  tokenInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
