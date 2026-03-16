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
  ActivityIndicator,
  Modal,
  Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  PlayCircle,
  Flame,
  Clock,
  Utensils,
  ArrowRight,
  ChevronRight,
  Store,
  MapPin,
  X, // <-- EKLENDİ (Kapatma ikonu)
  ChefHat, // <-- EKLENDİ (Opsiyonel: Zorluk ikonu için)
  Share2
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
  primary: '#ec7f13',
  bg: '#f8f7f6',
  white: '#ffffff',
  dark: '#181411',
  textGray: '#897561',
  border: '#e5e7eb',
  orangeLight: '#fff7ed',
  greenLight: '#f0fdf4',
  greenText: '#16a34a',
};

// --- GÜNCELLENMİŞ TİP TANIMLARI ---
interface Ingredient {
  item: string;
  amount: string;
}



// --- TİP TANIMLARI ---
interface Recipe {
  id: string;
  title: string;
  desc: string;
  time: string;
  difficulty: string;
  servings: string;
  image: string;
  isPopular: boolean;
  // UI Helper Props
  diffColor?: string;
  diffBg?: string;
  superText?: string;
  // Yeni eklenenler:
  ingredients: Ingredient[];
  steps: string[];
}

{/* 
const RESTAURANTS = [
  { id: '1', name: 'Konak Lokantası', location: 'Merkez, Boğazlıyan', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200' },
  { id: '2', name: 'Lezzet Sofrası', location: 'Çarşı İçi', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200' },
];
*/}



