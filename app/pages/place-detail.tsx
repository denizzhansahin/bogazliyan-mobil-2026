import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Linking,
  ActivityIndicator,
  Share,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  MapPin,
  Clock,
  Phone,
  MessageCircle, // WhatsApp için
  Navigation,
  Globe,
  Instagram,
  Facebook,
  Plus,
  Info,
  Check,
  X
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');

// --- TİP TANIMLAMALARI ---
interface PlaceDetail {
  id: string;
  name: string;
  type: string;
  priceLevel: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  address: string;
  city: string;
  coverImage: string;
  logo: string;
  phone: string | null;
  description: string | null;
  locationLink: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  openingHours: string | null;
  closingHours: string | null;
  profil_photo: string | null;
}

interface ProductUI {
  id: string;
  name: string;
  desc: string;
  price: string;
  image: string;
  isSoldOut: boolean;
}

interface CampaignUI {
  id: string;
  title: string;
  desc: string;
  tag: string;
  gradient: string[];
  btnText: string;
}

// --- RENKLER (HTML'den alındı) ---
const COLORS = {
  primary: '#0db9f2',
  secondary: '#111618',
  bg: '#f3f5f6',
  white: '#ffffff',
  textDark: '#111618',
  textGray: '#6b7280',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  whatsapp: '#25D366',
};

{/* 
// --- MOCK DATA (Divan Restoran) ---
const PLACE_DATA = {
  id: '1',
  name: 'Divan Restoran',
  type: 'Restoran • Türk Mutfağı',
  priceLevel: '₺₺',
  rating: 4.8,
  reviewCount: 128,
  isOpen: true,
  address: 'Mevlana Mah. Cumhuriyet Cad. No:14',
  city: 'Boğazlıyan, Yozgat',
  hours: '09:00 - 22:00',
  closingInfo: 'Kapanışa 2 saat kaldı',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9R0cWhBuC7holoJvabXABn_fZZCLjdCaW8WLqblqOHqfC_F8TTZUD6E9gbbOTgLVhYmgBPQhcmM5ZMm7X1xwzqVLFkM8fTOn3pMqn08trfVSTT86mU0mBxRNTII58rI5rLp9rkK__2Aqh6w5fwDGs3P6LfhouaJWHfT9WmSBb7gjf0N3wtnSdHYk-i5z6YyfjB4WRyyaUzH9f4TJecE4A_TuI3YonF743fmp0aYER-BAbkEd1sEEyL1OpGyN9cERHgB-o6Hs8bw', // HTML'deki görsel linki veya Unsplash
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcM-bBBcfuIdwUEFtbwrERlHRFTQpab5uC70pET2kxwwEweakjGZCEWXGKCOUmM7tKODO2Oz4zltjoqb6pFxwNyh2JOQe6FzjaTtt9xcnE9dwAHpaokoLJc9dotISwI1uSD_kYcumiR8DhdLW5cWl3mRNWjFkkdYR1QYheLdQQuOzPxmybtLeodbvI1yYs-oGmJg_vfBDBpPr6Um0vKagky_YtH5w1XCX1nNFZCKegxjuLv84rbS2zTlteroSu3KJ46SpTq54-mg',
  phone: '+905551234567',
};

const PRODUCTS = [
  {
    id: '1',
    name: 'Özel Divan Kebabı',
    desc: 'Közlenmiş patlıcan yatağında, özel soslu kuzu şiş, domates ve biber ile.',
    price: '240₺',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200',
  },
  {
    id: '2',
    name: 'Karışık Izgara',
    desc: 'Adana kebap, kuzu şiş, tavuk şiş ve pirzola. Pilav eşliğinde.',
    price: '320₺',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=200',
  },
  {
    id: '3',
    name: 'Türk Kahvesi',
    desc: 'Geleneksel sunum ve çifte kavrulmuş lokum ile.',
    price: '60₺',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=200',
  },
  {
    id: '4',
    name: 'Tavuk Kanat',
    desc: 'Özel soslu tavuk kanat ızgara. Patates tava ile.',
    price: '180₺',
    image: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200',
    isSoldOut: true,
  },
];

const CAMPAIGNS = [
  {
    id: '1',
    title: '3 Al 2 Öde!',
    desc: 'Tüm tatlı çeşitlerinde geçerli, arkadaşınla gel tatlın bizden olsun.',
    tag: 'Süreli Fırsat',
    gradient: ['#f97316', '#ef4444'], // Orange to Red
    btnText: 'Fırsatı Yakala',
    btnColor: 'text-orange-600'
  },
  {
    id: '2',
    title: '%15 İndirim',
    desc: 'Öğrenci kimliğini göster, 12:00 - 14:00 arası tüm menülerde indirimi kap.',
    tag: 'Öğrenciye Özel',
    gradient: ['#3b82f6', '#0db9f2'], // Blue to Cyan
    btnText: 'Detaylar',
    btnColor: 'text-blue-600'
  }
];
*/}


