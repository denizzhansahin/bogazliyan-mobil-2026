import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  Alert,
  Share
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';


// Tasarımdaki renkler
const COLORS = {
  primary: '#0db9f2',
  textDark: '#111618',
   dark: '#111718',
  textGray: '#9ca3af', // Gray-400
  textLightGray: '#d1d5db', // Gray-300
  bgLight: '#f9fafb', // Gray-50
  white: '#ffffff',
};

const openLink = async (url: string) => {
  try {

    await Linking.openURL(url);

  } catch (err) {
    console.error('Link hatası:', err);
  }
};

// Paylaşma Fonksiyonu
const handleShare = async () => {
  try {
    await Share.share({
      message: `Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
    });
  } catch (error) {
    console.log(error);
  }
};





export default function MenuScreen() {
  const router = useRouter();
  // Link açma fonksiyonu (Örnek)



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uygulama Hakkında</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. ÜST BÖLÜM (LOGO & BAŞLIK)
        
        <MaterialIcons name="location-city" size={48} color={COLORS.primary} style={styles.logoIcon} />

        */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBg} />
            <Image source={require('../../assets/images/logo_1024.png')} style={styles.logoIcon} />
          </View>

          <Text style={styles.appTitle}>Boğazlıyan Mobil</Text>
          <Text style={styles.versionText}>v1.0.0</Text>

          {/* Instagram Butonu */}
          <TouchableOpacity
            style={styles.instagramBtnContainer}
            activeOpacity={0.9}
            onPress={() => openLink('https://instagram.com/bogazliyanmobil')}
          >
            <LinearGradient
              colors={['#eab308', '#db2777', '#7e22ce']} // Yellow-500 -> Pink-600 -> Purple-700
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.instagramGradient}
            >
              <MaterialCommunityIcons name="instagram" size={24} color="white" />
              <Text style={styles.instagramText}>Bizi Instagram'da Takip Et</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* menu-1 */}
        {/* 2. LİSTE MENÜ (AYARLAR & İLETİŞİM) */}
        <View style={styles.menuList}>
          {/* Bize Ulaşın */}
          <MenuListItem
            icon="chat-bubble-outline"
            title="Bize Ulaşın / Öneri Gönder"
            onPress={() => openLink('https://bogazliyan.linksphere.tr/iletişim')}
          />

          {/* Web Sitesi */}
          <MenuListItem
            icon="language"
            title="Web Sitesi"
            detail="bogazliyan.linksphere.tr"
            onPress={() => openLink('https://bogazliyan.linksphere.tr')}
          />

          {/* E-Posta */}
          <MenuListItem
            icon="mail-outline"
            title="E-Posta"
            detail="mobilhaber2025@gmail.com"
            onPress={() => openLink('mailto:mobilhaber2025@gmail.com?subject=Öneri/İletişim')}
          />

          {/* Kullanım Koşulları */}
          <MenuListItem
            icon="description"
            title="Yasal Sözleşmeler"
            onPress={() => router.push('/pages/privacy-terms-license')}
          />

          {/* Kullanım Koşulları */}
          <MenuListItem
            icon="share"
            title="Uygulamayı Paylaş!"
            onPress={() => handleShare()}
          />
        </View>


        {/* reklam */}
        {/* 3. FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Designed for Boğazlıyan with ❤️</Text>
          <Text style={styles.copyrightText}>Copyright © 2026</Text>
        </View>

      </ScrollView>

      {/* index-4 */}
    </SafeAreaView>
  );
}

// Tekrar eden liste elemanı için ufak bir bileşen
const MenuListItem = ({ icon, title, detail, isLast, onPress }: any) => (
  <TouchableOpacity
    style={[styles.listItem, !isLast && styles.borderBottom]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.listItemLeft}>
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={20} color="#6b7280" />
      </View>
      <Text style={styles.listTitle}>{title}</Text>
    </View>

    <View style={styles.listItemRight}>
      {detail && <Text style={styles.detailText}>{detail}</Text>}
      <MaterialIcons name="chevron-right" size={22} color={COLORS.textLightGray} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // Üst Bölüm
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  logoBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(13, 185, 242, 0.1)', // Primary color opacity 10%
  },
  logoIcon: {
    zIndex: 1,
    width: 96,
    height: 96,
    //marginTop: 10
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLightGray, // Gray-300 equivalent
    fontWeight: '500',
    marginTop: 4,
  },
  instagramBtnContainer: {
    marginTop: 24,
    width: '100%',
    shadowColor: '#ec4899', // Pink shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  instagramGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 99, // Pill shape
    gap: 12,
  },
  instagramText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Liste Menü
  menuList: {
    width: '100%',
    marginBottom: 48,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937', // Gray-800
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#9ca3af', // Gray-400
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#d1d5db', // Gray-300
  },
  copyrightText: {
    fontSize: 10,
    color: '#e5e7eb', // Gray-200
  },


  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'white',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
});