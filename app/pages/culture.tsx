import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Share,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Play,
  Radio,
  Search,
  Bookmark,
  Clock,
  Heart,
  Navigation,
  Share2,
  ChevronRight,
  Music,
  Utensils
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
  textGray: '#6b7280',
  border: '#e5e7eb',
  cardBg: '#ffffff',
};

// --- TİP TANIMLARI ---
// (Basitleştirilmiş arayüz tipleri)
interface Artist { id: string; name: string; img: string; }
interface Song { id: string; title: string; artist: string; duration: string; img: string; url:string}
interface Word { id: string; word: string; type: string; desc: string; }
interface Photo { id: string; title: string; year: string; img: string; }
interface Food { id: string; title: string; time: string; img: string; }
interface Place { id: string; title: string; desc: string; img: string; location_link : string; }
interface Art { id: string; type: string; title: string; subtitle?: string; overlay?: string; img: string; height: number; }

export default function CultureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data States
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [wordOfTheDay, setWordOfTheDay] = useState<Word | null>(null);
  const [nostalgiaPhotos, setNostalgiaPhotos] = useState<Photo[]>([]);
  const [recipes, setRecipes] = useState<Food[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [artsLeft, setArtsLeft] = useState<Art[]>([]);
  const [artsRight, setArtsRight] = useState<Art[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // 1. Sanatçılar
      const { data: artistsData } = await supabase.from('culture_artists').select('*').limit(5);
      if (artistsData) {
        setArtists(artistsData.map(a => ({ id: a.id, name: a.name, img: a.image_url || '' })));
      }

      // 2. Şarkılar (Join ile sanatçı adı alınabilir ama şimdilik düz çekiyoruz)
      const { data: songsData } = await supabase.from('culture_songs').select('*, culture_artists(name)').limit(5);
      if (songsData) {
        // @ts-ignore: Supabase join typing is complex, simplifying here
        setSongs(songsData.map(s => ({
          id: s.id,
          title: s.title,
          // @ts-ignore
          artist: s.culture_artists?.name || 'Sanatçı',
          duration: s.duration || '',
          img: s.image_url || '',
          url:s.media_url
        })));
      }



      // 3. Günün Kelimesi (Rastgele bir kelime çekelim veya popüler olanı)
      const { data: wordsData } = await supabase.from('culture_dialect').select('*').limit(50);
      if (wordsData && wordsData.length > 0) {
        // Toplam kayıt sayısı
        const count = wordsData.length;

        // Rastgele index
        const randomIndex = Math.floor(Math.random() * count);

        // Günün kelimesi
        const selectedWord = wordsData[randomIndex];

        /*
        setWordOfTheDay({
          id: wordsData[0].id,
          word: wordsData[0].word,
          type: wordsData[0].type || 'genel',
          desc: wordsData[0].meaning
        });
        */

        setWordOfTheDay({
          id: selectedWord.id,
          word: selectedWord.word,
          type: selectedWord.type || 'genel',
          desc: selectedWord.meaning
        });
      }

      // 4. Nostalji
      const { data: photoData } = await supabase.from('culture_nostalgia').select('*').eq('type', 'gallery').limit(5);
      if (photoData) {
        setNostalgiaPhotos(photoData.map(p => ({
          id: p.id,
          title: p.title,
          year: p.beforeYear,
          img: p.beforeUrlImg
        })));
      }

      // 5. Yemekler
      const { data: foodData } = await supabase.from('culture_recipes').select('*').limit(5);
      if (foodData) {
        setRecipes(foodData.map(f => ({
          id: f.id,
          title: f.title,
          time: f.time || '',
          img: f.image_url || ''
        })));
      }

      // 6. Yerler
      const { data: placeData } = await supabase.from('culture_places').select('*').limit(5);
      if (placeData) {
        setPlaces(placeData.map(p => ({
          id: p.id,
          title: p.title,
          desc: p.description || '',
          img: p.image_url || '',
          location_link : p.location_link || ''
        })));
      }

      // 7. Sanat (Masonry için ikiye bölüyoruz)
      const { data: artsData } = await supabase.from('culture_arts').select('*').limit(4);
      if (artsData) {
        const left: Art[] = [];
        const right: Art[] = [];

        artsData.forEach((item, index) => {
          const artItem: Art = {
            id: item.id,
            type: item.type === 'poem' ? 'Şiir' : item.type === 'book' ? 'Kitap' : 'Fotoğraf',
            title: item.title,
            subtitle: item.subtitle || '',
            overlay: item.type === 'photo_contest' ? 'Yarışma' : undefined,
            img: item.image_url || '',
            height: index % 2 === 0 ? 220 : 180 // Mock height for masonry visual
          };

          if (index % 2 === 0) left.push(artItem);
          else right.push(artItem);
        });

        setArtsLeft(left);
        setArtsRight(right);
      }

    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleShareWordOfTheDay = async () => {
    if (!wordOfTheDay) return;
    try {
      await Share.share({
        message: `${wordOfTheDay.word} - ${wordOfTheDay.desc}  \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleMapPlace = (item : Place) => {
    if (item?.location_link) Linking.openURL(item.location_link);
    else alert("Konum bilgisi bulunamadı.");
  };

    const handleSharePlace = async (item : Place) => {
    if (!item) return;
    try {
      await Share.share({
        message: `${item.title} - ${item.desc} - \n ${item.location_link} \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {
      console.log(error);
    }
  };


    const openLink = async (url: string) => {
      try {
    
        await Linking.openURL(url);
    
      } catch (err) {
        console.error('Link hatası:', err);
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

      {/* HEADER */}
      <View style={{ backgroundColor: 'rgba(246, 248, 248, 0.95)' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kültür & Sanat</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 1. BOĞAZLIYAN EZGİLERİ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Boğazlıyan Ezgileri</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/artist')}>
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>

          {/* Sanatçılar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {artists.map((artist) => (
              <TouchableOpacity key={artist.id} style={styles.artistItem} onPress={() => router.push({ pathname: '/pages/culture/music', params: { id: artist.id } })}>
                <Image source={{ uri: artist.img }} style={styles.artistImage} />
                <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Şarkılar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.horizontalScroll, { marginTop: 16 }]}>
            {songs.map((song) => (
              <TouchableOpacity key={song.id} style={styles.songItem} onPress={() => openLink(song.url)}>
                <View style={styles.songImageContainer}>
                  <Image source={{ uri: song.img }} style={styles.songImage} />
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Play size={16} color="white" fill="white" />
                    </View>
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{song.duration}</Text>
                  </View>
                </View>
                <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Radyo Banner */}
          <TouchableOpacity style={styles.radioContainer}
          onPress={() => router.push( '/pages/culture/radioScreen')}
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
              
                          router.push('/pages/culture/radioScreen');
                        }}>
                <Play size={20} color={COLORS.dark} fill={COLORS.dark} />
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>
{/* reklam */}
        <View style={styles.divider} />

        {/* 2. YÖRE AĞZI SÖZLÜĞÜ */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Yöre Ağzı Sözlüğü</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/dialect')}>
              <Text style={styles.seeAll}>Keşfet</Text>
            </TouchableOpacity>
          </View>


          {/* 2. YÖRE AĞZI SÖZLÜĞÜ 
          
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Search size={20} color={COLORS.textGray} />
              <TextInput 
                placeholder="Kelime ara... (Örn: Gadasını almak)" 
                placeholderTextColor={COLORS.textGray}
                style={styles.searchInput}
              />
            </View>
          </View>
          */}


          {wordOfTheDay && (
            <View style={styles.wordCardContainer}>
              <TouchableOpacity
                activeOpacity={0.95}
                style={styles.wordCard}
                onPress={() => router.push('/pages/culture/dialect')}
              >
                <View style={styles.blob} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.wordBadge}>GÜNÜN KELİMESİ</Text>
                  <Share2 onPressOut={handleShareWordOfTheDay} size={20} color="#9ca3af" />
                </View>
                <Text style={styles.wordTitle}>{wordOfTheDay.word}</Text>
                <Text style={styles.wordType}>{wordOfTheDay.type}</Text>
                <Text style={styles.wordDesc} numberOfLines={3}>
                  {wordOfTheDay.desc}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* 3. NOSTALJİ TÜNELİ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nostalji Tüneli</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/nostalgia')}>
              <Text style={styles.seeAll}>Arşiv</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {nostalgiaPhotos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => router.push('/pages/culture/nostalgia')}
              >
                <View style={styles.photoFrame}>
                  <Image source={{ uri: photo.img }} style={styles.photoImage} contentFit="cover" />
                </View>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTitle}>{photo.title}</Text>
                  <Text style={styles.photoYear}>{photo.year}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />
{/* reklam */}
        {/* 4. BOĞAZLIYAN MUTFAĞI */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Boğazlıyan Mutfağı</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/recipes')}>
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {recipes.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodItem}
                onPress={() => router.push({ pathname: '/pages/culture/recipes', params: { id: food.id } })}
              >
                <View style={styles.foodImageContainer}>
                  <Image source={{ uri: food.img }} style={styles.foodImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.foodGradient} />
                  <View style={styles.foodContent}>
                    <Text style={styles.foodTitle}>{food.title}</Text>
                    <View style={styles.foodMeta}>
                      <Clock size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.foodTime}>{food.time}</Text>
                    </View>
                  </View>
                  {/* 
                  <View style={styles.favButton}>
                    <Heart size={14} color="white" />
                  </View>
                  */}
                  
                </View>
                {/* 
                <View style={styles.recipeBtn}>
                  <Text style={styles.recipeBtnText}>Tarife Git</Text>
                </View>
                */}
                
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 5. GEZİLECEK YERLER */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Gezilecek Yerler & Tarih</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/places')}>
              <Text style={styles.seeAll}>Rehber</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {places.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeItem}
                onPress={() => router.push('/pages/culture/places')}
              >
                <Image source={{ uri: place.img }} style={styles.placeImage} />
                <View style={{ padding: 12, flex: 1 }}>
                  <Text style={styles.placeTitle}>{place.title}</Text>
                  <Text style={styles.placeDesc} numberOfLines={2}>{place.desc}</Text>
                </View>
                <View style={styles.placeFooter}>
                  <TouchableOpacity style={styles.placeNavBtn} onPress={()=>{handleMapPlace(place)}}>
                    <Navigation size={16} color={COLORS.dark} />
                    <Text style={styles.placeNavText}>Yol Tarifi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.placeShareBtn}>
                    <Share2 size={16} color={COLORS.textGray} onPress={()=>{handleSharePlace(place)}}/>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 6. SANAL SERGİ & EDEBİYAT (MASONRY) */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
            <Text style={styles.sectionTitle}>Edebiyat & Kaymakam Kemal Bey</Text>
            <TouchableOpacity onPress={() => router.push('/pages/culture/arts')}>
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.masonryContainer}>
            {/* SOL SÜTUN */}
            <View style={styles.column}>
              {artsLeft.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.artItem, { height: item.height }]}
                  onPress={() => router.push('/pages/culture/arts')}
                >
                  <Image source={{ uri: item.img }} style={styles.artImage} />
                  <View style={styles.artContent}>
                    <Text style={styles.artType}>{item.type}</Text>
                    <Text style={styles.artTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.artSubtitle}>{item.subtitle}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* SAĞ SÜTUN */}
            <View style={styles.column}>
              {artsRight.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.artItem, { height: item.height }]}
                  onPress={() => router.push('/pages/culture/arts')}
                >
                  <Image source={{ uri: item.img }} style={styles.artImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.artOverlayContent}>
                    <Text style={styles.artOverlayText}>{item.overlay || item.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => router.push('/pages/culture/arts')}
          >
            <Text style={styles.moreBtnText}>Daha Fazla Göster</Text>
          </TouchableOpacity>
        </View>
        {/* reklam */}

      </ScrollView>
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
    paddingBottom: 12,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  content: {
    paddingBottom: 40,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  divider: {
    height: 4,
    backgroundColor: '#f1f2f4',
    marginTop: 24,
  },

  // ARTISTS
  artistItem: {
    alignItems: 'center',
    width: 80,
    gap: 8,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  artistName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.dark,
  },

  // SONGS
  songItem: {
    width: 220,
    gap: 8,
  },
  songImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  songImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  songTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  songArtist: {
    fontSize: 12,
    color: COLORS.textGray,
  },

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

  // DIALECT
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.dark,
  },
  wordCardContainer: {
    paddingHorizontal: 16,
  },
  wordCard: {
    backgroundColor: '#111718',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(19, 200, 236, 0.2)',
    transform: [{ scale: 1.5 }],
  },
  wordBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wordType: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  wordDesc: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '300',
  },

  // NOSTALGIA
  photoItem: {
    width: 260,
    gap: 8,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 3,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  photoYear: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  // FOOD
  foodItem: {
    width: 200,
    gap: 12,
  },
  foodImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  foodContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  foodTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodTime: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  favButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  recipeBtn: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  recipeBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // PLACES
  placeItem: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  placeImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  placeDesc: {
    fontSize: 12,
    color: COLORS.textGray,
    lineHeight: 16,
  },
  placeFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  placeNavBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeNavText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  placeShareBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // MASONRY GRID
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  artItem: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  artImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  artContent: {
    marginTop: 220,
    padding: 12,
    backgroundColor: 'white',
  },
  artType: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  artTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  artSubtitle: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  artOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  artOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  moreBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  moreBtnText: {
    color: COLORS.textGray,
    fontWeight: 'bold',
    fontSize: 14,
  },
});