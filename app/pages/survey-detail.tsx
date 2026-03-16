import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  Users,
  Info, 
  FileText,
  ExternalLink,
  Share2
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  border: '#e2e8f0',
  green: '#22c55e',
  greenBg: 'rgba(34, 197, 94, 0.1)',
  surface: '#ffffff',
};

// --- TİP TANIMI ---
interface SurveyDetail {
  id: string;
  title: string;
  publisher: string;
  publisherImg: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string;
  access: string;
  image: string;
  description: string;
  content: string[]; // Paragraflar
  bulletPoints: string[];
  surveyUrl: string;
}

export default function SurveyDetailScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const { id } = useLocalSearchParams();

    useEffect(() => {
              if (!id) return;
                trackEvent('survey_detail_view', {
                  item_id: id,
                  item_type: 'survey_detail',
                });
          
            }, [id]);
  
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveyDetail();
  }, [id]);

  const fetchSurveyDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Tarih Formatlama
        const startDateObj = new Date(data.start_date || '');
        const endDateObj = new Date(data.end_date || '');
        const isExpired = new Date() > endDateObj;

        // JSON Parse
        let bullets: string[] = [];
        if (data.bullet_points) {
            // @ts-ignore
            if (Array.isArray(data.bullet_points)) bullets = data.bullet_points;
            // @ts-ignore
            else if (typeof data.bullet_points === 'string') bullets = JSON.parse(data.bullet_points);
        }

        // Açıklamayı parçala (Basitçe 2 paragrafa bölüyoruz simülasyon için)
        const fullDesc = data.full_description || '';
        const splitIndex = fullDesc.indexOf('.', fullDesc.length / 2); // Ortaya yakın bir noktadan böl
        const p1 = splitIndex > 0 ? fullDesc.substring(0, splitIndex + 1) : fullDesc;
        const p2 = splitIndex > 0 ? fullDesc.substring(splitIndex + 1).trim() : '';

        const formattedSurvey: SurveyDetail = {
          id: data.id,
          title: data.title,
          publisher: data.publisher_name || 'Belediye',
          publisherImg: data.publisher_logo || "",
          status: isExpired ? 'Sona Erdi' : 'Aktif',
          category: data.category || 'Genel',
          startDate: startDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          endDate: endDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          access:  data.access|| 'Herkese Açık',
          image: data.image_url || "",
          description: data.short_description || '',
          content: [p1, p2].filter(Boolean),
          bulletPoints: bullets,
          surveyUrl: data.survey_url || ''
        };

        setSurvey(formattedSurvey);
      }
    } catch (error) {
      console.error('Anket detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSurvey = () => {
    if (survey?.surveyUrl) {
        Linking.openURL(survey.surveyUrl);
    } else {
        alert("Anket linki bulunamadı.");
    }
  };

  const handleShare = async () => {
    if (!survey) return;
    try {
        await Share.share({
            message: `Ankete Katılın: ${survey.title} \n${survey.description} \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
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

  if (!survey) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Anket bulunamadı.</Text>
      </View>
    );
  }

  return (
 <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (Sticky) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anket Detayı</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
            <Share2 size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
         {/* reklam */}
        {/* 2. HERO IMAGE */}
        <View style={styles.heroContainer}>
          
          <Image source={{ uri: survey.image }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroGradient}
          />
          
          {/* Badges */}
          <View style={styles.badgeRow}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, survey.status === 'Sona Erdi' && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={styles.pulsingDotWrapper}>
                <View style={[styles.dotCore, survey.status === 'Sona Erdi' && { backgroundColor: '#ef4444' }]} />
                {survey.status === 'Aktif' && <View style={styles.dotRing} />}
              </View>
              <Text style={[styles.statusText, survey.status === 'Sona Erdi' && { color: '#b91c1c' }]}>{survey.status}</Text>
            </View>

            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{survey.category}</Text>
            </View>
          </View>
        </View>

        {/* 3. TITLE & PUBLISHER */}
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{survey.title}</Text>
          
          <View style={styles.publisherRow}>
            <Image source={{ uri: survey.publisherImg }} style={styles.pubImage} />
            <View>
              <Text style={styles.pubLabel}>Yayıncı</Text>
              <Text style={styles.pubName}>{survey.publisher}</Text>
            </View>
          </View>
        </View>

        {/* 4. INFO GRID */}
        <View style={styles.gridContainer}>
          {/* Start Date */}
          <View style={styles.gridItem}>
            <View style={styles.gridLabelRow}>
              <Calendar size={16} color={COLORS.primary} />
              <Text style={styles.gridLabel}>BAŞLANGIÇ</Text>
            </View>
            <Text style={styles.gridValue}>{survey.startDate}</Text>
          </View>

          {/* End Date */}
          <View style={styles.gridItem}>
            <View style={styles.gridLabelRow}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.gridLabel}>BİTİŞ</Text>
            </View>
            <Text style={styles.gridValue}>{survey.endDate}</Text>
          </View>

          {/* Access */}
          <View style={[styles.gridItem, styles.gridItemFull]}>
            <View>
              <View style={styles.gridLabelRow}>
                <Users size={16} color={COLORS.primary} />
                <Text style={styles.gridLabel}>KATILIM</Text>
              </View>
              <Text style={styles.gridValue}>{survey.access}</Text>
            </View>
            <Info size={18} color="#cbd5e1" />
          </View>
        </View>
{/* reklam */}
        <View style={styles.divider} />

        {/* 5. DESCRIPTION */}
        <View style={styles.descSection}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Açıklama</Text>
          </View>

          <Text style={styles.paragraph}>{survey.description}</Text>
          
          {/* İçerik Paragraf 1 */}
          {survey.content.length > 0 && <Text style={styles.paragraph}>{survey.content[0]}</Text>}

          {/* Bullet Points */}
          <View style={styles.bulletList}>
            {survey.bulletPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* İçerik Paragraf 2 */}
          {survey.content.length > 1 && <Text style={styles.paragraph}>{survey.content[1]}</Text>}
        </View>

      </ScrollView>

      {/* 6. BOTTOM BAR (Sadece aktifse göster) */}
      {survey.status === 'Aktif' && (
        <View style={[styles.bottomBar,{paddingBottom: insets.bottom}]}>
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoinSurvey}>
            <Text style={styles.joinBtnText}>Ankete Katıl</Text>
            <ExternalLink size={18} color="white" />
            </TouchableOpacity>
            <Text style={styles.bottomHint}>Anket harici bir tarayıcıda açılacaktır.</Text>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    //marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 120, 
  },

  // HERO
  heroContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // Green bg
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backdropFilter: 'blur(4px)',
  },
  pulsingDotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    zIndex: 2,
  },
  dotRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.5)',
    zIndex: 1,
  },
  statusText: {
    color: '#15803d', 
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    backgroundColor: 'rgba(19, 200, 236, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(19, 200, 236, 0.3)',
    backdropFilter: 'blur(4px)',
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // TITLE & PUBLISHER
  mainInfo: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.dark,
    lineHeight: 32,
    marginBottom: 16,
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pubImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pubLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    fontWeight: '600',
  },
  pubName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },

  // GRID
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    width: (width - 40 - 12) / 2, 
    backgroundColor: '#f8fafc', 
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 20,
  },

  // DESCRIPTION
  descSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  bulletList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  bulletText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },

  // BOTTOM BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  joinBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
  },
});