// --- TİP TANIMLARI ---
interface ComparisonItem {
  img: string;
}

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const { id } = useLocalSearchParams(); // İleride ID'ye göre veri çekeceğiz


  useEffect(() => {
    if (!id) return;
    trackEvent('place_detail_view', {
      item_id: id,
      item_type: 'place_detail',
    });

  }, [id]);

  const [activeTab, setActiveTab] = useState<'products' | 'campaigns'>('products');

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  // Link Fonksiyonları
  //const handleCall = () => Linking.openURL(`tel:${PLACE_DATA.phone}`);
  //const handleWhatsapp = () => Linking.openURL(`https://wa.me/${PLACE_DATA.phone}`);
  //const handleMap = () => Linking.openURL('https://maps.google.com');


  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignUI[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaceData();
  }, [id]);


  const fetchPlaceData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // 1. Mekan Detaylarını Çek (Kategori ismiyle)
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .select(`*, categories(label)`)
        .eq('id', id)
        .single();

      if (placeError) throw placeError;

      // 2. Mekanın Ürünlerini Çek
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('place_id', id);

      // 3. Mekanın Kampanyalarını Çek (Many-to-Many)
      const { data: campaignsData } = await supabase
        .from('campaign_places')
        .select(`
          campaign:campaigns (
            id, title, description, badge, start_date, end_date
          )
        `)
        .eq('place_id', id);

      // --- VERİ DÖNÜŞÜMÜ (UI Formatına) ---

      if (placeData) {
        setPlace({
          id: placeData.id,
          name: placeData.name,
          // @ts-ignore
          type: `${placeData.categories?.label || 'Mekan'}`, // Kategori ve Alt tür
          priceLevel: '₺₺', // DB'de yoksa varsayılan
          rating: placeData.rating || 0,
          reviewCount: placeData.reviewCount || 0, // Mock review count
          isOpen: true, // Saat kontrolü eklenebilir
          address: placeData.address || '',
          city: placeData.city || '',
          coverImage: placeData.image_url || "",
          logo: placeData.image_url || "",
          phone: placeData.phone,
          description: placeData.description,
          locationLink: placeData.locationLink,
          whatsapp: placeData.whatsapp,
          instagram: placeData.instagram,
          facebook: placeData.facebook,
          website: placeData.website,
          openingHours: placeData.openingHours,
          closingHours: placeData.closingHours,
          profil_photo: placeData.profil_photo || placeData.image_url || ""
        });
      }

      if (productsData) {
        setProducts(productsData.map(p => ({
          id: p.id,
          name: p.name,
          desc: p.description || '',
          price: `${p.price}₺`,
          image: p.image_url || "",
          isSoldOut: !p.is_available
        })));
      }

      if (campaignsData) {
        setCampaigns(campaignsData.map((item: any) => ({
          id: item.campaign.id,
          title: item.campaign.title,
          desc: item.campaign.description || '',
          tag: item.campaign.badge || 'Fırsat',
          gradient: ['#f97316', '#ef4444'], // Statik gradient (DB'ye renk kodu eklenebilir)
          btnText: 'Fırsatı Yakala'
        })));
      }

    } catch (error) {
      console.error('Mekan detay hatası:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        message: `${place.name} - ${place.phone} - ${place.address} - ${place.description}   \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };


  // Link Fonksiyonları
  const handleCall = () => {
    if (place?.phone) Linking.openURL(`tel:${place.phone}`);
    else alert("Telefon bilgisi bulunamadı.");
  };
  const handleWhatsapp = () => {
    if (place?.whatsapp) Linking.openURL(`https://wa.me/${place.whatsapp}`);
    else alert("WhatsApp bilgisi bulunamadı.");
  };
  // Harita linki (Koordinat varsa Google Maps açar)
  const handleMap = () => {
    if (place?.locationLink) Linking.openURL(place.locationLink);
    else alert("Konum bilgisi bulunamadı.");
  };


  // Harita linki (Koordinat varsa Google Maps açar)
  const handleWebSite = () => {
    if (place?.website) Linking.openURL(place.website);
    else alert("WebSite bilgisi bulunamadı.");
  };

  // Harita linki (Koordinat varsa Google Maps açar)
  const handleFacebook = () => {
    if (place?.facebook) Linking.openURL(place.facebook);
    else alert("Facebook bilgisi bulunamadı.");
  };


  // Harita linki (Koordinat varsa Google Maps açar)
  const handleInstagram = () => {
    if (place?.instagram) Linking.openURL(place.instagram);
    else alert("Instagram bilgisi bulunamadı.");
  };





  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!place) return null;

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>


      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          {/* reklam */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => { setSelectedImage(null) }}
          >
            <X size={30} color="white" />
          </TouchableOpacity>

          {place && (
            <View style={styles.modalContent}>
              

              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }} // State'deki resmi kullanıyoruz
                  style={styles.modalImage}
                  contentFit="contain"
                />
              )}
            </View>
          )}
        </View>
      </Modal>



      {/* --- MEVCUT RESİM MODALININ ALTINA EKLEYİN --- */}
      <Modal
        visible={isDescriptionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDescriptionModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.descModalContent}>
            <View style={styles.descModalHeader}>
              <Text style={styles.descModalTitle}>Hakkında</Text>
              <TouchableOpacity onPress={() => setDescriptionModalVisible(false)}>
                <X size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.descModalText}>{place?.description}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatusBar barStyle="light-content" />

      {/* Ana ScrollView - Sticky Header Indices: [1] (Tab Kısmı) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* BÖLÜM 0: ÜST KISIM (Kapak, Profil, İletişim Butonları) */}
        <View style={{ backgroundColor: COLORS.bg }}>
          {/* Cover Image & Header Actions */}
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: place.coverImage }} // HTML'deki cover görseli yerine kaliteli Unsplash
              style={styles.coverImage}
              contentFit="cover"
            />
            <View style={styles.overlay} />

            {/* Header Absolute Buttons */}
            <View style={styles.headerSafeArea}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
                  <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* Header Absolute Buttons
                  <TouchableOpacity style={styles.glassBtn}>
                    <Heart size={22} color="white" />
                  </TouchableOpacity>
                  */}

                  <TouchableOpacity style={styles.glassBtn} onPress={handleShare}>
                    <Share2 size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Profile Info Overlay (Bottom Left) */}
            <TouchableOpacity style={styles.profileOverlay}
              onPress={() => {
                if (place.profil_photo) {
                  setSelectedImage(place.profil_photo);
                }
              }}
            >
              <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                  <Image
                    source={{ uri: place.profil_photo }} // Logo temsili
                    style={styles.logoImage}
                  />
                </View>
                <View style={{ flex: 1, paddingBottom: 4 }}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeType}>
                    {place.type} • <Text style={{ color: '#d1d5db' }}>{place.priceLevel}</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.bodyContent}>

            {/* Rating & Status Row */}
            <View style={styles.statusRow}>
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Star size={14} color={COLORS.orange} fill={COLORS.orange} />
                  <Text style={styles.ratingText}>{place.rating}</Text>
                </View>

                <Text style={styles.reviewText}>{place.reviewCount} Değerlendirme</Text>
                *

              </View>

              <View style={[styles.openBadge, { backgroundColor: place.isOpen ? '#ecfdf5' : '#fef2f2' }]}>
                <View style={[styles.pulsingDot, { backgroundColor: place.isOpen ? COLORS.green : COLORS.red }]} />
                <Text style={[styles.openText, { color: place.isOpen ? '#059669' : '#dc2626' }]}>
                  {place.isOpen ? 'Şu an Açık' : 'Kapalı'}
                </Text>
              </View>
            </View>

            {/* Address & Hours */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <MapPin size={18} color={COLORS.textGray} />
                </View>
                <View>
                  <Text style={styles.infoTitle}>{place.address}</Text>
                  <Text style={styles.infoSubtitle}>{place.city}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Clock size={18} color={COLORS.textGray} />
                </View>
                <View>
                  <Text style={styles.infoTitle}>{place.openingHours} - {place.closingHours}</Text>

                  {/* Address & Hours
                  <Text style={styles.closingText}>{place.closingInfo}</Text>
                  */}

                </View>
              </View>
            </View>
            {/* reklam */}
            
            {/* Action Buttons Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(13, 185, 242, 0.1)' }]} onPress={handleCall}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primary }]}>
                  <Phone size={20} color="white" />
                </View>
                <Text style={[styles.actionText, { color: COLORS.primary }]}>Ara</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]} onPress={handleWhatsapp}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.whatsapp }]}>
                  <MessageCircle size={20} color="white" />
                </View>
                <Text style={[styles.actionText, { color: '#15803d' }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(17, 22, 24, 0.05)' }]} onPress={handleMap}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary }]}>
                  <Navigation size={20} color="white" />
                </View>
                <Text style={[styles.actionText, { color: COLORS.secondary }]}>Yol Tarifi</Text>
              </TouchableOpacity>
            </View>

            {/* Social Links (Horizontal Scroll) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialScroll}>
              <TouchableOpacity style={styles.socialPill} onPress={handleInstagram}>
                <Instagram size={16} color="#c13584" />
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialPill} onPress={handleFacebook}>
                <Facebook size={16} color="#1877f2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialPill} onPress={handleWebSite}>
                <Globe size={16} color={COLORS.textGray} />
                <Text style={styles.socialText}>Website</Text>
              </TouchableOpacity>
            </ScrollView>
            {/* --- YENİ EKLENEN KISIM: AÇIKLAMA --- */}
            {place.description && (
              <TouchableOpacity
                style={styles.descriptionContainer}
                onPress={() => setDescriptionModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.descriptionHeader}>
                  <Info size={16} color={COLORS.primary} />
                  <Text style={styles.descriptionTitle}>İşletme Hakkında</Text>
                </View>
                <Text style={styles.descriptionPreview}>
                  {place.description.length > 100
                    ? `${place.description.substring(0, 100)}...`
                    : place.description}
                  {place.description.length > 100 && (
                    <Text style={styles.readMoreText}> Devamını Oku</Text>
                  )}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        {/* BÖLÜM 1: STICKY TABS */}
        <View style={styles.stickyTabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              Ürünler & Menü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'campaigns' && styles.tabItemActive]}
            onPress={() => setActiveTab('campaigns')}
          >
            <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>
              Kampanyalar
            </Text>
            {campaigns.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{campaigns.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BÖLÜM 2: İÇERİK */}
        <View style={styles.contentArea}>
          {activeTab === 'products' ? (
            /* ÜRÜNLER LİSTESİ */
            <View style={styles.listContainer}>
              {products.length > 0 ? products.map((item) => (
                <TouchableOpacity key={item.id} style={styles.productCard}
                  onPress={() => router.push({
                    pathname: '/pages/deal-detail',
                    params: { id: item.id }
                  })}
                >
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <View>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productDesc} numberOfLines={2}>{item.desc}</Text>
                    </View>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>{item.price}</Text>
                      {item.isSoldOut ? (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutText}>Tükendi</Text>
                        </View>
                      ) : (

                        <TouchableOpacity style={styles.addBtn}>
                          <Check size={18} color={COLORS.textDark} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <Text style={{ textAlign: 'center', color: COLORS.textGray, marginTop: 20 }}>Henüz ürün eklenmemiş.</Text>
              )}
            </View>
          ) : (
            /* KAMPANYALAR LİSTESİ */
            <View style={styles.listContainer}>
              {campaigns.length > 0 ? campaigns.map((camp) => (
                <LinearGradient
                  key={camp.id}
                  colors={camp.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.campaignCard}
                >
                  <TouchableOpacity style={styles.campaignContent}
                    onPress={() => router.push({
                      pathname: '/pages/campaigns-detail',
                      params: { id: camp.id }
                    })}
                  >
                    <View style={styles.campaignTag}>
                      <Text style={styles.campaignTagText}>{camp.tag}</Text>
                    </View>
                    <Text style={styles.campaignTitle}>{camp.title}</Text>
                    <Text style={styles.campaignDesc}>{camp.desc}</Text>
                    <TouchableOpacity style={styles.campaignBtn}>
                      <Text style={[styles.campaignBtnText, { color: camp.gradient[0] }]}>
                        {camp.btnText}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {/* Decorative Blur Circles */}
                  <View style={styles.blurCircle1} />
                  <View style={styles.blurCircle2} />
                </LinearGradient>
              )) : (
                <Text style={{ textAlign: 'center', color: COLORS.textGray, marginTop: 20 }}>Aktif kampanya bulunmuyor.</Text>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // COVER & HEADER
  coverContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    // Gradient overlay simülasyonu (basit)
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    //paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', // Backdrop blur alternatifi
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Profile Info Overlay
  profileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  placeName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 10,
    marginBottom: 4,
  },
  placeType: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },

  // BODY CONTENT
  bodyContent: {
    backgroundColor: COLORS.bg,
    paddingTop: 16,
    paddingHorizontal: 20,
  },

  // Rating & Status
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed', // Orange-50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: COLORS.orange,
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    fontSize: 13,
    color: COLORS.textGray,
    textDecorationLine: 'underline',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Info Section
  infoSection: {
    paddingVertical: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6', // Gray-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  infoSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 2,
  },
  closingText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '500',
    marginTop: 2,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Socials
  socialScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // STICKY TABS
  stickyTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  tabTextActive: {
    color: COLORS.textDark,
  },
  badge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // CONTENT AREA
  contentArea: {
    paddingHorizontal: 20,
  },
  listContainer: {
    gap: 16,
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  productDesc: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 4,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Campaign Card
  campaignCard: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 160,
  },
  campaignContent: {
    zIndex: 2,
  },
  campaignTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  campaignTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  campaignTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  campaignDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 16,
  },
  campaignBtn: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  campaignBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  blurCircle1: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blurCircle2: {
    position: 'absolute',
    top: -30,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },



  // MODAL STYLES
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Koyu arka plan
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: '70%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalYear: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },


  // --- AÇIKLAMA ALANI (PREVIEW) ---
  descriptionContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  descriptionPreview: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 20,
  },
  readMoreText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // --- AÇIKLAMA MODALI ---
  // Not: styles.modalContainer zaten vardı, onu kullanıyoruz.
  descModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  descModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  descModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  descModalText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});