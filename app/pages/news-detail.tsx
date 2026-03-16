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
  Share,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share as ShareIcon, // Platform share icon
  Clock,
  Calendar,
  User,
  Quote
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
  bg: '#ffffff',
  textDark: '#111618',
  textGray: '#6b7280', // gray-500
  textLight: '#9ca3af', // gray-400
  border: '#f3f4f6',
};

{/*
// --- MOCK DATA (Örnek Haber İçeriği) ---
const NEWS_DATA = {
  id: '1',
  category: 'GÜNDEM',
  date: '14 Ekim, 14:30',
  title: 'Yeni Kapalı Pazar Yeri Törenle Hizmete Açıldı',
  image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800', // İnşaat/Bina görseli
  source: 'Boğazlıyan Haber Merkezi',
  reporter: 'Muhabir: Ahmet Yılmaz',
  sourceInitials: 'BH',
  content: [
    { type: 'lead', text: 'Boğazlıyan Belediyesi tarafından yapımı tamamlanan modern Kapalı Pazar Yeri, bugün düzenlenen görkemli bir törenle vatandaşların hizmetine sunuldu.' },
    { type: 'paragraph', text: 'İlçe merkezinde uzun süredir ihtiyaç duyulan ve vatandaşların talepleri doğrultusunda projelendirilen tesis, hem esnafın hem de alışveriş yapan vatandaşların konforunu ön planda tutacak şekilde tasarlandı. Açılış törenine ilçe protokolü, esnaf odaları temsilcileri ve çok sayıda vatandaş katılım gösterdi.' },
    { type: 'quote', text: '"Boğazlıyan\'a yakışır, modern ve hijyenik bir pazar alanını ilçemize kazandırmanın mutluluğunu yaşıyoruz."' },
    { type: 'paragraph', text: 'Belediye Başkanı yaptığı açılış konuşmasında, kışın soğuktan ve yağıştan, yazın ise sıcaktan etkilenmeden alışveriş yapılabilecek bu tesisin, bölge ekonomisine de canlılık katacağını ifade etti.' },
    { type: 'subheading', text: 'Modern İmkanlarla Donatıldı' },
    { type: 'paragraph', text: 'Yaklaşık 5000 metrekarelik bir alana kurulan yeni pazar yerinde, sadece satış alanları değil, aynı zamanda zabıta noktası, mescit, bebek bakım odası ve geniş kapasiteli otopark gibi sosyal donatılar da bulunuyor. Tesisin çatısında kullanılan özel sistem sayesinde gün ışığından maksimum seviyede faydalanılması sağlanarak enerji tasarrufu hedefleniyor.' },
    { type: 'paragraph', text: 'Pazar esnafı da yeni yerlerine geçmenin heyecanını yaşarken, vatandaşlar yapılan hizmetten duydukları memnuniyeti dile getirdiler.' }
  ]
};
*/}


// --- TIP TANIMLAMALARI ---
type ContentBlock = {
  type: 'lead' | 'paragraph' | 'subheading' | 'quote';
  text: string;
};

// UI için kullanacağımız veri tipi
interface NewsDetail {
  id: string;
  title: string;
  image: string;
  categoryLabel: string;
  categoryColor: string;
  date: string;
  source: string;
  reporter: string;
  sourceInitials: string;
  content: ContentBlock[];
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

export default function NewsDetailScreen() {
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
          .eq('place', 'news-detail'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
      console.error('Veriler çekilemedi - news-detail:', error);
    } finally {
      console.log('passed');
    }
  };








  const { id } = useLocalSearchParams(); // Listeden gelen ID

  useEffect(() => {
    if (!id) return;
    trackEvent('news_detail_view', {
      item_id: id,
      item_type: 'news_detail',
    });

  }, [id]);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Haber detayını ve ilişkili kategoriyi çek
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          categories ( label, color )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // DB verisini UI formatına dönüştür
        // JSON verisini güvenli bir şekilde ayrıştır (Parse)
        let parsedContent = [];
        try {
          if (typeof data.content === 'string') {
            parsedContent = JSON.parse(data.content);
          } else if (Array.isArray(data.content)) {
            parsedContent = data.content;
          }
        } catch (e) {
          console.log("JSON Parse Hatası:", e);
        }

        const formattedNews: NewsDetail = {
          id: data.id,
          title: data.title,
          image: data.image_url || "",
          // İlişkili tablo verileri (categories)
          // @ts-ignore: Supabase join tipleri bazen karmaşık olabilir
          categoryLabel: data.categories?.label || 'Genel',
          // @ts-ignore
          categoryColor: data.categories?.color || COLORS.primary,

          date: new Date(data.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          }),

          source: data.source || 'Haber Merkezi',
          reporter: data.reporter || 'Editör',
          sourceInitials: (data.source || 'H').substring(0, 2).toUpperCase(),

