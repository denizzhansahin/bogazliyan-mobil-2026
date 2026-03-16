import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image'; // Daha iyi performans için
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal, // Sort icon
  Heart,
  Clock,
  Zap,
  Plus,
  ArrowRight
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 32 - COLUMN_GAP) / 2; // (Ekran - Padding - Ara Boşluk) / 2

// --- RENKLER (HTML'den alındı) ---
const COLORS = {
  bg: '#f3f4f6',
  white: '#ffffff',
  primary: '#0db9f2',
  accent: '#f97316', // Turuncu
  textDark: '#111618',
  textGray: '#9ca3af',
  red: '#ef4444',
};

// --- TİP TANIMLAMALARI ---
interface DealUI {
  id: string;
  title: string;
  store: string;
  price: string;
  oldPrice: string;
  discount: string;
  image: string;
  badgeText: string;
  badgeIcon: React.ElementType;
  badgeColor: string;
  isFeatured: boolean; // Yeni ekledik
  category: string;
}

// --- KATEGORİLER ---
const CATEGORIES = ['Hepsi', 'Gıda', 'Giyim', 'Teknoloji', 'Hizmet', 'Yeme-İçme'];
{/* 
// --- MOCK DATA ---
const DEALS: Deal[] = [
  {
    id: '1',
    title: 'Profesyonel Koşu Ayakkabısı',
    store: 'Spor Dünyası',
    price: '850₺',
    oldPrice: '1200₺',
    discount: '%30',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400',
    badgeText: 'Son 2 Gün',
    badgeIcon: Clock,
    badgeColor: COLORS.red,
  },
  {
    id: '2',
    title: 'Haftalık Manav & Sebze Paketi',
    store: 'Eko Market',
    price: '199₺',
    oldPrice: '250₺',
    discount: '%20',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
    badgeText: 'Bugün Bitiyor',
    badgeIcon: Clock,
    badgeColor: COLORS.accent,
  },
  {
    id: '3',
    title: 'Akıllı TV Ünitesi ve Ses Sistemi',
    store: 'Tekno Center',
    price: '4.200₺',
    oldPrice: '5.000₺',
    discount: '%15',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=400',
    badgeText: 'Son 5 Gün',
    badgeIcon: Zap,
    badgeColor: COLORS.textGray,
  },
  {
    id: '4',
    title: 'Saç & Sakal Kesimi (Damat Paketi)',
    store: 'Kuaför Ali',
    price: '150₺',
    oldPrice: '300₺',
    discount: '%50',
    image: 'https://images.unsplash.com/photo-1503951914290-934c203a1164?q=80&w=400',
    badgeText: 'Sınırlı Süre',
    badgeIcon: Clock,
    badgeColor: COLORS.accent,
  },
  {
    id: '5',
    title: 'Taze Simit ve Poğaça Tepsisi',
    store: 'Saray Fırını',
    price: '120₺',
    oldPrice: '160₺',
    discount: '%25',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
    badgeText: 'Sabah İndirimi',
    badgeIcon: Clock,
    badgeColor: COLORS.textGray,
  },
  {
    id: '6',
    title: 'Çocuk Bisikleti (Mavi/Kırmızı)',
    store: 'Hobi Dünyası',
    price: '1.350₺',
    oldPrice: '1.500₺',
    discount: '%10',
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57e3081?q=80&w=400',
    badgeText: 'Stoklarla Sınırlı',
    badgeIcon: Zap,
    badgeColor: COLORS.textGray,
  },
];
*/}

