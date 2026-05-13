// MotivitoAIChatScreen.tsx
// شاشة الدردشة مع موتيفيتو

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { parentApi } from '../../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface MotivitoAIChatScreenProps {
  navigation: any;
  route: any;
}

export const MotivitoAIChatScreen: React.FC<MotivitoAIChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'السلام عليكم! أنا هنا لمساعدتك في فهم سلوك أطفالك وتطويرهم. اسألني عن أي شيء يتعلق بأطفالك وسأساعدك! 💪',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await parentApi.get('/api/ai/chat/history');
      if (res.data.length > 0) {
        const history: Message[] = res.data.map((h: any) => ({
          id: h.id,
          text: h.content,
          isUser: h.role === 'user',
          timestamp: new Date(h.createdAt),
        }));
        setMessages(history);
      }
    } catch {
      // keep welcome message on error
    }
  };

  const handleClearChat = async () => {
    try {
      await parentApi.delete('/api/ai/chat/history');
    } catch {}
    setMessages([{
      id: '1',
      text: 'السلام عليكم! أنا هنا لمساعدتك في فهم سلوك أطفالك وتطويرهم. اسألني عن أي شيء يتعلق بأطفالك وسأساعدك! 💪',
      isUser: false,
      timestamp: new Date(),
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    const messageToSend = inputText;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await parentApi.post('/api/ai/chat', { message: messageToSend });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const text = error?.response?.data?.error || 'عذراً، حدث خطأ. حاول مرة أخرى.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text,
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={{
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      justifyContent: item.isUser ? 'flex-end' : 'flex-start',
    }}>
      {!item.isUser && (
        <Image
          source={require('../../assets/motivito-logo.png')}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          resizeMode="contain"
        />
      )}
      <View style={{
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        ...(item.isUser
          ? { backgroundColor: '#FFD700' }
          : { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }
        ),
      }}>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 24,
            textAlign: 'right',
            writingDirection: 'rtl',
            ...(item.isUser
              ? { color: '#333333', fontWeight: '600' }
              : { color: '#FFFFFF', fontWeight: '400' }
            ),
          }}
          allowFontScaling={false}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#6B39B8' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header + Messages wrapper */}
          <View style={{ flex: 1, backgroundColor: '#7241c6' }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              height: 110,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.15)',
            }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 30, color: '#FFFFFF', fontWeight: '800' }}>‹</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Image
                  source={require('../../assets/motivito-logo.png')}
                  style={{ width: 80, height: 80 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={loading ? [...messages, { id: 'loading', text: '', isUser: false, timestamp: new Date() }] : messages}
              keyExtractor={item => item.id}
              renderItem={(props) => {
                if (props.item.id === 'loading') {
                  return (
                    <View style={{ paddingVertical: 16, alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="large" color="#FFD700" />
                      <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '600' }}>موتيفيتو يفكر...</Text>
                    </View>
                  );
                }
                return renderMessage(props);
              }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                paddingBottom: 16,
                flexGrow: 1,
                justifyContent: 'flex-end',
              }}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            />
          </View>

          {/* Input Area */}
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Platform.OS === 'android' ? 12 : 8,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.15)',
            backgroundColor: '#6B39B8',
          }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  maxHeight: 100,
                  fontSize: 14,
                  textAlign: 'right',
                }}
                placeholder="اسأل موتيفيتو..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!loading}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,80,80,0.2)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,80,80,0.4)',
                }}
                onPress={handleClearChat}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,215,0,0.3)',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,215,0,0.5)',
                  opacity: (!inputText.trim() || loading) ? 0.5 : 1,
                }}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || loading}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: '700' }}>إرسال</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
