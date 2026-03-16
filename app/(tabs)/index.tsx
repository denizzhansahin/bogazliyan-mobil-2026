import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Moon, Play, Radio, UserMinus } from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { usePathname } from 'expo-router';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

import PromoCard from '@/components/PromoCard';

import { trackButton } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');



// --- RENKLER ---
const COLORS = {
  primary: '#0db9f2',
  backgroundLight: '#f5f8f8',
  darkBg: '#101e22',
  textDark: '#111618',
  orange: '#f97316',
  emerald: '#059669',
  slate: '#1e293b',
  dark: '#111718',
};


// --- TİP TANIMLARI ---
interface NewsItem { id: string; title: string; category: string; time: string; image: string; badgeBg: string; badgeText: string; }
interface ListingItem { id: string; title: string; price: string; image: string; tag: string; }
interface ObituaryItem { id: string; name: string; age: number; location: string; }
interface DealItem { id: string; title: string; oldPrice: string; newPrice: string; image: string; }
// StoryItem artık İşletme verisi tutacak
interface StoryItem { id: string; name: string; img: string; category: string; }

// Diğer interface'lerin yanına ekleyin
interface SliderItem {
  id: string;
  title: string;
  image: string;
  tag: string;
  tagColor: string;
  targetPath: string;
  targetId: string;
}

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

// ✅ DÜZELTME 1: Tarih hesaplama fonksiyonunu bu şekilde güncelle
// Bu yöntem, cihazın saat dilimi farkını hesaba katarak "Bugünün" tarihini ISO formatında (YYYY-MM-DD) verir.
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset(); // Dakika cinsinden fark (Örn: -180)
  // UTC zamanına ofset'i tersine ekleyerek yerel saati "UTC gibi" gösteriyoruz
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentDateStr, setCurrentDateStr] = useState('');

  const pathname = usePathname();



  // Data States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [obituaries, setObituaries] = useState<ObituaryItem[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]); // İşletmeler buraya gelecek

  const [slides, setSlides] = useState<SliderItem[]>([]); // YENİ STATE

  const [adds, setAdds] = useState<AddsItem[]>([]); // YENİ STATE

  // Widget Data
  const [weatherTemp, setWeatherTemp] = useState('12°C');
  const [nextPrayerTime, setNextPrayerTime] = useState('Vakit');

  useEffect(() => {
    // Tarih
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', weekday: 'long' };
    setCurrentDateStr(now.toLocaleDateString('tr-TR', options));

    fetchAllData();
  }, []);

