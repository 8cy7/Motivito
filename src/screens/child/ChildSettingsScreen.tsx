import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { isTablet, getResponsiveSpacing, getResponsiveFontSize } from '../../utils/deviceUtils';
import { SoundManager, SOUND_LABELS, SoundType } from '../../utils/soundUtils';

// Icons
const LanguageIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="#667eea"/>
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#667eea"/>
  </Svg>
);

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#4CAF50"/>
  </Svg>
);

const SoundIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="#667eea"/>
  </Svg>
);

interface ChildSettingsScreenProps {
  onLogout: () => void;
}

export const ChildSettingsScreen: React.FC<ChildSettingsScreenProps> = ({
  onLogout,
}) => {
  const isTabletDevice = isTablet();
  const [soundSettings, setSoundSettings] = useState(SoundManager.getAllSounds());

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل خروج', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleLanguagePress = () => {
    Alert.alert('اللغة', 'إعدادات اللغة قريباً!');
  };

  const handleSoundToggle = async (soundType: SoundType) => {
    // تغيير الحالة
    const newEnabled = SoundManager.toggleSound(soundType);

    // تشغيل الصوت كعينة إذا تم تفعيله
    if (newEnabled) {
      await SoundManager.playSound(soundType);
    }

    // تحديث الواجهة
    setSoundSettings(SoundManager.getAllSounds());
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(26, 26, 46, 0.98)" />

      {/* Title Bar - Hidden on Tablet */}
      {!isTabletDevice && (
        <View style={styles.titleBar}>
          <Text style={styles.titleBarText}>الإعدادات</Text>
        </View>
      )}

      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTabletDevice && styles.tabletScrollContent
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>مدفوع</Text>
                <CheckIcon />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>الحساب</Text>
                <Text style={styles.settingSubtitle}>حساب الطفل</Text>
              </View>
            </View>
          </View>

          {/* Sound Settings */}
          <View style={styles.section}>
            <View style={styles.soundHeader}>
              <SoundIcon />
              <Text style={styles.soundHeaderTitle}>إعدادات الأصوات</Text>
            </View>
            {soundSettings.map((sound, index) => (
              <View
                key={sound.type}
                style={[
                  styles.settingItem,
                  index !== soundSettings.length - 1 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.soundItemContent}>
                  <Switch
                    value={sound.enabled}
                    onValueChange={() => handleSoundToggle(sound.type)}
                    trackColor={{ false: '#CCC', true: '#81C784' }}
                    thumbColor={sound.enabled ? '#4CAF50' : '#FFF'}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{sound.label}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Other Settings */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={handleLanguagePress}
            >
              <View style={styles.settingRight}>
                <LanguageIcon />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>اللغة</Text>
                  <Text style={styles.settingSubtitle}>العربية</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={styles.settingRight}>
                <LogoutIcon />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>تسجيل الخروج</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Motivito v1.0.0</Text>
            <Text style={styles.appInfoSubtext}>حساب الطفل</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7241c6',
  },
  container: {
    flex: 1,
  },
  titleBar: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleBarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 600,
    width: '90%',
  },
  soundHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  soundHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  soundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
    textAlign: 'right',
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'right',
  },
  premiumBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CAF50',
  },
  arrow: {
    fontSize: 20,
    color: '#CCC',
    fontWeight: '700',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
