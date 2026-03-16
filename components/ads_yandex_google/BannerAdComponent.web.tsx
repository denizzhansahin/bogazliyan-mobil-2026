import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

// SENİN SABİT YANDEX ID'N
const YANDEX_BLOCK_ID = 'R-A-18434914-1'; 

declare global {
  interface Window {
    Ya: any;
    yaContextCb: any[];
  }
}

// Interface'i güncelledik: bannerID eklendi.
interface BannerAdProps {
  bannerID?: string; // Native tarafla uyumlu olsun diye buraya ekledik
  style?: any;
}

// bannerID prop'unu parametre olarak alıyoruz ama aşağıda KULLANMIYORUZ.
// Çünkü gelen ID Google AdMob ID'si, Yandex'te çalışmaz.
export default function BannerAdComponent({ bannerID, style }: BannerAdProps) {
  
  const divId = useRef(`yandex_rtb_${Math.random().toString(36).substring(7)}`).current;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.Ya) {
      const script = document.createElement('script');
      script.src = 'https://yandex.ru/ads/system/context.js';
      script.async = true;
      document.head.appendChild(script);
    }

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (window.Ya) {
        window.Ya.Context.AdvManager.render({
          renderTo: divId,
          blockId: YANDEX_BLOCK_ID, // Gelen bannerID'yi değil, sabit Yandex ID'sini kullanıyoruz
          onError: (data: any) => {
             console.warn('Yandex Ads Hatası:', data);
          },
        });
      }
    });
  }, [divId]); // bannerID değişse bile effect'i tetiklemeye gerek yok

  return (
    <View style={[styles.container, style]}>
      <div 
        id={divId} 
        style={{ width: '100%', minHeight: '50px', display: 'flex', justifyContent: 'center' }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 10,
  },
});