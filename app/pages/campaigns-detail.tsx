import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Share,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Info,
  Store,
  ChevronRight,
  ArrowRight,
  Clock // Schedule icon karşılığı
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#FF6B00', // Turuncu
  bg: '#F2F4F7', // Açık gri arka plan
  cardBg: '#FFFFFF',
  textDark: '#111827', // Koyu yazı
  textGray: '#6B7280', // Gri yazı
  border: '#E5E7EB',
};

{/* 
// --- MOCK DATA (Detaylı) ---
const CAMPAIGNS_DATA = [
  {
    id: '1',
    title: '3 Al 2 Öde!',
    badge: 'Süreli Fırsat',
    desc: 'Tüm tatlı çeşitlerinde geçerli, arkadaşınla gel tatlın bizden olsun.',
    timeLeft: 'Son 3 gün',
    dateRange: '01 Mayıs - 31 Mayıs 2024',
    colors: ['#F97316', '#FF6B00', '#EF4444'], // Orange Gradient
    conditions: [
      'Bu kampanya sadece tatlı kategorisindeki ürünlerde geçerlidir.',
      'Başka indirim veya promosyonlarla birleştirilemez.',
      'Masadaki en düşük fiyatlı ürün ikram edilir.',
      'Kampanya stoklarla sınırlıdır.'
    ],
    businesses: [
      { name: 'Boğazlıyan Kafe & Bistro', address: 'Cumhuriyet Meydanı, No:12', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=100' , id:"1"},
      { name: 'Merkez Pastanesi', address: 'Hastane Cad. No:5', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=100' , id:"2"}
    ]
  },
  {
    id: '2',
    title: '%15 İndirim',
    badge: 'Öğrenciye Özel',
    desc: 'Öğrenci kimliğini göster, 12:00 - 14:00 arası tüm menülerde indirimi kap.',
    timeLeft: 'Yıl Boyunca',
    dateRange: '01 Eylül - 15 Haziran 2024',
    colors: ['#29B6F6', '#0284C7', '#0369A1'], // Blue Gradient
    conditions: [
        'Öğrenci kimlik kartı ibrazı zorunludur.',
        'Sadece 12:00 - 14:00 saatleri arasında geçerlidir.',
        'İçecekler kampanyaya dahil değildir.'
    ],
    businesses: [
        { name: 'Kampüs Kafeterya', address: 'Üniversite Cad. No:1', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=100',id:"3" }
    ]
  },
  // Diğer kampanyalar için fallback data...
];
*/}

// --- TİP TANIMLAMALARI ---
interface BusinessUI {
  id: string;
  name: string;
  address: string;
  img: string;
}

interface CampaignDetail {
  id: string;
  title: string;
  badge: string;
  desc: string;
  timeLeft: string;
  dateRange: string;
  colors: string[];
  conditions: string[];
  businesses: BusinessUI[];
  code: string
}

