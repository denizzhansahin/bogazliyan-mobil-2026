import React, { useEffect, useState } from 'react';
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
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  MapPin,
  BadgeCheck, // Verified icon
  Banknote, // Payments
  Clock,
  Briefcase, // Experience
  Store,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  Send,
  MessageCircleIcon
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

// --- RENKLER ---
const COLORS = {
  primary: '#137fec',
  bg: '#f8f9fa',
  white: '#ffffff',
  textDark: '#111418',
  textGray: '#617589',
  border: '#e2e8f0',
  // Metadata Colors
  blueBg: '#e0f2fe', // blue-50/100 equivalent
  blueText: '#0284c7',
  orangeBg: '#ffedd5',
  orangeText: '#ea580c',
  purpleBg: '#f3e8ff',
  purpleText: '#7e22ce',
  tealBg: '#ccfbf1',
  tealText: '#0f766e',
};

{/* 
// --- MOCK DATA ---
const JOB_DETAIL = {
  id: '1',
  title: 'Satış Danışmanı',
  company: 'Boğazlıyan Tekstil A.Ş.',
  verified: true,
  location: 'Merkez, Boğazlıyan',
  logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=200', // Logo temsili
  salary: '17B - 22B ₺',
  type: 'Tam Zamanlı',
  experience: 'En az 2 yıl',
  sector: 'Perakende',
  description: 'Mağazamızda müşterilerimize ürünlerimiz hakkında bilgi verecek, satış süreçlerini yönetecek ve müşteri memnuniyetini en üst düzeyde tutacak ekip arkadaşları arıyoruz. Günlük mağaza düzenini sağlamak, stok takibi yapmak ve kasa işlemlerine destek olmak da sorumluluklarınız arasında yer alacaktır.',
  qualifications: [
    'Lise veya üniversite mezunu',
    'İletişim becerileri güçlü ve takım çalışmasına yatkın',
    'Vardiyalı çalışma sistemine uyum sağlayabilecek',
    'Boğazlıyan merkez veya yakın çevrede ikamet eden'
  ]
};
*/}