// Adds dizisi içinden place_code'a göre veriyi bulur
const getAdByCode = (code: string) => {
  return adds.find(item => item.place_code === code);
};

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // ✅ DÜZELTME 2: Güncellenmiş fonksiyonu kullanıyoruz
      const todayStr = getLocalDateString();
      console.log("Sorgulanan Tarih:", todayStr); // Konsoldan kontrol edebilirsin

      // Paralel Veri Çekme
      const [newsRes, listingsRes, obituariesRes, weatherRes, prayerRes, dealsRes, placesRes, sliderRes, addRes] = await Promise.all([
        // 1. Haberler
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3),

        // 2. İkinci El
        supabase.from('market_items').select('*').order('created_at', { ascending: false }).limit(4),

        // 3. Vefat İlanları (GÜNCELLENDİ: 'date' yerine 'death_date' kullanıyoruz)
        supabase.from('death_notices').select('*').eq('death_date', todayStr),


        // 4. Hava Durumu
        supabase.from('weather_forecasts').select('temp_current').eq('date', todayStr).single(),

        // 5. Namaz Vakitleri
        supabase.from('prayer_times').select('*').eq('date', todayStr).single(),

        // 6. Fırsatlar
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(5),

        // 7. İşletmeler (Stories Alanı İçin) - YENİ
        supabase.from('places').select('*').limit(8),

        supabase.from('slider_items').select('*').eq('is_active', true).order('sort_order', { ascending: true }),

        supabase
          .from('add_company')
          .select('*')
          .eq('place', 'index'), // ✅ FİLTRE: Sadece index sayfasındakiler
      ]);

      // --- HABERLER ---
      if (newsRes.data) {
        setNews(newsRes.data.map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          time: new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          image: item.image_url || GORSEL,
          badgeBg: item.category === 'Spor' ? '#dcfce7' : '#e0f2fe',
          badgeText: item.category === 'Spor' ? '#15803d' : '#0284c7'
        })));
      }

      // --- İKİNCİ EL ---
      if (listingsRes.data) {
        setListings(listingsRes.data.map(item => ({
          id: item.id,
          title: item.title,
          price: `${item.price}₺`,
          image: item.image_url || (item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : ""),
          tag: item.status === 'active' ? 'Satılık' : 'Satıldı'
        })));
      }

      // --- VEFAT İLANLARI (MAPPING) ---
      if (obituariesRes.data) {
        setObituaries(obituariesRes.data.map(item => ({
          id: item.id,
          name: item.full_name,
          age: item.age, // Veritabanında 'age' sütunu olduğunu varsayıyoruz
          location: item.burial_place || 'Mezarlık' // Boş gelirse varsayılan değer
        })));
      }
      // --- FIRSATLAR ---
      if (dealsRes.data) {
        setDeals(dealsRes.data.map(item => ({
          id: item.id,
          title: item.name || item.title,
          oldPrice: item.old_price ? `${item.old_price}₺` : '',
          newPrice: `${item.price}₺`,
          image: item.image_url || ""
        })));
      }

      // --- HİKAYELER (İŞLETMELERDEN GELEN) ---
      if (placesRes.data) {
        setStories(placesRes.data.map(item => ({
          id: item.id,
          name: item.name,
          img: item.image_url || "",
          category: item.category
        })));
      }

      if (sliderRes.data) {
        setSlides(sliderRes.data.map(item => ({
          id: item.id,
          title: item.title,
          image: item.image_url,
          tag: item.tag,
          tagColor: item.tag_color || '#0db9f2', // Veri yoksa varsayılan mavi
          targetPath: item.target_path || '',
          targetId: item.target_id || ''
        })));
      }


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

      // --- WIDGETS ---
      if (weatherRes.data) setWeatherTemp(`${weatherRes.data.temp_current}°C`);
      if (prayerRes.data) setNextPrayerTime('Vakit');

    } catch (error) {
      console.error('Anasayfa verileri çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>
            İyi Günler, <Text style={styles.highlightText}>Boğazlıyan</Text> 👋
          </Text>
          <Text style={styles.dateText}>{currentDateStr}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}
          onPress={() => {
            trackButton('notifications', pathname);
            router.push('/pages/notifications');
          }}

        >
          <MaterialIcons name="notifications-none" size={26} color="#4b5563" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>


      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >



        {/* 1. HERO CAROUSEL (DİNAMİK) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.85 + 16}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContainer}
        >
          {slides.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={styles.heroCard}
              onPress={() => {
                trackButton('hero_slider', pathname, {
                  slider_id: item.id,
                  slider_title: item.title,
                  target_path: item.targetPath,
                });

                if (item.targetPath) {
                  router.push({
                    pathname: item.targetPath as any,
                    params: { id: item.targetId },
                  });
                }
              }}

            >
              <Image
                source={{ uri: item.image }}
                style={styles.heroImage}
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={[styles.tagContainer, { backgroundColor: item.tagColor }]}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. BENTO GRID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Bilgi</Text>
          <View style={styles.gridContainer}>

            {/* Weather */}
            <TouchableOpacity activeOpacity={0.9}
              onPress={() => {
                trackButton('quick_weather', pathname);
                router.push('/pages/weather');
              }}


              style={{ width: '100%' }}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.weatherCard}
              >
                <View style={styles.weatherContent}>
                  <View>
                    <Text style={styles.weatherLabel}>Hava Durumu</Text>
                    <Text style={styles.weatherDegree}>{weatherTemp}</Text>
                    <Text style={styles.weatherCondition}>Detaylar için tıkla</Text>
                  </View>
                  <MaterialCommunityIcons name="weather-partly-cloudy" size={64} color="white" />
                </View>
                <View style={styles.decorativeCircle} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.gridRow}>
              {/* Prayer */}
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.9}
                onPress={() => {
                  trackButton('quick_prayer_times', pathname);


                  router.push('/pages/prayer-times');
                }}

              >
                <LinearGradient
                  colors={['#0ba360', '#3cba92']}
                  style={styles.smallInfoCard}
                >
                  <MaterialCommunityIcons name="mosque" size={28} color="white" />
                  <View>
                    <Text style={styles.smallCardLabel}>Namaz Vakitleri</Text>
                    <Text style={styles.smallCardValue}>{nextPrayerTime}</Text>
                    <Text style={styles.smallCardUnit}>Detay</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Pharmacy */}
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.9}
                onPress={() => {
                  trackButton('quick_pharmacy', pathname);


                  router.push('/pages/pharmacy');
                }}

              >
                <LinearGradient
                  colors={['#ff758c', '#ff7eb3']}
                  style={styles.smallInfoCard}
                >
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="local-pharmacy" size={20} color="white" />
                  </View>
                  <View>
                    <Text style={styles.smallCardLabel}>Nöbetçi Eczane</Text>
                    <Text style={styles.smallCardValue} numberOfLines={1}>Görüntüle</Text>
                    <Text style={styles.smallCardUnit}>Haritada Gör</Text>
                  </View>
                  <MaterialIcons name="medical-services" size={60} color="white" style={styles.bgIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- REKLAM ALANI: index-0 --- */}
      {/* getAdByCode('index-0') veri dönerse render eder, yoksa boş geçer */}
      {getAdByCode('index-0') && (
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <PromoCard 
            data={getAdByCode('index-0')!} 
            height={140} // İstersen yüksekliği buradan özel ayarla
          />
        </View>
      )}



        {/* Radyo Banner */}
        <TouchableOpacity style={styles.radioContainer}
          onPress={() => {
            trackButton('radio_banner', pathname);


            router.push('/pages/culture/radioScreen');
          }}

        >
          <LinearGradient
            colors={['rgba(19, 200, 236, 0.15)', 'rgba(19, 200, 236, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.radioGradient}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.radioIconBox}>
                <Radio size={24} color={COLORS.dark} />
              </View>
              <View>
                <Text style={styles.radioTitle}>Radyolar Dinle!</Text>
                <Text style={styles.radioSubtitle}>Boğazlıyan için Radyo Yayınları Dinle!</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.radioPlayBtn} onPress={() => {
            trackButton('radio_banner', pathname);


            router.push('/pages/culture/radioScreen');
          }}>
              <Play size={20} color={COLORS.dark} fill={COLORS.dark} />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>

        {/* 5. HABERLER */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Haberler</Text>
            <TouchableOpacity
              onPress={() => {
                trackButton('see_all_news', pathname);

                router.push('/pages/news');
              }}
            >
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>

          {news.length > 0 ? news.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsItem}
              activeOpacity={0.7}
              onPress={() => {
                trackButton('news_item', pathname, {
                  news_id: item.id,
                  category: item.category,
                });


                router.push({
                  pathname: '/pages/news-detail',
                  params: { id: item.id },
                });
              }}

            >
              <Image source={{ uri: item.image }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.newsMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.categoryText, { color: item.badgeText }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={{ color: '#9ca3af', marginLeft: 4 }}>Haber bulunamadı.</Text>
          )}
        </View>

        {/* 3. FIRSATLAR */}
        {deals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İlçedeki Fırsatlar 🔥</Text>
              <TouchableOpacity

                onPress={() => {


                  trackButton('see_all_click_deals', pathname);

                  router.push('/pages/deals');
                }}>
                <Text style={styles.seeAll}>Tümü</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={deals}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dealCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    trackButton('deal_item', pathname, {
                      deal_id: item.id,
                      price: item.newPrice,
                    });


                    router.push({
                      pathname: '/pages/deal-detail',
                      params: { id: item.id },
                    });
                  }}

                >
                  <View style={styles.dealImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.dealImage} />
                  </View>
                  <View style={styles.dealContent}>
                    <Text style={styles.dealTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.priceRow}>
                      {item.oldPrice ? <Text style={styles.oldPrice}>{item.oldPrice}</Text> : null}
                      <Text style={styles.newPrice}>{item.newPrice}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

     


        {/* 4. YEREL LEZZETLER & HİZMETLER (PLACES TABLOSUNDAN) */}
        {stories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yerel İşletmeler</Text>
              <TouchableOpacity
                onPress={() => {


                  trackButton('see_all_click_places', pathname);


                  router.push('/places');
                }}
              >
                <Text style={styles.seeAll}>Tümü</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={stories}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.storyItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    trackButton('place_item', pathname, {
                      place_id: item.id,
                      place_name: item.name,
                    });


                    router.push({
                      pathname: '/pages/place-detail',
                      params: { id: item.id },
                    });
                  }}

                >
                  <LinearGradient
                    // Tüm işletmeler için standart halka rengi
                    colors={['#facc15', '#f97316', '#9333ea']}
                    style={styles.storyBorder}
                  >
                    <Image source={{ uri: item.img }} style={styles.storyImage} />
                  </LinearGradient>
                  <Text style={styles.storyText} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

       {/* --- REKLAM ALANI: index-1 --- */}
      {getAdByCode('index-1') && (
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <PromoCard 
            data={getAdByCode('index-1')!}
            style={{ borderColor: '#e5e7eb', borderWidth: 1 }} // Örnek stil
          />
        </View>
      )}

        



        {/* 6. İKİNCİ EL */}
        {listings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İkinci El / İlan Vitrini</Text>
              <TouchableOpacity
                onPress={() => {


                  trackButton('section_open_second_hall', pathname);


                  router.push('/pages/second-hand');
                }}

              >
                <Text style={styles.seeAll}>Tümü</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listingsGrid}>
              {listings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listingCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    trackButton('second_hand_item', pathname, {
                      item_id: item.id,
                      price: item.price,
                    });


                    router.push({
                      pathname: '/pages/second-hand-detail',
                      params: { id: item.id },
                    });
                  }}

                >
                  <View style={styles.listingImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.listingImage} />
                    <BlurView intensity={20} style={styles.listingTag}>
                      <Text style={styles.listingTagText}>{item.tag}</Text>
                    </BlurView>
                  </View>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.listingPrice}>{item.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 7. VEFAT İLANLARI */}
        <View style={[styles.section, { paddingBottom: 110 }]}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.obituaryCard}
            onPress={() => router.push('/pages/death-notices')}
          >
            <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
              <Moon size={120} color="white" />
            </View>

            <View style={styles.obituaryHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <UserMinus size={20} color="#9ca3af" />
                <Text style={styles.obituaryTitle}>Vefat İlanları (Bugün)</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: 'bold' }}>
                  {obituaries.length > 0 ? `${obituaries.length} Kişi` : 'Yok'}
                </Text>
              </View>
            </View>

            <View style={styles.obituaryList}>
              {obituaries.length > 0 ? obituaries.map((item) => (
                <View key={item.id} style={styles.obituaryItem}>
                  <View style={styles.dot} />
                  <Text style={styles.obituaryText} numberOfLines={1}>
                    <Text style={{ fontWeight: 'bold', color: 'white' }}>{item.name}</Text>
                    <Text style={{ color: '#9ca3af' }}> ({item.age}) - {item.location}</Text>
                  </Text>
                </View>
              )) : (
                <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Bugün vefat ilanı bulunmamaktadır.</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.obituaryButton}
              onPress={() => router.push('/pages/death-notices')}
            >
              <Text style={styles.obituaryBtnText}>Tüm İlanları Gör</Text>
              <ArrowRight size={16} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  highlightText: {
    color: COLORS.primary,
  },
  dateText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
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

  // Hero Carousel
  carouselContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    marginTop: 16,
  },
  heroCard: {
    width: width * 0.85,
    height: 208,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  tagContainer: {
    backgroundColor: 'rgba(13, 185, 242, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },

  // Sections Common
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Bento Grid
  gridContainer: {
    gap: 16,
  },
  weatherCard: {
    width: '100%',
    height: 128,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
  },
  weatherLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  weatherDegree: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  weatherCondition: { color: 'white', fontSize: 14, fontWeight: '500', marginTop: 4 },
  decorativeCircle: {
    position: 'absolute',
    bottom: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  },

  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallInfoCard: {
    flex: 1,
    height: 160,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: 0.1,
    transform: [{ translateX: 10 }, { translateY: 10 }]
  },
  smallCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  smallCardValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  smallCardUnit: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  // Deals
  horizontalScroll: {
    paddingRight: 24,
  },
  dealCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  dealImageContainer: {
    width: '100%',
    height: 128,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  dealImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  dealContent: { padding: 12 },
  dealTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oldPrice: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  newPrice: { fontSize: 14, color: COLORS.emerald, fontWeight: 'bold' },

  // Stories
  storyItem: { alignItems: 'center', marginRight: 16, gap: 8 },
  storyBorder: { width: 72, height: 72, borderRadius: 36, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyImage: { width: '100%', height: '100%', borderRadius: 36, borderWidth: 3, borderColor: '#fff' },
  storyText: { fontSize: 12, color: '#374151', fontWeight: '500', width: 72, textAlign: 'center' },

  // News
  newsItem: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  newsImage: { width: 96, height: 96, borderRadius: 12, backgroundColor: '#e5e7eb' },
  newsContent: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  newsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, lineHeight: 22 },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { backgroundColor: 'rgba(13, 185, 242, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  timeText: { fontSize: 12, color: '#9ca3af' },

  // Second Hand (Listings)
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listingCard: {
    width: (width - 48 - 16) / 2, // 2 column calculation
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  listingImageContainer: {
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    overflow: 'hidden',
  },
  listingImage: { width: '100%', height: '100%' },
  listingTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  listingTagText: { color: 'white', fontSize: 10, fontWeight: '600' },
  listingTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  listingPrice: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },

  // Obituary
  obituaryCard: {
    backgroundColor: COLORS.slate,
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.slate,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },
  obituaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12
  },
  obituaryTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  obituaryList: { gap: 12 },
  obituaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9ca3af' },
  obituaryText: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  obituaryButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  obituaryBtnText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },


  // RADIO
  radioContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  radioGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(19, 200, 236, 0.1)',
  },
  radioIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  radioSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  radioPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});