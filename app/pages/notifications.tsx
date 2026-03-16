import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Droplet,
  Store,
  Construction,
  Landmark,
  Megaphone,
  Calendar,
  Info
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { useEffect, useState } from 'react';
import {

  ActivityIndicator
} from 'react-native';
import {

  AlertTriangle,
  CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- SUPABASE IMPORTLARI ---
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

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  textLightGray: '#94a3b8',
  border: '#e2e8f0',
  readBg: 'rgba(255, 255, 255, 0.6)', // Okunmuş bildirim arka planı
};

// Veritabanından gelen ham veri tipi
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// UI'da kullanacağımız (işlenmiş) veri tipi
type NotificationUI = {
  id: string;
  title: string;
  desc: string;
  time: string;
  isRead: boolean; // DB'de yoksa varsayılan false kabul edeceğiz
  icon: any;       // Lucide Icon Component
  iconColor: string;
  iconBg: string;
};

// --- MOCK DATA ---
const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Su Kesintisi Uyarısı',
    desc: 'Boğazlıyan merkez mahallesinde bakım çalışması nedeniyle sular kesilecektir.',
    time: '10 dk önce',
    isRead: false,
    icon: Droplet,
    iconColor: '#3b82f6', // Blue
    iconBg: '#eff6ff',
  },
  {
    id: '2',
    title: 'Yeni Kampanya: Market İndirimleri',
    desc: 'Yerel esnafımızda geçerli %20 indirim fırsatlarını kaçırmayın.',
    time: '2 saat önce',
    isRead: false,
    icon: Store,
    iconColor: '#16a34a', // Green
    iconBg: '#f0fdf4',
  },
  {
    id: '3',
    title: 'Yol Yapım Çalışması',
    desc: 'Cumhuriyet Caddesi üzerindeki asfaltlama çalışmaları nedeniyle trafik kontrollü sağlanmaktadır.',
    time: '4 saat önce',
    isRead: false,
    icon: Construction,
    iconColor: '#f97316', // Orange
    iconBg: '#fff7ed',
  },
  {
    id: '4',
    title: 'Belediye Meclis Toplantısı',
    desc: 'Kasım ayı olağan meclis toplantısı sonuçları ve alınan kararlar web sitemizde yayınlandı.',
    time: 'Dün, 14:30',
    isRead: true,
    icon: Landmark,
    iconColor: '#64748b', // Slate
    iconBg: '#f1f5f9',
  },
  {
    id: '5',
    title: 'Vergi Ödeme Hatırlatması',
    desc: 'Emlak vergisi 2. taksit ödemeleri için son gün yaklaşıyor.',
    time: 'Dün, 09:15',
    isRead: true,
    icon: Megaphone,
    iconColor: '#64748b',
    iconBg: '#f1f5f9',
  },
  {
    id: '6',
    title: 'Kültür Merkezi Etkinliği',
    desc: 'Çocuk tiyatrosu "Renkli Dünyalar" bu hafta sonu kültür merkezimizde sahnelenecek.',
    time: '2 gün önce',
    isRead: true,
    icon: Calendar,
    iconColor: '#64748b',
    iconBg: '#f1f5f9',
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
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
          .eq('place', 'notifications'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
      console.error('Veriler çekilemedi - notifications:', error);
    } finally {
      console.log('passed');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- VERİ ÇEKME FONKSİYONU ---
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // DB verisini UI formatına dönüştür (Mapping)
        const formattedData: NotificationUI[] = data.map((item) => {
          const style = getStyleByType(item.type); // Helper fonksiyon
          return {
            id: item.id,
            title: item.title,
            desc: item.content_pre || '', // content_pre alanını açıklama olarak kullanıyoruz
            time: formatTime(item.created_at),
            isRead: false, // Şimdilik hepsi okunmamış varsayalım (veya localStorage'dan kontrol edilebilir)
            icon: style.icon,
            iconColor: style.color,
            iconBg: style.bg,
          };
        });
        setNotifications(formattedData);
      }
    } catch (error) {
      console.error('Bildirimler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- YARDIMCI: TİPE GÖRE STİL VE İKON SEÇİMİ ---
  const getStyleByType = (type: string | null) => {
    switch (type) {
      case 'emergency':
        return { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' }; // Kırmızı
      case 'event':
        return { icon: Calendar, color: '#f97316', bg: '#fff7ed' }; // Turuncu
      case 'info':
        return { icon: Info, color: '#3b82f6', bg: '#eff6ff' }; // Mavi
      case 'system':
        return { icon: Megaphone, color: '#64748b', bg: '#f1f5f9' }; // Gri
      default:
        return { icon: Landmark, color: '#13c8ec', bg: 'rgba(19, 200, 236, 0.1)' }; // Varsayılan (Primary)
    }
  };

  // --- YARDIMCI: TARİH FORMATLA ---
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  // --- RENDERING ITEM ---
  const renderItem1 = ({ item }: { item: NotificationUI }) => {
    const Icon = item.icon;

    return (
      <TouchableOpacity
        style={[styles.card, item.isRead && styles.readCard]}
        activeOpacity={0.7}
        onPress={() => {
          // Detay sayfasına DB'den gelen ID ile git
          router.push({ pathname: '/notification-detail', params: { id: item.id } });
        }}
      >
        {/* Okunmamış Noktası */}
        {!item.isRead && <View style={styles.unreadDot} />}

        {/* İkon */}
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <Icon size={24} color={item.iconColor} />
        </View>

        {/* İçerik */}
        <View style={styles.content}>
          <Text style={[styles.title, item.isRead && styles.readTitle]}>
            {item.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.desc}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }





  // --- RENDERING ITEM ---
  const renderItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => {
    const Icon = item.icon;

    return (
      <TouchableOpacity
        style={[styles.card, item.isRead && styles.readCard]}
        activeOpacity={0.7}
        onPress={() => {
          // Detay sayfasına yönlendirme (Şimdilik ID ile)
          // Detay sayfası kodunu gönderdiğinde burayı güncelleyeceğiz.
          console.log("Detay sayfasına git:", item.id);
          router.push({ pathname: '/pages/notification-detail', params: { id: item.id } });
        }}
      >
        {/* Okunmamış Noktası */}
        {!item.isRead && <View style={styles.unreadDot} />}

        {/* İkon */}
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <Icon size={24} color={item.iconColor} />
        </View>

        {/* İçerik */}
        <View style={styles.content}>
          <Text style={[styles.title, item.isRead && styles.readTitle]}>
            {item.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.desc}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };



  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={{ backgroundColor: 'rgba(246, 248, 248, 0.95)' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      {/* reklam */}

      {/* LISTE 
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 20 }} />}
      /> */}

      {/* --- REKLAM ALANI: notifications-0 --- */}
      {/* getAdByCode('notifications-0') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('notifications-0') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard
            data={getAdByCode('notifications-0')!}
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 20 }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: COLORS.textGray }}>Henüz bildirim yok.</Text>
          </View>
        }
      />
      {/* reklam */}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1', // Hover effect simulation
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Card Styles
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb', // Slate-200
    shadowColor: '#000',
    shadowOpacity: 0.03, // Shadow-soft
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  readCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Şeffaflaştırılmış
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },

  // Icon
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12, // Rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text Content
  content: {
    flex: 1,
    paddingRight: 12, // Dot için boşluk
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
    lineHeight: 20,
  },
  readTitle: {
    color: '#334155', // Slate-700
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: COLORS.textLightGray,
    fontWeight: '500',
  },
});