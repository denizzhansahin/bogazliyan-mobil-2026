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
  Linking,
  ActivityIndicator,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  Phone,
  MessageCircle,
  Navigation,
  Clock,
  CreditCard,
  Snowflake,
  MapPin,
  Star,
  CarTaxiFront,
  CheckCircle2,
  Wifi,
  Accessibility,
  Luggage,
  ShieldCheck,
  Share2
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
  primary: '#FFD60A', // Taksi Sarısı
  dark: '#111827',
  white: '#ffffff',
  bg: '#f9fafb',
  textGray: '#6b7280',
  green: '#22c55e',
  red: '#ef4444',
  border: '#e5e7eb',
  cardBg: '#f3f4f6'
};

// --- TİP TANIMI ---
interface Driver {
  name: string;
  status: string;
  image: string;
}

interface TaxiDetail {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  address: string;
  district: string;
  image: string;
  phone: string;
  whatsapp: string;
  locationLink: string;
  features: string[];
  drivers: Driver[];
}

export default function TaxiDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

    useEffect(() => {
              if (!id) return;
                trackEvent('taxi_detail_view', {
                  item_id: id,
                  item_type: 'taxi_detail',
                });
          
            }, [id]);

  const [taxi, setTaxi] = useState<TaxiDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxiDetail();
  }, [id]);

  const fetchTaxiDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('taxi_stands')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Parse JSONB fields
        let feats: string[] = [];
        if (data.features) {
          // @ts-ignore
          if (Array.isArray(data.features)) feats = data.features;
          // @ts-ignore
          else if (typeof data.features === 'string') feats = JSON.parse(data.features);
        }

        let driverList: Driver[] = [];
        if (data.drivers) {
          // @ts-ignore
          if (Array.isArray(data.drivers)) driverList = data.drivers;
          // @ts-ignore
          else if (typeof data.drivers === 'string') driverList = JSON.parse(data.drivers);
        }

        const formattedTaxi: TaxiDetail = {
          id: data.id,
          name: data.name,
          rating: data.rating || 5.0,
          reviewCount: data.review_count || 0,
          isOpen: data.is_open,
          address: data.address || 'Adres bilgisi yok',
          district: data.district || 'Boğazlıyan, Yozgat',
          image: data.image_url || "",
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          locationLink: data.location_link || '',
          features: feats,
          drivers: driverList
        };

        setTaxi(formattedTaxi);
      }
    } catch (error) {
      console.error('Taksi detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to map feature text to icon
  const getFeatureIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('7/24') || lower.includes('açık') || lower.includes('saat')) return Clock;
    if (lower.includes('kart') || lower.includes('kredi')) return CreditCard;
    if (lower.includes('klima')) return Snowflake;
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('engelli') || lower.includes('sandalye')) return Accessibility;
    if (lower.includes('bagaj') || lower.includes('yük')) return Luggage;
    if (lower.includes('güvenli')) return ShieldCheck;
    return CheckCircle2; // Default
  };

  // Aksiyonlar
  const handleCall = () => {
    if (taxi?.phone) Linking.openURL(`tel:${taxi.phone}`);
    else alert("Telefon numarası bulunamadı.");
  };

  const handleWhatsapp = () => {
    if (taxi?.whatsapp) Linking.openURL(`https://wa.me/${taxi.whatsapp}`);
    else alert("WhatsApp numarası bulunamadı.");
  };

  const handleMap = () => {
    if (taxi?.locationLink) Linking.openURL(taxi.locationLink);
    else alert("Konum bilgisi bulunamadı.");
  };


  const handleShare = async () => {
    if (!taxi) return;
    try {
      await Share.share({
        message: `${taxi.name} - ${taxi.address} - ${taxi.phone}  \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.dark} />
      </View>
    );
  }

  if (!taxi) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Durak bulunamadı.</Text>
      </View>
    );
  }

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 1. HEADER IMAGE & NAVBAR */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: taxi.image }} style={styles.headerImage} contentFit="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn} onPress={handleShare}>
            <Share2 size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Hero Content (Bottom Left) */}
        <View style={styles.heroContent}>
          <View style={styles.statusRow}>
            <View style={[styles.badge, { backgroundColor: taxi.isOpen ? COLORS.green : COLORS.red }]}>
              <Text style={styles.badgeText}>{taxi.isOpen ? 'AÇIK' : 'KAPALI'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={14} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={styles.ratingText}>{taxi.rating} ({taxi.reviewCount})</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{taxi.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationText}>{taxi.address}</Text>
          </View>
        </View>
      </View>

      {/* 2. MAIN CONTENT (Sheet) */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Quick Action Buttons */}
        <View style={styles.actionGrid}>
          {/* Hemen Ara */}
          <TouchableOpacity style={styles.mainActionBtn} onPress={handleCall}>
            <View style={styles.iconCircleBlack}>
              <Phone size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.mainActionText}>Hemen Ara</Text>
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleWhatsapp}>
            <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
              <MessageCircle size={24} color="#16a34a" />
            </View>
            <Text style={styles.secondaryActionText}>WhatsApp</Text>
          </TouchableOpacity>

          {/* Yol Tarifi */}
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleMap}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <Navigation size={24} color="#2563eb" />
            </View>
            <Text style={styles.secondaryActionText}>Yol Tarifi</Text>
          </TouchableOpacity>
        </View>
        {/* taxi-detail-1 */}

        {/* Özellikler (Yatay Scroll) */}
        {taxi.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Özellikler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
              {taxi.features.map((feature, idx) => {
                const Icon = getFeatureIcon(feature);
                return (
                  <View key={idx} style={styles.featureChip}>
                    <Icon size={18} color={COLORS.dark} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Konum (Harita Görseli) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Konum</Text>
            <TouchableOpacity onPress={handleMap}>
              <Text style={{ color: '#ca8a04', fontWeight: 'bold', fontSize: 12 }}>Haritada Gör</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapCard}>
            {/* Statik Harita Görseli */}
            <Image
              source={require("../../assets/images/harita.jpg")}
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapPin}>
                <CarTaxiFront size={20} color="black" />
              </View>
            </View>
            <View style={styles.mapFooter}>
              <MapPin size={20} color={COLORS.textGray} />
              <View>
                <Text style={styles.mapAddress} numberOfLines={1}>{taxi.address}</Text>
                <Text style={styles.mapDistrict}>{taxi.district}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Müsait Sürücüler */}
        {taxi.drivers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sürücüler</Text>
            <View style={styles.driversList}>
              {taxi.drivers.map((driver, index) => (
                <View key={index} style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Image source={{ uri: driver.image }} style={styles.driverAvatar} />
                    <View>
                      <Text style={styles.driverName}>{driver.name}</Text>
                      <View style={styles.driverStatusRow}>
                        <View style={[styles.statusDot, { backgroundColor: driver.status === 'Müsait' ? COLORS.green : '#eab308' }]} />
                        <Text style={[styles.driverStatusText, { color: driver.status === 'Müsait' ? COLORS.green : '#ca8a04' }]}>
                          {driver.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callDriverBtn} onPress={handleCall}>
                    <Phone size={20} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
 {/* taxi-detail-2 */}
      </ScrollView>

      {/* 3. STICKY BOTTOM BUTTON */}
      <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
        <TouchableOpacity style={styles.stickyBtn} onPress={handleCall}>
          <Phone size={20} color={COLORS.dark} fill={COLORS.dark} />
          <Text style={styles.stickyBtnText}>Taksi'yi Ara</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  headerContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  navbar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },

  // Content Sheet
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  // Actions Grid
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  mainActionBtn: {
    flex: 1.2,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  iconCircleBlack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  featuresScroll: {
    gap: 10,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },

  // Map Card
  mapCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  mapImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#e5e7eb',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 60,
  },
  mapPin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  mapAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  mapDistrict: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  // Drivers
  driversList: {
    gap: 12,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  driverName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  driverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  driverStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  callDriverBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sticky Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  stickyBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  stickyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
});