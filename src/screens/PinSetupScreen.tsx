import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

interface PinSetupScreenProps {
  childToken: string;
  childName: string;
  onComplete: () => void;
}

export const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ childToken, childName, onComplete }) => {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const scale = Math.min(Math.max(shortSide / 375, 0.8), 1.4);
  const sp = (n: number) => Math.round(n * scale);

  const { setupChildPin } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  const handleNumberPress = (num: string) => {
    if (step === 'enter') {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          setTimeout(() => handleConfirm(newConfirm), 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'enter') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    }
  };

  const handleConfirm = async (confirmed: string) => {
    if (confirmed !== pin) {
      Alert.alert('خطأ', 'الرمزان غير متطابقين، حاول مرة أخرى');
      setConfirmPin('');
      setStep('enter');
      setPin('');
      return;
    }

    setLoading(true);
    try {
      await setupChildPin(childToken, pin);
      onComplete();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
      Alert.alert('خطأ', msg);
      setConfirmPin('');
      setStep('enter');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;
  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['⌫', '0', '']];

  const pinDotSize = sp(48);
  const buttonHeight = sp(54);
  const buttonWidth = (Math.min(width * 0.85, 320) - sp(16) * 2) / 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <Text style={[styles.title, { fontSize: sp(24) }]}>
            مرحباً {childName}! 🌟
          </Text>
          <Text style={[styles.subtitle, { fontSize: sp(15), marginTop: sp(8), marginBottom: sp(32) }]}>
            {step === 'enter'
              ? 'اختر رمز PIN سري من 4 أرقام'
              : 'أعد إدخال الرمز للتأكيد'}
          </Text>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 'enter' && styles.stepDotActive]} />
            <View style={[styles.stepLine]} />
            <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
          </View>
          <Text style={[styles.stepLabel, { fontSize: sp(12), marginTop: sp(8), marginBottom: sp(24) }]}>
            {step === 'enter' ? 'خطوة 1: اختر الرمز' : 'خطوة 2: تأكيد الرمز'}
          </Text>

          {/* PIN Dots */}
          <View style={[styles.pinRow, { gap: sp(12), marginBottom: sp(32) }]}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    width: pinDotSize,
                    height: pinDotSize,
                    borderRadius: pinDotSize / 2,
                    backgroundColor: i < currentPin.length
                      ? '#FBBF24'
                      : 'rgba(255,255,255,0.2)',
                  },
                ]}
              >
                {i < currentPin.length && (
                  <Text style={[styles.pinText, { fontSize: sp(22) }]}>●</Text>
                )}
              </View>
            ))}
          </View>

          {/* Numpad */}
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <View style={[styles.numpad, { width: Math.min(width * 0.85, 320) }]}>
              {keys.map((row, ri) => (
                <View key={ri} style={[styles.numpadRow, { gap: sp(8), marginBottom: sp(8) }]}>
                  {row.map((key, ki) => (
                    <TouchableOpacity
                      key={ki}
                      style={[
                        styles.numpadBtn,
                        {
                          width: buttonWidth,
                          height: buttonHeight,
                          borderRadius: buttonHeight / 4,
                          backgroundColor: key ? 'rgba(255,255,255,0.15)' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        if (key === '⌫') handleDelete();
                        else if (key) handleNumberPress(key);
                      }}
                      disabled={!key}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.numpadText, { fontSize: sp(24) }]}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {step === 'confirm' && (
            <TouchableOpacity onPress={handleBack} style={{ marginTop: sp(16) }}>
              <Text style={[styles.backText, { fontSize: sp(14) }]}>↩️ العودة لتغيير الرمز</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: '#FBBF24',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  pinRow: {
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
    color: '#FFF',
    fontWeight: '700',
  },
  numpad: { alignItems: 'center' },
  numpadRow: { flexDirection: 'row' },
  numpadBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadText: {
    fontWeight: '700',
    color: '#FFF',
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});
