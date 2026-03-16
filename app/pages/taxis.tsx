import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  Navigation,
  Star,
  MapPin,
  CarTaxiFront,
  Plus
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- RENKLER ---
const COLORS = {
  taxiYellow: '#FFD60A', // Arka plan sarısı
  primary: '#0db9f2',    // Mavi buton rengi
  dark: '#111618',       // Koyu metin/buton
  white: '#ffffff',
  green: '#22c55e',
  red: '#ef4444',
  gray: '#9ca3af',
  slate: '#f1f5f9',
};

// --- TİP TANIMI ---
interface TaxiStandUI {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  isOpen: boolean;
  phone: string;
  image: string;
  locationLink: string;
}

export default function TaxisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [taxiStands, setTaxiStands] = useState<TaxiStandUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxiStands();
  }, []);

  const fetchTaxiStands = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('taxi_stands')
        .select('*')
        .order('rating', { ascending: false }); // Puana göre sırala

      if (error) throw error;

      if (data) {
        const formattedData: TaxiStandUI[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          rating: item.rating || 5.0,
          reviewCount: item.review_count || 0,
          address: item.address || 'Adres bilgisi yok',
          isOpen: item.is_open,
          phone: item.phone || '',
          image: item.image_url || "",
          locationLink: item.location_link || ''
        }));
        setTaxiStands(formattedData);
      }
    } catch (error) {
      console.error('Taksi durakları çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else alert("Telefon numarası bulunamadı.");
  };

  const handleMap = (link: string) => {
    if (link) Linking.openURL(link);
    else alert("Konum bilgisi bulunamadı.");
  };

  // --- KART BİLEŞENİ ---
  const renderTaxiCard = ({ item }: { item: TaxiStandUI }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.card}
      onPress={() => router.push({
        pathname: '/pages/taxi-detail',
        params: { id: item.id }
      })}
    >
      {/* Kart Görseli */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={[styles.cardImage, !item.isOpen && { opacity: 0.6 }]}
          contentFit="cover"
        />
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.isOpen ? COLORS.green : COLORS.red }]} />
          <Text style={[styles.statusText, { color: item.isOpen ? '#15803d' : '#b91c1c' }]}>
            {item.isOpen ? 'Şu an Açık' : 'Kapalı'}
          </Text>
        </View>
      </View>

      {/* Kart İçeriği */}
      <View style={styles.cardContent}>
        {/* Başlık ve İkon */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={16} color="#eab308" fill="#eab308" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount})</Text>
            </View>
          </View>
          <View style={styles.iconCircle}>
            <CarTaxiFront size={24} color="#4b5563" />
          </View>
        </View>

        {/* Adres */}
        <View style={styles.addressRow}>
          <MapPin size={18} color="#4b5563" />
          <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
        </View>

        {/* Aksiyon Butonları */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, !item.isOpen && styles.btnDisabled]}
            onPress={() => item.isOpen && handleCall(item.phone)}
            disabled={!item.isOpen}
          >
            <Phone size={18} color={item.isOpen ? COLORS.dark : '#9ca3af'} />
            <Text style={[styles.btnTextPrimary, !item.isOpen && { color: '#9ca3af' }]}>Ara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => handleMap(item.locationLink)}
          >
            <Navigation size={18} color={COLORS.dark} />
            <Text style={styles.btnTextSecondary}>Yol Tarifi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.taxiYellow} />


      {/* 1. HEADER */}
      <View style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Taksi Durakları</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* taxis-1 */}
      {/* 2. LİSTE */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.dark} />
        </View>
      ) : (
        <FlatList
          data={taxiStands}
          keyExtractor={(item) => item.id}
          renderItem={renderTaxiCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: COLORS.dark }}>Kayıtlı taksi durağı bulunamadı.</Text>
            </View>
          }
        />
      )}


      {/* 3. FLOAT ACTION BUTTON */}
      <View style={[styles.fabContainer, { paddingBottom: insets.bottom }]}>
        {/* taxis-2 */}

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => {
            const openTaxis = taxiStands.filter(t => t.isOpen);

            if (openTaxis.length > 0) {
              // 2. Açık taksiler arasından rastgele bir index seç
              const randomIndex = Math.floor(Math.random() * openTaxis.length);
              const selectedTaxi = openTaxis[randomIndex];

              // 3. Seçilen taksiyi ara
              handleCall(selectedTaxi.phone);
            } else {
              alert("Şu an açık taksi durağı bulunamadı.");
            }
          }}
        >
          <Plus size={24} color={COLORS.primary} />
          <Text style={styles.fabText}>Rastgele - En Yakın Taksi Çağır</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.taxiYellow, // Tüm sayfa sarı
  },

  // Header
  headerSafe: {
    backgroundColor: COLORS.taxiYellow,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 10,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100, // FAB için boşluk
    gap: 20,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    height: 180,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backdropFilter: 'blur(4px)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Card Content
  cardContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },

  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnSecondary: {
    backgroundColor: COLORS.slate,
  },
  btnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  btnTextSecondary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fab: {
    width: '100%',
    maxWidth: 480,
    height: 56,
    backgroundColor: COLORS.dark,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});