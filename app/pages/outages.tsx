import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Zap, 
  Droplet, 
  Cone, 
  WifiOff, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- RENKLER ---
const COLORS = {
  primary: '#197fe6', // Ana Mavi
  bg: '#f6f7f8',
  white: '#ffffff',
  textDark: '#1e293b',
  textGray: '#64748b',
  border: '#e2e8f0',
  
  // Durum Renkleri
  amberBg: '#fffbeb',
  amberText: '#b45309',
  blueBg: '#eff6ff',
  blueText: '#1d4ed8',
  grayBg: '#f1f5f9',
  grayText: '#475569',
  greenBg: '#f0fdf4',
  greenText: '#15803d',
};

// --- TİP TANIMLAMALARI ---
type OutageType = 'electricity' | 'water' | 'road' | 'internet';
type OutageStatus = 'ongoing' | 'new' | 'planned' | 'resolved';

interface OutageUI {
  id: string;
  type: string; // OutageType olarak zorlayabiliriz ama db'den string geliyor
  title: string;
  subtitle: string;
  status: string; // OutageStatus
  location: string;
  dateLabel: string;
  dateValue: string;
}

// --- KATEGORİLER ---
const CATEGORIES = [
  { id: 'all', label: 'Hepsi' },
  { id: 'water', label: 'Su Kesintisi' },
  { id: 'electricity', label: 'Elektrik Kesintisi' },
  { id: 'road', label: 'Yol Çalışması' },
  { id: 'internet', label: 'İnternet' },
];



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


export default function OutagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [outages, setOutages] = useState<OutageUI[]>([]);
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
                      .eq('place', 'outages'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
              console.error('Veriler çekilemedi - outages:', error);
          } finally {
              console.log('outages passed');
          }
      };





  useEffect(() => {
    fetchOutages();
  }, []);

  const fetchOutages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('outages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: OutageUI[] = data.map((item) => {
          // Tarih Formatlama
          const startDate = new Date(item.start_time || Date.now());
          const endDate = item.end_time ? new Date(item.end_time) : null;
          
          const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
          const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
          
          const startStr = `${startDate.toLocaleDateString('tr-TR', dateOptions)}, ${startDate.toLocaleTimeString('tr-TR', timeOptions)}`;
          
          let dateVal = `${startStr} Başlangıç`;
          
          if (endDate) {
             const endStr = endDate.toLocaleTimeString('tr-TR', timeOptions);
             // Aynı günse sadece saati, farklı günse tarihi de göster
             if(startDate.getDate() === endDate.getDate()) {
                 dateVal = `${startStr} - ${endStr}`;
             } else {
                 dateVal = `${startDate.toLocaleDateString('tr-TR', dateOptions)} - ${endDate.toLocaleDateString('tr-TR', dateOptions)}`;
             }
          }

          return {
            id: item.id,
            type: item.type,
            title: item.title,
            subtitle: item.subtitle || '',
            status: item.status || 'new',
            location: item.location || 'Konum belirtilmedi',
            dateLabel: item.type === 'road' ? 'TARİH' : 'TARİH & SAAT',
            dateValue: dateVal
          };
        });
        setOutages(formattedData);
      }
    } catch (error) {
      console.error('Kesintiler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme
  const filteredData = useMemo(() => {
    if (activeCategory === 'all') return outages;
    return outages.filter(item => item.type === activeCategory);
  }, [activeCategory, outages]);

  // --- HELPER: Tip Bazlı İkon ve Renkler ---
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'electricity':
        return { icon: Zap, color: '#ca8a04', bg: '#fef9c3' }; // Yellow
      case 'water':
        return { icon: Droplet, color: '#2563eb', bg: '#dbeafe' }; // Blue
      case 'road':
        return { icon: Cone, color: '#ea580c', bg: '#ffedd5' }; // Orange
      case 'internet':
        return { icon: WifiOff, color: '#4f46e5', bg: '#e0e7ff' }; // Indigo
      default:
        return { icon: AlertCircle, color: '#64748b', bg: '#f1f5f9' };
    }
  };

  // --- HELPER: Durum Bazlı Badge ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.amberBg, borderColor: '#fef3c7' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.badgeText, { color: COLORS.amberText }]}>Devam Ediyor</Text>
          </View>
        );
      case 'new':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.blueBg, borderColor: '#dbeafe' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.badgeText, { color: COLORS.blueText }]}>Yeni Bildirim</Text>
          </View>
        );
      case 'planned':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.grayBg, borderColor: '#e2e8f0' }]}>
            <Text style={[styles.badgeText, { color: COLORS.textGray }]}>Planlanıyor</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.greenBg, borderColor: '#dcfce7' }]}>
            <CheckCircle2 size={12} color={COLORS.greenText} />
            <Text style={[styles.badgeText, { color: COLORS.greenText }]}>Giderildi</Text>
          </View>
        );
      default: return null;
    }
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: OutageUI }) => {
    const typeStyle = getTypeStyles(item.type);
    const Icon = typeStyle.icon;
    const isResolved = item.status === 'resolved';

    return (
      <TouchableOpacity 
        style={[styles.card, isResolved && styles.cardResolved]}
        activeOpacity={0.9}
        onPress={() => router.push({
            pathname: '/pages/outage-detail',
            params: { id: item.id }
        })}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
            <View style={[styles.iconBox, { backgroundColor: typeStyle.bg }]}>
              <Icon size={24} color={typeStyle.color} />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          
          {/* Status Badge */}
          <View style={{ alignSelf: 'flex-start' }}>
             {getStatusBadge(item.status)}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailsContainer}>
          {/* Location */}
          <View style={styles.detailRow}>
            <MapPin size={18} color="#94a3b8" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>ETKİLENEN BÖLGE</Text>
              <Text style={styles.detailValue}>{item.location}</Text>
            </View>
          </View>
          
          {/* Time */}
          <View style={styles.detailRow}>
            {item.type === 'road' ? <Calendar size={18} color="#94a3b8" style={{ marginTop: 2 }} /> : <Clock size={18} color="#94a3b8" style={{ marginTop: 2 }} />}
            <View>
              <Text style={styles.detailLabel}>{item.dateLabel}</Text>
              <Text style={styles.detailValue}>{item.dateValue}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: 'white' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kesintiler ve Arızalar</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </View>

       {/* outages-1 */}

                       {/* --- REKLAM ALANI: outages-0 --- */}
                       {/* getAdByCode('outages-0') veri dönerse render eder, yoksa boş geçer */}
                       {getAdByCode('outages-0') && (
                           <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                               <PromoCard
                                   data={getAdByCode('outages-0')!}
                                   height={140} // İstersen yüksekliği buradan özel ayarla
                               />
                           </View>
                       )}
      

      {/* 2. FILTERS */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(cat.id as any)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. LIST */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
                <View style={styles.footer}>
                    <CheckCircle2 size={40} color="#cbd5e1" />
                    <Text style={styles.footerText}>Başka kayıt bulunmamaktadır.</Text>
                </View>
            }
            ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                    <Text style={{ color: COLORS.textGray }}>Bu kategoride kayıt bulunamadı.</Text>
                </View>
            }
        />
      )}
      {/* outages-2 */}
      
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'white',
  },
  backBtn: {
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

  // Filters
  filterContainer: {
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  filterTextActive: {
    color: 'white',
  },

  // List
  listContent: {
    padding: 16,
    gap: 16,
  },
  
  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  cardResolved: {
    opacity: 0.6, // Giderilenleri soluk yap
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },

  // Details
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  // Footer
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20,
    gap: 8,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});