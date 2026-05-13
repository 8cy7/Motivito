import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'register';

export const ParentAuthScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const scale = Math.min(Math.max(shortSide / 375, 0.8), 1.4);
  const sp = (n: number) => Math.round(n * scale);

  const { registerParent, loginParentWithPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) { Alert.alert('تنبيه', 'يرجى إدخال الاسم'); return; }
      if (parentPin.length !== 4 || !/^\d{4}$/.test(parentPin)) {
        Alert.alert('تنبيه', 'رمز PIN يجب أن يكون 4 أرقام'); return;
      }
      if (password.length < 8) {
        Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerParent(name.trim(), email.trim().toLowerCase(), password, parentPin);
      } else {
        await loginParentWithPassword(email.trim().toLowerCase(), password);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || err?.message
        || 'حدث خطأ، تحقق من الاتصال بالإنترنت';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { fontSize: sp(15), borderRadius: sp(12), padding: sp(14) }];
  const labelStyle = [styles.label, { fontSize: sp(13), marginBottom: sp(6) }];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={[styles.title, { fontSize: sp(28), marginBottom: sp(6) }]}>
              موتيفيتو 🌟
            </Text>
            <Text style={[styles.subtitle, { fontSize: sp(15), marginBottom: sp(32) }]}>
              {mode === 'register' ? 'أنشئ حسابك الآن' : 'أهلاً بعودتك ولي الأمر'}
            </Text>

            {/* Mode Switch */}
            <View style={[styles.modeSwitch, { borderRadius: sp(12), marginBottom: sp(24) }]}>
              {(['login', 'register'] as Mode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeBtn,
                    { borderRadius: sp(10) },
                    mode === m && styles.modeBtnActive,
                  ]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeBtnText, { fontSize: sp(14) }, mode === m && styles.modeBtnTextActive]}>
                    {m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form */}
            <View style={[styles.form, { gap: sp(16), borderRadius: sp(16), padding: sp(20) }]}>
              {mode === 'register' && (
                <View>
                  <Text style={labelStyle}>الاسم</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="اسمك الكريم"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={name}
                    onChangeText={setName}
                    textAlign="right"
                  />
                </View>
              )}

              <View>
                <Text style={labelStyle}>البريد الإلكتروني</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="example@email.com"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="left"
                />
              </View>

              <View>
                <Text style={labelStyle}>كلمة المرور {mode === 'register' ? '(8 أحرف على الأقل)' : ''}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textAlign="left"
                />
              </View>

              {mode === 'register' && (
                <View>
                  <Text style={labelStyle}>رمز PIN (4 أرقام) - لتسجيل الدخول السريع</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="مثال: 1234"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={parentPin}
                    onChangeText={t => setParentPin(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                  />
                </View>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { borderRadius: sp(14), marginTop: sp(24), paddingVertical: sp(16) }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#7C3AED" />
              ) : (
                <Text style={[styles.submitText, { fontSize: sp(17) }]}>
                  {mode === 'register' ? '✅ إنشاء الحساب' : '🔑 دخول'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.hint, { fontSize: sp(12), marginTop: sp(16) }]}>
              {mode === 'register'
                ? 'بعد التسجيل يمكنك الدخول بـ PIN فقط'
                : 'بعد الدخول يمكنك استخدام رمز PIN للجلسات اللاحقة'}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
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
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeBtnText: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  modeBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  submitBtn: {
    backgroundColor: '#FBBF24',
    alignItems: 'center',
  },
  submitText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
