import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Star, 
  LayoutGrid, 
  Castle, 
  Trees, 
  Tent, 
  Bookmark, 
  History, 
  Navigation, 
  Users, 
  MapPin, 
  ArrowRight,
  Map,
  Share2,
  X
} from 'lucide-react-native';

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
  textGray: '#618389',
  border: '#e2e8f0',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
  cardBg: '#ffffff',
};

// --- TİP TANIMI ---
interface Place {
  id: string;
  title: string;
  desc: string;
  category: string; // 'history' | 'nature' | 'village'
  dateLabel?: string;
  population?: number;
  img: string;
  locationLink: string;
  yer: string;
  longDesc: string;
}

// Filtre ID'leri veritabanındaki kategorilerle eşleşmeli veya manuel eşleştirmeliyiz
const FILTERS = [
  { id: 'all', label: 'Tümü', icon: LayoutGrid },
  { id: 'history', label: 'Tarihi Yapılar', icon: Castle },
  { id: 'nature', label: 'Doğa', icon: Trees },
  { id: 'village', label: 'Köyler', icon: Tent }, // DB'de 'village' olarak kayıtlı
];


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function PlacesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // Component içine (PlacesScreen) eklenecek state'ler:
const [modalVisible, setModalVisible] = useState(false);
const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

const openModal = (item: Place) => {
    setSelectedPlace(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPlace(null);
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('culture_places')
        .select('*');

      if (error) throw error;

      if (data) {
        const formattedData: Place[] = data.map(item => ({
          id: item.id,
          title: item.title,
          desc: item.description || '',
          category: item.category,
          dateLabel: item.date_label || '',
          population: item.population || 0,
          img: item.image_url || "",
          locationLink: item.location_link || '',
          yer : item.yer || "",
          longDesc : item.longDesc || ""
        }));
        setPlaces(formattedData);
      }
    } catch (error) {
      console.error('Yerler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMap = (link: string) => {
    if (link) Linking.openURL(link);
    else alert("Konum bilgisi bulunamadı.");
  };

  // --- FİLTRELEME MANTIĞI ---
  const { listItems, gridItems, showList, showGrid, sectionTitle } = useMemo(() => {
    let listData: Place[] = [];
    let gridData: Place[] = [];
    let sTitle = "Gezilecek Yerler";

    // Veriyi kategorilere ayır
    const history = places.filter(p => p.category === 'history');
    const nature = places.filter(p => p.category === 'nature');
    const villages = places.filter(p => p.category === 'village');

    if (activeFilter === 'all') {
      listData = [...history, ...nature]; // Liste kısmında Tarih ve Doğa
      gridData = villages;               // Grid kısmında Köyler
      sTitle = "Tarihi ve Doğal Güzellikler";
    } else if (activeFilter === 'history') {
      listData = history;
      gridData = [];
      sTitle = "Tarihi Yapılar";
    } else if (activeFilter === 'nature') {
      listData = nature;
      gridData = [];
      sTitle = "Doğal Güzellikler";
    } else if (activeFilter === 'village') {
      listData = [];
      gridData = villages;
      // Köy başlığı aşağıda grid bölümünde zaten var
    }

    return {
      listItems: listData,
      gridItems: gridData,
      showList: listData.length > 0,
      showGrid: gridData.length > 0 || activeFilter === 'village', // Filtre köyse grid boş olsa bile bölüm görünsün
      sectionTitle: sTitle
    };
  }, [activeFilter, places]);


    const handleShare = async (item:Place) => {
        if (!item) return;
        try {
          await Share.share({
            message: `${item.title} - ${item.yer} - ${item.category} - ${item.desc} - ${item.locationLink}   \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
          });
        } catch (error) {
          console.log(error);
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
      <View style={{ backgroundColor: COLORS.white }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gezilecek Yerler & Tarih</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* 2. HERO SECTION */}
        <View style={styles.heroContainer}>
          <Image 
            source={require("../../../assets/images/logo_1024.png")} 
            style={styles.heroImage} 
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          >
            <View style={styles.badgeContainer}>
              <Star size={12} color="white" fill="white" />
              <Text style={styles.badgeText}>Hoş Geldiniz</Text>
            </View>
            <Text style={styles.heroTitle}>Boğazlıyan'ı Keşfet</Text>
            <Text style={styles.heroSubtitle}>Anadolu'nun kalbinde tarih ve doğanın buluştuğu eşsiz durak.</Text>
          </LinearGradient>
        </View>

        {/* 3. FILTERS */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const Icon = filter.icon;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.id)}
                >
                  <Icon size={16} color={isActive ? 'white' : COLORS.textGray} />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. LIST SECTION (Historical & Nature) */}
        {showList && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            </View>

            <View style={styles.listContainer}>
              {listItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.card} onPress={() => openModal(item)}>
                  <TouchableOpacity style={styles.cardImageWrapper} onPress={() => openModal(item)}>
                    <Image source={{ uri: item.img }} style={styles.cardImage} />
                    <View style={styles.bookmarkBadge}>
                      <Share2 size={18} color={COLORS.primary} onPress={()=>{handleShare(item)}} />
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {item.dateLabel ? (
                        <View style={styles.dateBadge}>
                          <History size={12} color={COLORS.amber} />
                          <Text style={styles.dateText}>{item.dateLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.distRow}>
                        <Navigation size={16} color={COLORS.primary} />
                        <Text style={styles.distText}>{item.yer}</Text>
                      </View>
                      <TouchableOpacity style={styles.navBtn} onPress={() => handleMap(item.locationLink)}>
                        <Map size={16} color="white" />
                        <Text style={styles.navBtnText}>Yol Tarifi Al</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 5. GRID SECTION (Villages) */}
        {showGrid && (
          <View style={[styles.section, { paddingBottom: 40 }]}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Köy Tanıtımları</Text>
              <Text style={styles.sectionSubtitle}>İlçemize bağlı köyleri keşfedin</Text>
            </View>

            <View style={styles.gridContainer}>
              {gridItems.length > 0 ? gridItems.map((village) => (
                <TouchableOpacity key={village.id} style={styles.gridCard} activeOpacity={0.9} onPress={() => openModal(village)}>
                  <View style={styles.gridImageWrapper}>
                    <Image source={{ uri: village.img }} style={styles.gridImage} />
                    {village.population ? (
                        <View style={styles.popBadge}>
                            <Users size={10} color="white" />
                            <Text style={styles.popText}>{village.population}</Text>
                        </View>
                    ) : null}
                  </View>
                  
                  <Text style={styles.gridTitle} numberOfLines={1}>{village.title}</Text>
                  
                  <View style={styles.gridFooter}>
                    <View style={styles.gridDist}>
                      <MapPin size={12} color={COLORS.textGray} />
                      <Text style={styles.gridDistText}>{village.yer}</Text>
                    </View>
                    <View style={styles.arrowCircle}>
                      <ArrowRight size={12} color={COLORS.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <Text style={{ marginLeft: 16, color: COLORS.textGray }}>Bu kategoride kayıt bulunamadı.</Text>
              )}
            </View>
          </View>
        )}

      </ScrollView>


      {/* --- DETAY MODALI --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            {/* Modal Header Image */}
            <View style={styles.modalImageWrapper}>
              <Image 
                source={{ uri: selectedPlace?.img }} 
                style={styles.modalImage} 
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.modalGradient}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={[styles.modalContent,{paddingBottom: insets.bottom}]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPlace?.title}</Text>
                  <View style={styles.modalBadgeRow}>
                     {/* Kategori Badge */}
                    <View style={styles.modalBadge}>
                        <Text style={styles.modalBadgeText}>
                          {selectedPlace?.category === 'history' ? 'Tarihi Yapı' : 
                           selectedPlace?.category === 'nature' ? 'Doğal Güzellik' : 'Köy'}
                        </Text>
                    </View>
                    {/* Konum Badge */}
                    <View style={[styles.modalBadge, {backgroundColor: COLORS.bg}]}>
                        <MapPin size={12} color={COLORS.textGray} />
                        <Text style={[styles.modalBadgeText, {color: COLORS.textGray}]}>{selectedPlace?.yer}</Text>
                    </View>
                  </View>
                </View>
       

                {/* Uzun Açıklama (yoksa kısayı gösterir) */}
                <Text style={styles.modalDesc}>
                  {selectedPlace?.longDesc || selectedPlace?.desc}
                </Text>
                
              </ScrollView>

              {/* ACTION BUTTONS FOOTER */}
              <View style={[styles.modalFooter,{paddingBottom: insets.bottom}]}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.shareBtn]} 
                  onPress={() => {
                    if(selectedPlace) handleShare(selectedPlace); // Senin share fonksiyonun
                  }}
                >
                  <Share2 size={20} color={COLORS.primary} />
                  <Text style={styles.shareBtnText}>Paylaş</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtn, styles.locationBtn]} 
                  onPress={() => {
                    if(selectedPlace) handleMap(selectedPlace.locationLink); // Senin map fonksiyonun
                  }}
                >
                  <Map size={20} color="#fff" />
                  <Text style={styles.locationBtnText}>Konuma Git</Text>
                </TouchableOpacity>
              </View>

            </View>
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
   // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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

  content: {
    paddingBottom: 40,
  },

  // HERO
  heroContainer: {
    width: '100%',
    aspectRatio: 16/9,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 200, 236, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },

  // FILTERS
  filterContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  filterTextActive: {
    color: 'white',
  },

  // SECTION
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // CARD (History)
  listContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 20,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.amber,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distText: {
    fontSize: 13,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  navBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // GRID (Villages)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: (width - 32 - 12) / 2, // 2 Sütun
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  popBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridDist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridDistText: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // View All Card
  viewAllCard: {
    width: (width - 32 - 12) / 2,
    aspectRatio: 0.85,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  viewAllIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 18,
  },




  // ... mevcut stillerin sonuna ekle:
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Alttan açılması için
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    height: '90%', // Ekranın %90'ını kaplar
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalImageWrapper: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    position: 'relative', // Footer için
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '20', // Opak primary
    borderRadius: 8,
    gap: 4,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // MODAL FOOTER (BUTONLAR)
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16, // iPhone alt çubuğu için
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  locationBtn: {
    backgroundColor: COLORS.primary,
  },
  locationBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
});