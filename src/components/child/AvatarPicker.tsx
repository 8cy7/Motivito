import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppModal } from '../AppModal';

const DEFAULT_AVATARS = {
  boy: '👦',
  girl: '👧',
};

interface AvatarPickerProps {
  visible: boolean;
  currentAvatar: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onImageUpload?: () => void;
  gender?: 'boy' | 'girl';
  unlockedEmojis?: string[];
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  visible,
  currentAvatar,
  onSelect,
  onClose,
  onImageUpload,
  gender = 'boy',
  unlockedEmojis = [],
}) => {
  const defaultAvatar = DEFAULT_AVATARS[gender];
  const availableEmojis = Array.from(new Set([...unlockedEmojis]));

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const isSelected = (emoji: string) => emoji === currentAvatar;

  return (
    <AppModal
      visible={visible}
      transparent={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: '#6B46C1',
            width: 350,
            borderRadius: 28,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 25,
          }}>
            {/* العنوان */}
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 24, textAlign: 'center' }}>
              اختر صورتك
            </Text>

            {/* كل الإيموجيات في صف أفقي واحد */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20, maxWidth: '100%' }}
              contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingHorizontal: 8 }}
            >
              {/* الإيموجي الافتراضي أولاً */}
              <TouchableOpacity
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: isSelected(defaultAvatar) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isSelected(defaultAvatar) ? 3 : 2,
                  borderColor: isSelected(defaultAvatar) ? '#FFD700' : 'rgba(255,255,255,0.3)',
                }}
                onPress={() => handleSelect(defaultAvatar)}
              >
                <Text style={{ fontSize: 38 }}>{defaultAvatar}</Text>
              </TouchableOpacity>

              {/* باقي الإيموجيات */}
              {availableEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: isSelected(emoji) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.12)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: isSelected(emoji) ? 3 : 2,
                    borderColor: isSelected(emoji) ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  }}
                  onPress={() => handleSelect(emoji)}
                >
                  <Text style={{ fontSize: 38 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* زر رفع صورة */}
            {onImageUpload && (
              <TouchableOpacity
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  paddingVertical: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.25)',
                }}
                onPress={() => { onClose(); setTimeout(() => onImageUpload(), 300); }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center' }}>📷 رفع صورة</Text>
              </TouchableOpacity>
            )}

            {/* زر الإغلاق */}
            <TouchableOpacity style={{ paddingVertical: 14 }} onPress={onClose}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </AppModal>
  );
};
