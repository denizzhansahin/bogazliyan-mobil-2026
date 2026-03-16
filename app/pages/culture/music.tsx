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
  Linking,
  Share,
  Modal, // Eklendi
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  BadgeCheck, 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  PlayCircle, 
  Play, 
  Pause,
  SkipBack, 
  SkipForward,
  MoreHorizontal,
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
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
};

// --- TİP TANIMLARI ---
interface ArtistDetail {
  id: string;
  name: string;
  title: string;
  years: string;
  image: string;
  bio: string;
  spotify: string;
  youtube: string
}

interface Song {
  id: string;
  title: string;
  duration: string;
  views: string;
  image: string;
  isFeatured: boolean;
  url : string
}

export default function MusicDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Sanatçı ID'si
  const [loading, setLoading] = useState(true);
  
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [featuredSong, setFeaturedSong] = useState<Song | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null); // Player için

  const [isBioVisible, setIsBioVisible] = useState(false);

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      
      // Eğer ID yoksa, varsayılan bir sanatçı çek (Örnek: Ozan Yusuf ID'si veya ilk kayıt)
      let artistQuery = supabase.from('culture_artists').select('*');
      if (id) {
        artistQuery = artistQuery.eq('id', id);
      }
      
      const { data: artistData, error: artistError } = await artistQuery.limit(1).single();
      
      if (artistError) throw artistError;

      if (artistData) {
        setArtist({
          id: artistData.id,
          name: artistData.name,
          title: artistData.title || 'Halk Ozanı',
          years: artistData.years || '',
          image: artistData.image_url || "",
          bio: artistData.bio || 'Biyografi bulunamadı.',
          spotify : artistData.spotify || "",
          youtube: artistData.youtube || ""
        });

        // Şarkıları Çek
        const { data: songsData } = await supabase
          .from('culture_songs')
          .select('*')
          .eq('artist_id', artistData.id);

        if (songsData) {
          const formattedSongs: Song[] = songsData.map(s => ({
            id: s.id,
            title: s.title,
            duration: s.duration || '00:00',
            views: s.views || '0',
            image: s.image_url || "",
            isFeatured: s.is_featured,
            url:s.media_url
          }));

          setSongs(formattedSongs);
          
          // Öne Çıkan Şarkıyı Belirle
          const featured = formattedSongs.find(s => s.isFeatured) || formattedSongs[0];
          setFeaturedSong(featured);
          setCurrentSong(featured); // Player başlangıcı
        }
      }
    } catch (error) {
      console.error('Sanatçı verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };


  const openLink = async (url: string) => {
    try {
  
      await Linking.openURL(url);
  
    } catch (err) {
      console.error('Link hatası:', err);
    }
  };


    // --- PAYLAŞMA FONKSİYONU ---
    const handleShare = async () => {
      try {
        await Share.share({
          message: `📜 *${artist?.name}*\n\n${artist?.title}\n\n✒️ _${artist?.bio}_\n\n📲 Boğazlıyan Mobil ile keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
        });
      } catch (error) {
        console.log('Paylaşım hatası:', error);
      }
    };
  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Sanatçı bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Şarkıları Grupla (Popüler vs Tüm)
  // Gerçekte 'views' veya başka bir kritere göre sıralanabilir. Şimdilik ilk 3 popüler.
  const popularSongs = songs.slice(0, 3);
  const allSongs = songs;

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* 1. HEADER */}
      <View style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sanatçılar & Ezgiler</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* 2. ARTIST PROFILE */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <Image source={{ uri: artist.image }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={20} color={COLORS.primary} fill="white" />
            </View>
          </View>
          
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistTitle}>{artist.title}</Text>
          
          <View style={styles.metaRow}>
            <Calendar size={14} color={COLORS.textGray} />
            <Text style={styles.metaText}>{artist.years}</Text>
          </View>

          {/* --- YENİ EKLENEN: SPOTIFY VE YOUTUBE BUTONLARI --- */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
            
            {/* Spotify Butonu */}
            {artist.spotify ? (
              <TouchableOpacity 
                onPress={() => openLink(artist.spotify)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#1DB954', // Spotify Yeşili
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 24,
                  gap: 8,
                  shadowColor: "#1DB954",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <PlayCircle size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Spotify</Text>
              </TouchableOpacity>
            ) : null}

            {/* YouTube Butonu */}
            {artist.youtube ? (
              <TouchableOpacity 
                onPress={() => openLink(artist.youtube)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FF0000', // YouTube Kırmızısı
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 24,
                  gap: 8,
                  shadowColor: "#FF0000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <Play size={18} color="white" fill="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>YouTube</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {/* -------------------------------------------------- */}
        </View>

        

        {/* 3. BIOGRAPHY CARD */}
        <View style={styles.bioCard}>
          <View style={styles.bioHeader}>
            <Text style={styles.bioTitle}>Biyografi</Text>
            <Share2 onPressOut={handleShare} size={20} color={COLORS.textGray} />
          </View>
          <Text style={styles.bioText} numberOfLines={4}>
            {artist.bio}
          </Text>
          <TouchableOpacity style={styles.readMoreBtn} onPress={() => setIsBioVisible(true)}>
            <Text style={styles.readMoreText}>Devamını Oku</Text>
            <ArrowRight size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 4. FEATURED VIDEO */}
        {featuredSong && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PlayCircle size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Öne Çıkan Eser</Text>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.9} 
              style={styles.featuredCard}
              onPress={() => setCurrentSong(featuredSong)}
            >
              <Image source={{ uri: featuredSong.image }} style={styles.featuredImage} />
              <View style={styles.overlay}>
                <View style={styles.playCircleBig}>
                  <Play onPress={()=>openLink(featuredSong.url)} size={32} color="white" fill="white" style={{ marginLeft: 4 }} />
                </View>
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
              >
                <Text style={styles.featuredTitle}>{featuredSong.title}</Text>
                <Text style={styles.featuredSubtitle}>Müzik Klibi • {featuredSong.duration}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        {/* 5. POPULAR SONGS (Horizontal) */}
        {popularSongs.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between', paddingRight: 20 }]}>
              <Text style={styles.sectionTitle}>Popüler Ezgiler</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {popularSongs.map((song) => (
                <TouchableOpacity 
                  key={song.id} 
                  style={styles.songCard}
                  onPress={() => {setCurrentSong(song),openLink(song.url)}}
                >
                  <View style={styles.songImageContainer}>
                    <Image source={{ uri: song.image }} style={styles.songImage} />
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{song.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songViews}>{song.views} izlenme</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. ALL SONGS (Vertical List) */}
        {allSongs.length > 0 && (
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 12 }]}>Tüm Eserler</Text>
            
            <View style={styles.listContainer}>
              {allSongs.map((song, index) => (
                <TouchableOpacity 
                  key={song.id} 
                  style={styles.listItem}
                  onPress={() => {setCurrentSong(song),openLink(song.url)}}
                >
                  <View style={styles.listLeft}>
                    <View style={styles.indexCircle}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.listTitle}>{song.title}</Text>
                      <Text style={styles.listSub}>{artist.name} • {song.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.playBtnSmall}>
                    <Play size={18} color={COLORS.textGray} fill={COLORS.textGray} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        

      </ScrollView>

      {/* 7. STICKY PLAYER */}
      {currentSong && (
        <View style={[styles.stickyPlayerContainer,{paddingBottom: insets.bottom}]}>
          <View style={styles.stickyPlayer}>
            <View style={styles.playerInfo}>
              <View style={styles.playerAlbumArt}>
                 <Image 
                   source={{ uri: currentSong.image }} 
                   style={styles.playerImage} 
                 />
                 <View style={styles.vinylCenter} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.playerTitle} numberOfLines={1}>{currentSong.title}</Text>
                <Text style={styles.playerSub} numberOfLines={1}>{artist.name}</Text>
              </View>
            </View>

            <View style={styles.playerControls}>
              <TouchableOpacity onPress={()=>openLink(currentSong.url)}>
                 <SkipBack size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playPauseBtn} onPress={()=>openLink(currentSong.url)}>
                 <Pause size={20} color={COLORS.primary} fill={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={()=>openLink(currentSong.url)}>
                 <SkipForward size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Biyografi Modal */}
<Modal
  animationType="fade"
  transparent={true}
  visible={isBioVisible}
  onRequestClose={() => setIsBioVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{artist.name}</Text>
        <TouchableOpacity 
          onPress={() => setIsBioVisible(false)}
          style={styles.closeBtn}
        >
          <Text style={styles.closeBtnText}>Kapat</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={true}>
        <Text style={styles.modalBioText}>{artist.bio}</Text>
      </ScrollView>
    </View>
  </View>
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
  
  // Header
  headerSafeArea: {
    backgroundColor: 'rgba(246, 248, 248, 0.95)',
    zIndex: 10,
  },
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
    backgroundColor: 'white',
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

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 75,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  artistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  artistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // Bio Card
  bioCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 24,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textGray,
    marginBottom: 12,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Featured Video
  featuredCard: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  playCircleBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(8px)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 16,
    zIndex: 2,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featuredSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },

  // Popular Songs (Carousel)
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  songCard: {
    width: 220,
    gap: 8,
  },
  songImageContainer: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  songImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  songTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  songViews: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  // All Songs List
  listContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  indexCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 200, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  listSub: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  playBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },

  // Sticky Player
  stickyPlayerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  stickyPlayer: {
    backgroundColor: '#1e293b', // Slate-900 (Dark player)
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerImage: {
    width: '100%',
    height: '100%',
  },
  vinylCenter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  playerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 4,
  },
  playPauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'white',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
  },
  closeBtnText: {
    color: COLORS.dark,
    fontWeight: '600',
    fontSize: 13,
  },
  modalBioText: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.dark,
    opacity: 0.8,
  },
});