const openLink = async (url: string) => {
  try {

    await Linking.openURL(url);

  } catch (err) {
    console.error('Link hatası:', err);
  }
};

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Hepsi');

  const [deals, setDeals] = useState<DealUI[]>([]);
  const [featuredDeal, setFeaturedDeal] = useState<DealUI | null>(null); // Günün Fırsatı
  const [loading, setLoading] = useState(true);


  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          place:places ( name, image_url )
        `)
        .not('old_price', 'is', null) // İndirimi olanlar
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedDeals: DealUI[] = data.map((item: any) => {
          const price = item.price;
          const oldPrice = item.old_price;
          const discountRate = Math.round(((oldPrice - price) / oldPrice) * 100);

          return {
            id: item.id,
            title: item.name,
            store: item.place?.name || 'Mağaza',
            price: `${price}₺`,
            oldPrice: `${oldPrice}₺`,
            discount: `%${discountRate}`,
            image: item.image_url || "",
            badgeText: discountRate > 20 ? 'Süper Fırsat' : 'Sınırlı Süre',
            badgeIcon: discountRate > 20 ? Zap : Clock,
            badgeColor: discountRate > 20 ? COLORS.red : COLORS.accent,
            isFeatured: item.is_featured ,// Veritabanından gelen bayrak,
            category: item.category || 'Diğer'
          };
        });

        // 1. Günün Fırsatını Bul (isFeatured = true olan ilk ürün)
        const featured = formattedDeals.find(d => d.isFeatured);
        setFeaturedDeal(featured || null);

        // 2. Kalanları Listeye At (Günün fırsatı listede tekrar gözükmesin istiyorsan filtrele)
        const otherDeals = formattedDeals.filter(d => d.id !== featured?.id);
        setDeals(otherDeals);
      }
    } catch (error) {
      console.error('Fırsatlar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // YENİ: Filtreleme Mantığı (Arama + Kategori)
  const filteredDeals = useMemo(() => {
    return deals.filter(item => {
      // 1. Kategori Filtresi
      const categoryMatch = activeCategory === 'Hepsi' || item.category === activeCategory; // Veritabanında kategori yoksa 'Hepsi' varsayılabilir veya backend'den çekilmeli

      // 2. Arama Filtresi
      const searchMatch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.store.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [deals, activeCategory, searchQuery]);


  // İyileştirilmiş Filtreleme Mantığı
  const filteredDeals1 = useMemo(() => {
    return deals.filter(item => {
      // 1. Kategori Filtresi (Büyük/Küçük harf duyarsız yapıldı)
      const categoryMatch =
        activeCategory === 'Hepsi' ||
        (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());

      // 2. Arama Filtresi
      const searchMatch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.store.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [deals, activeCategory, searchQuery]);
  // --- ÜRÜN KARTI BİLEŞENİ ---
  const renderDealItem = ({ item }: { item: DealUI }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push({
        pathname: '/pages/deal-detail',
        params: { id: item.id },
      })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" transition={500} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
        {/* 
        <TouchableOpacity style={styles.favButton}>
          <Heart size={18} color="#9ca3af" />
        </TouchableOpacity>
        */}
      </View>

      <View style={styles.cardContent}>
        <View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.storeName}>{item.store}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <View style={styles.priceRow}>
            <Text style={styles.newPrice}>{item.price}</Text>
            <Text style={styles.oldPrice}>{item.oldPrice}</Text>
          </View>
          <View style={[styles.timeBadge, { backgroundColor: item.badgeColor === COLORS.red ? '#fef2f2' : '#fff7ed' }]}>
            <item.badgeIcon size={12} color={item.badgeColor} />
            <Text style={[styles.timeText, { color: item.badgeColor }]}>{item.badgeText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- HEADER (Featured Banner - DİNAMİK) ---
  const ListHeader = () => {

    if (searchQuery.length > 0) return null;
    // Eğer featuredDeal yoksa (henüz yüklenmediyse veya db'de yoksa) gösterme veya placeholder göster
    if (!featuredDeal) return null;

    return (
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.featuredContainer}
          onPress={() => router.push({
            pathname: '/pages/deal-detail',
            params: { id: featuredDeal.id },
          })}
        >
          <ImageBackground
            source={{ uri: featuredDeal.image }}
            style={styles.featuredImage}
            imageStyle={{ borderRadius: 16 }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
              borderRadius={16}
            />

            <View style={styles.featuredContent}>
              <View style={styles.featuredTopBadge}>
                <Zap size={14} color="white" fill="white" />
                <Text style={styles.featuredBadgeText}>Günün Fırsatı</Text>
              </View>

              <View style={styles.featuredBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredStore}>{featuredDeal.store}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredDeal.title}
                  </Text>
                  <View style={styles.featuredPriceRow}>
                    <Text style={styles.featuredOldPrice}>{featuredDeal.oldPrice}</Text>
                    <View style={styles.featuredNewPriceBox}>
                      <Text style={styles.featuredNewPrice}>{featuredDeal.price}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featuredArrowBtn}>
                  <ArrowRight size={20} color={COLORS.accent} />
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />


      {/* 1. FIXED HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fırsatlar & Kampanyalar</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textGray} />
            <TextInput
              placeholder="Market indirimi, ayakkabı vb. ara..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              value={searchQuery}           // EKLENDİ
              onChangeText={setSearchQuery} // EKLENDİ
            />
          </View>
          {/* 1. FIXED HEADER 
          <TouchableOpacity style={styles.sortButton}>
            <SlidersHorizontal size={20} color={COLORS.textGray} />
          </TouchableOpacity>
          */}

        </View>

        <View>
          <FlatList
            horizontal
            data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isActive = activeCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
      {/* deals-1 */}
            
      {/* 2. MAIN CONTENT */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredDeals1} //deals
          keyExtractor={(item) => item.id}
          renderItem={renderDealItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader} // <-- Dinamik Header Burada
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: COLORS.textGray }}>{searchQuery ? 'Sonuç bulunamadı.' : 'Şu an aktif indirim bulunmuyor.'}</Text>
            </View>
          }
        />
      )}
      {/* deals-2 */}

      {/* 3. FAB */}
      <TouchableOpacity style={[styles.fab]} onPress={() => openLink('https://bogazliyan.linksphere.tr/iletişim')}>
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header Styles
  headerContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    height: '100%',
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  categoryTextActive: {
    color: 'white',
  },

  // Main List Styles
  listContent: {
    padding: 16,
    paddingBottom: 100, // FAB ve alt boşluk
  },

  // Featured Banner
  featuredContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredTopBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredStore: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredOldPrice: {
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
    fontSize: 14,
  },
  featuredNewPriceBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backdropFilter: 'blur(10px)', // iOS only
  },
  featuredNewPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuredArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  // Product Card Styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 18,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 10,
    color: '#9ca3af',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  newPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  oldPrice: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 64,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
});