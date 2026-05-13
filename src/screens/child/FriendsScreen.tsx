/**
 * FriendsScreen
 * ─────────────
 * ① كارت خاص بي: اسمي + MOTI-XXXX
 * ② إضافة صديق: أدخل friendCode → يرسل طلب حقيقي للـ backend
 * ③ طلبات واردة: اقبل أو ارفض
 * ④ قائمة الأصدقاء: مرتبين بالتقدم
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { childApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MyProfile {
  friendCode: string;
}

interface IncomingRequest {
  requestId: string;
  sender: {
    id: string;
    name: string;
    gender: 'boy' | 'girl';
    friendCode: string | null;
  };
}

interface Friend {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  friendCode: string | null;
  challengeLevel: number;
  level: number;
}

interface Props {
  navigation?: any;
  route?: any;
}

// ─── FriendCard ───────────────────────────────────────────────────────────────
const FriendCard: React.FC<{ friend: Friend; onRemove: (id: string, name: string) => void }> = ({ friend, onRemove }) => (
  <View style={fc.card}>
    <View style={fc.avatarWrap}>
      <Text style={{ fontSize: 26 }}>{friend.gender === 'girl' ? '👧' : '👦'}</Text>
      <View style={fc.levelBadge}>
        <Text style={fc.levelTxt}>{friend.level ?? 0}</Text>
      </View>
    </View>
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text style={fc.name}>{friend.name}</Text>
      {friend.friendCode && <Text style={fc.code}>{friend.friendCode}</Text>}
    </View>
    <TouchableOpacity onPress={() => onRemove(friend.id, friend.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Text style={fc.removeBtn}>✕</Text>
    </TouchableOpacity>
  </View>
);

// ─── RequestCard ──────────────────────────────────────────────────────────────
const RequestCard: React.FC<{
  req: IncomingRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}> = ({ req, onAccept, onReject, loading }) => (
  <View style={rc.card}>
    <View style={rc.avatar}>
      <Text style={{ fontSize: 24 }}>{req.sender.gender === 'girl' ? '👧' : '👦'}</Text>
    </View>
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text style={rc.name}>{req.sender.name}</Text>
      {req.sender.friendCode && (
        <Text style={rc.code}>{req.sender.friendCode}</Text>
      )}
      <Text style={rc.label}>يريد إضافتك كصديق</Text>
    </View>
    <View style={rc.btns}>
      <TouchableOpacity
        style={rc.acceptBtn}
        onPress={() => onAccept(req.requestId)}
        disabled={loading}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={rc.acceptTxt}>قبول</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={rc.rejectBtn}
        onPress={() => onReject(req.requestId)}
        disabled={loading}
      >
        <Text style={rc.rejectTxt}>رفض</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const FriendsScreen: React.FC<Props> = ({ navigation, route }) => {
  const childName   = route?.params?.childName   ?? 'الطفل';
  const childGender = (route?.params?.childGender ?? 'boy') as 'boy' | 'girl';

  const [profile,      setProfile]      = useState<MyProfile | null>(null);
  const [friends,      setFriends]      = useState<Friend[]>([]);
  const [incoming,     setIncoming]     = useState<IncomingRequest[]>([]);
  const [searchCode,   setSearchCode]   = useState('');
  const [sending,      setSending]      = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const [copied,       setCopied]       = useState(false);

  // ── Load all data ──
  const loadAll = useCallback(async () => {
    const [profileRes, friendsRes, incomingRes] = await Promise.allSettled([
      childApi.get('/api/friends/me'),
      childApi.get('/api/friends'),
      childApi.get('/api/friends/requests/incoming'),
    ]);
    if (profileRes.status === 'fulfilled')  setProfile(profileRes.value.data);
    if (friendsRes.status === 'fulfilled')  setFriends(friendsRes.value.data);
    if (incomingRes.status === 'fulfilled') setIncoming(incomingRes.value.data);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!navigation) return;
    const unsub = navigation.addListener('focus', loadAll);
    return unsub;
  }, [navigation, loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ── Send friend request ──
  const handleSend = async () => {
    const code = searchCode.trim().toUpperCase();
    if (!code) return;
    setSending(true);
    try {
      const res = await childApi.post('/api/friends/request', { friendCode: code });
      Alert.alert('✅ تم الإرسال', `تم إرسال طلب صداقة إلى ${res.data.receiverName}`);
      setSearchCode('');
      loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'حدث خطأ، تحقق من الـ ID';
      Alert.alert('خطأ', msg);
    } finally {
      setSending(false);
    }
  };

  // ── Accept request ──
  const handleAccept = async (requestId: string) => {
    setActionId(requestId);
    try {
      await childApi.post(`/api/friends/requests/${requestId}/accept`);
      await loadAll();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر القبول');
    } finally {
      setActionId(null);
    }
  };

  // ── Reject request ──
  const handleReject = async (requestId: string) => {
    setActionId(requestId);
    try {
      await childApi.post(`/api/friends/requests/${requestId}/reject`);
      setIncoming(prev => prev.filter(r => r.requestId !== requestId));
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'تعذر الرفض');
    } finally {
      setActionId(null);
    }
  };

  // ── Remove friend ──
  const handleRemove = (friendId: string, name: string) => {
    Alert.alert('حذف الصديق', `تريد حذف ${name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try {
            await childApi.delete(`/api/friends/${friendId}`);
            setFriends(prev => prev.filter(f => f.id !== friendId));
          } catch {
            Alert.alert('خطأ', 'تعذر الحذف');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0020' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0020" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* ── Header ── */}
          <View style={sc.header}>
            <TouchableOpacity style={sc.backBtn} onPress={() => navigation?.goBack()}>
              <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <Text style={sc.title}>الأصدقاء 👥</Text>
            <View style={{ width: 46 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={sc.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFD700" />
            }
          >

            {/* ── My Card ── */}
            <View style={sc.myCard}>
              <View style={sc.myAvatar}>
                <Text style={{ fontSize: 32 }}>{childGender === 'girl' ? '👧' : '👦'}</Text>
              </View>
              <View style={{ flex: 1, marginRight: 14 }}>
                <Text style={sc.myName}>{childName}</Text>
                <Text style={sc.idLabel}>الـ ID حقي</Text>
                <View style={sc.idRow}>
                  <TouchableOpacity
                    style={[sc.copyBtn, copied && sc.copiedBtn]}
                    onPress={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  >
                    <Text style={sc.copyTxt}>{copied ? '✓ تم' : '📋'}</Text>
                  </TouchableOpacity>
                  <Text style={sc.myCode}>
                    {profile ? profile.friendCode : '...'}
                  </Text>
                </View>
                <Text style={sc.shareHint}>شارك الـ ID مع أصدقائك</Text>
              </View>
            </View>

            {/* ── Add Friend ── */}
            <View style={sc.section}>
              <Text style={sc.sectionTitle}>➕ إضافة صديق</Text>
              <View style={sc.searchRow}>
                <TouchableOpacity
                  style={[sc.sendBtn, sending && { opacity: 0.6 }]}
                  onPress={handleSend}
                  disabled={sending}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>إرسال</Text>}
                </TouchableOpacity>
                <TextInput
                  style={sc.input}
                  placeholder="MOTI-XXXX"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={searchCode}
                  onChangeText={t => setSearchCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={9}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>
            </View>

            {/* ── Incoming Requests ── */}
            {incoming.length > 0 && (
              <View style={sc.section}>
                <Text style={sc.sectionTitle}>🔔 طلبات واردة ({incoming.length})</Text>
                {incoming.map(req => (
                  <RequestCard
                    key={req.requestId}
                    req={req}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    loading={actionId === req.requestId}
                  />
                ))}
              </View>
            )}

            {/* ── Friends List ── */}
            <View style={sc.section}>
              <Text style={sc.sectionTitle}>
                {friends.length === 0 ? '👥 قائمة الأصدقاء' : `👥 الأصدقاء (${friends.length})`}
              </Text>
              {friends.length === 0 ? (
                <View style={sc.emptyBox}>
                  <Text style={{ fontSize: 44, marginBottom: 8 }}>🤝</Text>
                  <Text style={sc.emptyTxt}>أضف أصدقاءك وشوف وين وصلوا في الرحلة!</Text>
                </View>
              ) : (
                friends.map(f => (
                  <FriendCard key={f.id} friend={f} onRemove={handleRemove} />
                ))
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontSize: 22, fontWeight: '900', color: '#ede9fe',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  myCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e0d4a',
    borderRadius: 20, padding: 18, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(196,181,253,0.3)',
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  myAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.5)',
    marginLeft: 14,
  },
  myName: { fontSize: 18, fontWeight: '900', color: '#ede9fe', textAlign: 'right' },
  idLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'right' },
  idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  myCode: { fontSize: 20, fontWeight: '900', color: '#FFD700', letterSpacing: 1 },
  copyBtn: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  copiedBtn: { backgroundColor: 'rgba(100,255,100,0.2)', borderColor: 'rgba(100,255,100,0.4)' },
  copyTxt: { fontSize: 12, color: '#FFD700', fontWeight: '700' },
  shareHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15, fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12, textAlign: 'right',
  },

  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: '#fff', fontSize: 16, fontWeight: '700',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    textAlign: 'right', letterSpacing: 1,
  },
  sendBtn: {
    paddingHorizontal: 18, paddingVertical: 13,
    backgroundColor: '#6d28d9', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    minWidth: 72,
  },

  emptyBox: {
    alignItems: 'center', paddingVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTxt: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', paddingHorizontal: 24,
  },
});

