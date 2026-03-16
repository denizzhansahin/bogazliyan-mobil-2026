import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Music, ChevronRight, Play } from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase'; // Yolunu projene göre ayarla



const { width } = Dimensions.get('window');
const SPACING = 16;
// 2 Sütunlu yapı için genişlik hesabı (Kenar boşlukları ve aradaki boşluk çıkarılıyor)
const ITEM_WIDTH = (width - (SPACING * 3)) / 2;

// --- RENKLER ---
const COLORS = {
  primary: '#13c8ec',
  bg: '#f6f8f8',
  white: '#ffffff',
  dark: '#111718',
  textGray: '#6b7280',
  border: '#e5e7eb',
};

interface Artist {
  id: string;
  name: string;
  img: string;
  bio?: string;
}

export default function AllArtistsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      // Tüm sanatçıları isme göre sıralı çekiyoruz
      const { data, error } = await supabase
        .from('culture_artists')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedData: Artist[] = data.map(a => ({
          id: a.id,
          name: a.name,
          img: a.image_url || "",
          bio: a.bio || ''
        }));
        setArtists(formattedData);
        setFilteredArtists(formattedData);
      }
    } catch (error) {
      console.error('Sanatçılar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arama fonksiyonu
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      const filtered = artists.filter(artist => 
        artist.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredArtists(filtered);
    } else {
      setFilteredArtists(artists);
    }
  };

  // Sanatçıya tıklanınca Music ekranına git
  const handleArtistPress = (artistId: string) => {
    // Burada music sayfasına ID parametresi ile gidiyoruz
    router.push({
      pathname: '/pages/culture/music',
      params: { id: artistId } // music.tsx bu ID'yi karşılamalı
    });
  };

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => handleArtistPress(item.id)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.img }} 
          style={styles.image} 
          contentFit="cover" 
          transition={200}
        />
        {/* Play İkonu Overlay */}
        <View style={styles.playOverlay}>
             <Play size={20} color="white" fill="white" style={{ opacity: 0.9 }} />
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.listenRow}>
            <Music size={12} color={COLORS.primary} />
            <Text style={styles.listenText}>Şarkılarını Dinle</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sanatçılar</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 2. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textGray} />
            <TextInput 
                placeholder="Sanatçı ara..." 
                placeholderTextColor={COLORS.textGray}
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearch}
            />
        </View>
      </View>
     

      {/* 3. LISTE */}
      <FlatList
        data={filteredArtists}
        renderItem={renderArtistItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Sanatçı bulunamadı.</Text>
            </View>
        }
      />
     
      
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: COLORS.bg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // SEARCH
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.dark,
    fontSize: 14,
  },

  // GRID LISTE
  listContent: {
    padding: SPACING,
  },
  columnWrapper: {
    gap: SPACING,
    marginBottom: SPACING,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Kare fotoğraf
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  infoContainer: {
    padding: 12,
    backgroundColor: COLORS.white,
  },
  artistName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  listenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listenText: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // EMPTY STATE
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 14,
  }
});