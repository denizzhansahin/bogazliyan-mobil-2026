import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  Linking,
  Dimensions,
  ActivityIndicator,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Map, 
  Info, 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Droplet, 
  Phone,
  Zap,
  Cone,
  WifiOff,
  AlertCircle,
  Share2
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');




// --- COLORS ---
const COLORS = {
  primary: '#137fec',
  bg: '#f6f7f8',
  white: '#ffffff',
  textDark: '#111418',
  textGray: '#617589',
  orange: '#ea580c',
  red: '#dc2626',
  border: '#e2e8f0',
};

// --- TYPE DEFINITION ---
interface OutageDetail {
  id: string;
  title: string;
  status: string;
  type: string;
  typeKey: string; // for icon selection
  image: string;
  startTime: string;
  endTime: string;
  location: string;
  reason: string;
  authority: string;
  refNo: string;
  phone: string;
  coordinates: string;
}

export default function OutageDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
            if (!id) return;
              trackEvent('outage_detail_view', {
                item_id: id,
                item_type: 'outage_detail',
              });
        
          }, [id]);
  
  const [outage, setOutage] = useState<OutageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutageDetail();
  }, [id]);

  const fetchOutageDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('outages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Date Formatting
        const startDate = new Date(data.start_time || '');
        const endDate = data.end_time ? new Date(data.end_time) : null;
        
        const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

        const startTimeStr = `${startDate.toLocaleDateString('tr-TR', dateOptions)}, ${startDate.toLocaleTimeString('tr-TR', timeOptions)}`;
        const endTimeStr = endDate 
          ? `${endDate.toLocaleDateString('tr-TR', dateOptions)}, ${endDate.toLocaleTimeString('tr-TR', timeOptions)}`
          : 'Belirsiz';

        // Status Translation (Basic)
        const statusMap: {[key: string]: string} = {
            'ongoing': 'Devam Ediyor',
            'new': 'Yeni Bildirim',
            'planned': 'Planlı Çalışma',
            'resolved': 'Giderildi'
        };

        // Type Translation
        const typeMap: {[key: string]: string} = {
            'electricity': 'Elektrik Kesintisi',
            'water': 'Su Kesintisi',
            'road': 'Yol Çalışması',
            'internet': 'İnternet Arızası'
        };

        const formattedOutage: OutageDetail = {
          id: data.id,
          title: data.title,
          status: statusMap[data.status || 'new'] || 'Bilinmiyor',
          type: typeMap[data.type] || 'Genel Arıza',
          typeKey: data.type,
          image: data.image_url || "",
          startTime: startTimeStr,
          endTime: endTimeStr,
          location: data.location || 'Konum belirtilmedi',
          reason: data.description || 'Açıklama girilmemiş.',
          authority: data.authority || 'Yetkili Kurum',
          refNo: `#${data.id.substring(0, 4).toUpperCase()}`, // Mock ref no from ID
          phone: data.phone || '',
          coordinates: data.coordinates || ''
        };

        setOutage(formattedOutage);
      }
    } catch (error) {
      console.error('Arıza detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (outage?.phone) Linking.openURL(`tel:${outage.phone}`);
    else alert("Telefon numarası bulunamadı.");
  };

  const handleMap = () => {
    if (outage?.coordinates) {
        // coordinates format: "lat,long" -> "39.19,35.25"
        Linking.openURL(`geo:${outage.coordinates}?q=${outage.coordinates}`);
    } else {
        alert("Konum bilgisi mevcut değil.");
    }
  };

  const handleShare = async () => {
    if (!outage) return;
    try {
        await Share.share({
            message: `${outage.title} \nDurum: ${outage.status} \nBölge: ${outage.location} \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
        });
    } catch (error) {
        console.log(error);
    }
  };

  // Helper to get Icon based on type
  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'electricity': return Zap;
          case 'water': return Droplet;
          case 'road': return Cone;
          case 'internet': return WifiOff;
          default: return AlertCircle;
      }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!outage) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Kayıt bulunamadı.</Text>
      </View>
    );
  }

  const TypeIcon = getTypeIcon(outage.typeKey);

  return (
    <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kesinti Detayı</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleShare}>
            <Share2 size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* outage-detail-1 */}
      
        {/* 2. MAP SECTION */}
        <View style={styles.mapContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleMap} style={styles.mapCard}>
            <Image 
              source={{ uri: outage.image }} 
              style={styles.mapImage} 
              contentFit="cover"
            />
            {/* Harita Overlay Butonu */}
            <View style={styles.mapOverlay}>
              <View style={styles.mapBtn}>
                <Map size={16} color={COLORS.primary} />
                <Text style={styles.mapBtnText}>Haritada Gör</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. TITLE & TAGS */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{outage.title}</Text>
          
          <View style={styles.tagsRow}>
            {/* Mavi Etiket */}
            <View style={[styles.tag, styles.tagBlue]}>
              <Info size={16} color={COLORS.primary} />
              <Text style={[styles.tagText, { color: COLORS.primary }]}>{outage.type}</Text>
            </View>
            
            {/* Turuncu Etiket */}
            <View style={[styles.tag, styles.tagOrange]}>
              <Loader2 size={16} color={COLORS.orange} />
              <Text style={[styles.tagText, { color: COLORS.orange }]}>{outage.status}</Text>
            </View>
          </View>
        </View>

        {/* 4. INFO CARD (Timeline) */}
        <View style={styles.infoCard}>
          
          {/* Başlangıç */}
          <View style={styles.timelineRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
               <Calendar size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.label}>BAŞLANGIÇ</Text>
              <Text style={styles.value}>{outage.startTime}</Text>
            </View>
          </View>

          {/* Dikey Çizgi (Timeline Connector) */}
          <View style={styles.timelineConnector} />

          {/* Bitiş */}
          <View style={styles.timelineRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
               <Clock size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.label}>TAHMİNİ BİTİŞ</Text>
              <Text style={styles.value}>{outage.endTime}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Konum */}
          <View style={styles.timelineRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
               <MapPin size={20} color={COLORS.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ETKİLENEN YERLER</Text>
              <Text style={styles.valueDescription}>{outage.location}</Text>
            </View>
          </View>
        </View>

        {/* 5. DESCRIPTION */}
        {/* outage-detail-2 */}
      
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>Arıza Nedeni</Text>
          <Text style={styles.descText}>{outage.reason}</Text>
        </View>

        {/* 6. AUTHORITY INFO */}
        <View style={styles.authorityCard}>
          <TypeIcon size={24} color={COLORS.primary} />
          <View>
            <Text style={styles.authTitle}>{outage.authority}</Text>
            <Text style={styles.authSub}>Resmi Duyuru {outage.refNo}</Text>
          </View>
        </View>

      </ScrollView>

      {/* 7. BOTTOM ACTION */}
      <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Phone size={20} color="white" />
          <Text style={styles.callBtnText}>Yetkiliyi Ara</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg, // #f6f7f8
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  content: {
    paddingBottom: 100, // Bottom bar payı
  },

  // Map
  mapContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  mapCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 127, 236, 0.1)', // Primary opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  mapBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  // Title & Tags
  titleSection: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagBlue: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)', // Primary opacity
    borderColor: 'rgba(19, 127, 236, 0.2)',
  },
  tagOrange: {
    backgroundColor: '#fff7ed', // Orange-50
    borderColor: '#ffedd5',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white', //
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  valueDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  timelineConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#e2e8f0', // (border style)
    marginLeft: 19, // Icon center alignment
    marginVertical: 4,
    borderStyle: 'dashed', 
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },

  // Description
  descSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.textGray, //
  },

  // Authority
  authorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    backgroundColor: '#eff6ff', // Blue-50
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  authTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af', // Blue-800
  },
  authSub: {
    fontSize: 12,
    color: '#2563eb', // Blue-600
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  callBtn: {
    backgroundColor: COLORS.primary, // #137fec
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  callBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});