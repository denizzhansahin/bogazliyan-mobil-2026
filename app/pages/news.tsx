import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  Share2,
  CalendarDays,
  MoreHorizontal
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Supabase bağlantısı
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ActivityIndicator } from 'react-native'; // Yükleniyor ikonu için

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

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#0db9f2',
  bg: '#ffffff',
  textDark: '#111618',
  textGray: '#6b7280',
  border: '#f3f4f6',
  green: '#22c55e',
  orange: '#f97316',
  purple: '#a855f7',
};

// --- TİP TANIMLAMALARI ---
interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string; // 'gundem', 'belediye', 'spor', 'egitim', 'kultur'
  categoryLabel: string;
  categoryColor: string;
  time: string;
  image: string;
  isHeadline?: boolean; // Manşet mi?
}

{/* 
// --- KATEGORİLER ---
const CATEGORIES = [
  { id: 'all', label: 'Hepsi', icon: '🌍' },
  { id: 'gundem', label: 'Gündem', icon: '📢' },
  { id: 'belediye', label: 'Belediye', icon: '🏛️' },
  { id: 'spor', label: 'Spor', icon: '⚽' },
  { id: 'egitim', label: 'Eğitim', icon: '🎓' },
  { id: 'kultur', label: 'Kültür', icon: '🎨' },
];

// --- MOCK DATA (MANŞETLER) ---

const HEADLINES: NewsItem[] = [
  {
    id: 'h1',
    title: 'Yeni Kapalı Pazar Yeri Törenle Hizmete Açıldı',
    excerpt: '',
    category: 'gundem',
    categoryLabel: 'GÜNDEM',
    categoryColor: COLORS.primary,
    time: '2 saat önce',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800',
    isHeadline: true
  },
  {
    id: 'h2',
    title: 'Boğazlıyan Spor Deplasmandan 3 Puanla Döndü',
    excerpt: '',
    category: 'spor',
    categoryLabel: 'SPOR',
    categoryColor: COLORS.green,
    time: '4 saat önce',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?q=80&w=800',
    isHeadline: true
  },
  {
    id: 'h3',
    title: 'Yozgat Genelinde Yoğun Kar Yağışı Uyarısı',
    excerpt: '',
    category: 'gundem',
    categoryLabel: 'HAVA DURUMU',
    categoryColor: '#2563eb', // Blue
    time: '6 saat önce',
    image: 'https://images.unsplash.com/photo-1485594050903-8e8ee53223b7?q=80&w=800',
    isHeadline: true
  },
];

// --- MOCK DATA (HABER LİSTESİ) ---
const NEWS_LIST: NewsItem[] = [
  {
    id: '1',
    title: 'Altyapı Çalışmaları Hız Kesmeden Devam Ediyor',
    excerpt: 'Şehir merkezindeki su hattı yenileme çalışmaları bu hafta tamamlanıyor. Vatandaşların dikkatine sunulur.',
    category: 'belediye',
    categoryLabel: 'BELEDİYE',
    categoryColor: COLORS.primary,
    time: '2 saat önce',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400',
  },
  {
    id: '2',
    title: 'Boğazlıyan Şekerspor Transfer Dönemine Hızlı Girdi',
    excerpt: 'Yeni sezon öncesi 3 önemli oyuncu ile anlaşma sağlandı. Hedef şampiyonluk.',
    category: 'spor',
    categoryLabel: 'SPOR',
    categoryColor: COLORS.green,
    time: '4 saat önce',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=400',
  },
  {
    id: '3',
    title: 'Okullarda Kış Saati Uygulaması Başlıyor',
    excerpt: 'Valilik tarafından yapılan açıklamaya göre ders başlama saatleri güncellendi.',
    category: 'egitim',
    categoryLabel: 'EĞİTİM',
    categoryColor: COLORS.orange,
    time: '6 saat önce',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400',
  },
  {
    id: '4',
    title: "Boğazlıyan Kültür Merkezi'nde Yıl Sonu Sergisi",
    excerpt: 'Yerel sanatçıların eserlerinin sergilendiği etkinlik hafta sonuna kadar ziyaret edilebilir.',
    category: 'kultur',
    categoryLabel: 'KÜLTÜR & SANAT',
    categoryColor: COLORS.purple,
    time: '1 gün önce',
    image: 'https://images.unsplash.com/photo-1505567745926-ba89000d255a?q=80&w=400',
  },
  {
    id: '5',
    title: 'Çiftçilere Mazot ve Gübre Desteği Ödemeleri Başladı',
    excerpt: 'Tarım ve Orman Bakanlığı tarafından yapılan açıklamaya göre ödemeler hesaplara yatırılıyor.',
    category: 'gundem',
    categoryLabel: 'EKONOMİ',
    categoryColor: '#ca8a04',
    time: '1 gün önce',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=400',
  },
];
*/}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // --- YENİ EKLENECEKLER ---
  const [headlines, setHeadlines] = useState<NewsItem[]>([]); // Manşetler için
  const [newsList, setNewsList] = useState<NewsItem[]>([]);   // Liste haberleri için
  const [categories, setCategories] = useState<any[]>([]);    // Kategoriler için
  const [loading, setLoading] = useState(true);               // Yükleniyor durumu



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
              .eq('place', 'news'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
          console.error('Veriler çekilemedi - news:', error);
        } finally {
          console.log('news passed');
        }
      };


  const [activeCategory, setActiveCategory] = useState('all'); // Mevcut kodunda vardı, kalsın

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Kategorileri Çek
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'news'); // Sadece haber kategorileri

      if (catData) {
        // "Hepsi" seçeneğini manuel ekliyoruz, gerisi DB'den
        setCategories([{ id: 'all', label: 'Hepsi', icon: '🌍' }, ...catData]);
      }

      // 2. Haberleri Çek (Kategori bilgisiyle beraber)
      const { data: newsData, error } = await supabase
        .from('news')
        .select(`
          *,
          categories ( label, color, icon )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (newsData) {
        // DB verisini UI formatına çevir (Mapping)
        const formattedNews: NewsItem[] = newsData.map((item: any) => ({
          id: item.id,
          title: item.title,
          excerpt: item.excerpt || '',
          category: item.category_id,
          // İlişkili tablodan gelen veriler (categories.*)
          categoryLabel: item.categories?.label || 'Genel',
          categoryColor: item.categories?.color || COLORS.primary,
          time: new Date(item.created_at).toLocaleDateString('tr-TR'), // Basit tarih formatı
          image: item.image_url,
          isHeadline: item.is_headline
        }));

        // Veriyi ikiye ayır: Manşetler ve Diğerleri
        setHeadlines(formattedNews.filter(n => n.isHeadline));
        setNewsList(formattedNews.filter(n => !n.isHeadline));
      }

    } catch (error) {
      console.error('Veri hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = useMemo(() => {
  if (activeCategory === 'all') return newsList; // <-- Değişti
  return newsList.filter(item => item.category === activeCategory); // <-- Değişti
}, [activeCategory, newsList]);


  // Paylaşım Fonksiyonu
  const handleShare = async (item:NewsItem) => {
    if (!item) return;
    try {
      await Share.share({
        message: `${item.title} $- Boğazlıyan Mobil Uygulaması'ndan okuyun. \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // --- COMPONENT: Slider Item (Manşet) ---
  const renderHeadline = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.headlineCard}
      onPress={() => router.push(`/pages/news-detail?id=${item.id}`)} // Detay Sayfasına Bağlanacak
    >
      <Image source={{ uri: item.image }} style={styles.headlineImage} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={styles.headlineGradient}
      />
      <View style={styles.headlineContent}>
        <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor }]}>
          <Text style={styles.categoryBadgeText}>{item.categoryLabel}</Text>
        </View>
        <Text style={styles.headlineTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Clock size={14} color="#d1d5db" />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- COMPONENT: List Item (Haber Kartı) ---
  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.newsCard}
      onPress={() => router.push(`/pages/news-detail?id=${item.id}`)} // Detay Sayfasına Bağlanacak
    >
      {/* Sol Taraf: Metin */}
      <View style={styles.newsContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <View style={[styles.dot, { backgroundColor: item.categoryColor }]} />
          <Text style={[styles.newsCategory, { color: item.categoryColor }]}>
            {item.categoryLabel}
          </Text>
        </View>

        <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
        <Text style={styles.newsExcerpt} numberOfLines={2}>{item.excerpt}</Text>

        <View style={styles.newsFooter}>
          <Text style={styles.newsTime}>{item.time}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={()=>{handleShare(item)}}>
            <Share2 size={16} color={COLORS.textGray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sağ Taraf: Resim */}
      <View style={styles.newsImageContainer}>
        <Image source={{ uri: item.image }} style={styles.newsImage} contentFit="cover" transition={300} />
      </View>
    </TouchableOpacity>
  );

