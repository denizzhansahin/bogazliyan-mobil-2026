import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  ArrowRight,
  Feather,
  Download,
  BookOpen,
  Share2
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  border: '#e2e8f0',
  cardBg: '#ffffff',
};

// --- TİP TANIMLARI ---
interface Poem {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorTitle: string;
  authorImg: string;
}

interface Photo {
  id: string;
  img: string;
  height: number;
}

interface Book {
  id: string;
  title: string;
  issue: string;
  cover: string | null;
  customIcon?: boolean;
}



export default function ArtsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [featuredPoem, setFeaturedPoem] = useState<Poem | null>(null);
  const [photoContestLeft, setPhotoContestLeft] = useState<Photo[]>([]);
  const [photoContestRight, setPhotoContestRight] = useState<Photo[]>([]);
  const [eBooks, setEBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetchArtsData();
  }, []);

  const fetchArtsData = async () => {
    try {
      setLoading(true);

      // 1. Şiir Köşesi (type='poem')
      const { data: poems } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'poem')
      //.limit(1); // Şimdilik ilkini alıyoruz

      if (poems && poems.length > 0) {

        const randomIndex = Math.floor(Math.random() * poems.length);
        //console.log(poems.length)
        //console.log(randomIndex)

        // 2. Rastgele seçilen kelimeyi al
        const p = poems[randomIndex];
        setFeaturedPoem({
          id: p.id,
          title: p.title,
          excerpt: (p.content || '').slice(0, 250) + '...',
          author: p.author || 'Bilinmiyor',
          authorTitle: p.subtitle || 'Şair',
          authorImg: p.image_url || "", // Yazar fotosu yoksa placeholder
        });
      }

      // 2.müze (type='photo_contest')
      const { data: photos } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'photo_contest');

      if (photos) {
        const left: Photo[] = [];
        const right: Photo[] = [];

        photos.forEach((item, index) => {
          // Masonry efekti için rastgele yükseklik atayalım
          const height = index % 3 === 0 ? 220 : 180;
          const photoItem = { id: item.id, img: item.image_url || '', height };

          if (index % 2 === 0) left.push(photoItem);
          else right.push(photoItem);
        });

        setPhotoContestLeft(left);
        setPhotoContestRight(right);
      }

      // 3. Kültür Yayınları (type='book')
      const { data: books } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'book');

      if (books) {
        setEBooks(books.map(b => ({
          id: b.id,
          title: b.title,
          issue: b.subtitle || '',
          cover: b.image_url,
          customIcon: !b.image_url // Görsel yoksa ikon göster
        })));
      }

    } catch (error) {
      console.error('Sanat verileri çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- PAYLAŞMA FONKSİYONU ---
  const handleShare = async () => {
    try {
      await Share.share({
        message: `📜 *${featuredPoem?.title}*\n\n${featuredPoem?.excerpt}\n\n✒️ _${featuredPoem?.author}_\n\n📲 Boğazlıyan Mobil ile keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log('Paylaşım hatası:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kültür İçerikleri</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
    





      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 2. ŞİİR KÖŞESİ */}
        {featuredPoem && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Şiir Köşesi</Text>
            </View>

            <View style={styles.poemCard}>
              <View style={styles.decorativeCircle} />

              <View style={styles.poemHeader}>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>SENİN İÇİN ŞİİR</Text>
                </View>
                <Share2 size={22} color="#94a3b8" onPress={handleShare} />
              </View>

              <Text style={styles.poemTitle}>{featuredPoem.title}</Text>

              <View style={styles.poemBody}>
                <View style={styles.poemLine} />
                <Text style={styles.poemText}>{featuredPoem.excerpt}</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.poemFooter} onPress={() => router.push('/pages/culture/allPoemsScreen')}>
                <View style={styles.authorContainer}>
                  <Image source={{ uri: featuredPoem.authorImg }} style={styles.authorImg} />
                  <View>
                    <Text style={styles.authorName}>{featuredPoem.author}</Text>
                    <Text style={styles.authorTitle}>{featuredPoem.authorTitle}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.readBtn} onPress={() => router.push('/pages/culture/allPoemsScreen')}>
                  <Text style={styles.readBtnText}>Keşfet</Text>
                  <ArrowRight size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/pages/culture/allPoemsScreen')}>
              <Text style={styles.outlineBtnText}>Tüm Şiirleri İncele</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. müze (Masonry Grid) */}
        {(photoContestLeft.length > 0 || photoContestRight.length > 0) && (
          <View style={styles.section}>
            <View style={styles.contestHeader}>
              <View>
                <Text style={styles.contestTitle}>Kaymakam Kemal Bey</Text>
                <Text style={styles.contestSub}>Saygıyla ve Rahmetle Anıyoruz</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/pages/culture/museumScreen')}>
                <Text style={styles.seeAll}>Tümü</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.masonryContainer}>
              {/* Sol Sütun */}
              <View style={styles.column}>
                {photoContestLeft.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.photoCard, { height: item.height }]} onPress={() => router.push('/pages/culture/museumScreen')}>
                    <Image source={{ uri: item.img }} style={styles.photoImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
              {/* Sağ Sütun */}
              <View style={styles.column}>
                {photoContestRight.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.photoCard, { height: item.height }]} onPress={() => router.push('/pages/culture/museumScreen')}>
                    <Image source={{ uri: item.img }} style={styles.photoImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 4. KÜLTÜR YAYINLARI (E-Kitaplar) */}
        {eBooks.length > 0 && (
          <View style={[styles.section, { paddingBottom: 40 }]}>



            <View style={styles.contestHeader}>
              <TouchableOpacity style={{ paddingHorizontal: 20, marginBottom: 12 }} onPress={() => router.push('/pages/culture/libraScreen')}>
                <Text style={styles.contestTitle}>Kültür Yayınları</Text>
                <Text style={styles.contestSub}>Dijital kütüphanemizi keşfedin</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/pages/culture/libraScreen')}>
                <Text style={styles.seeAll}>Tümü</Text>
              </TouchableOpacity>
            </View>


            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.booksScroll}>
              {eBooks.map((book) => (
                <View key={book.id} style={styles.bookContainer}>
                  <TouchableOpacity style={styles.bookCover} activeOpacity={0.8} onPress={() => router.push('/pages/culture/libraScreen')}>
                    {book.customIcon ? (
                      <View style={styles.customCover}>
                        <BookOpen size={32} color="white" />
                        <Text style={styles.customCoverText}>{book.title}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: book.cover || '' }} style={styles.coverImage} />
                    )}

                    <View style={styles.downloadBadge}>
                      <Download size={14} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.bookIssue}>{book.issue}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 40,
  },

  // Section Common
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // Poem Card
  poemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(19, 200, 236, 0.05)',
  },
  poemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  poemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
  poemBody: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  poemLine: {
    width: 3,
    backgroundColor: 'rgba(19, 200, 236, 0.3)',
    marginRight: 16,
    borderRadius: 2,
  },
  poemText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  poemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  authorTitle: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Outline Button
  outlineBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 30, // Pill shape
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // Photo Contest
  contestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  contestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  contestSub: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  photoCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },

  // Books
  booksScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  bookContainer: {
    width: 140,
    gap: 8,
  },
  bookCover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  customCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  customCoverText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  downloadBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  bookIssue: {
    fontSize: 11,
    color: COLORS.textGray,
  },
});