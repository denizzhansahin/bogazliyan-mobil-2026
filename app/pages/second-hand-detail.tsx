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
  Share,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Heart,
  User,
  BadgeCheck, // Verified icon
  Calendar,
  MapPin,
  MessageCircle
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent, trackScreen } from '@/src/firebase/analytics';


// --- RENKLER ---
const COLORS = {
  primary: '#0db9f2',
  accent: '#f97316', // Orange
  bg: '#f3f4f6',
  white: '#ffffff',
  textDark: '#111618',
  textGray: '#6b7280',
  border: '#e5e7eb',
  blue: '#2563eb',
  blueBg: '#eff6ff',
};

{/* 
// --- MOCK DATA ---
const PRODUCT_DETAIL = {
  id: '1',
  title: 'Nike Air Zoom Pegasus - 42 Numara',
  price: '750₺',
  seller: 'Mehmet Demir',
  sellerJoinDate: 'Ekim 2022',
  sellerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200',
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
  condition: 'İyi Durumda',
  description: 'Ayakkabıyı sadece birkaç kez yürüyüşte kullandım, ayağıma küçük geldiği için satıyorum. Herhangi bir yırtığı veya deformasyonu yoktur. Tabanı gayet iyi durumdadır. Kutusunu atmıştım o yüzden kutusuz verilecektir.',
  features: [
    '42 Numara',
    'Orijinal Ürün',
    'Temiz Kullanılmış',
    'Elden teslim edilebilir'
  ],
  date: '2 Gün Önce',
  location: 'Çarşı Mh.',
};
*/}

// UI için kullanacağımız veri tipi
interface ProductDetail {
  id: string;
  title: string;
  price: string;
  seller: string;
  sellerJoinDate: string;
  sellerAvatar: string;
  image: string;
  condition: string;
  description: string;
  features: string[];
  date: string;
  location: string;
  contactInfoInstagramFacebook: string | null;
}

