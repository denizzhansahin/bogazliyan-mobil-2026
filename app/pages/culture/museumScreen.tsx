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
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  X,
  Info,
  MapPin
} from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';

const { width, height } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  overlay: 'rgba(0, 0, 0, 0.9)', // Modal arka planı için koyu renk
};

// --- TİP TANIMI ---
interface MuseumItem {
  id: string;
  title: string;
  description: string;
  img: string;
  location?: string;
  height: number; // Masonry düzeni için rastgele yükseklik
}

export default function MuseumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State'ler
  const [items, setItems] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MuseumItem | null>(null);

  // Sütunlar için veriyi ayırma
  const [leftColumn, setLeftColumn] = useState<MuseumItem[]>([]);
  const [rightColumn, setRightColumn] = useState<MuseumItem[]>([]);

  useEffect(() => {
    fetchMuseumItems();
  }, []);

  const fetchMuseumItems = async () => {
    try {
      setLoading(true);
      // 'photo_contest' tipini Müze verisi olarak çekiyoruz
      const { data, error } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'photo_contest')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: MuseumItem[] = data.map((item, index) => ({
          id: item.id,
          title: item.title || 'İsimsiz Eser',
          description: item.content || 'Bu eser hakkında detaylı bilgi bulunmuyor.',
          img: item.image_url || "",
          location: item.subtitle || 'Bilgi yok.',
          height: index % 3 === 0 ? 260 : 180, // Dinamik yükseklik
        }));

        setItems(formattedData);

        // Masonry Layout için veriyi ikiye böl
        const left: MuseumItem[] = [];
        const right: MuseumItem[] = [];
        formattedData.forEach((item, index) => {
          if (index % 2 === 0) left.push(item);
          else right.push(item);
        });
        setLeftColumn(left);
        setRightColumn(right);
      }
    } catch (error) {
      console.error('Müze verileri çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- MODAL İŞLEMLERİ ---
  const openModal = (item: MuseumItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleShare = async () => {
    if (!selectedItem) return;
    try {
      await Share.share({
        message: `🏛️ *${selectedItem.title}*\n\n${selectedItem.description}\n\n📍 ${selectedItem.location}\n\n📲 Boğazlıyan Mobil ile tarihi keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Kaymakam Kemal Bey</Text>
            <Text style={styles.headerSub}>Tarihi Mirasımız</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {/* 2. MASONRY GRID GALERİ */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.masonryContainer}>
            {/* Sol Sütun */}
            <View style={styles.column}>
            {leftColumn.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={[styles.card, { height: item.height }]}
                    activeOpacity={0.9}
                    onPress={() => openModal(item)}
                >
                    <Image source={{ uri: item.img }} style={styles.cardImage} contentFit="cover" transition={500} />
                    <View style={styles.cardGradient} />
                    <Text style={styles.cardTitleInside} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
            ))}
            </View>

            {/* Sağ Sütun */}
            <View style={styles.column}>
            {rightColumn.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={[styles.card, { height: item.height }]}
                    activeOpacity={0.9}
                    onPress={() => openModal(item)}
                >
                    <Image source={{ uri: item.img }} style={styles.cardImage} contentFit="cover" transition={500} />
                    <View style={styles.cardGradient} />
                    <Text style={styles.cardTitleInside} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </View>
      </ScrollView>

      {/* --- 3. DETAY MODALI --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
            
            {/* Kapat Butonu (Sağ Üst) */}
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <X size={28} color="white" />
            </TouchableOpacity>

            {selectedItem && (
                <View style={styles.modalContent}>
                   
                    {/* Görsel */}
                    <View style={styles.modalImageContainer}>
                        <Image 
                            source={{ uri: selectedItem.img }} 
                            style={styles.modalImage} 
                            contentFit="contain" 
                        />
                    </View>
                    {/* Alt Bilgi Kartı */}
                    <View style={styles.modalFooter}>
                        <View style={styles.modalTextHeader}>
                            <View style={{flex: 1}}>
                                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                                <View style={styles.locationBadge}>
                                    <MapPin size={12} color={COLORS.textGray} />
                                    <Text style={styles.locationText}>{selectedItem.location}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.modalShareBtn} onPress={handleShare}>
                                <Share2 size={20} color={COLORS.dark} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={{maxHeight: 120}}>
                            <Text style={styles.modalDesc}>{selectedItem.description}</Text>
                        </ScrollView>
                        <View style={[styles.infoBadge,{paddingBottom: insets.bottom +15}]}>
                           <Info size={14} color={COLORS.primary} />
                           <Text style={styles.infoText}>Boğazlıyan</Text>
                        </View>
                        
                    </View>
                </View>
            )}
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
    borderBottomColor: '#e2e8f0',
    backgroundColor: COLORS.bg,
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

  // MASONRY LAYOUT
  scrollContent: {
    paddingVertical: 16,
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
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#cbd5e1',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardTitleInside: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
  },
  modalContent: {
    width: width,
    height: height,
    justifyContent: 'space-between',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: '100%',
  },
  
  // Modal Footer Card
  modalFooter: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: 200,
  },
  modalTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  modalShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  }
});