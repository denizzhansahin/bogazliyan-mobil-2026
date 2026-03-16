import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Share,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Heart,
  Timer,
  Star,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Percent
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
  primary: '#0db9f2',
  accent: '#f97316',
  bg: '#f3f4f6',
  white: '#ffffff',
  textDark: '#111618',
  textGray: '#6b7280',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
};

// --- TİP TANIMI ---
interface DealDetail {
  id: string;
  title: string;
  store: string;
  storeId: string;
  storeLogo: string;
  rating: number;
  reviewCount: number;
  price: string;
  oldPrice: string;
  discountRate: string;
  images: string[];
  timeLeft: string;
  description: string;
  features: string[];
  warranty: string;
  location: string;
  storePhone?: string | null;
}

export default function DealDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();




  useEffect(() => {
    if (!id) return;
  
  
      trackEvent('deal_detail_view', {
        item_id: id,
        item_type: 'deal_detail',
      });

  }, [id]);

  const [product, setProduct] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchDealDetail();
  }, [id]);

  const fetchDealDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Ürün detayını ve mağaza (place) bilgisini çek
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          place:places (
            id, name, image_url, rating, address, phone, whatsapp
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // İndirim Oranı
        const price = data.price || 0;
        const oldPrice = data.old_price || price * 1.2; // Eski fiyat yoksa %20 fazlası varsay
        const discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);

        // UI Formatı
        const formattedProduct: DealDetail = {
          id: data.id,
          title: data.name,
          // @ts-ignore
          store: data.place?.name || 'Mağaza',
          // @ts-ignore
          storeId: data.place?.id,
          // @ts-ignore
          storeLogo: data.place?.image_url || "",
          // @ts-ignore
          rating: data.place?.rating || 4.5,
          reviewCount: Math.floor(Math.random() * 200) + 50, // Mock
          price: `${price}₺`,
          oldPrice: `${oldPrice}₺`,
          discountRate: `%${discountPercent}`,
          images: [
            data.image_url || "",
            // Ekstra resimler (DB'de tek resim var, çoğaltıyoruz simülasyon için)
            data.image_url || "",
          ],
          timeLeft: 'Son 2 Gün', // DB'ye end_date eklenebilir
          description: data.description || 'Bu ürün için açıklama girilmemiş.',
          features: ['Orijinal Ürün', 'Hızlı Teslimat', 'İade Garantisi'], // DB'de özellik yoksa varsayılan
          warranty: '2 Yıl',
          // @ts-ignore
          location: data.place?.address || 'Merkez',
          // @ts-ignore
          storePhone: data.place?.whatsapp
        };

        setProduct(formattedProduct);
      }
    } catch (error) {
      console.error('Fırsat detayı hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Slider Scroll Event
  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveSlide(roundIndex);
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.title} - ${product.price} (İndirimde!) \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessage = () => {
    if (product?.storePhone) {
      Linking.openURL(`https://wa.me/${product.storePhone}`);
    } else {
      alert("Satıcı telefon numarası eklememiş.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Ürün bulunamadı.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Fixed Top) */}
      <View style={styles.header}>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Fırsat Detayı</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Share2 size={22} color={COLORS.textDark} />
          </TouchableOpacity>
          {/* 
          <TouchableOpacity style={[styles.iconButton, { marginRight: -8 }]}>
            <Heart size={22} color={COLORS.textDark} />
          </TouchableOpacity>
          */}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* reklam */}


        {/* 2. IMAGE CAROUSEL */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.productImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* İndirim Rozeti (Overlay) */}
          <View style={styles.discountBadge}>
            <Percent size={14} color="white" />
            <Text style={styles.discountText}>{product.discountRate} İndirim</Text>
          </View>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeSlide === index ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        </View>

        {/* 3. MAIN CONTENT (Sheet) */}
        <View style={styles.contentSheet}>
          {/* Sürükleme Çubuğu (Görsel) */}
          <View style={styles.dragIndicator} />

          {/* Başlık ve Mağaza */}
          <View style={styles.titleSection}>
            <Text style={styles.storeLabel}>{product.store}</Text>
            <Text style={styles.productTitle}>{product.title}</Text>
          </View>

          {/* Fiyat ve Süre */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.oldPrice}>{product.oldPrice}</Text>
              <Text style={styles.newPrice}>{product.price}</Text>
            </View>

            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Kampanya Bitiş</Text>
              <View style={styles.timerBadge}>
                <Timer size={14} color={COLORS.red} />
                <Text style={styles.timerText}>{product.timeLeft}</Text>
              </View>
            </View>
          </View>

          {/* Açıklama */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ürün Açıklaması</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>

            {/* Bullet Points */}
            <View style={styles.featureList}>
              {product.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mağaza Kartı */}
          <View style={styles.storeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: product.storeLogo }} style={styles.storeLogo} />
              <View>
                <Text style={styles.storeName}>{product.store}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Text style={styles.reviewCount}>({product.reviewCount}+ Değerlendirme)</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.storeBtn}
              onPress={() => router.push({
                pathname: '/pages/place-detail',
                params: { id: product.storeId }
              })}
            >
              <Text style={styles.storeBtnText}>Mağazayı Gör</Text>
            </TouchableOpacity>
          </View>

          {/* Bilgi Çipleri (Grid) */}
          <View style={styles.chipsGrid}>
            {/* Garanti */}
            <View style={styles.chipItem}>
              <View style={[styles.chipIcon, { backgroundColor: '#eff6ff' }]}>
                <ShieldCheck size={20} color={COLORS.blue} />
              </View>
              <View>
                <Text style={styles.chipLabel}>Garanti</Text>
                <Text style={styles.chipValue}>{product.warranty}</Text>
              </View>
            </View>

            {/* Konum */}
            <View style={styles.chipItem}>
              <View style={[styles.chipIcon, { backgroundColor: '#f0fdf4' }]}>
                <MapPin size={20} color={COLORS.green} />
              </View>
              <View>
                <Text style={styles.chipLabel}>Konum</Text>
                <Text style={styles.chipValue}>{product.location}</Text>
              </View>
            </View>
          </View>

        </View>
{/* reklam */}
      </ScrollView>

      {/* 4. STICKY BOTTOM BAR */}
      <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
        
        <View style={styles.bottomBarInner}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={handleMessage}>
            <ShoppingBag size={20} color="white" />
            <Text style={styles.primaryBtnText}>WhatsApp - Fırsatı İncele</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMessage}>
            <MessageCircle size={24} color={COLORS.textGray} />
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Carousel
  carouselContainer: {
    height: width, // Square Aspect Ratio
    backgroundColor: 'white',
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: COLORS.red,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pagination: {
    position: 'absolute',
    bottom: 32, // Sheet'in üzerine çıkmasın diye biraz yukarıda
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: 'white',
    width: 24, // Active is wider
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Content Sheet
  contentSheet: {
    marginTop: -24, // Negative margin for overlap
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dragIndicator: {
    width: 48,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  storeLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 30,
  },

  // Price & Timer
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 20,
    marginBottom: 20,
  },
  oldPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  newPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.accent,
  },
  timerBox: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2', // Red-50
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Description
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  featureList: {
    marginTop: 12,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
  },
  featureText: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Store Card
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    marginBottom: 20,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  storeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  reviewCount: {
    fontSize: 10,
    color: '#9ca3af',
  },
  storeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  storeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },

  // Info Chips
  chipsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  chipItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBarInner: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});