export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [compactRecipe, setCompactRecipe] = useState<Recipe | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null); // <-- EKLENDİ

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('culture_recipes')
        .select('*');

      if (error) throw error;

      if (data) {
        const formattedRecipes: Recipe[] = data.map(item => {
          // Zorluk seviyesine göre renk belirle
          let dColor = '#ea580c'; // Orange (Orta)
          let dBg = '#ffedd5';

          if (item.difficulty === 'Kolay') {
            dColor = '#16a34a'; // Green
            dBg = '#dcfce7';
          } else if (item.difficulty === 'Zor') {
            dColor = '#dc2626'; // Red
            dBg = '#fee2e2';
          }

          return {
            id: item.id,
            title: item.title,
            desc: item.description || '',
            time: item.time || '30 dk',
            difficulty: item.difficulty || 'Orta',
            servings: item.servings || '2 Kişilik',
            image: item.image_url || "",
            isPopular: item.is_popular,
            diffColor: dColor,
            diffBg: dBg,
            superText: item.superText,
            // JSONB VERİLERİNİ PARSE ETME:
            ingredients: item.ingredients || [], // Supabase bunu otomatik array'e çevirir
            steps: item.steps || [],             // Supabase bunu otomatik array'e çevirir
          };
        });

        // 1. Hero Recipe (Popüler olan ilk)
        const hero = formattedRecipes.find(r => r.isPopular) || formattedRecipes[0];
        setHeroRecipe(hero);

        // 2. Diğerleri (Hero hariç)
        const others = formattedRecipes.filter(r => r.id !== hero.id);

        // Compact için listeden birini ayır (Örn: sonuncusu veya belirli bir index)
        if (others.length > 2) {
          setCompactRecipe(others.pop() || null);
        }

        setRecipes(others);
      }
    } catch (error) {
      console.error('Yemek tarifleri çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedRecipe) return;
    try {
      await Share.share({
        message: `${selectedRecipe.title} - ${selectedRecipe.desc} \n ${selectedRecipe.time} \n ${selectedRecipe.ingredients.map((item)=>{return item.item})} \n${selectedRecipe.steps.map((item)=>{return item})} \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
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

  return (
    <SafeAreaView style={[styles.container, {
      //paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yöresel Yemek Tarifleri</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 2. HERO CARD */}
        {heroRecipe && (
          <TouchableOpacity style={styles.heroCard} onPress={() => setSelectedRecipe(heroRecipe)} >
            <View style={styles.heroImageContainer}>
              <Image source={{ uri: heroRecipe.image }} style={styles.heroImage} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.heroGradient}
              />
              <View style={styles.heroOverlay}>
                <TouchableOpacity style={styles.videoBtn}>
                  <PlayCircle size={20} color="white" fill={COLORS.primary} />
                  <Text style={styles.videoBtnText}>{heroRecipe.superText}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{heroRecipe.title}</Text>
                  <Text style={styles.heroDesc}>{heroRecipe.desc}</Text>
                </View>
                <View style={styles.popularBadge}>
                  <Flame size={14} color={COLORS.primary} fill={COLORS.primary} />
                  <Text style={styles.popularText}>Popüler</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={COLORS.textGray} />
                  <Text style={styles.metaText}>{heroRecipe.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Utensils size={16} color={COLORS.textGray} />
                  <Text style={styles.metaText}>{heroRecipe.servings}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 3. SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Diğer Lezzetler</Text>

          {/* 3. SECTION HEADER
          
                    <TouchableOpacity>
            <Text style={styles.seeAll}>Tümü</Text>
          </TouchableOpacity>
          */}

        </View>

        {/* 4. RECIPE CARDS */}
        <View style={styles.listContainer}>
          
          {recipes.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelectedRecipe(item)}>
              <View style={styles.cardImageWrapper}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.timeBadge}>
                  <Clock size={12} color={COLORS.dark} />
                  <Text style={styles.timeBadgeText}>{item.time}</Text>
                </View>

              </View>

              <View style={styles.cardBody}>

                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: item.diffBg }]}>
                    <Text style={[styles.diffText, { color: item.diffColor }]}>{item.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>

                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Tarifi İncele</Text>
                  <ArrowRight size={16} color={COLORS.dark} />
                </TouchableOpacity>


              </View>
            </TouchableOpacity>
          ))}

          {/* Compact Card (Eğer varsa) */}
          {compactRecipe && (
            <TouchableOpacity style={styles.compactCard} activeOpacity={0.7} onPress={() => compactRecipe && setSelectedRecipe(compactRecipe)}>
              <Image source={{ uri: compactRecipe.image }} style={styles.compactImage} />
              <View style={styles.compactContent}>
                <Text style={styles.compactTitle}>{compactRecipe.title}</Text>
                <Text style={styles.compactDesc} numberOfLines={1}>{compactRecipe.desc}</Text>
                <View style={styles.compactMeta}>
                  <Clock size={12} color={COLORS.textGray} />
                  <Text style={styles.compactMetaText}>{compactRecipe.time} • </Text>
                  <Text style={[styles.compactMetaText, { color: compactRecipe.diffColor }]}>
                    {compactRecipe.difficulty}
                  </Text>
                </View>
              </View>
              <View style={styles.chevronBox}>
                <ChevronRight size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. WHERE TO EAT WIDGET 
        <View style={styles.widgetContainer}>
          <LinearGradient
            colors={['rgba(236, 127, 19, 0.1)', 'rgba(236, 127, 19, 0.05)']}
            style={styles.widgetGradient}
          >
            <View style={styles.widgetHeader}>
              <View style={styles.storeIconBox}>
                <Store size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.widgetTitle}>Nerede Yenir?</Text>
                <Text style={styles.widgetSubtitle}>Bu lezzetleri yerinde deneyin</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantScroll}>
              {RESTAURANTS.map((rest) => (
                <View key={rest.id} style={styles.restaurantCard}>
                  <Image source={{ uri: rest.img }} style={styles.restaurantImage} />
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.restName} numberOfLines={1}>{rest.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={10} color={COLORS.primary} />
                      <Text style={styles.restLoc} numberOfLines={1}>{rest.location}</Text>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.viewAllCard}>
                <View style={styles.arrowCircle}>
                  <ArrowRight size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.viewAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
        */}

      </ScrollView>


      {/* --- RECIPE DETAIL MODAL --- */}
      <Modal
        visible={!!selectedRecipe}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRecipe(null)}
        statusBarTranslucent
      >
        {selectedRecipe && (
          <View style={styles.modalContainer}>
            
            {/* Header Image Background */}
            <View style={styles.modalHeader}>
              
              <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} contentFit="cover" />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={StyleSheet.absoluteFill}
              />


              <TouchableOpacity
                style={[styles.closeBtn, { top: insets.top + 50 }]}
                onPress={handleShare}
              >
                <Share2 size={24} color="white" />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.closeBtn, { top: insets.top + 10 }]}
                onPress={() => setSelectedRecipe(null)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Content Scrollable Sheet */}
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Title & Badges */}
                <View style={styles.modalBody}>
                  <View style={styles.modalDragIndicator} />

                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>

                  <View style={styles.modalMetaRow}>
                    <View style={styles.modalMetaItem}>
                      <Clock size={16} color={COLORS.primary} />
                      <Text style={styles.modalMetaText}>{selectedRecipe.time}</Text>
                    </View>
                    <View style={styles.modalMetaDivider} />
                    <View style={styles.modalMetaItem}>
                      <Utensils size={16} color={COLORS.primary} />
                      <Text style={styles.modalMetaText}>{selectedRecipe.servings}</Text>
                    </View>
                    <View style={styles.modalMetaDivider} />
                    <View style={styles.modalMetaItem}>
                      <Flame size={16} color={selectedRecipe.diffColor || COLORS.primary} />
                      <Text style={[styles.modalMetaText, { color: selectedRecipe.diffColor }]}>
                        {selectedRecipe.difficulty}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Description Section */}
                  <Text style={styles.sectionHeaderTitle}>Hakkında</Text>
                  <Text style={styles.modalDesc}>{selectedRecipe.desc}</Text>

                  {/* Mock Ingredients Section (Görsel Zenginlik İçin) */}
                  {/* --- DİNAMİK MALZEMELER BÖLÜMÜ --- */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Malzemeler</Text>

                  {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                    <View style={styles.ingredientBox}>
                      {selectedRecipe.ingredients.map((ing, index) => (
                        <View key={index} style={styles.ingredientRow}>
                          <View style={styles.checkCircle}>
                            <View style={styles.checkInner} />
                          </View>
                          <Text style={styles.ingredientText}>
                            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{ing.amount}</Text> {ing.item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: COLORS.textGray, fontStyle: 'italic' }}>Malzeme bilgisi eklenmemiş.</Text>
                  )}

                  {/* --- DİNAMİK YAPILIŞ (ADIMLAR) BÖLÜMÜ --- */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Yapılışı</Text>

                  {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                    <View style={styles.stepsContainer}>
                      {selectedRecipe.steps.map((step, index) => (
                        <View key={index} style={styles.stepRow}>
                          <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                            {/* Son adım değilse çizgi çek */}
                            {index !== selectedRecipe.steps.length - 1 && <View style={styles.stepLine} />}
                          </View>
                          <View style={styles.stepContent}>
                            <Text style={styles.stepText}>{step}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: COLORS.textGray, fontStyle: 'italic' }}>Tarif adımları eklenmemiş.</Text>
                  )}

                  {/* Action Button (Mevcut olan) */}
                  <TouchableOpacity style={[styles.modalActionBtn,{paddingBottom: insets.bottom}]} activeOpacity={0.8} onPress={handleShare}>
                    <Text style={styles.modalBtnText}>Afiyet Olsun! Paylaş</Text>
                    <ChevronRight size={18} color="white" />
                  </TouchableOpacity>

                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0

  },

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 40,
  },

  // HERO CARD
  heroCard: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  heroImageContainer: {
    height: 200,
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
  heroOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  videoBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroContent: {
    padding: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // LIST SECTION
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // RECIPE CARD
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImageWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  cardBody: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textGray,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },

  // COMPACT CARD
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
  },
  compactContent: {
    flex: 1,
    gap: 4,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  compactDesc: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  compactMetaText: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // WIDGET
  widgetContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  widgetGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 127, 19, 0.2)',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 127, 19, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  widgetSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  restaurantScroll: {
    gap: 12,
  },
  restaurantCard: {
    width: 140,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  restaurantImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
  },
  restName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  restLoc: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  viewAllCard: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // MODAL STYLES
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    height: '45%',
    width: '100%',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: COLORS.bg,
    marginTop: -40, // Resmin üzerine binmesi için
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  modalBody: {
    padding: 24,
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMetaDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  modalMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textGray,
  },
  ingredientBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // Hafif çizgi
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: COLORS.dark,
    flex: 1, // Metin uzunsa alt satıra geçsin
  },
  noteText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalActionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    gap: 8,
  },
  modalBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },


  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },

  // STEPS STYLES
  stepsContainer: {
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 0, // Çizgi sürekliliği için margin'i içeride halledeceğiz
  },
  stepNumberContainer: {
    alignItems: 'center',
    width: 40,
    marginRight: 12,
  },
  stepNumberText: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    color: 'white',
    textAlign: 'center',
    lineHeight: 30, // Dikey ortalama
    fontWeight: 'bold',
    fontSize: 14,
    zIndex: 2,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#fed7aa', // COLORS.primary'nin açık tonu
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24, // Bir sonraki adıma boşluk
  },
  stepText: {
    fontSize: 15,
    color: COLORS.textGray,
    lineHeight: 22,
    marginTop: 4, // Numarayla hizalamak için
  },
});