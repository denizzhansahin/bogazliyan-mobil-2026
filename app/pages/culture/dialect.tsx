import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  TextInput,
  Platform,
  LayoutAnimation, 
  UIManager,
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Share2, 
  Volume2, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Plus 
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

// Android için LayoutAnimation aktivasyonu
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  border: '#e2e8f0',
  slate900: '#0f172a',
  slate800: '#1e293b',
};

// --- TİP TANIMI ---
interface DialectWord {
  id: string;
  word: string;
  meaning: string;
  type: string;
  example: string;
  category: string;
  isPopular: boolean;
}

const CATEGORIES = ['Hepsi', 'Genel', 'Mutfak', 'Giyim', 'Akrabalık', 'Doğa', 'Eşya'];

export default function DialectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [allWords, setAllWords] = useState<DialectWord[]>([]);
  const [wordOfTheDay, setWordOfTheDay] = useState<DialectWord | null>(null);
  
  // UI States
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Hepsi');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchDialectData();
  }, []);

  const fetchDialectData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('culture_dialect')
        .select('*')
        .order('word', { ascending: true }); // Alfabetik sıra

      if (error) throw error;

      if (data) {
        const formattedData: DialectWord[] = data.map(item => ({
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          type: item.type || 'genel',
          example: item.example || '',
          category: item.category || 'Genel',
          isPopular: item.is_popular
        }));

        setAllWords(formattedData);

        

        // Günün kelimesi olarak rastgele birini veya popüler olanlardan birini seçelim
        // (Gerçek senaryoda bu backend tarafında günlük değişen bir id olabilir)
        if (formattedData.length > 0) {
          // 1. Dizinin uzunluğuna göre rastgele bir index belirle
          const randomIndex = Math.floor(Math.random() * formattedData.length);
          
          // 2. Rastgele seçilen kelimeyi al
          const randomWord = formattedData[randomIndex];
          // Örnek: "Gadasını Aldığım" varsa onu, yoksa ilkini seç
          //const featured = formattedData.find(w => w.word.toLowerCase().includes('gada')) || formattedData[0];
          setWordOfTheDay(randomWord);
        }
      }
    } catch (error) {
      console.error('Sözlük verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme Mantığı
  const filteredWords = useMemo(() => {
    return allWords.filter(item => {
      // 1. Kategori Filtresi
      const categoryMatch = activeCategory === 'Hepsi' || item.category === activeCategory;
      
      // 2. Arama Filtresi
      const searchMatch = item.word.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.meaning.toLowerCase().includes(searchText.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [allWords, activeCategory, searchText]);

  // Akordeon Aç/Kapa
  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

    const handleShare = async () => {
      if (!wordOfTheDay) return;
      try {
        await Share.share({
          message: `${wordOfTheDay.word} - ${wordOfTheDay.meaning}  \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
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
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={{ backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yöre Ağzı Sözlüğü</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </View>

      {/* 2. SEARCH BAR (Sticky) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textGray} />
          <TextInput 
            placeholder="Boğazlıyan ağzında ara..." 
            placeholderTextColor={COLORS.textGray}
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* 3. GÜNÜN KELİMESİ (Hero Card) */}
        {wordOfTheDay && !searchText && ( // Arama yapılıyorsa bunu gizleyebiliriz veya en üstte tutabiliriz.
          <View style={styles.heroCard}>
            <View style={styles.blob} />
            
            <View style={styles.heroHeader}>
              <View style={styles.badgeContainer}>
                <Calendar size={14} color={COLORS.primary} />
                <Text style={styles.badgeText}>Günün Kelimesi</Text>
              </View>
              <TouchableOpacity>
                <Share2 onPressOut={handleShare} size={20} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.wordTitle}>{wordOfTheDay.word}</Text>
              <View style={styles.wordMetaRow}>
                <Text style={styles.wordType}>{wordOfTheDay.type}</Text>
                {/*
                <TouchableOpacity style={styles.soundBtn}>
                  <Volume2 size={16} color={COLORS.primary} />
                </TouchableOpacity>
                */}
                
              </View>
            </View>

            <View style={styles.definitionBox}>
              <Text style={styles.definitionText}>
                {wordOfTheDay.meaning}
              </Text>
              {wordOfTheDay.example ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.exampleText}>
                    "{wordOfTheDay.example}"
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        )}

        {/* 4. MİNİ BİLGİ YARIŞMASI (Quiz Card - Statik Bırakıldı) 
        
                {!searchText && (
          <LinearGradient
            colors={[COLORS.slate900, COLORS.slate800]}
            style={styles.quizCard}
          >
            <View style={styles.quizHeader}>
              <Lightbulb size={18} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={styles.quizBadge}>MİNİ BİLGİ YARIŞMASI</Text>
            </View>
            
            <Text style={styles.quizQuestion}>"Culfuk" ne demektir?</Text>
            <Text style={styles.quizSub}>Doğru cevabı seçerek puan topla.</Text>
            
            <View style={styles.quizOptions}>
              <TouchableOpacity style={styles.quizBtn}>
                <Text style={styles.quizBtnText}>Hindi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quizBtn}>
                <Text style={styles.quizBtnText}>Tavuk</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
        */}

        {/* 5. KATEGORİLER (Chips) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 6. KELİME LİSTESİ (Accordion List) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchText ? 'Arama Sonuçları' : (activeCategory === 'Hepsi' ? 'Tüm Sözlük' : `${activeCategory} Terimleri`)}
            </Text>
          </View>

          <View style={styles.listContainer}>
            {filteredWords.length > 0 ? (
              filteredWords.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.accordionItem, isExpanded && styles.accordionItemActive]}
                    activeOpacity={0.9}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <View style={styles.accordionHeader}>
                      <View>
                        <Text style={styles.accordionTitle}>{item.word}</Text>
                        <Text style={styles.accordionType}>{item.type}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color={COLORS.primary} />
                      ) : (
                        <ChevronDown size={20} color={COLORS.textGray} />
                      )}
                    </View>
                    {isExpanded && (
                      <View style={styles.accordionBody}>
                        <Text style={styles.accordionText}>{item.meaning}</Text>
                        {item.example ? (
                          <Text style={styles.accordionExample}>Örnek: "{item.example}"</Text>
                        ) : null}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={{ color: COLORS.textGray }}>Kelime bulunamadı.</Text>
              </View>
            )}
          </View>
        </View>

        {/* 7. SUGGESTION CARD
        
                <View style={styles.suggestionCard}>
          <View style={styles.iconCircle}>
            <Edit3 size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.suggestionTitle}>Bildiklerini Paylaş</Text>
          <Text style={styles.suggestionText}>
            Listede olmayan bir kelime biliyor musun? Sözlüğe katkıda bulun.
          </Text>
          <TouchableOpacity>
            <Text style={styles.suggestionLink}>Kelime Öner</Text>
          </TouchableOpacity>
        </View>
        */}


      </ScrollView>

      {/* 8. FAB 
       <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Plus size={32} color={COLORS.white} />
      </TouchableOpacity>
      */}
     

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
    backgroundColor: COLORS.bg, 
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24, 
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    height: '100%',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  blob: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  wordTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  wordMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  wordType: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textGray,
  },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  definitionBox: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  definitionText: {
    fontSize: 15,
    color: COLORS.dark,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontStyle: 'italic',
  },

  // Quiz Card
  quizCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quizBadge: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  quizQuestion: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  quizSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  quizOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  quizBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quizBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // List & Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    gap: 10,
  },
  accordionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accordionItemActive: {
    borderColor: 'rgba(19, 200, 236, 0.5)',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  accordionType: {
    fontSize: 12,
    color: COLORS.textGray,
    fontStyle: 'italic',
  },
  accordionBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  accordionText: {
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
  },
  accordionExample: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
  },

  // Categories
  chipsScroll: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  chipTextActive: {
    color: COLORS.dark, 
  },

  // Suggestion Card
  suggestionCard: {
    backgroundColor: 'rgba(255,255,255,0.6)', 
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.textGray,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  suggestionLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});