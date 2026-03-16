import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  AlertTriangle, // Uyarı ikonu
  ArrowRight,
  Info // Bilgi ikonu
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



// Supabase bağlantısı ve tipleri
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ActivityIndicator } from 'react-native'; // Yükleniyor çarkı için
import { trackEvent } from '@/src/firebase/analytics';

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

// Veritabanındaki 'notifications' tablosunun satır tipi
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec', // Turkuaz
  bg: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  red: '#ef4444',
  lightRed: '#fef2f2',
  infoBoxBg: 'rgba(19, 200, 236, 0.05)', // Primary %5 opaklık
  infoBoxBorder: '#13c8ec',
};

// --- MOCK DATA ---
// Gerçek uygulamada ID ile veritabanından çekilecek
const NOTIFICATION_DETAIL = {
  id: '1',
  title: 'Su Kesintisi Hakkında Duyuru',
  date: '14 Ekim 2023 • 09:45',
  type: 'important', // 'important', 'normal'
  badgeText: 'Önemli',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHIxsMvvcqBSr-c7XTiiVXt7L7j_Vyo4u6LghuEMw4t97dDYcwxIfg_a0QljCWZ5H6u79uqwYN0hkkvh7eEisiOdWiFuABACTQjFV-5Sw58rMg-cUWGjGjdGYhcfLbK_raMAMKSCKOBySEXz0YvtnUOagonaiTqnIvThyHMF0URYQRHODWT1JhXWl4Rg9zTdEoHAtfewc3QGr9CJdLH60vosRAH_uWO_MmjuP643av68X7-soyDPOE5noyQJe5Qtj5VfOoJrL-Ug', // HTML'deki görsel linki veya Unsplash
  // image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ce2ac6?q=80&w=800', // Alternatif
  contentPre: 'Boğazlıyan Belediyesi Fen İşleri Müdürlüğü tarafından yapılan açıklamaya göre, bakım onarım çalışmaları nedeniyle ilçemizin bazı bölgelerinde geçici su kesintisi yaşanacaktır.',
  infoBoxTitle: 'Etkilenen Bölgeler',
  infoBoxText: 'Bahçelievler Mahallesi, Cumhuriyet Caddesi ve çevresi.',
  contentPost: 'Çalışmaların tamamlanmasıyla birlikte suların kademeli olarak verilmesi planlanmaktadır. Vatandaşlarımızın mağduriyet yaşamamaları adına gerekli tedbirleri almaları önemle rica olunur.',
  signature: 'Anlayışınız için teşekkür ederiz.\nBoğazlıyan Belediyesi',

  // Aksiyon Butonu Ayarları
  actionLabel: 'İlgili Alana Git',
  actionRoute: '/outage-detail?id=1' // Örn: Kesinti detay sayfasına yönlendirme
};

export default function NotificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();


        useEffect(() => {
          if (!id) return;
            trackEvent('notification_detail_view', {
              item_id: id,
              item_type: 'notification_detail',
            });
      
        }, [id]);





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
              .eq('place', 'notification-detail'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
          console.error('Veriler çekilemedi - notification-detail:', error);
        } finally {
          console.log('passed');
        }
      };

  // State tanımları
  const [notification, setNotification] = useState<NotificationRow | null>(null);
  const [loading, setLoading] = useState(true);


  // Sayfa açılınca veya ID değişince çalışır
  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Supabase'den veriyi çeken fonksiyon
  const fetchDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // 'notifications' tablosundan, ID'si eşleşen TEK satırı (.single()) çek
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setNotification(data);
    } catch (err) {
      console.error('Detay hatası:', err);
    } finally {
      setLoading(false); // Hata olsa da olmasa da yüklemeyi bitir
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Tarih formatlama
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Veri bulunamadıysa patlamasın
  if (!notification) return null;


  // Aksiyon butonuna tıklanınca
  const handleAction = () => {
    if (!notification?.action_url) return;

    if (notification.action_type === 'link') {
      // Web sitesi aç
      Linking.openURL(notification.action_url);
    } else {
      // Uygulama içi yönlendirme (Örn: /outage-detail)
      // @ts-ignore
      router.push(notification.action_url);
    }
  };

  return (
    <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
{/* reklam */}
      
        {/* 2. HERO IMAGE SECTION */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: notification.image_url || "" }}
              style={styles.heroImage}
              contentFit="cover"
            />

            {/* Status Badge (Overlay) */}
            {/* Rozet (Varsa) */}
            {notification.badge_text && (
              <View style={[
                styles.badge,
                { backgroundColor: notification.type === 'emergency' ? COLORS.red : COLORS.primary }
              ]}>
                {notification.type === 'emergency' ? (
                  <AlertTriangle size={14} color="white" />
                ) : (
                  <Info size={14} color="white" />
                )}
                <Text style={styles.badgeText}>{notification.badge_text}</Text>
              </View>
            )}
          </View>
        </View>

{/* --- REKLAM ALANI: explore-0 --- */}
      {/* getAdByCode('notification-detail-0') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('notification-detail-0') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard 
            data={getAdByCode('notification-detail-0')!} 
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}


      
        {/* 3. CONTENT BODY */}
        <View style={styles.bodySection}>

          {/* Meta Data */}
          <View style={styles.metaRow}>
            <Clock size={18} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(notification.created_at)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{notification.title}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Intro Text */}
          <Text style={styles.paragraph}>
            {notification.content_pre}
          </Text>

          {/* Info Box (Varsa) */}
          {notification.info_box_title && (
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{notification.info_box_title}</Text>
              <Text style={styles.infoBoxText}>{notification.info_box_text}</Text>
            </View>
          )}
{/* reklam */}
       
          {/* Post Text (content_post) */}
          {notification.content_post && (
            <Text style={styles.paragraph}>
              {notification.content_post}
            </Text>
          )}

          {/* Signature */}
          {notification.signature && (
            <Text style={styles.signature}>
              {notification.signature}
            </Text>
          )}

        </View>

      </ScrollView>

      {/* 4. FIXED BOTTOM ACTION BAR */}
      <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.9}
          onPress={handleAction}
        >
          <Text style={styles.actionBtnText}>{notification.action_label}</Text>
          <ArrowRight size={20} color="white" />
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 100, // Bottom bar payı
  },

  // Image Area
  imageSection: {
    padding: 16,
    paddingBottom: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: '#e2e8f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Body Area
  bodySection: {
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    lineHeight: 32,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.dark,
    marginBottom: 16,
  },

  // Info Box (Highlight)
  infoBox: {
    backgroundColor: COLORS.infoBoxBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.infoBoxBorder,
    padding: 16,
    borderRadius: 8, // border-radius-r-lg in tailwind usually affects right corners more visibly if left is bordered, but standard radius looks good
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 14,
    color: COLORS.dark, // text-text-main
    lineHeight: 22,
  },

  signature: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textGray,
    marginTop: 8,
    lineHeight: 22,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});