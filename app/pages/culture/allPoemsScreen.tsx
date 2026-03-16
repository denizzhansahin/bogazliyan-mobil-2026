import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator,
  Modal,
  Share,
  Platform,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Feather, 
  Share2, 
  X, 
  Quote,
  Copy
} from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase'; 
import { Database } from '../../../types/supabase'; // Gerekirse açarsın

const { width, height } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f8fafc', // Hafif kağıt rengi
  white: '#ffffff',
  dark: '#1e293b',
  textGray: '#64748b',
  border: '#e2e8f0',
  paper: '#fff1e6', // Şiir kağıdı tonu
};

// --- TİP TANIMI ---
interface Poem {
  id: string;
  title: string;
  content: string; // Şiirin tamamı
  author: string;
  authorTitle?: string;
  authorImg: string;
}



export default function AllPoemsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State'ler
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State'leri
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);

  useEffect(() => {
    fetchPoems();
  }, []);

  const fetchPoems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('culture_arts')
        .select('*')
        .eq('type', 'poem')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: Poem[] = data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content || '', 
          author: item.author || 'Bilinmiyor',
          authorTitle: item.subtitle || '',
          authorImg: item.image_url || "",
        }));
        setPoems(formattedData);
      }
    } catch (error) {
      console.error('Şiirler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- MODAL İŞLEMLERİ ---
  const openModal = (poem: Poem) => {
    setSelectedPoem(poem);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPoem(null);
  };

  // --- PAYLAŞMA FONKSİYONU ---
  const handleShare = async (poem: Poem) => {
    try {
      await Share.share({
        message: `📜 *${poem.title}*\n\n${poem.content}\n\n✒️ _${poem.author}_\n\n📲 Boğazlıyan Mobil ile keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
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
        <Text style={styles.headerTitle}>Şiir Antolojisi</Text>
        <View style={{ width: 40 }} />
      </View>

 
      {/* 2. LİSTE */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Duyguların Dili</Text>
          <Text style={styles.introSub}>İlçemizin şairlerinden seçme eserler.</Text>
        </View>

        <View style={styles.listContainer}>
          {poems.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => openModal(item)}
            >
              {/* Sol taraf: İkon veya Görsel */}
              <View style={styles.cardLeft}>
                <Image source={{ uri: item.authorImg }} style={styles.cardAuthorImg} />
              </View>

              {/* Orta: Bilgiler */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardAuthor}>{item.author}</Text>
                <Text style={styles.cardExcerpt} numberOfLines={2}>
                  {item.content.replace(/\n/g, ' ')}
                </Text>
              </View>

              {/* Sağ: Okuma İkonu */}
              <View style={styles.cardRight}>
                 <View style={styles.readIconBg}>
                    <Feather size={18} color={COLORS.primary} />
                 </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
     
       
      </ScrollView>

      {/* --- 3. ŞİİR OKUMA MODALI --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          {/* Arka planı bulanıklaştırmak veya karartmak için overlay */}
          <TouchableOpacity style={{flex:1}} onPress={closeModal} />
          
          <View style={styles.modalContainer}>
            {/* Kapat Butonu */}
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <X size={24} color={COLORS.textGray} />
            </TouchableOpacity>

            {/* Modal İçerik */}
            {selectedPoem && (
              <View style={{flex: 1}}>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Yazar Başlığı */}
                  <View style={styles.modalHeader}>
                    <Image source={{ uri: selectedPoem.authorImg }} style={styles.modalAuthorImg} />
                    <Text style={styles.modalAuthorName}>{selectedPoem.author}</Text>
                    {selectedPoem.authorTitle ? (
                       <Text style={styles.modalAuthorTitle}>{selectedPoem.authorTitle}</Text>
                    ) : null}
                  </View>

                  <View style={styles.divider} />

                  {/* Şiir Metni */}
                  <View style={styles.poemContainer}>
                    
                    
                    <Quote size={24} color={COLORS.primary} style={styles.quoteIcon} />
                    <Text style={styles.modalPoemTitle}>{selectedPoem.title}</Text>
                    <Text style={styles.modalPoemContent}>
                        {selectedPoem.content}
                    </Text>
                    <Quote size={24} color={COLORS.primary} style={[styles.quoteIcon, styles.quoteRight]} />
                  </View>
                 
                  
                </ScrollView>

                {/* Footer Aksiyonları */}
                <View style={[styles.modalFooter,{paddingBottom: insets.bottom}]}>
                  <TouchableOpacity 
                    style={styles.shareBtn} 
                    onPress={() => handleShare(selectedPoem)}
                  >
                    <Share2 size={20} color="white" />
                    <Text style={styles.shareBtnText}>Şiiri Paylaş</Text>
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
    borderBottomColor: '#f1f5f9',
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
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 40,
  },

  // INTRO
  introContainer: {
    padding: 20,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  introSub: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 4,
  },

  // LISTE
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardLeft: {
    marginRight: 12,
  },
  cardAuthorImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  cardAuthor: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardExcerpt: {
    fontSize: 12,
    color: COLORS.textGray,
    fontStyle: 'italic',
  },
  cardRight: {
    paddingLeft: 12,
  },
  readIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%', // Ekranın %92'si
    backgroundColor: '#fffcf7', // Eski kağıt havası
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  modalScrollContent: {
    paddingBottom: 100,
    paddingTop: 60,
  },
  
  // Modal Header
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalAuthorImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  modalAuthorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalAuthorTitle: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
    marginHorizontal: 40,
  },

  // Poem Text Area
  poemContainer: {
    paddingHorizontal: 30,
    position: 'relative',
  },
  quoteIcon: {
    opacity: 0.2,
    marginBottom: 10,
  },
  quoteRight: {
    alignSelf: 'flex-end',
    marginTop: 10,
    transform: [{ rotate: '180deg' }]
  },
  modalPoemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.dark,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalPoemContent: {
    fontSize: 16,
    lineHeight: 28,
    color: '#334155',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Footer
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fffcf7',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});