const fc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a0e42',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  avatarWrap: {
    width: 52, height: 52, marginLeft: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.35)',
  },
  levelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#7c3aed',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1.5, borderColor: '#0a0020',
    minWidth: 20, alignItems: 'center',
  },
  levelTxt: { fontSize: 11, fontWeight: '900', color: '#FFD700' },
  name: { fontSize: 16, fontWeight: '900', color: '#ede9fe', textAlign: 'right' },
  code: { fontSize: 11, color: '#a78bfa', fontWeight: '700', textAlign: 'right', marginTop: 2 },
  removeBtn: { fontSize: 16, color: 'rgba(255,100,100,0.6)', fontWeight: '900', paddingLeft: 8 },
});

const rc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1040',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.35)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)',
    marginLeft: 10,
  },
  name: { fontSize: 15, fontWeight: '900', color: '#ede9fe', textAlign: 'right' },
  code: { fontSize: 11, color: '#a78bfa', fontWeight: '700', textAlign: 'right', marginTop: 1 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'right' },
  btns: { flexDirection: 'column', gap: 6 },
  acceptBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
    alignItems: 'center', minWidth: 64,
  },
  acceptTxt: { fontSize: 13, fontWeight: '900', color: '#fff' },
  rejectBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
    alignItems: 'center',
  },
  rejectTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
});