import PromoCard from '@/components/PromoCard';
// Diğer interface'lerin yanına ekleyin
interface AddsItem {
    id: string;
    title: string;
    image: string;
    tag: string;
    tagColor: string;
    targetPath: string;
    targetId: string;
    place: string;
    place_code: string;
}

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

    const [adds, setAdds] = useState<AddsItem[]>([]); // YENİ STATE
    // Adds dizisi içinden place_code'a göre veriyi bulur
    const getAdByCode = (code: string) => {
        return adds.find(item => item.place_code === code);
    };


    useEffect(() => {
        fetchAllData();
    }, []);


    const fetchAllData = async () => {
        try {

            // Paralel Veri Çekme
            const [addRes] = await Promise.all([

                supabase
                    .from('add_company')
                    .select('*')
                    .eq('place', 'second-hand-detail'), // ✅ FİLTRE: Sadece explore sayfasındakiler
            ]);


            if (addRes.data) {
                setAdds(addRes.data.map(item => ({
                    id: item.id,
                    title: item.title,
                    image: item.image_url,
                    tag: item.tag,
                    tagColor: item.tag_color || '#0db9f2', // Veri yoksa varsayılan mavi
                    targetPath: item.target_path || '',
                    targetId: item.target_id || '',
                    place: item.place || '',
                    place_code: item.place_code || ''
                })));
            }

        } catch (error) {
            console.error('Veriler çekilemedi - second-hand-detail:', error);
        } finally {
            console.log('second-hand-detail passed');
        }
    };



  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (!id) return;
    trackEvent('second_hand_view', {
      item_id: id,
      item_type: 'second_hand',
    })


  }, [id]);




  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // DB verisini UI formatına dönüştür
        const formattedProduct: ProductDetail = {
          id: data.id,
          title: data.title,
          price: `${data.price}₺`,
          seller: data.seller_name,
          sellerJoinDate: 'İkinci El Satıcı', // DB'de bu bilgi yoksa varsayılan
          sellerAvatar: data.seller_avatar_url || "",
          image: data.image_url || "",
          condition: 'İkinci El', // DB'de yok, varsayılan
          description: data.description || 'Açıklama girilmemiş.',
          // DB'de özellik listesi yok, kategoriye göre veya boş dönebiliriz
          features: [data.category, 'Elden Teslim', 'Mesajla İletişim'],
          date: new Date(data.created_at).toLocaleDateString('tr-TR'),
          location: data.location, // DB'de lokasyon yoksa varsayılan
          contactInfoInstagramFacebook: data.contactInfoInstagramFacebook
        };

        setProduct(formattedProduct);
      }
    } catch (error) {
      console.error('Ürün detayı hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Paylaşma
  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.title} - ${product.price} - ${product.description} - ${product.location} \nBoğazlıyan Mobil'de buldum! - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // İletişime Geç
  const handleContact = () => {
    if (product?.contactInfoInstagramFacebook) {
      Linking.openURL(product.contactInfoInstagramFacebook);
    } else {
      alert("Satıcı Instagram/Facebook bilgisi eklememiş.");
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
        <Text>İlan bulunamadı veya kaldırılmış.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Sabit) */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ArrowLeft size={24} color={COLORS.textDark} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>İlan Detayı</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Share2 size={22} color={COLORS.textDark} />
              </TouchableOpacity>
              {/* 1. HEADER (Sabit) 
              <TouchableOpacity style={[styles.iconBtn, { marginRight: -8 }]}>
                <Heart size={22} color={COLORS.textDark} />
              </TouchableOpacity>
              */}
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* 2. MAIN IMAGE */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            contentFit="cover"
          />
          {/* Pagination Dots (Mock) 
          <View style={styles.pagination}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          */}
        </View>


        {/* 3. CONTENT SHEET */}
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Seller Info (Small Top) */}
          <View style={styles.sellerTopRow}>
            <User size={14} color={COLORS.textGray} />
            <Text style={styles.sellerNameSmall}>{product.seller}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Price & Condition Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            <View style={styles.conditionBadge}>
              <BadgeCheck size={16} color={COLORS.blue} />
              <Text style={styles.conditionText}>{product.condition}</Text>
            </View>
          </View>

                  {/* reklam */}
        {/* --- REKLAM ALANI: second-hand-detail-0 --- */}
                        {/* getAdByCode('second-hand-detail-0') veri dönerse render eder, yoksa boş geçer */}
                        {getAdByCode('second-hand-detail-0') && (
                            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                                <PromoCard
                                    data={getAdByCode('second-hand-detail-0')!}
                                    height={140} // İstersen yüksekliği buradan özel ayarla
                                />
                            </View>
                        )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İlan Açıklaması</Text>
            <Text style={styles.description}>{product.description}</Text>

            {/* Features List */}
            <View style={styles.featureList}>
              {product.features.map((feature, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* reklam */}
          {/* Seller Card */}
          <View style={styles.sellerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: product.sellerAvatar }} style={styles.avatar} />
              <View>
                <Text style={styles.sellerName}>{product.seller}</Text>

                {/* Seller Card 
          <Text style={styles.sellerMeta}>Üyelik: {product.sellerJoinDate}</Text>
          */}


              </View>
            </View>
            {/* Seller Card 
            <TouchableOpacity style={styles.otherAdsBtn}>
              <Text style={styles.otherAdsText}>Diğer İlanları</Text>
            </TouchableOpacity>
            */}

          </View>

          {/* Info Grid (Date & Location) */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: '#fff7ed', }]}>
                <Calendar size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.infoLabel}>İlan Tarihi</Text>
                <Text style={styles.infoValue}>{product.date}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: '#f0fdf4' }]}>
                <MapPin size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Konum</Text>
                <Text style={styles.infoValue}>{product.location}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* 4. BOTTOM BAR (Fixed) */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.9} onPress={handleContact}>
          <MessageCircle size={20} color="white" />
          <Text style={styles.contactBtnText}>Satıcıyla İletişime Geç - Instagram/Facebook</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 10,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },

  // Image
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Kare veya 4:5
    backgroundColor: '#fff',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dotActive: {
    backgroundColor: 'white',
  },

  // Sheet
  sheetContainer: {
    marginTop: -24, // Negative margin overlap
    backgroundColor: COLORS.bg, // veya Beyaz
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    minHeight: 500,
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sellerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sellerNameSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 32,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.accent,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.blueBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  conditionText: {
    color: COLORS.blue,
    fontWeight: 'bold',
    fontSize: 14,
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
  description: {
    fontSize: 14,
    lineHeight: 24,
    color: '#4b5563',
  },
  featureList: {
    marginTop: 12,
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textGray,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
  },

  // Seller Card
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  sellerMeta: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  otherAdsBtn: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  otherAdsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  infoValue: {
    fontSize: 12,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  contactBtn: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});