import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StatusBar, 
  Platform, 
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Search, 
  Share2, 
  MapPin, 
  Clock, 
  Landmark 
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- RENK PALETİ ---
const COLORS = {
  primary: '#0f49bd',
  bg: '#f6f6f8',
  white: '#ffffff',
  textDark: '#0f172a',
  textGray: '#64748b',
  border: '#f1f5f9',
  blueBg: '#eff6ff',
  orangeBg: '#fff7ed',
  greenBg: '#f0fdf4',
  blueText: '#2563eb',
  orangeText: '#ea580c',
  greenText: '#16a34a',
};

// --- TİP TANIMLAMALARI ---
interface DeathNoticeUI {
  id: string;
  name: string;
  date: string;
  village: string;
  prayerTime: string;
  burialPlace: string;
  isToday: boolean;
}

const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // Dakika cinsinden fark (Örn: -180)
    // UTC zamanına ofset'i tersine ekleyerek yerel saati "UTC gibi" gösteriyoruz
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export default function DeathNoticesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  
  const [notices, setNotices] = useState<DeathNoticeUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('death_notices')
        .select('*')
        .order('death_date', { ascending: false }); // En yeniden eskiye

      if (error) throw error;

      if (data) {
        // ✅ DÜZELTME 2: Güncellenmiş fonksiyonu kullanıyoruz
            const todayStr = getLocalDateString();
            console.log("Sorgulanan Tarih:", todayStr); // Konsoldan kontrol edebilirsin

        const formattedNotices: DeathNoticeUI[] = data.map((item) => {
          const isToday = item.death_date === todayStr;
          
          return {
            id: item.id,
            name: item.full_name,
            date: new Date(item.death_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            village: item.village || 'Belirtilmedi',
            prayerTime: item.prayer_time || 'Vakit Belirtilmedi',
            burialPlace: item.burial_place || 'Mezarlık',
            isToday: isToday
          };
        });
        setNotices(formattedNotices);
      }
    } catch (error) {
      console.error('Vefat ilanları çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arama Filtrelemesi
  const filteredNotices = notices.filter(n => 
    n.name.toLowerCase().includes(searchText.toLowerCase()) ||
    n.village.toLowerCase().includes(searchText.toLowerCase())
  );

  // Veriyi Bugün ve Geçmiş olarak ayır
  const todayNotices = filteredNotices.filter(n => n.isToday);
  const pastNotices = filteredNotices.filter(n => !n.isToday);

  // Paylaşma Fonksiyonu
  const handleShare = async (item: DeathNoticeUI) => {
    try {
      await Share.share({
        message: `Vefat İlanı: ${item.name} vefat etmiştir. \nKöyü: ${item.village} \nNamaz: ${item.prayerTime} \nDefin: ${item.burialPlace} \nBaşımız sağolsun.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // --- KART BİLEŞENİ ---
  const renderNoticeCard = (item: DeathNoticeUI) => {
    const iconStyle = {
      locBg: item.isToday ? COLORS.blueBg : '#f1f5f9',
      locColor: item.isToday ? COLORS.primary : '#94a3b8',
      timeBg: item.isToday ? COLORS.orangeBg : '#f1f5f9',
      timeColor: item.isToday ? COLORS.orangeText : '#94a3b8',
      burialBg: item.isToday ? COLORS.greenBg : '#f1f5f9',
      burialColor: item.isToday ? COLORS.greenText : '#94a3b8',
      opacity: item.isToday ? 1 : 0.8,
    };

    return (
      <View key={item.id} style={[styles.card, { opacity: iconStyle.opacity }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item)}>
          <Share2 size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: iconStyle.locBg }]}>
              <MapPin size={18} color={iconStyle.locColor} />
            </View>
            <View>
              <Text style={styles.label}>Köy / Mahalle</Text>
              <Text style={styles.value}>{item.village}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: iconStyle.timeBg }]}>
              <Clock size={18} color={iconStyle.timeColor} />
            </View>
            <View>
              <Text style={styles.label}>Namaz Vakti</Text>
              <Text style={styles.value}>{item.prayerTime}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: iconStyle.burialBg }]}>
              <Landmark size={18} color={iconStyle.burialColor} />
            </View>
            <View>
              <Text style={styles.label}>Defin Yeri</Text>
              <Text style={styles.value}>{item.burialPlace}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vefat İlanları</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </View>
      </View>

      {/* 2. ARAMA ÇUBUĞU */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput 
            placeholder="İsim veya köy ara..." 
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 3. LİSTE */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* BUGÜN BÖLÜMÜ */}
          {todayNotices.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>BUGÜN</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{todayNotices.length} İlan</Text>
                </View>
              </View>
              <View style={styles.listGroup}>
                {todayNotices.map(renderNoticeCard)}
              </View>
            </>
          )}

          {/* AYIRAÇ (Eğer hem bugün hem geçmiş varsa göster) */}
          {todayNotices.length > 0 && pastNotices.length > 0 && (
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Geçmiş İlanlar</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* GEÇMİŞ BÖLÜMÜ */}
          <View style={styles.listGroup}>
            {pastNotices.map(renderNoticeCard)}
          </View>

          {/* BOŞ DURUM */}
          {filteredNotices.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: '#94a3b8' }}>İlan bulunamadı.</Text>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Header
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 10,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Search
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    height: '100%',
  },

  // Content
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listGroup: {
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  shareBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 5,
  },
  cardHeader: {
    marginBottom: 16,
    paddingRight: 32, // Share butonu için boşluk
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  
  // Info Rows
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
    opacity: 0.6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});