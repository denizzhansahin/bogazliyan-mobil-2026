import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ViewStyle,
  DimensionValue
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
// Analytics yolunu kendi projene göre ayarla
import { trackButton } from '@/src/firebase/analytics'; 

interface PromoCardProps {
  data: {
    id: string;
    title: string;
    image: string;
    tag?: string;
    tagColor?: string;
    targetPath?: string;
    targetId?: string;
    place?: string; // Alt başlık veya yer bilgisi
  };
  style?: ViewStyle; // Dışarıdan margin/padding vermek için
  height?: number;   // Yüksekliği değiştirmek istersen (Varsayılan: 130)
}

export default function PromoCard({ data, style, height = 130 }: PromoCardProps) {
  const router = useRouter();

  if (!data) return null;

  const handlePress = () => {
    // Analytics
    trackButton('promo_card_click', 'home', {
      card_id: data.id,
      card_title: data.title,
    });

    // Yönlendirme
    if (data.targetPath) {
      router.push({
        pathname: data.targetPath as any,
        params: { id: data.targetId },
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, { height }, style]}
    >
      <Image
        source={{ uri: data.image }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Karartma Efekti */}
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.85)']} 
        style={styles.overlay} 
      />

      <View style={styles.content}>
        {/* Etiket (Varsa göster) */}
        {data.tag && (
          <View style={[styles.tagContainer, { backgroundColor: data.tagColor || '#0db9f2' }]}>
            <Text style={styles.tagText}>{data.tag}</Text>
          </View>
        )}
        
        <Text style={styles.title} numberOfLines={2}>
          {data.title}
        </Text>
        
        {/* Alt Başlık (Yer bilgisi vb.) 
        {data.place && (
           <Text style={styles.subTitle} numberOfLines={1}>
             {data.place}
           </Text>
        )}
        */}
        
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%', // Bulunduğu alanın tamamını kaplar
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    // Hafif gölge
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subTitle: {
    color: '#cbd5e1', // Çok açık gri
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  }
});