return (
    <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Fixed) */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Haber Merkezi</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>


                {/* --- REKLAM ALANI: news-0 --- */}

 {/* reklam */}
      {/* 2. FLATLIST (Tüm İçerik) */}
      
      <FlatList
        // DÜZELTME 1: Burası 'headlines' değil 'filteredNews' olmalı.
        // Çünkü burası aşağı doğru akan ana haber listesi.
        data={filteredNews} 
        keyExtractor={(item) => item.id}
        renderItem={renderNewsItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}

        // --- HEADER COMPONENT (Slider + Kategoriler) ---
        ListHeaderComponent={
          <>
            {/* Manşet Slider */}
            <View style={styles.sliderContainer}>
              <FlatList
                horizontal
                // DÜZELTME 2: Burası 'filteredNews' değil 'headlines' olmalı.
                // Çünkü burası üstteki manşet alanı.
                data={headlines} 
                keyExtractor={(item) => item.id}
                renderItem={renderHeadline}
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToAlignment="center"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              />

                            {/* getAdByCode('news-0') veri dönerse render eder, yoksa boş geçer */}
              {getAdByCode('news-0') && (
                <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                  <PromoCard 
                    data={getAdByCode('news-0')!} 
                    height={140} // İstersen yüksekliği buradan özel ayarla
                  />
                </View>
              )}
            </View>

            {/* Kategori Filtreleri */}
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setActiveCategory(cat.id)}
                    >
                      <Text style={{ fontSize: 12 }}>{cat.icon}</Text>
                      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </>
        }

        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
             {/* Loading kontrolü eklemek kullanıcı deneyimi için iyi olur */}
            {loading ? (
               <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
               <Text style={{ color: COLORS.textGray }}>Bu kategoride haber bulunamadı.</Text>
            
            )}
          </View>
        }
      />
       {/* reklam */}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Slider (Manşet)
  sliderContainer: {
    paddingVertical: 16,
  },
  headlineCard: {
    width: width - 32, // Tam ekran genişliği eksi padding
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  headlineImage: {
    width: '100%',
    height: '100%',
  },
  headlineGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  headlineContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headlineTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
  },

  // Filtreler
  filterContainer: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterTextActive: {
    color: 'white',
  },

  // Liste
  listContainer: {
    paddingBottom: 40,
  },
  newsCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  newsCategory: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: 4,
  },
  newsExcerpt: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  newsTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  shareBtn: {
    padding: 4,
  },
  newsImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
});