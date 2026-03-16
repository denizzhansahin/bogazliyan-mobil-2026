import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Linking,
  Dimensions,
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Calendar,
  Navigation,
  Phone,
  MapPin,
  Info,
  Pill,
  Share2
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

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

// --- RENK PALETİ ---
const COLORS = {
  primary: '#ee2b4b',
  primaryDark: '#c41c38',
  background: '#121212',
  cardBg: '#1c1c1e',
  textWhite: '#ffffff',
  textGray: '#9ca3af',
  success: '#4ade80',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

// --- TİP TANIMI ---
interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  isOpenNow: boolean;
  phone: string;
  locationUrl: string;
  dutyDate: string;
}

// ✅ DÜZELTME 1: Tarih hesaplama fonksiyonunu bu şekilde güncelle
// Bu yöntem, cihazın saat dilimi farkını hesaba katarak "Bugünün" tarihini ISO formatında (YYYY-MM-DD) verir.
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset(); // Dakika cinsinden fark (Örn: -180)
  // UTC zamanına ofset'i tersine ekleyerek yerel saati "UTC gibi" gösteriyoruz
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export default function PharmacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(null);
  const [nextPharmacies, setNextPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);


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
              .eq('place', 'pharmacy'), // ✅ FİLTRE: Sadece pharmacy sayfasındakiler
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
          console.error('Veriler çekilemedi - pharmacy:', error);
        } finally {
          console.log('passed');
        }
      };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);

      // ✅ DÜZELTME 2: Güncellenmiş fonksiyonu kullanıyoruz
      const todayStr = getLocalDateString();
      console.log("Sorgulanan Tarih:", todayStr); // Konsoldan kontrol edebilirsin

      // Bugünden itibaren olan nöbetçileri çek (Sıralı)
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .gte('duty_date', todayStr) // duty_date >= today
        .order('duty_date', { ascending: true })
        .limit(10); // İlk 10 tanesini al

      if (error) throw error;

      if (data && data.length > 0) {
        // Bugünün nöbetçisini bul
        const todayPharmacy = data.find(p => p.duty_date === todayStr);

        // Diğerlerini listeye at (Bugünkü hariç)
        const others = data.filter(p => p.duty_date !== todayStr);

        if (todayPharmacy) {
          setActivePharmacy({
            id: todayPharmacy.id,
            name: todayPharmacy.name,
            address: todayPharmacy.address || 'Adres bilgisi yok',
            isOpenNow: todayPharmacy.isOpenNow,
            phone: todayPharmacy.phone || '',
            locationUrl: todayPharmacy.location_url || '',
            dutyDate: todayPharmacy.duty_date
          });
        }

        const formattedOthers: Pharmacy[] = others.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address || '',
          isOpenNow: p.isOpenNow,
          phone: p.phone || '',
          locationUrl: p.location_url || '',
          dutyDate: new Date(p.duty_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
        }));

        setNextPharmacies(formattedOthers);
      }
    } catch (error) {
      console.error('Eczaneler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else alert("Telefon numarası bulunamadı.");
  };

  const handleDirections = (url: string) => {
    if (url) Linking.openURL(url);
    else alert("Konum bilgisi bulunamadı.");
  };


  // Paylaşma
  const handleShare = async () => {
    if (!activePharmacy) return;
    try {
      await Share.share({
        message: `${activePharmacy.name} - ${activePharmacy.address} - \n ${activePharmacy.locationUrl} \nBoğazlıyan Mobil'de buldum! - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="light-content" />

      {/* 1. ARKA PLAN */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['rgba(238, 43, 75, 0.2)', '#121212']}
          style={styles.topGlow}
        />
      </View>

      <View style={styles.safeArea}>

        {/* 2. HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nöbetçi Eczaneler</Text>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleShare}
          >
            <Share2 color="white" size={22} />
          </TouchableOpacity>

        </View>

        {/* --- REKLAM ALANI: pharmacy-0 --- */}
      {/* getAdByCode('pharmacy-0') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('pharmacy-0') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard 
            data={getAdByCode('pharmacy-0')!} 
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

            {/* 3. TARİH UYARISI */}
            <View style={styles.dateBadgeContainer}>
              <BlurView intensity={20} tint="light" style={styles.dateBadge}>
                <Calendar size={14} color={COLORS.primary} />
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} gecesi için geçerlidir
                </Text>
              </BlurView>
            </View>

            {/* 4. HERO KART (Aktif Eczane) */}
            {activePharmacy ? (
              <View style={styles.heroCard}>
                <View style={styles.heroGlow} />

                <BlurView intensity={10} tint="dark" style={styles.heroInner}>

                  {/* Harita Görseli */}
                  <View style={styles.mapContainer}>
                    <Image
                      source={require("../../assets/images/harita.jpg")}
                      style={styles.mapImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.mapOverlay}
                    />

                    {/* Mesafe Rozeti
                    
                    <BlurView intensity={30} style={styles.distanceBadge}>
                      <Navigation size={12} color={COLORS.primary} />
                      <Text style={styles.distanceText}>{activePharmacy.distance}</Text>
                    </BlurView>
                    */}


                    {/* Pin */}
                    <View style={styles.mapPinContainer}>
                      <View style={styles.pinOuterCircle}>
                        <View style={styles.pinInnerCircle}>
                          <Pill size={20} color="white" />
                        </View>
                      </View>
                      <View style={styles.pinShadow} />
                    </View>
                  </View>

                  {/* Detaylar */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.statusRow}>
                      <View style={styles.pulsingDot}>
                        <View style={styles.dotCore} />
                        <View style={styles.dotRing} />
                      </View>
                      <Text style={styles.statusText}>ŞU AN AÇIK</Text>
                    </View>

                    <Text style={styles.pharmacyName}>{activePharmacy.name}</Text>
                    <Text style={styles.pharmacyAddress}>
                      {activePharmacy.address}
                    </Text>

                    {/* Butonlar */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(activePharmacy.phone)}
                        activeOpacity={0.8}
                      >
                        <Phone size={20} color="white" fill="white" />
                        <Text style={styles.callButtonText}>Hemen Ara</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() => handleDirections(activePharmacy.locationUrl)}
                        activeOpacity={0.8}
                      >
                        <Navigation size={20} color="white" />
                        <Text style={styles.directionButtonText}>Yol Tarifi</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </BlurView>
              </View>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: 'white' }}>Bugün için nöbetçi eczane kaydı bulunamadı.</Text>
              </View>
            )}

            {/* 5. UYARI METNİ */}
            <View style={styles.infoRow}>
              <Info size={16} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text style={styles.infoText}>
                Nöbet değişimi saatlerinde (08:30 - 09:00) farklılık olabilir, lütfen gitmeden önce arayarak teyit ediniz.
              </Text>
            </View>
            {/* phamarcy-1 */}
            

            {/* 6. YEDEK LİSTE */}
            {nextPharmacies.length > 0 && (
              <View style={styles.listSection}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Gelecek Nöbetçiler</Text>
                </View>

                <View style={styles.listContainer}>
                  {nextPharmacies.map((pharmacy) => (
                    <View key={pharmacy.id} style={styles.listItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                        <View style={styles.listIconBox}>
                          <Pill size={20} color="#9ca3af" />
                        </View>
                        <View>
                          <Text style={styles.listItemName}>{pharmacy.name}</Text>
                          <Text style={styles.listItemSub}>{pharmacy.dutyDate} tarihinde nöbetçi</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.listCallBtn}
                        onPress={() => handleCall(pharmacy.phone)}
                      >
                        <Phone size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* phamarcy-2 */}
            
            <View style={{ height: 40 }} />


          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  topGlow: {
    height: 300,
    width: '100%',
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Date Warning
  dateBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dateText: {
    color: '#cbd5e1', // slate-300
    fontSize: 12,
    fontWeight: '500',
  },

  // Hero Card
  heroCard: {
    marginBottom: 20,
    borderRadius: 24,
    position: 'relative', // Glow için relative
  },
  heroGlow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
    opacity: 0.25,
    borderRadius: 40,
    transform: [{ scale: 0.95 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  heroInner: {
    borderRadius: 24,
    backgroundColor: COLORS.cardBg, // Fallback
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },

  // Map Section
  mapContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#242426',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24, // Inner radius
    marginTop: 6,
    marginHorizontal: 6,
    alignSelf: 'center',
    //width: width - 44, // Padding telafisi
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  distanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Map Pin
  mapPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -28 }], // Center alignment
    alignItems: 'center',
  },
  pinOuterCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#242426',
    zIndex: 2,
  },
  pinInnerCircle: {
    // İkon için container
  },
  pinShadow: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    marginTop: 4,
  },

  // Details
  detailsContainer: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  dotRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    opacity: 0.3,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pharmacyName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pharmacyAddress: {
    color: COLORS.textGray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  directionButton: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  directionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Warning Text
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    opacity: 0.8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },

  // List Section
  listSection: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)', // Glass-panel fallback
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSub: {
    color: COLORS.textGray,
    fontSize: 12,
  },
  listCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});