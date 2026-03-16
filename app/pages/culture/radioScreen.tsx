import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Share,
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Share2, 
  SkipBack, 
  SkipForward,
  ListMusic, 
  X          
} from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../../lib/supabase'; 

import PromoCard from '@/components/PromoCard';
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

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#13c8ec',
  dark: '#111718',
  modalBg: '#1a2223',
  white: '#ffffff',
  gray: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.1)'
};


{/* 
  
    const player = useAudioPlayer(currentRadio ? {
    uri: currentRadio.stream_url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.google.com/',
      
    }
  } : null);

  */}

export default function RadioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State
  const [radioList, setRadioList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  


  const [adds, setAdds] = useState<AddsItem[]>([]); // YENİ STATE
  // Adds dizisi içinden place_code'a göre veriyi bulur
  const getAdByCode = (code: string) => {
    return adds.find(item => item.place_code === code);
  };
  
  
    useEffect(() => {
      fetchAllData();
    }, []);
  
  
      const fetchAllData = async () => {
        try {
          // Paralel Veri Çekme
          const [addRes] = await Promise.all([
            
            supabase
              .from('add_company')
              .select('*')
              .eq('place', 'radioScreen'), // ✅ FİLTRE: Sadece explore sayfasındakiler
          ]);
    
    
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
  
        } catch (error) {
          console.error('Veriler çekilemedi - radioScreen:', error);
        } finally {
          console.log('radioScreen passed');
        }
      };

  // Veritabanından radyoları çek
  useEffect(() => {
    fetchRadios();
  }, []);

  const fetchRadios = async () => {
    try {
      setDbLoading(true);
      const { data, error } = await supabase
        .from('culture_radios')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true }); 

      if (error) throw error;
      
      if (data && data.length > 0) {
        setRadioList(data);
      }
    } catch (error) {
      console.log('Radyo verisi çekilemedi', error);
    } finally {
      setDbLoading(false);
    }
  };

  const currentRadio = radioList[currentIndex];

  // --- PLAYER YAPILANDIRMASI ---
  
const player = useAudioPlayer();