// --- UI TİP TANIMI ---
interface JobDetail {
  id: string;
  title: string;
  company: string;
  verified: boolean;
  location: string;
  logo: string;
  salary: string;
  type: string;
  experience: string;
  sector: string;
  description: string;
  qualifications: string[];
  phone: string | null;
  whatsapp: string | null;
  applyLink: string | null;
}

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();


    useEffect(() => {
      if (!id) return;
        trackEvent('job_detail_view', {
          item_id: id,
          item_type: 'job_detail',
        });
  
    }, [id]);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // 🟢 ÖNEMLİ DEĞİŞİKLİK: place (işletme) verisini de çekiyoruz (join)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          place:places (
            id,
            name,
            image_url,
            address,
            phone,
            rating,
            whatsapp,
            instagram,
            facebook
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Requirements JSON parse işlemi (Aynı)
        let quals: string[] = [];
        if (data.requirements) {
          // @ts-ignore
          if (Array.isArray(data.requirements)) quals = data.requirements;
          // @ts-ignore
          else if (typeof data.requirements === 'string') quals = JSON.parse(data.requirements);
        }

        // 🟢 MANTIK: Eğer place bağlıysa oradan al, yoksa manuel girileni kullan
        const companyName = data.place?.name || data.company_name || 'İsimsiz İşveren';
        const companyLogo = data.place?.image_url || "";
        const companyLocation = data.place?.address || data.location || 'Konum Belirtilmedi';
        const companyPhone = data.place?.phone || data.contact_phone; // İşletme telefonu öncelikli
        const companyPhoneWhatsApp = data.place?.whatsapp || data.whatsapp;

        const companyApplyLink = data.applyLink || data.place?.instagram || data.place?.facebook; // İşletme telefonu öncelikli


        const formattedJob: JobDetail = {
          id: data.id,
          title: data.title,

          // İşletme Bilgileri (Dinamik)
          company: companyName,
          logo: companyLogo,
          location: companyLocation,
          phone: companyPhone,

          // İşletme ID'sini de sakla (Profil butonu için)
          // @ts-ignore
          placeId: data.place?.id || null,


          verified: !!data.place, // Eğer bir işletmeye bağlıysa "Onaylı" rozeti göster

          salary: data.salary_range || 'Belirtilmedi',
          type: data.type || 'Tam Zamanlı',
          experience: 'Tecrübeli/Tecrübesiz',
          sector: data.category || 'Genel',
          description: data.description || 'Açıklama bulunmuyor.',
          qualifications: quals.length > 0 ? quals : ['Genel başvuru şartları geçerlidir.'],
          whatsapp : companyPhoneWhatsApp,
          applyLink : companyApplyLink
        };

        setJob(formattedJob);
      }
    } catch (error) {
      console.error('İlan detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Telefonla Başvuru Fonksiyonu
  const handleApply = () => {
    if (job?.applyLink) {
      Linking.openURL(job.applyLink);
    } else {
      alert("Başvuru numarası veya linki bulunamadı.");
    }
  };

  const handleWhatsapp = () => {
    if (job?.whatsapp) Linking.openURL(`https://wa.me/${job.whatsapp}`);
    else alert("WhatsApp bilgisi bulunamadı.");
  };
  // 

  // 🟢 GÜNCELLENEN: İşletme Profiline Git
  const goToCompanyProfile = () => {
    // @ts-ignore - placeId'yi JobDetail tipine eklediğimizi varsayıyoruz
    if (job?.placeId) {
      router.push({
        pathname: '/pages/place-detail',
        // @ts-ignore
        params: { id: job.placeId } // İşletme ID'si ile git
      });
    } else {
      alert("Bu ilan kurumsal bir işletme profiline bağlı değil.");
    }
  };

  const handleShare = async () => {
      if (!job) return;
      try {
        await Share.share({
          message: `${job.title} - ${job.phone} - ${job.company} - ${job.description} - ${job.applyLink}   \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
        });
      } catch (error) {
        console.log(error);
      }
    };
  

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>İlan bulunamadı.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Sticky) */}
      <View style={{ backgroundColor: 'white' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlan Detayı</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 2. JOB IDENTITY */}
        <View style={styles.identitySection}>
          <View style={styles.logoWrapper}>
            <Image source={{ uri: job.logo }} style={styles.logo} contentFit="cover" />
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.companyRow}>
            <Text style={styles.companyName}>{job.company}</Text>
            {job.verified && <BadgeCheck size={18} color={COLORS.primary} fill="transparent" />}
          </View>

          <View style={styles.locationRow}>
            <MapPin size={16} color={COLORS.textGray} />
            <Text style={styles.locationText}>{job.location}</Text>
          </View>
        </View>

        {/* 3. METADATA GRID */}
        <View style={styles.gridContainer}>
          {/* Maaş */}
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 127, 236, 0.1)' }]}>
              <Banknote size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>Maaş Aralığı</Text>
            <Text style={styles.gridValue}>{job.salary}</Text>
          </View>

          {/* Çalışma Şekli */}
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
              <Clock size={20} color={COLORS.orangeText} />
            </View>
            <Text style={styles.gridLabel}>Çalışma Şekli</Text>
            <Text style={styles.gridValue}>{job.type}</Text>
          </View>

          {/* Deneyim */}
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(126, 34, 206, 0.1)' }]}>
              <Briefcase size={20} color={COLORS.purpleText} />
            </View>
            <Text style={styles.gridLabel}>Deneyim</Text>
            <Text style={styles.gridValue}>{job.experience}</Text>
          </View>

          {/* Sektör */}
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(15, 118, 110, 0.1)' }]}>
              <Store size={20} color={COLORS.tealText} />
            </View>
            <Text style={styles.gridLabel}>Sektör</Text>
            <Text style={styles.gridValue}>{job.sector}</Text>
          </View>
        </View>

        {/* 4. DESCRIPTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPill} />
            <Text style={styles.sectionTitle}>İş Tanımı</Text>
          </View>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        {/* 5. QUALIFICATIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPill} />
            <Text style={styles.sectionTitle}>Aranan Nitelikler</Text>
          </View>
          <View style={styles.listContainer}>
            {job.qualifications.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <CheckCircle2 size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. COMPANY CARD (GÜNCELLENDİ) */}
        <View style={styles.companyCard}>
          <View style={styles.companyCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: job.logo }} style={styles.smallLogo} />
              <View>
                <Text style={styles.cardCompanyName}>{job.company}</Text>
                <Text style={styles.cardIndustry}>Tekstil & Moda</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={goToCompanyProfile} // Yönlendirme eklendi
            >
              <ChevronRight size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={goToCompanyProfile} // Yönlendirme eklendi
          >
            <Store size={18} color={COLORS.textGray} />
            <Text style={styles.profileBtnText}>İşletme Profilini Görüntüle</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>


      {/* 7. BOTTOM FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookmarkBtn} onPress={handleWhatsapp}>
          <MessageCircleIcon size={24} color={COLORS.textGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApply}
        >
          <Send size={20} color="white" />
          <Text style={styles.applyBtnText}>Hemen Başvur</Text>
        </TouchableOpacity>
      </View>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },

  content: {
    paddingBottom: 100, // Footer payı
  },

  // Identity
  identitySection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#f1f5f9',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: 'white',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textGray,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (Dimensions.get('window').width - 32 - 12) / 2, // 2 Sütun
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '500',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionPill: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },

  // Company Card
  companyCard: {
    marginHorizontal: 16,
    backgroundColor: '#f8fafc', // Slate-50 equivalent
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  companyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cardCompanyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  cardIndustry: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  chevronBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  bookmarkBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
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
  applyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});