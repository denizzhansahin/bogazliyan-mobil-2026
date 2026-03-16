import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  Share,
  Linking,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  X,
  BookOpen,
  Download,
  FileText,
  Info
} from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';

const { width, height } = Dimensions.get('window');
const SPACING = 16;
// 2 Sütunlu yapı için genişlik hesabı
const CARD_WIDTH = (width - (SPACING * 3)) / 2; 

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  overlay: 'rgba(0, 0, 0, 0.8)',
  cardBorder: '#e2e8f0',
};

// --- TİP TANIMI ---
interface BookItem {
  id: string;
  title: string;
  subtitle: string; // Sayı, Basım Yılı vb.
  description: string;
  coverUrl: string | null;
  url: string; // location_link sütununu PDF linki olarak kullanacağız
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State'ler
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // 'book' tipini çekiyoruz
      const { data, error } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'book')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: BookItem[] = data.map(item => ({
          id: item.id,
          title: item.title || 'İsimsiz Yayın',
          subtitle: item.subtitle || 'Kültür Yayını',
          description: item.content || 'Bu yayın hakkında açıklama bulunmuyor.',
          coverUrl: item.image_url, 
          url: item.url || '', // PDF linki burada olmalı
        }));
        setBooks(formattedData);
      }
    } catch (error) {
      console.error('Kitaplar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FONKSİYONLAR ---
  const openModal = (book: BookItem) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
  };

  const handleRead = (url: string) => {
    if (url) {
      Linking.openURL(url);
    } else {
      alert("Bu yayının dijital bağlantısı bulunamadı.");
    }
  };

  const handleShare = async () => {
    if (!selectedBook) return;
    try {
      await Share.share({
        message: `📚 *${selectedBook.title}*\n\n${selectedBook.description}\n\nOkumak için: ${selectedBook.pdfUrl || 'Boğazlıyan Mobil uygulamasını indir! _\n\n📲 Boğazlıyan Mobil ile keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir'}`,
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
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Kültür Yayınları</Text>
            <Text style={styles.headerSub}>Dijital Kütüphane</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {/* 2. GRID LISTE */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {books.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.bookCard}
              activeOpacity={0.8}
              onPress={() => openModal(item)}
            >
              <View style={styles.coverWrapper}>
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={styles.coverImage} contentFit="cover" />
                ) : (
                  // Kapak resmi yoksa varsayılan görünüm
                  <View style={styles.defaultCover}>
                    <BookOpen size={40} color="white" />
                    <Text style={styles.defaultCoverText}>{item.title}</Text>
                  </View>
                )}
                
                {/* İndir/Oku Rozeti */}
                <View style={styles.cardBadge}>
                    <Download size={12} color="white" />
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- 3. DETAY MODALI --- */}
      <Modal
        animationType="slide" // Alttan gelsin
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={{flex:1}} onPress={closeModal} />
            
            <View style={styles.modalContainer}>
                {/* Tutamaç Çizgisi */}
                <View style={styles.dragIndicator} />
                
                {/* Kapat Butonu */}
                <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                    <X size={24} color={COLORS.dark} />
                </TouchableOpacity>

                {selectedBook && (
                    <View style={styles.modalContent}>
                      
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Üst Kısım: Kapak ve Başlık */}
                            <View style={styles.modalHeaderSection}>
                                <View style={styles.modalCoverWrapper}>
                                    {selectedBook.coverUrl ? (
                                        <Image source={{ uri: selectedBook.coverUrl }} style={styles.modalCover} contentFit="cover" />
                                    ) : (
                                        <View style={[styles.defaultCover, {width: '100%', height: '100%'}]}>
                                            <BookOpen size={60} color="white" />
                                        </View>
                                    )}
                                </View>
                                
                                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                                <Text style={styles.modalSubtitle}>{selectedBook.subtitle}</Text>
                            </View>
                            {/* Açıklama */}
                            <View style={styles.modalBody}>
                                <Text style={styles.sectionHeader}>Yayın Hakkında</Text>
                                <Text style={styles.modalDesc}>{selectedBook.description}</Text>
                            </View>
                        </ScrollView>

                        {/* Alt Butonlar */}
                        <View style={[styles.modalFooter,{paddingBottom: insets.bottom}]}>
                            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                                <Share2 size={22} color={COLORS.textGray} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.readBtn} 
                                onPress={() => handleRead(selectedBook.url)}
                            >
                                <FileText size={20} color="white" />
                                <Text style={styles.readBtnText}>Oku / İndir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // HEADER
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.bg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textGray,
    textAlign: 'center',
  },

  // GRID CONTENT
  scrollContent: {
    padding: SPACING,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING,
  },
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 2 / 3, // Kitap oranı
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  defaultCoverText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  cardBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textGray,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  
  // Modal Header
  modalHeaderSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalCoverWrapper: {
    width: 140,
    height: 210, // 2:3 oranı
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalCover: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Modal Body
  modalBody: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Footer için boşluk
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 24,
    color: '#334155',
  },

  // Modal Footer
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  readBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  readBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});