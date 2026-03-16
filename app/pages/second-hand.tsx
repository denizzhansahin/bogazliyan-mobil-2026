import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Dimensions,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal, // Sort ikonu için
  Heart,
  Plus,
  User
} from 'lucide-react-native';

import { useEffect } from 'react';
import {
  ActivityIndicator
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- TİP TANIMLAMALARI ---
// UI tarafında kullandığımız tip
interface ProductUI {
  id: string;
  title: string;
  price: string; // Ekranda göstermek için string (örn: "850₺")
  seller: string;
  image: string;
  sellerAvatar?: string | null;
  category: string;
}

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
// (Ekran Genişliği - Kenar Boşlukları - Sütun Arası) / 2
const CARD_WIDTH = (width - 32 - COLUMN_GAP) / 2;

// --- RENKLER (HTML'den alındı) ---
const COLORS = {
  bg: '#f3f4f6',
  white: '#ffffff',
  primary: '#0db9f2',
  accent: '#f97316', // Turuncu
  textDark: '#111618',
  textGray: '#6b7280',
  border: '#e5e7eb',
};



// Veritabanı satır tipi
type MarketItemRow = Database['public']['Tables']['market_items']['Row'];

// --- KATEGORİLER ---
// Veritabanındaki verilerle örtüşmeli (Gıda'yı ekledim)
const CATEGORIES = ['Hepsi', 'Elektronik', 'Giyim', 'Ev Eşyası', 'Gıda', 'Araç', 'Hobi'];

const openLink = async (url: string) => {
  try {

    await Linking.openURL(url);

  } catch (err) {
    console.error('Link hatası:', err);
  }
};

{/* 
// --- MOCK DATA ---
const PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Az Kullanılmış Koşu Ayakkabısı',
    price: '850₺',
    seller: 'Ahmet Y.',
    category: 'Giyim',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100',
  },
  {
    id: '2',
    title: 'Kapalı Paket Erzak Kolisi',
    price: '150₺',
    seller: 'Fatma T.',
    category: 'Gıda',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100',
  },
  {
    id: '3',
    title: 'Temiz TV Ünitesi ve Ses Sistemi',
    price: '4.200₺',
    seller: 'Mehmet K.',
    category: 'Ev Eşyası',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=400',
    // Avatar yoksa placeholder icon kullanacağız
  },
  {
    id: '4',
    title: 'Profesyonel Kuaför Malzemeleri',
    price: '1.500₺',
    seller: 'Ali V.',
    category: 'Elektronik',
    image: 'https://images.unsplash.com/photo-1503951914290-934c203a1164?q=80&w=400',
    sellerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100',
  },
  {
    id: '5',
    title: 'Ev Yapımı Tepsi Börek',
    price: '120₺',
    seller: 'Ayşe H.',
    category: 'Gıda',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
    sellerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100',
  },
  {
    id: '6',
    title: 'Çocuk Bisikleti (Az Kullanılmış)',
    price: '1.350₺',
    seller: 'Hasan B.',
    category: 'Hobi',
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57e3081?q=80&w=400',
    sellerAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=100',
  },
];
*/}

export default function SecondHandScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Hepsi');

  // State Tanımları
  const [items, setItems] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Kategori her değiştiğinde veriyi yeniden çek
  useEffect(() => {
    fetchMarketItems();
  }, [activeCategory]);

  const fetchMarketItems = async () => {
    try {
      setLoading(true);

      // Temel sorgu
      let query = supabase
        .from('market_items')
        .select('*')
        .eq('is_sold', false) // Satılmamış ürünleri getir
        .order('created_at', { ascending: false }); // En yeniden eskiye

      // Eğer "Hepsi" seçili değilse kategoriye göre filtrele
      if (activeCategory !== 'Hepsi') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // DB verisini UI formatına dönüştür
        const formattedItems: ProductUI[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          price: `${item.price}₺`, // Fiyatı formatla
          seller: item.seller_name,
          image: item.image_url || "",
          sellerAvatar: item.seller_avatar_url,
          category: item.category
        }));

        setItems(formattedItems);
      }
    } catch (error) {
      console.error('İlanlar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ÜRÜN KARTI BİLEŞENİ ---
  const renderProductItem = ({ item }: { item: ProductUI }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push({
        pathname: '/pages/second-hand-detail', // Senin verdiğin dosya adı
        params: { id: item.id }
      })}
    >
      {/* Görsel Alanı */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" transition={300} />

        {/* Favori Butonu (Sağ Üst) 
        <TouchableOpacity style={styles.favButton}>
          <Heart size={18} color="#9ca3af" />
        </TouchableOpacity>
        */}


        {/* Satıcı Avatarı (Sol Alt - Resim Üstünde) */}
        <View style={styles.avatarContainer}>
          {item.sellerAvatar ? (
            <Image source={{ uri: item.sellerAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={16} color={COLORS.textGray} />
            </View>
          )}
        </View>
      </View>

      {/* İçerik Alanı */}
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.sellerName}>Satıcı: {item.seller}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Arama Filtrelemesi (Client-side)
  // Not: Büyük verilerde bu işlemi veritabanı sorgusuna (.ilike) taşımak gerekir.
  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // İyileştirilmiş Filtreleme Mantığı
  const filteredDeals1 = useMemo(() => {
    return items.filter(item => {
      // 1. Kategori Filtresi (Büyük/Küçük harf duyarsız yapıldı)
      const categoryMatch =
        activeCategory === 'Hepsi' ||
        (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());

      // 2. Arama Filtresi
      const searchMatch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.seller.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <View>
          {/* Üst Satır: Geri & Başlık */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>İkinci El Pazarı</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Orta Satır: Arama & Sıralama */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Search size={20} color={COLORS.textGray} />
              <TextInput
                placeholder="İkinci el telefon, araba vb. ara..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
                value={searchQuery}           // EKLENDİ
                onChangeText={setSearchQuery} // EKLENDİ
              />
            </View>
            {/* Orta Satır: Arama & Sıralama
            <TouchableOpacity style={styles.sortButton}>
              <SlidersHorizontal size={20} color={COLORS.textGray} />
            </TouchableOpacity> */}

          </View>

          {/* Alt Satır: Kategoriler */}
          <View style={{ paddingBottom: 12 }}>
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
      </View>
{/* reklam */}
      {/* 2. ÜRÜN LİSTESİ (GRID) */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredDeals1} // Filtrelenmiş veriyi kullan = filteredItems
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: COLORS.textGray }}>Bu kategoride ilan bulunamadı.</Text>
            </View>
          }
          // Sayfa yenileme özelliği (Pull to Refresh)
          onRefresh={fetchMarketItems}
          refreshing={loading}
        />
      )}
{/* reklam */}
      {/* 3. FAB (İlan Ekle Butonu) */}
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
  },

  // Header
  header: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Search
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
    fontWeight: '500',
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Categories
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  categoryTextActive: {
    color: 'white',
  },

  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 100, // FAB için boşluk
  },

  // Product Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    // Hover efektini mobilde activeOpacity ile sağlıyoruz
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.8, // 4:5 Oranı
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(4px)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 2, // Border effect
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
    zIndex: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card Content
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
  sellerName: {
    fontSize: 10,
    color: '#9ca3af',
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800', // Bold
    color: COLORS.accent,
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
    shadowRadius: 10,
    elevation: 6,
    zIndex: 20,
  },
});