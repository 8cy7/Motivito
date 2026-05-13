import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useChildren } from '../../contexts/ChildrenContext';
import { useAuth } from '../../contexts/AuthContext';
import { iapManager, PRODUCT_IDS } from '../../services/iap';

const { height } = Dimensions.get('window');

// Icons
const ChevronIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="#999" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FF0000"
    />
  </Svg>
);

export const SettingsScreen = ({ navigation, route }: any) => {
  const { isPremium, togglePremium, refreshPremiumStatus, refreshChildren } = useChildren();
  const { logoutParent } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(route?.params?.showUpgrade || false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('عربي');
  const [purchasing, setPurchasing] = useState(false);

  const handleUpgrade = async () => {
    setShowUpgradeModal(false);
    setPurchasing(true);
    try {
      await iapManager.purchase(PRODUCT_IDS.MONTHLY, async () => {
        await refreshPremiumStatus();
        await refreshChildren();
      });
      Alert.alert('مبروك! 🎉', 'تم تفعيل اشتراكك بنجاح');
    } catch (err: any) {
      if (err !== null) {
        Alert.alert('خطأ', err || 'تعذّر إتمام عملية الشراء، حاول مرة أخرى');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setShowUpgradeModal(false);
    setPurchasing(true);
    try {
      await iapManager.restore(async () => {
        await refreshPremiumStatus();
        await refreshChildren();
      });
      Alert.alert('تمّ! 🎉', 'تم استعادة اشتراكك بنجاح');
    } catch (err: any) {
      Alert.alert('تنبيه', err?.response?.data?.error || err?.message || 'لا توجد مشتريات سابقة لاستعادتها');
    } finally {
      setPurchasing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: () => logoutParent(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Purchase Loading Overlay */}
      {purchasing && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </Modal>
      )}
      {/* Background */}
      <View style={styles.background}>
        <LinearGradient
          colors={['#7241c6', '#5c34a3', '#7241c6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.8}
            onPress={() => setShowUpgradeModal(true)}>
            <View style={styles.accountContent}>
              <ChevronIcon />
              <Text style={[styles.accountType, isPremium && styles.accountTypePremium]}>
                {isPremium ? 'مدفوع' : 'قياسي'}
              </Text>
              <View style={styles.accountTitleContainer}>
                <Text style={styles.accountTitle}>الحساب</Text>
                <Text style={styles.accountSubtitle}>ولي الأمر</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اللغة</Text>
          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.8}
            onPress={() => setShowLanguageModal(true)}>
            <View style={styles.settingContent}>
              <View style={styles.settingRight}>
                <ChevronIcon />
                <Text style={styles.languageText}>{selectedLanguage}</Text>
              </View>
              <Text style={styles.settingTitle}>اللغة</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات</Text>
          <TouchableOpacity
            style={styles.settingCard}
            activeOpacity={0.8}
            onPress={() => setShowAboutModal(true)}>
            <View style={styles.settingContent}>
              <ChevronIcon />
              <Text style={styles.settingTitle}>عن التطبيق</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}>
          <View
            style={{
              paddingVertical: 16,
              alignItems: 'center',
              borderRadius: 18,
              backgroundColor: '#F44336',
              borderWidth: 2,
              borderColor: '#000',
            }}>
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Upgrade Modal */}
      <AppModal
        visible={showUpgradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowUpgradeModal(false)}
          />
          <View style={styles.upgradeModalContainer}>
            <View
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: '#FFD700',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 25,
              }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowUpgradeModal(false)}
                  style={styles.closeButton}>
                  <CloseIcon />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>ترقية الحساب</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                <Text style={styles.upgradeTitle}>{isPremium ? 'تم فتح الميزات' : 'اشترك في VIP / Premium!'}</Text>
                <Text style={styles.upgradeDescription}>
                  احصل على مميزات حصرية لتحفيز أطفالك بشكل أفضل
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>📚</Text>
                    <Text style={styles.featureText}>رف الإنجازات للوالد والطفل</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🗺️</Text>
                    <Text style={styles.featureText}>خريطة الطفل التفاعلية</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>📊</Text>
                    <Text style={styles.featureText}>المحلل الذكي للأداء</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>⚔️</Text>
                    <Text style={styles.featureText}>المسار المميز في موتيفيتو باس</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>👨‍👧‍👦</Text>
                    <Text style={styles.featureText}>يمكنك إضافة حتى ٥ أطفال</Text>
                  </View>
                </View>

                {isPremium ? (
                  <View style={styles.activatedContainer}>
                    <View style={styles.checkCircle}>
                      <Svg width="48" height="48" viewBox="0 0 24 24">
                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#FFFFFF" />
                      </Svg>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>شهر</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.currency, { fontFamily: 'saudi_riyal' }]}>{'\u20C1'}</Text>
                        <Text style={styles.price}>١٤.٩٩</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.purchaseButton}
                      activeOpacity={0.8}
                      onPress={handleUpgrade}>
                      <View
                        style={{
                          paddingVertical: 16,
                          alignItems: 'center',
                          borderRadius: 18,
                          backgroundColor: '#4CAF50',
                          borderWidth: 2,
                          borderColor: '#000',
                        }}>
                        <Text style={styles.purchaseText}>اشتراك الآن</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleRestore}
                      style={{ marginTop: 8, alignItems: 'center', paddingVertical: 10 }}>
                      <Text style={{ fontSize: 14, color: '#667eea', textDecorationLine: 'underline' }}>
                        استعادة المشتريات السابقة
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 16 }}>
                  <TouchableOpacity onPress={() => Linking.openURL('https://maznalharbi.github.io/Motivito-Privacy')}>
                    <Text style={{ fontSize: 12, color: '#555', textDecorationLine: 'underline' }}>سياسة الخصوصية</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                    <Text style={{ fontSize: 12, color: '#555', textDecorationLine: 'underline' }}>شروط الاستخدام</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </AppModal>

      {/* Language Modal */}
      <AppModal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={styles.smallModalContainer}>
            <View style={styles.smallModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>اختر اللغة</Text>
                <TouchableOpacity
                  onPress={() => setShowLanguageModal(false)}
                  style={styles.closeButton}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'عربي' && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setSelectedLanguage('عربي');
                  setShowLanguageModal(false);
                }}>
                <Text style={styles.languageOptionText}>عربي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'English' && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setSelectedLanguage('English');
                  setShowLanguageModal(false);
                }}>
                <Text style={styles.languageOptionText}>English</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>

      {/* About Modal */}
      <AppModal
        visible={showAboutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowAboutModal(false)}
          />
          <View style={styles.modalContainer}>
            <View
              style={{
                width: '100%',
                backgroundColor: '#667eea',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 25,
              }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowAboutModal(false)}
                  style={styles.closeButton}>
                  <CloseIcon />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, styles.aboutModalTitle]}>عن التطبيق</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.aboutTitle}>Motivito</Text>
                <Text style={styles.aboutDescription}>
                  تطبيق تحفيزي متطور مصمم لمساعدة الأهل في تشجيع أطفالهم على إنجاز
                  المهام اليومية والوصول إلى أهدافهم بطريقة ممتعة وتفاعلية.
                </Text>

                <View style={styles.developersSection}>
                  <Text style={styles.developersTitle}>فريق التطوير</Text>
                  <View style={styles.developersList}>
                    <Text style={styles.developerName}>• م. مازن الحربي</Text>
                    <Text style={styles.developerName}>• م. فهد السبر</Text>
                    <Text style={styles.developerName}>• م. عبدالعزيز الفهد</Text>
                    <Text style={styles.developerName}>• م. متعب السويح</Text>
                  </View>

                  <View style={styles.supervisorSection}>
                    <Text style={styles.supervisorLabel}>بإشراف</Text>
                    <Text style={styles.supervisorName}>الدكتور موال</Text>
                  </View>
                </View>

                <View style={styles.versionSection}>
                  <Text style={styles.versionText}>الإصدار 1.0.0</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  titleBar: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  titleBarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 95,
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    textAlign: 'right',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  accountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  accountTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  accountSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'right',
  },
  accountType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    marginLeft: 8,
  },
  accountTypePremium: {
    color: '#667eea',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'right',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  logoutGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    maxHeight: height * 0.70,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
  },
  upgradeModalContainer: {
    height: height * 0.92,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
  },
  smallModalContainer: {
    maxHeight: height * 0.4,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    padding: 25,
    maxHeight: height * 0.85,
    backgroundColor: '#FFFFFF',
  },
  smallModalContent: {
    padding: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  upgradeDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  featuresList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000000',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: '#333',
  },
  currency: {
    fontSize: 48,
    fontWeight: '900',
    color: '#666',
  },
  purchaseButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  activatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 20,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  purchaseGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
  },
  purchaseText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  languageOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  languageOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#667eea',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  aboutDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  developersSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  developersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  developersList: {
    gap: 10,
  },
  developerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  leadDeveloperCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  leadDeveloperName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  leadDeveloperTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  developerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 12,
    alignItems: 'center',
  },
  developerCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  developerCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  supervisorSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  supervisorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  supervisorName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  versionSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  aboutModalTitle: {
    color: '#FFFFFF',
  },
});