export default function CampaignDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [isModalVisible, setIsModalVisible] = useState(false);


  useEffect(() => {
    if (!id) return;
  
  
    trackEvent('campaigns_detail_view', {
      item_id: id,
      item_type: 'campaigns_detail',
    });

  }, [id]);

  // ID'ye göre kampanyayı bul, yoksa ilkini göster (Fallback)
  //const campaign = CAMPAIGNS_DATA.find(c => c.id === id) || CAMPAIGNS_DATA[0];

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignDetail();
  }, [id]);

  const fetchCampaignDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // 1. Kampanya Detaylarını Çek
      const { data: campData, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campError) throw campError;

      // 2. Katılımcı İşletmeleri Çek (campaign_places -> places)
      const { data: placesData, error: placesError } = await supabase
        .from('campaign_places')
        .select(`
          place:places (
            id, name, address, image_url
          )
        `)
        .eq('campaign_id', id);

      if (campData) {
        // Tarih Hesaplamaları
        const startDate = new Date(campData.start_date || Date.now());
        const endDate = new Date(campData.end_date || Date.now());

        // Kalan gün hesapla
        const now = new Date();
        const diffTime = Math.abs(endDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = now > endDate;

        // JSON koşulları parse et
        let conditionsList: string[] = [];
        if (campData.terms) {
          // Veritabanında JSONB olarak tutuluyor, string array'e çeviriyoruz
          // @ts-ignore
          if (Array.isArray(campData.terms)) conditionsList = campData.terms;
          // @ts-ignore
          else if (typeof campData.terms === 'string') conditionsList = JSON.parse(campData.terms);
        }

        // İşletmeleri formatla
        const businessesList: BusinessUI[] = placesData
          ? placesData.map((item: any) => ({
            id: item.place.id,
            name: item.place.name,
            address: item.place.address || 'Adres belirtilmemiş',
            img: item.place.image_url || ""
          }))
          : [];

        setCampaign({
          id: campData.id,
          title: campData.title,
          badge: campData.badge || 'Fırsat',
          desc: campData.description || '',
          timeLeft: isExpired ? 'Süresi Doldu' : `Son ${diffDays} gün`,
          dateRange: `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          colors: ['#F97316', '#FF6B00', '#EF4444'], // Varsayılan Turuncu Tema
          conditions: conditionsList.length > 0 ? conditionsList : ['Genel kampanya koşulları geçerlidir.'],
          businesses: businessesList,
          code: campData.code
        });
      }

    } catch (error) {
      console.error('Kampanya detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        message: `${campaign.title} - ${campaign.desc}  \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Kampanya bulunamadı.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Kapatma Butonu */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={{ fontSize: 20, color: COLORS.textGray }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <Store size={32} color={COLORS.primary} />
            </View>

            <Text style={styles.modalTitle}>Kampanya Kodunuz</Text>
            <Text style={styles.modalSubTitle}>Kasada bu kodu göstererek indirimden hemen faydalanabilirsiniz.</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{campaign?.code || 'KOD-YOK'}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalActionBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kampanya Detayı</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* reklam */}

        {/* 2. HERO CARD (Gradient) */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={campaign.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Dekoratif Blob Efektleri */}
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />

            {/* İçerik */}
            <View style={styles.heroContent}>
              <View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{campaign.badge}</Text>
                </View>
                <Text style={styles.heroTitle}>{campaign.title}</Text>
                <Text style={styles.heroDesc}>{campaign.desc}</Text>
              </View>

              <View style={styles.timerRow}>
                <Clock size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.timerText}>{campaign.timeLeft}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 3. GEÇERLİLİK TARİHLERİ */}
        <View style={styles.infoCard}>
          <View style={styles.iconBoxOrange}>
            <Calendar size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.cardLabel}>GEÇERLİLİK TARİHLERİ</Text>
            <Text style={styles.cardValue}>{campaign.dateRange}</Text>
          </View>
        </View>

        {/* 4. KAMPANYA KOŞULLARI */}
        <View style={styles.infoCardList}>
          <View style={styles.cardHeader}>
            <Info size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Kampanya Koşulları</Text>
          </View>
          <View style={styles.listContainer}>
            {campaign.conditions?.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5. KATILIMCI İŞLETMELER */}
        <View style={styles.infoCardList}>
          <View style={styles.cardHeader}>
            <Store size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Katılımcı İşletmeler</Text>
          </View>

          {campaign.businesses.length > 0 ? (
            campaign.businesses.map((biz, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.businessItem}
                  onPress={() => router.push({
                    pathname: '/pages/place-detail',
                    params: { id: biz.id }
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image source={{ uri: biz.img }} style={styles.bizImage} />
                    <View>
                      <Text style={styles.bizName}>{biz.name}</Text>
                      <Text style={styles.bizAddress}>{biz.address}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={COLORS.textGray} />
                </TouchableOpacity>
                {/* Son eleman değilse çizgi koy */}
                {index < campaign.businesses.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <Text style={{ color: COLORS.textGray, fontSize: 13 }}>
              Bu kampanya için özel bir işletme belirtilmemiş.
            </Text>
          )}
        </View>
        {/* reklam */}
      </ScrollView>

      {/* 6. BOTTOM ACTION BAR (Fixed) */}
      <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.actionBtnText}>Fırsattan Yararlan</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.bottomHint}>Kodu kasada göstererek indirimden faydalanabilirsiniz.</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Bottom bar için yer
    paddingTop: 10,
    gap: 20,
  },

  // Hero Card
  heroCardContainer: {
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    borderRadius: 24,
    padding: 24,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    lineHeight: 38,
  },
  heroDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    maxWidth: '90%',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  timerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  // Blobs
  blobTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Info Cards
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBoxOrange: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff7ed', // Orange-50
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // List Cards (Conditions & Businesses)
  infoCardList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
  },

  // Business Item
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bizImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  bizName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  bizAddress: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    //paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomHint: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  modalSubTitle: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  codeContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  modalActionBtn: {
    backgroundColor: COLORS.textDark,
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});