useEffect(() => {
  if (!currentRadio) return;

  const loadAndPlay = async () => {
    player.pause();
    player.seekTo(0);
    try {
      await player.replace({
        uri: currentRadio.stream_url,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.google.com/',
          'Accept': '*/*'
        }
      });

      await player.play(); // 🔥 GARANTİLİ OYNAT
    } catch (e) {
      console.log('Radio load error', e);
    }
  };

  

  loadAndPlay();
}, [currentIndex,currentRadio]);

  
useEffect(() => {
  if (!currentRadio) return;

  let timeout: ReturnType<typeof setTimeout> | null = null;

  if (!player.playing) {
    timeout = setTimeout(() => {
      if (!player.playing) {
        player.pause();
        player.seekTo(0);
      }
    },8000);
  }

  return () => {
    if (timeout) clearTimeout(timeout);
  };
}, [currentIndex, player.playing, currentRadio]);

  // --- KRİTİK NOKTA: OTOMATİK OYNATMA VE YÜKLEME ---
  // 1. Radyo değiştiğinde (currentIndex) veya Player hazır olduğunda (isLoaded)
  // otomatik olarak oynat komutu gönderiyoruz.
  /*
  useEffect(() => {
    if (player.isLoaded) {
      player.play();
    }
  }, [player.isLoaded, currentIndex]); // currentIndex değişince tetiklenir

  */

  // Play/Pause Manuel Kontrol
  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };



  // İleri Sarma
  const handleNext = () => {
    if (radioList.length === 0) return;
    setCurrentIndex((prev) => (prev < radioList.length - 1 ? prev + 1 : 0));
  };

  // Geri Sarma
  const handlePrev = () => {
    if (radioList.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : radioList.length - 1));
  };

  // Listeden Seçim
  const selectRadio = (index: number) => {
    setCurrentIndex(index);
    setShowList(false); 
  };

  // Paylaşma
  const handleShare = async () => {
    if(!currentRadio) return;
    try {
      await Share.share({
        message: `🎧 ${currentRadio.title} dinliyorum! - \n\n📲 Boğazlıyan Mobil ile keşfet! \n\n\n \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
      });
    } catch (error) {}
  };

  // Veritabanı yükleniyor ekranı
  if (dbLoading || (!currentRadio && !dbLoading)) {
    return (
      <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Player'ın o anki durumu: Yükleniyor mu?
  // Eğer player yüklü değilse (isLoaded false) -> Yükleniyor sayılır.
  //const isBuffering = !player.isLoaded;

  const isBuffering = !player.playing && !!currentRadio;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image */}
      <Image 
          key={currentRadio.image_url}
          source={{ uri: currentRadio.image_url || "" }} 
          style={StyleSheet.absoluteFillObject} 
          contentFit="cover"
          transition={500}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', '#111718']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={[styles.safeArea]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>CANLI YAYIN</Text>
          
          <View style={{flexDirection:'row', gap:10}}>
            <TouchableOpacity onPress={() => setShowList(true)} style={styles.iconBtn}>
                <ListMusic size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Share2 size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
{/* reklam */}
        {/* PLAYER CONTENT */}
        <View style={styles.content}>
          <View style={styles.artworkContainer}>
            <View style={styles.artworkBorder}>
                <Image 
                source={{ uri: currentRadio.image_url || "" }} 
                style={styles.artwork} 
                contentFit="cover"
                />
            </View>
            <View style={styles.liveBadge}>
                {/* Yükleniyorsa Sarı, Çalıyorsa Mavi, Duruyorsa Beyaz */}
                <View style={[styles.liveDot, { 
                    backgroundColor: isBuffering ? '#facc15' : (player.playing ? '#13c8ec' : 'white') 
                }]} />
                <Text style={styles.liveText}>
                    {isBuffering ? 'LOADING...' : (player.playing ? 'ON AIR' : 'PAUSED')}
                </Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.radioTitle}>{currentRadio.title}</Text>
            <Text style={styles.radioFreq}>
              {currentRadio.frequency ? `FM ${currentRadio.frequency}` : 'Digital Radyo'}
            </Text>
          </View>

          {/* KONTROLLER */}
          <View style={styles.controlsContainer}>
            {/* Geri Butonu */}
            <TouchableOpacity style={styles.sideBtn} onPress={handlePrev}>
                <SkipBack size={32} color={COLORS.white} />
            </TouchableOpacity>

            {/* Play/Pause/Loading Butonu */}
            <TouchableOpacity 
                style={styles.playBtn} 
                onPress={togglePlayback}
                // Yüklenirken de basılabilsin, belki kullanıcı durdurmak ister
                disabled={false}
            >
                {/* DURUM KONTROLÜ:
                   1. Eğer radyo yükleniyorsa (isBuffering) -> Dönen Çember (ActivityIndicator)
                   2. Eğer çalıyorsa -> Pause İkonu
                   3. Duruyorsa -> Play İkonu
                */}
                {isBuffering ? (
                    <ActivityIndicator size="large" color="white" />
                ) : player.playing ? (
                    <Pause size={40} color="white" fill="white" />
                ) : (
                    <Play size={40} color="white" fill="white" style={{marginLeft:4}} />
                )}
            </TouchableOpacity>

            {/* İleri Butonu */}
            <TouchableOpacity style={styles.sideBtn} onPress={handleNext}>
                <SkipForward size={32} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

                {/* --- REKLAM ALANI: radioScreen-0 --- */}
              {/* getAdByCode('radioScreen-0') veri dönerse render eder, yoksa boş geçer */}
              {getAdByCode('radioScreen-0') && (
                <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                  <PromoCard 
                    data={getAdByCode('radioScreen-0')!} 
                    height={140} // İstersen yüksekliği buradan özel ayarla
                  />
                </View>
              )}
        {/* reklam */}
      </SafeAreaView>

      {/* --- RADYO LİSTESİ MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showList}
        onRequestClose={() => setShowList(false)}
      >
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setShowList(false)}>
                <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Yayın Listesi ({radioList.length})</Text>
                    <TouchableOpacity onPress={() => setShowList(false)} style={styles.closeBtn}>
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={radioList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item, index }) => {
                        const isSelected = currentIndex === index;
                        return (
                            <TouchableOpacity 
                                style={[
                                    styles.listItem, 
                                    isSelected && styles.activeListItem
                                ]}
                                onPress={() => selectRadio(index)}
                            >
                                <Image 
                                    source={{ uri: item.image_url }} 
                                    style={styles.listImg} 
                                    contentFit="cover"
                                />
                                <View style={styles.listInfo}>
                                    <Text style={[styles.listTitle, isSelected && { color: COLORS.primary }]}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.listSub}>
                                        {item.frequency || 'Web Radyo'}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <View style={styles.playingIndicator}>
                                        {/* Listede de yükleniyorsa dönen çember */}
                                        {isBuffering ? (
                                             <ActivityIndicator size="small" color={COLORS.primary} />
                                        ) : (
                                             <View style={{width:10, height:10, borderRadius:5, backgroundColor: COLORS.primary}} />
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  artworkContainer: {
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  artworkBorder: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.35, 
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: '#333',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: COLORS.dark,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  radioTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  radioFreq: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginTop: 20,
  },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  sideBtn: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.modalBg,
    height: height * 0.6,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeListItem: {
    backgroundColor: 'rgba(19, 200, 236, 0.1)', 
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderBottomColor: 'transparent',
  },
  listImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  listInfo: {
    flex: 1,
    marginLeft: 15,
  },
  listTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listSub: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 2,
  },
  playingIndicator: {
    marginLeft: 10,
  }
});