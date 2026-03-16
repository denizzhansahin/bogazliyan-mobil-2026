import React, { useEffect, useState } from 'react'; import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MoreVertical,
  Share2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



// --- TİP TANIMI (UI İçin) ---
interface CampaignUI {
  id: string;
  badge: string;
  title: string;
  desc: string;
  btnText: string;
  colors: readonly [string, string, ...string[]]; // Gradient tipi için readonly
  shadowColor: string;
  btnTextColor: string;
}

{/* 
// --- VERİ SETİ (HTML'den alındı) ---
const CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    badge: 'Süreli Fırsat',
    title: '3 Al 2 Öde!',
    desc: 'Tüm tatlı çeşitlerinde geçerli, arkadaşınla gel tatlın bizden olsun.',
    btnText: 'Fırsatı Yakala',
    colors: ['#FF8C42', '#FF3D3D'], // Orange to Red
    shadowColor: '#FF3D3D',
    btnTextColor: '#FF3D3D',
  },
  {
    id: '2',
    badge: 'Öğrenciye Özel',
    title: '%15 İndirim',
    desc: 'Öğrenci kimliğini göster, 12:00 - 14:00 arası tüm menülerde indirimi kap.',
    btnText: 'Detaylar',
    colors: ['#29B6F6', '#0284C7'], // Cyan to Blue
    shadowColor: '#0284C7',
    btnTextColor: '#0284C7',
  },
  {
    id: '3',
    badge: 'Haftasonu',
    title: 'Bedava İçecek',
    desc: 'Haftasonu yapacağın 200₺ ve üzeri alışverişlerde büyük boy içecek hediye!',
    btnText: 'Kampanyayı Gör',
    colors: ['#34D399', '#059669'], // Green
    shadowColor: '#059669',
    btnTextColor: '#059669',
  },
  {
    id: '4',
    badge: 'Yeni Üye',
    title: '50₺ Puan Kazan',
    desc: 'Uygulamaya yeni kayıt olan herkese ilk alışverişinde kullanılabilir 50₺ değerinde puan.',
    btnText: 'Hemen Üye Ol',
    colors: ['#A78BFA', '#7C3AED'], // Purple
    shadowColor: '#7C3AED',
    btnTextColor: '#7C3AED',
  },
];
*/}

// --- RENK PALETLERİ (Veritabanında renk yok, bunları sırayla kullanacağız) ---
const COLOR_THEMES = [
  { colors: ['#FF8C42', '#FF3D3D'], shadow: '#FF3D3D', text: '#FF3D3D' }, // Turuncu-Kırmızı
  { colors: ['#29B6F6', '#0284C7'], shadow: '#0284C7', text: '#0284C7' }, // Mavi-Cyan
  { colors: ['#34D399', '#059669'], shadow: '#059669', text: '#059669' }, // Yeşiller
  { colors: ['#A78BFA', '#7C3AED'], shadow: '#7C3AED', text: '#7C3AED' }, // Morlar
  { colors: ['#F472B6', '#DB2777'], shadow: '#DB2777', text: '#DB2777' }, // Pembeler
];

export default function CampaignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [campaigns, setCampaigns] = useState<CampaignUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      // 1. Veritabanından Kampanyaları Çek
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false }); // En yeniler üstte

      if (error) throw error;

      if (data) {
        // 2. Veriyi UI formatına dönüştür ve Renk Ata
        const formattedData: CampaignUI[] = data.map((item, index) => {
          // Modulo operatörü (%) ile renkleri sırayla döndür
          const theme = COLOR_THEMES[index % COLOR_THEMES.length];

          return {
            id: item.id,
            badge: item.badge || 'Fırsat', // DB'de boşsa varsayılan
            title: item.title,
            desc: item.description || '',
            btnText: 'Detayları Gör', // Sabit buton metni
            colors: theme.colors as any,
            shadowColor: theme.shadow,
            btnTextColor: theme.text
          };
        });

        setCampaigns(formattedData);
      }

    } catch (error) {
      console.error('Kampanyalar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

    const handleShare = async () => {
      try {
        await Share.share({
          message: ` \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
        });
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F4F7" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kampanyalar</Text>
        
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Share2 size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      {/* reklam */}

      {/* LISTE */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0db9f2" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {campaigns.length > 0 ? (
            campaigns.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.95}
                onPress={() => router.push({
                  pathname: '/pages/campaigns-detail',
                  params: { id: item.id }
                })}
                style={[styles.cardContainer, { shadowColor: item.shadowColor }]}
              >
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Dekoratif Baloncuklar (Blobs) */}
                  <View style={styles.blob1} />
                  <View style={styles.blob2} />

                  {/* İçerik */}
                  <View style={styles.content}>
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={3}>{item.desc}</Text>

                    <View style={styles.button}>
                      <Text style={[styles.btnText, { color: item.btnTextColor }]}>
                        {item.btnText}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: '#6b7280', fontSize: 16 }}>Aktif kampanya bulunmuyor.</Text>
            </View>
          )}
        </ScrollView>
      )}
      {/* reklam */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7', // background-light
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(242, 244, 247, 0.9)', // Glass effect fake
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },

  // Card
  cardContainer: {
    borderRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 32,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 240,
  },

  // Dekoratif
  blob1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ scale: 1 }],
  },
  blob2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // İçerik
  content: {
    zIndex: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -1,
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 24,
    paddingRight: 16,
  },
  button: {
    backgroundColor: 'white',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});