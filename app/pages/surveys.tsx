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
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  Landmark,
  Shield,
  Palette,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Vote
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#618389',
  border: '#e2e8f0',
  orange: '#f97316',
  orangeBg: '#fff7ed',
};

// --- TİP TANIMI ---
interface SurveyUI {
  id: string;
  title: string;
  desc: string;
  timeLeft: string;
  institution: string;
  image: string;
  isNew: boolean;
  icon: any; // Lucide icon component
  isCompleted: boolean;
  resultText?: string;
}



export default function SurveysScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [surveys, setSurveys] = useState<SurveyUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .order('end_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const today = new Date();

        const formattedData: SurveyUI[] = data.map((item) => {
          const endDate = new Date(item.end_date || '');
          const isCompleted = today > endDate;

          // Kalan gün hesapla
          const diffTime = Math.abs(endDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const timeLeft = isCompleted ? 'Sona Erdi' : `${diffDays} gün kaldı`;

          // Kategoriye göre ikon seçimi (Basit mantık)
          let Icon = Vote;
          if (item.category?.includes('Kültür')) Icon = Palette;
          else if (item.category?.includes('Güvenlik')) Icon = Shield;
          else if (item.category?.includes('Belediye')) Icon = Landmark;

          return {
            id: item.id,
            title: item.title,
            desc: item.short_description || '',
            timeLeft: timeLeft,
            institution: item.publisher_name || 'Belediye',
            image: item.image_url || "",
            isNew: diffDays > 10, // Örnek: Bitişe 10 günden fazla varsa "Yeni"
            icon: Icon,
            isCompleted: isCompleted,
            resultText: isCompleted ? 'Sonuçlandı' : undefined
          };
        });

        setSurveys(formattedData);
      }
    } catch (error) {
      console.error('Anketler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gruplama
  const activeSurveys = surveys.filter(s => !s.isCompleted);
  const completedSurveys = surveys.filter(s => s.isCompleted);

  // Hero Survey (İlk aktif anket)
  const heroSurvey = activeSurveys.length > 0 ? activeSurveys[0] : null;
  // Diğer Aktif Anketler (Hero hariç)
  const otherActiveSurveys = activeSurveys.slice(1);

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anketler</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
 {/* reklam */}
          <Text style={styles.introText}>
            Şehrimizin geleceğine yön vermek için güncel anketlere katılın. Görüşleriniz bizim için değerli.
          </Text>

          {/* 2. HERO CARD (Main Poll) */}
          {heroSurvey && (
            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.heroCard}
              onPress={() => router.push({ pathname: '/pages/survey-detail', params: { id: heroSurvey.id } })}
            >
              <View style={styles.heroImageContainer}>
                <Image source={{ uri: heroSurvey.image }} style={styles.heroImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)']}
                  style={styles.heroGradient}
                />
                <View style={styles.timeBadge}>
                  <Clock size={12} color={COLORS.primary} />
                  <Text style={styles.timeText}>{heroSurvey.timeLeft}</Text>
                </View>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.instRow}>
                  <Landmark size={16} color={COLORS.primary} />
                  <Text style={styles.instText}>{heroSurvey.institution.toUpperCase()}</Text>
                </View>

                <Text style={styles.heroTitle}>{heroSurvey.title}</Text>
                <Text style={styles.heroDesc}>{heroSurvey.desc}</Text>

                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => router.push({ pathname: '/pages/survey-detail', params: { id: heroSurvey.id } })}
                >
                  <Text style={styles.heroBtnText}>Anketi Aç</Text>
                  <ArrowRight size={18} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* 3. ACTIVE SURVEYS LIST */}
          <View style={styles.listContainer}>
            {otherActiveSurveys.map((survey) => {
              const Icon = survey.icon;
              return (
                <TouchableOpacity
                  key={survey.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/pages/survey-detail', params: { id: survey.id } })}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.cardHeader}>
                      <Icon size={16} color={COLORS.textGray} />
                      <Text style={styles.cardInst}>{survey.institution}</Text>
                    </View>

                    <Text style={styles.cardTitle}>{survey.title}</Text>

                    {survey.isNew ? (
                      <View style={styles.newBadge}>
                        <Sparkles size={12} color={COLORS.orange} />
                        <Text style={styles.newBadgeText}>Yeni Anket</Text>
                      </View>
                    ) : (
                      <Text style={styles.cardDesc} numberOfLines={1}>{survey.desc}</Text>
                    )}

                    <View style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Anketi Aç</Text>
                    </View>
                  </View>

                  <Image source={{ uri: survey.image }} style={styles.cardImage} />
                </TouchableOpacity>
              );
            })}
          </View>
 {/* reklam */}
          {/* 4. COMPLETED SECTION */}
          {completedSurveys.length > 0 && (
            <>
              <View style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>TAMAMLANANLAR</Text>
                <View style={styles.line} />
              </View>

              {completedSurveys.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.completedCard}
                  onPress={() => router.push({ pathname: '/pages/survey-detail', params: { id: item.id } })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle}>{item.title}</Text>
                    <Text style={styles.completedSub}>{item.resultText}</Text>

                    <View style={styles.resultLink}>
                      <Text style={styles.resultLinkText}>Sonuçları Gör</Text>
                      <ChevronRight size={14} color={COLORS.primary} />
                    </View>
                  </View>
                  <CheckCircle2 size={24} color="#22c55e" />
                </TouchableOpacity>
              ))}
            </>
          )}
 {/* reklam */}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 20,
    lineHeight: 20,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  heroImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  heroContent: {
    padding: 16,
  },
  instRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  instText: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    lineHeight: 24,
  },
  heroDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // LIST CARD
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardInst: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  newBadgeText: {
    fontSize: 11,
    color: COLORS.orange,
    fontWeight: '600',
  },
  smallBtn: {
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  smallBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },

  // SEPARATOR
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  separatorText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 1,
  },

  // COMPLETED CARD
  completedCard: {
    backgroundColor: 'rgba(255,255,255,0.7)', // Slightly transparent
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  completedSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  resultLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});