import React, { useState, useEffect } from 'react';
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
  Store,
  Calculator,
  Utensils,
  Truck,
  GraduationCap,
  ChevronRight,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- RENKLER ---
const COLORS = {
  primary: '#137fec',
  bg: '#f6f7f8',
  white: '#ffffff',
  textDark: '#111418',
  textGray: '#617589',
  border: '#e2e8f0',
  // Sektör Renkleri
  blueBg: '#e0f2fe',
  blueText: '#0284c7',
  orangeBg: '#ffedd5',
  orangeText: '#ea580c',
  amberBg: '#fef3c7',
  amberText: '#d97706',
  greenBg: '#dcfce7',
  greenText: '#16a34a',
  purpleBg: '#f3e8ff',
  purpleText: '#7e22ce',
};

// --- TİP TANIMLARI (UI İçin) ---
interface JobUI {
  id: string;
  title: string;
  company: string;
  type: string;
  category: string;
  time: string;
  location: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  tags: { label: string; bg: string; color: string }[];
}

// --- FİLTRELER ---
const FILTERS = ['Hepsi', 'Tam Zamanlı', 'Yarı Zamanlı', 'Staj', 'Serbest'];

{/* 
// --- MOCK DATA ---
const JOBS: Job[] = [
  {
    id: '1',
    title: 'Satış Danışmanı',
    company: 'Boğazlıyan Market',
    type: 'Tam Zamanlı',
    category: 'Perakende',
    time: '2 saat önce',
    location: 'Merkez',
    icon: Store,
    iconBg: '#f1f5f9', // Gray-100
    iconColor: COLORS.primary,
    tags: [
      { label: 'Tam Zamanlı', bg: 'rgba(19, 127, 236, 0.1)', color: COLORS.primary },
      { label: 'Perakende', bg: '#f1f5f9', color: '#4b5563' }
    ]
  },
  {
    id: '2',
    title: 'Muhasebe Elemanı',
    company: 'Yılmaz İnşaat',
    type: 'Tecrübeli',
    category: 'Ofis',
    time: '5 saat önce',
    location: 'Sanayi Sitesi',
    icon: Calculator,
    iconBg: '#f1f5f9',
    iconColor: '#f97316', // Orange
    tags: [
      { label: 'Tecrübeli', bg: 'rgba(19, 127, 236, 0.1)', color: COLORS.primary },
      { label: 'Ofis', bg: '#f1f5f9', color: '#4b5563' }
    ]
  },
  {
    id: '3',
    title: 'Garson',
    company: 'Merkez Cafe',
    type: 'Yarı Zamanlı',
    category: 'Hizmet',
    time: 'Dün',
    location: 'Meydan',
    icon: Utensils,
    iconBg: '#f1f5f9',
    iconColor: '#d97706', // Amber
    tags: [
      { label: 'Yarı Zamanlı', bg: '#f3e8ff', color: '#7e22ce' }, // Purple style
      { label: 'Hizmet', bg: '#f1f5f9', color: '#4b5563' }
    ]
  },
  {
    id: '4',
    title: 'Şoför',
    company: 'Kaya Lojistik',
    type: 'Tam Zamanlı',
    category: 'Lojistik',
    time: 'Dün',
    location: 'Yenidoğan Mah.',
    icon: Truck,
    iconBg: '#f1f5f9',
    iconColor: '#16a34a', // Green
    tags: [
      { label: 'Tam Zamanlı', bg: 'rgba(19, 127, 236, 0.1)', color: COLORS.primary },
      { label: 'Lojistik', bg: '#f1f5f9', color: '#4b5563' }
    ]
  },
  {
    id: '5',
    title: 'İngilizce Öğretmeni',
    company: 'Boğazlıyan Koleji',
    type: 'Tam Zamanlı',
    category: 'Eğitim',
    time: '2 gün önce',
    location: 'Bağlarbaşı',
    icon: GraduationCap,
    iconBg: '#f1f5f9',
    iconColor: '#3b82f6', // Blue
    tags: [
      { label: 'Tam Zamanlı', bg: 'rgba(19, 127, 236, 0.1)', color: COLORS.primary },
      { label: 'Eğitim', bg: '#f1f5f9', color: '#4b5563' }
    ]
  },
];
*/}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Hepsi');
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [activeFilter]);


  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Temel sorgu
      let query = supabase
        .from('jobs')
        .select('*')
        .select(`
          *,
          place:places (
            id,
            name,
            image_url,
            address,
            phone,
            rating
          )
        `)
        .eq('is_active', true) // Sadece aktif ilanlar
        .order('created_at', { ascending: false });

      // Filtreleme (Hepsi değilse)
      if (activeFilter !== 'Hepsi') {
        query = query.eq('type', activeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedJobs: JobUI[] = data.map((item) => {
          // Kategoriye göre stil al
          const style = getJobStyle(item.type || 'Ofis'); // item.category yoksa type'a göre bakabiliriz veya tam tersi

          // 🟢 MANTIK: Eğer place bağlıysa oradan al, yoksa manuel girileni kullan
          const companyName = item.place?.name || item.company_name || 'İsimsiz İşveren';
          const companyLocation = item.place?.address || item.location || 'Konum Belirtilmedi';

          // Zaman formatla (Basit hesaplama)
          const timeDiff = new Date().getTime() - new Date(item.created_at).getTime();
          const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
          const timeLabel = hoursDiff < 24 ? `${hoursDiff} saat önce` : `${Math.floor(hoursDiff / 24)} gün önce`;

          return {
            id: item.id,
            title: item.title,
            company: companyName,
            type: item.type || 'Tam Zamanlı',
            category: item.type || 'Genel', // DB'de category sütunu varsa onu kullan
            time: timeLabel,
            location: companyLocation,
            icon: style.icon,
            iconBg: '#f1f5f9',
            iconColor: style.color,
            tags: [
              { label: item.type || 'Tam Zamanlı', bg: 'rgba(19, 127, 236, 0.1)', color: COLORS.primary },
              // Maaş bilgisini ikinci etiket yapabiliriz
              { label: item.salary_range || 'Maaş Belirtilmedi', bg: '#f1f5f9', color: '#4b5563' }
            ]
          };
        });
        setJobs(formattedJobs);
      }

    } catch (error) {
      console.error('İş ilanları çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Kategoriye Göre İkon ve Renk ---
  // Bu fonksiyon DB'den gelen metni (Ofis, Perakende vb.) ikona çevirir.
  const getJobStyle = (categoryStr: string) => {
    const cat = categoryStr.toLowerCase();

    if (cat.includes('perakende') || cat.includes('satış')) return { icon: Store, color: '#137fec' }; // Mavi
    if (cat.includes('muhasebe') || cat.includes('ofis')) return { icon: Calculator, color: '#f97316' }; // Turuncu
    if (cat.includes('hizmet') || cat.includes('garson')) return { icon: Utensils, color: '#d97706' }; // Amber
    if (cat.includes('lojistik') || cat.includes('şoför')) return { icon: Truck, color: '#16a34a' }; // Yeşil
    if (cat.includes('eğitim') || cat.includes('öğretmen')) return { icon: GraduationCap, color: '#3b82f6' }; // Mavi

    return { icon: Briefcase, color: '#64748b' }; // Varsayılan Gri
  };

  // --- KART BİLEŞENİ ---
  const renderJobItem = ({ item }: { item: JobUI }) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/pages/job-detail',
          params: { id: item.id }
        })}
      >
        <View style={styles.cardTop}>
          {/* Sol İkon */}
          <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
            <Icon size={28} color={item.iconColor} />
          </View>

          {/* Orta Bilgi */}
          <View style={styles.cardContent}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.company}>{item.company}</Text>

            {/* Etiketler */}
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: tag.bg }]}>
                  <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sağ Ok */}
          <ChevronRight size={20} color="#9ca3af" style={{ marginTop: 4 }} />
        </View>

        {/* Alt Çizgi ve Footer */}
        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Clock size={14} color="#9ca3af" />
            <Text style={styles.footerText}>{item.time}</Text>
          </View>
          <View style={styles.footerItem}>
            <MapPin size={14} color="#9ca3af" />
            <Text style={styles.footerText}>{item.location}</Text>
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
          <Text style={styles.headerTitle}>İş İlanları</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* 2. FİLTRELER (Sticky Görünümü) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((filter, index) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={index}
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

      {/* 3. LİSTE */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {activeFilter === 'Hepsi' ? 'Tüm İlanlar' : `${activeFilter} İlanları`}
            </Text>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: '#9ca3af' }}>Bu kategoride ilan bulunamadı.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView >
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
    backgroundColor: '#f8fafc', // Hover effect
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Filters
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  filterTextActive: {
    color: 'white',
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent', // Hover state simulation can be added here
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12, // Rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#64748b', // Text-gray-500
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Divider & Footer
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af', // Gray-400
  },

  // Loading
  loadingText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 32,
  },
});