          // JSON verisini tip güvenli hale getiriyoruz
          //content: Array.isArray(data.content) ? (data.content as any[]) : []
          content: parsedContent
        };

        setNews(formattedNews);
      }
    } catch (error) {
      console.error('Haber detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Paylaşım Fonksiyonu
  const handleShare = async () => {
    if (!news) return;
    try {
      await Share.share({
        message: `${news.title} $- Boğazlıyan Mobil Uygulaması'ndan okuyun. \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Yükleniyor Durumu
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Veri Yoksa
  if (!news) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textGray }}>Haber bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10 }}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Fixed/Sticky) */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerInner}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <ArrowLeft size={24} color={COLORS.textDark} />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>Haber Detayı</Text>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.iconButton}
            >
              <ShareIcon size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* reklam */}
        {/* 2. HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: news.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* 3. CONTENT SHEET (White Background with negative margin) */}
        <View style={styles.contentSheet}>
          {/* Süsleme Çizgisi */}
          <View style={styles.dragHandle} />

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{news.categoryLabel}</Text>
            </View>
            <View style={styles.dateRow}>
              <Clock size={14} color={COLORS.textLight} />
              <Text style={styles.dateText}>{news.date}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{news.title}</Text>

          {/* Author/Source Row */}
          <View style={styles.authorContainer}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitials}>{news.sourceInitials}</Text>
            </View>
            <View>
              <Text style={styles.sourceName}>{news.source}</Text>
              <Text style={styles.reporterName}>{news.reporter}</Text>
            </View>
          </View>
          {/* reklam */}

          {/* --- REKLAM ALANI: news-detail-0 --- */}
          {/* getAdByCode('news-detail-0') veri dönerse render eder, yoksa boş geçer */}
          {getAdByCode('news-detail-0') && (
            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
              <PromoCard
                data={getAdByCode('news-detail-0')!}
                height={140} // İstersen yüksekliği buradan özel ayarla
              />
            </View>
          )}

          {/* Article Body 
          <View style={styles.articleBody}>
            {NEWS_DATA.content.map((block, index) => {
              switch (block.type) {
                case 'lead':
                  return (
                    <Text key={index} style={styles.leadText}>
                      {block.text}
                    </Text>
                  );
                case 'subheading':
                  return (
                    <Text key={index} style={styles.subheading}>
                      {block.text}
                    </Text>
                  );
                case 'quote':
                  return (
                    <View key={index} style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{block.text}</Text>
                    </View>
                  );
                default: // paragraph
                  return (
                    <Text key={index} style={styles.paragraph}>
                      {block.text}
                    </Text>
                  );
              }
            })}
          </View>
          */}


          {/* Article Body - JSON Mapping */}
          <View style={styles.articleBody}>
            {news.content && news.content.length > 0 ? (
              news.content.map((block, index) => {
                switch (block.type) {
                  case 'lead':
                    return (
                      <Text key={index} style={styles.leadText}>
                        {block.text}
                      </Text>
                    );
                  case 'subheading':
                    return (
                      <Text key={index} style={styles.subheading}>
                        {block.text}
                      </Text>
                    );
                  case 'quote':
                    return (
                      <View key={index} style={[styles.quoteBox, { borderLeftColor: news.categoryColor }]}>
                        <Text style={styles.quoteText}>{block.text}</Text>
                      </View>
                    );
                  default: // paragraph
                    return (
                      <Text key={index} style={styles.paragraph}>
                        {block.text}
                      </Text>
                    );
                }
              })
            ) : (
              // Eğer içerik henüz girilmemişse veya boşsa
              <Text style={styles.paragraph}>İçerik yükleniyor veya mevcut değil.</Text>
            )}
          </View>
          {/* reklam */}

          {/* Bottom Share Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shareBtnLarge} onPress={handleShare}>
              <ShareIcon size={20} color={COLORS.textDark} />
              <Text style={styles.shareBtnText}>Haberi Paylaş</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
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
    zIndex: 10,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb', // Hover effect bg
  },

  // Hero Image
  heroContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#e5e7eb',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Content Sheet
  contentSheet: {
    backgroundColor: COLORS.bg,
    marginTop: -24, // Negative margin for overlap effect
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5, // Android shadow
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Meta Data
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(13, 185, 242, 0.1)', // Primary color opacity
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: COLORS.textGray,
    fontSize: 12,
    fontWeight: '500',
  },

  // Title & Author
  title: {
    fontSize: 26,
    fontWeight: '800', // Extra bold
    color: COLORS.textDark,
    lineHeight: 34,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  authorInitials: {
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  reporterName: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  // Article Body
  articleBody: {
    gap: 16,
  },
  leadText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151', // Gray-700
  },
  subheading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 4,
  },
  quoteBox: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4b5563',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 24,
    alignItems: 'center',
  },
  shareBtnLarge: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  shareBtnText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
});