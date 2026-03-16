import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { useRouter } from 'expo-router';

import { supabase } from '../../lib/supabase';
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



// Tasarımdaki Renk Paleti
const COLORS = {
  background: '#f8f9fa',
  white: '#ffffff',
  textDark: '#111618',
  textGray: '#9ca3af',
  primary: '#0db9f2',

  // Bölüm Renkleri (Opaklık ayarları stil içinde yapılacak)
  red: '#ef4444',
  yellow: '#eab308',
  emerald: '#10b981',
  orange: '#f97316',
  purple: '#a855f7',
  sky: '#0ea5e9', // Light Blue
  green: '#22c55e',
  blue: '#3b82f6',
};



export default function MenuScreen() {

  const router = useRouter();
   const insets = useSafeAreaInsets();

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
            .eq('place', 'explore'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
        console.error('Veriler çekilemedi - explore:', error);
      } finally {
        console.log('passed');
      }
    };

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menü & Rehber</Text>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => { router.push("/pages/notifications") }} >
          <MaterialIcons name="notifications-none" size={26} color="#4b5563" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* --- REKLAM ALANI: explore-0 --- */}
      {/* getAdByCode('ex-0') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('explore-0') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard 
            data={getAdByCode('explore-0')!} 
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}
          

        {/* 1. ACİL & GÜNLÜK (EMERGENCY & DAILY) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACİL & GÜNLÜK</Text>
          <View style={styles.cardList}>

            {/* Nöbetçi Eczane */}
            <TouchableOpacity style={styles.listCard} onPress={() => router.push('/pages/pharmacy')}>
              <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                <MaterialIcons name="medical-services" size={24} color={COLORS.red} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Nöbetçi Eczane & Sağlık</Text>
                <Text style={styles.cardSubtitle}>En yakın sağlık kuruluşları</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
            </TouchableOpacity>

            {/* Taksi Durağı */}
            <TouchableOpacity style={styles.listCard} onPress={() => router.push('/pages/taxis')}>
              <View style={[styles.iconBox, { backgroundColor: '#fefce8' }]}>
                <MaterialIcons name="local-taxi" size={24} color={COLORS.yellow} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Taksi Durağı</Text>
                <Text style={styles.cardSubtitle}>Tek tıkla taksi çağır</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
            </TouchableOpacity>

            {/* Kesintiler & Arıza */}
            <TouchableOpacity style={styles.listCard} onPress={() => router.push('/pages/outages')}>
              <View style={[styles.iconBox, { backgroundColor: '#f3f4f6' }]}>
                <MaterialCommunityIcons name="power-plug-off" size={24} color="#6b7280" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Kesintiler & Arıza</Text>
                <Text style={styles.cardSubtitle}>Su ve Elektrik duyuruları</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
            </TouchableOpacity>

            {/* Namaz Vakitleri (Özel Tasarım) */}
            <TouchableOpacity style={styles.prayerCard} onPress={() => router.push('/pages/prayer-times')}>
              <View style={[styles.iconBox, { backgroundColor: '#f3f4f6' }]}>
                <MaterialCommunityIcons name="mosque" size={24} color="#059669" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Namaz Vakitleri</Text>
                <Text style={styles.cardSubtitle}>Namaz vakitlerini öğrenin</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
              {/* Namaz Vakitleri (Özel Tasarım) 
              
              <Text style={styles.prayerTime}>Akşam'a 1s 20dk</Text>*/}
              
            </TouchableOpacity>

          </View>
        </View>


        {/* 2. TİCARET VE FIRSATLAR (COMMERCE & DEALS) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TİCARET VE FIRSATLAR</Text>
          <View style={styles.gridContainer}>

            {/* Row 1 */}
            <View style={styles.gridRow}>
              {/* Ucuzluk Dünyası */}
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: '#fff7ed' }]} onPress={() => router.push('/pages/deals')}>
                <MaterialIcons name="shopping-basket" size={40} color={COLORS.orange} style={{ opacity: 0.8 }} />
                <Text style={styles.gridText}>Ucuzluk{'\n'}Dünyası</Text>
              </TouchableOpacity>

              {/* Kampanyalar */}
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: '#faf5ff' }]} onPress={() => router.push('/pages/campaigns')}>
                <MaterialIcons name="campaign" size={40} color={COLORS.purple} style={{ opacity: 0.8 }} />
                <Text style={styles.gridText}>Kampanyalar</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>
              {/* İşletmeler Rehberi */}
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: '#f0f9ff' }]} onPress={() => router.push('/pages/culture/places')}>
                <MaterialIcons name="apartment" size={40} color={COLORS.sky} style={{ opacity: 0.8 }} />
                <Text style={styles.gridText}>Köy&Kasaba{'\n'}Rehberi</Text>
              </TouchableOpacity>

              {/* İkinci El Pazarı */}
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: '#f0fdf4' }]} onPress={() => router.push('/pages/second-hand')}>
                <MaterialIcons name="inventory" size={40} color={COLORS.green} style={{ opacity: 0.8 }} />
                <Text style={styles.gridText}>İkinci El{'\n'}Pazarı</Text>
              </TouchableOpacity>
            </View>

            {/* Full Width - İş İlanları */}
            <TouchableOpacity style={[styles.fullWidthCard, { backgroundColor: '#eff6ff' }]} onPress={() => router.push('/pages/jobs')}>
              <View style={styles.jobContent}>
                <MaterialIcons name="work" size={36} color={COLORS.blue} />
                <View>
                  <Text style={styles.jobTitle}>İş İlanları</Text>
                  <Text style={styles.jobSubtitle}>Güncel pozisyonları incele</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#93c5fd" />
            </TouchableOpacity>

          </View>
        </View>

        {/* --- REKLAM ALANI: explore-0 --- */}
      {/* getAdByCode('explore-1') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('explore-1') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard 
            data={getAdByCode('explore-1')!} 
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}
   
        {/* 3. SOSYAL & YAŞAM (SOCIAL & LIFE) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOSYAL & YAŞAM</Text>
          <View style={styles.groupedList}>
            {[
              { icon: 'newspaper', label: 'Haberler', iconColor: '#6b7280', yol: '/pages/news' },
              { icon: 'person-off', label: 'Vefat İlanları', iconColor: '#6b7280', yol: '/pages/death-notices' },
              { icon: 'account-balance', label: 'Kamu Hizmetleri', iconColor: '#6b7280', yol: '/pages/public-institutions' },
              { icon: 'theater-comedy', label: 'Kültür & Sanat', iconColor: '#6b7280', yol: '/pages/culture' },
              { icon: 'how-to-vote', label: 'Anketler', iconColor: '#6b7280', yol: '/pages/surveys' },
              { icon: 'wb-sunny', label: 'Hava Durumu', subtitle: '5 günlük tahmin', iconColor: '#6b7280', yol: '/pages/weather' },
              { icon: 'settings', label: 'Uygulama Hakkında', subtitle: 'İletişim ve yasal sözleşmeler', iconColor: '#6b7280', yol: '/pages/menu' },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.groupedItem,
                  index === arr.length - 1 && { borderBottomWidth: 0 } // Son eleman çizgisiz
                ]}
                onPress={() => router.push(item.yol)}
              >
                <View style={styles.groupedItemLeft}>
                  <View style={styles.groupedIconBox}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View>
                    <Text style={styles.groupedLabel}>{item.label}</Text>
                    {item.subtitle && <Text style={styles.groupedSubtitle}>{item.subtitle}</Text>}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    
  },
  scrollContent: {
    paddingBottom: 100, // Bottom Tab Bar için boşluk
    paddingTop: 10,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800', // Font-extrabold
    color: '#1e293b', // Slate-800
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },

  // Section Common
  section: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af', // Gray-400
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  cardList: {
    gap: 12,
  },

  // List Card (Acil & Günlük)
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937', // Gray-800
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Prayer Card
  prayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5', // Emerald-50
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46', // Emerald-800
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669', // Emerald-600
  },

  // Grid (Ticaret)
  gridContainer: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1.2, // Karemsi görünüm
    borderRadius: 24, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  gridText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 18,
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  jobContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  jobSubtitle: {
    fontSize: 12,
    color: '#3b82f6', // Blue-500
    fontWeight: '500',
  },

  // Grouped List (Sosyal)
  groupedList: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    overflow: 'hidden', // Köşelerden taşmaması için
  },
  groupedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  groupedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  groupedSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
  },
    notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
    badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
});