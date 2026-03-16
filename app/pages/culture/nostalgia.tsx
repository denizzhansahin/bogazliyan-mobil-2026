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
  Linking,
  PanResponder,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Code2,
  Camera,
  Plus,
  X
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

const { width } = Dimensions.get('window');



// ... Bileşen içi ...


// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#618389',
  border: '#e5e7eb',
};

// --- TİP TANIMLARI ---
interface ComparisonItem {
  title: string;
  subtitle: string;
  yearBefore: string;
  yearAfter: string;
  imgBefore: string;
  imgAfter: string;
}

interface GalleryItem {
  id: string;
  title: string;
  year: string;
  img: string;
  height: number;
}


interface GalleryItem1 {
  id: string;
  title: string;
  year: string;
  img: string;
  height: number;
  subtitle: string;
  yearBefore: string;
  yearAfter: string;
  imgBefore: string;
  imgAfter: string;
}

const openLink = async (url: string) => {
  try {

    await Linking.openURL(url);

  } catch (err) {
    console.error('Link hatası:', err);
  }
};

const FILTERS = ['Tümü'];//, "1960'lar", "1970'ler", "1980'ler", "1990'lar"

export default function NostalgiaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem1 | null>(null); // <-- EKLENDİ

  const[kontrolAfter, setKontrolAfter] = useState(false)


  const [comparisonData, setComparisonData] = useState<ComparisonItem | null>(null);

  // Ham veri ve filtrelenmiş sütunlar
  const [allGalleryItems, setAllGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLeft, setGalleryLeft] = useState<GalleryItem[]>([]);
  const [galleryRight, setGalleryRight] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetchNostalgiaData();
  }, []);

  // Filtre değiştiğinde listeyi yeniden düzenle
  useEffect(() => {
    filterAndDistributeItems();
  }, [activeFilter, allGalleryItems]);

  const fetchNostalgiaData = async () => {
    try {
      setLoading(true);

      // 1. Karşılaştırma Verisi
      const { data: compData } = await supabase
        .from('culture_nostalgia')
        .select('*')
        .eq('type', 'comparison')
        .limit(1);

      if (compData && compData.length > 0) {
        const item = compData[0];
        setComparisonData({
          title: item.title,
          subtitle: 'Değişimi görmek için görsellere tıklayın',
          yearBefore: item.beforeYear,
          yearAfter: item.afterYear,
          imgBefore: item.beforeUrlImg,
          imgAfter: item.afterUrlImg
        });
      }

      // 2. Galeri Verisi (Hepsini Çek)
      const { data: galleryData } = await supabase
        .from('culture_nostalgia')
        .select('*')
        .eq('type', 'gallery');

      if (galleryData) {
        const items = galleryData.map((item, index) => ({
          id: item.id,
          title: item.title,
          year: item.beforeYear,
          img: item.beforeUrlImg,
          height: index % 3 === 0 ? 200 : 240 // Rastgele yükseklik
        }));
        setAllGalleryItems(items);
      }

    } catch (error) {
      console.error('Nostalji verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndDistributeItems = () => {
    let filtered = allGalleryItems;

    if (activeFilter !== 'Tümü') {
      // "1960'lar" -> "196" prefix araması
      const decadePrefix = activeFilter.substring(0, 3);
      filtered = allGalleryItems.filter(item => item.year.startsWith(decadePrefix));
    }

    const left: GalleryItem[] = [];
    const right: GalleryItem[] = [];

    filtered.forEach((item, index) => {
      if (index % 2 === 0) left.push(item);
      else right.push(item);
    });

    setGalleryLeft(left);
    setGalleryRight(right);
  };

  const renderGalleryItem = (item: GalleryItem) => (
    <TouchableOpacity key={item.id} style={[styles.galleryItem, { height: item.height }]} activeOpacity={0.9} onPress={() => setSelectedImage(item)}>
      <Image source={{ uri: item.img }} style={styles.galleryImage} contentFit="cover" />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.galleryGradient}
      >
        <Text style={styles.galleryTitle}>{item.title}</Text>
      </LinearGradient>

      <View style={styles.yearBadge}>
        <Text style={styles.yearText}>{item.year}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          {/* reklam */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => {setSelectedImage(null), setKontrolAfter(false)}}
          >
            <X size={30} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.modalContent}>

              <Image
                source={{ uri: selectedImage.img || (kontrolAfter ? selectedImage.imgAfter : selectedImage.imgBefore) }}
                style={styles.modalImage}
                contentFit="contain" // Görüntü oranını koruyarak sığdırır
              />
              <View style={[styles.modalFooter,{paddingBottom: insets.bottom}]}>
                <Text style={styles.modalTitle}>{selectedImage.title}</Text>
                <Text style={styles.modalYear}>{selectedImage.year || (kontrolAfter ? selectedImage.yearAfter : selectedImage.yearBefore)}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: 'white' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eski Boğazlıyan Fotoğrafları</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
{/* reklam */}
      {/* 2. FILTERS */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 3. ZAMAN YOLCULUĞU (Sadece "Tümü" seçiliyken gösterelim veya her zaman kalsın mı? Genelde her zaman kalır) */}
        {comparisonData && activeFilter === 'Tümü' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zaman Yolculuğu</Text>

            <View style={styles.comparisonCard}>
              {/* After Image */}
              <TouchableOpacity style={styles.imageWrapperFull} onPress={() => {
                
                setSelectedImage(comparisonData),
                setKontrolAfter(true)
              }
                
                }>
                <Image source={{ uri: comparisonData.imgAfter }} style={styles.compImage} />
                <View style={styles.labelContainerRight}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelText}>{comparisonData.yearAfter}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Before Image (Clipped) */}
              <TouchableOpacity style={[styles.imageWrapperClipped, { width: '50%' }]} onPress={() => setSelectedImage(comparisonData)}>
                <Image
                  source={{ uri: comparisonData.imgBefore }}
                  style={[styles.compImage, { width: width - 32 }]}
                  contentFit="cover"
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', mixBlendMode: 'saturation' }]} />

                <View style={styles.labelContainerLeft}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelText}>{comparisonData.yearBefore}</Text>
                  </View>
                </View>

                <View style={styles.sliderLine} />
              </TouchableOpacity>




              {/* Slider Handle */}
              <View style={[styles.sliderHandle, { left: '50%' }]}>
                <Code2 size={20} color={COLORS.primary} strokeWidth={3} />
              </View>

              <View style={styles.compFooter}>
                <Text style={styles.compTitle}>{comparisonData.title}</Text>
                <Text style={styles.compSubtitle}>{comparisonData.subtitle}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. GALERİ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'Tümü' ? 'Galeri' : `${activeFilter} Galerisi`}
          </Text>

          {(galleryLeft.length > 0 || galleryRight.length > 0) ? (
            <>
              <View style={styles.masonryContainer}>
                <View style={styles.masonryColumn}>
                  {galleryLeft.map(renderGalleryItem)}
                </View>
                <View style={styles.masonryColumn}>
                  {galleryRight.map(renderGalleryItem)}
                </View>
              </View>

              <Text style={styles.endText}>
                {activeFilter === 'Tümü' ? 'Tüm fotoğrafları görüntülediniz' : `Bu dönemden başka fotoğraf yok`}
              </Text>
            </>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textGray }}>Bu dönem için fotoğraf bulunamadı.</Text>
            </View>
          )}
        </View>
{/* reklam */}
      </ScrollView>

      {/* 5. FAB */}
      <TouchableOpacity style={[styles.fab,{paddingBottom: insets.bottom}]} activeOpacity={0.9} onPress={() => openLink('https://bogazliyan.linksphere.tr/iletişim')}>
        <Camera size={24} color="white" />
        <Text style={styles.fabText}>Anı Paylaş</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // FILTERS
  filterContainer: {
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  filterTextActive: {
    color: 'white',
  },

  content: {
    paddingBottom: 100, // FAB alanı için
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },

  // TIME TRAVEL (Comparison)
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapperFull: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  imageWrapperClipped: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 250,
    overflow: 'hidden',
    zIndex: 2,
  },
  compImage: {
    width: '100%',
    height: '100%',
  },
  sliderLine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderHandle: {
    position: 'absolute',
    top: 125 - 18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  labelContainerLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  labelContainerRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  labelBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backdropFilter: 'blur(4px)',
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compFooter: {
    padding: 16,
  },
  compTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  compSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // GALLERY (Masonry)
  masonryContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 16,
  },
  galleryItem: {
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16, // Alt boşluk
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  galleryTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  yearBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  endText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 24,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 34,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },



  // MODAL STYLES
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Koyu arka plan
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: '70%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalYear: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});