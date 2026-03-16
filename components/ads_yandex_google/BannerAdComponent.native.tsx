import React, { FC, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';

/*
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground, // <-- Dökümandan gelen yeni hook
} from 'react-native-google-mobile-ads';

*/


//import mobileAds from 'react-native-google-mobile-ads';


// --- TypeScript için Prop Tipleri ---
interface BannerAdComponentProps {
  /**
   * Canlı (production) modda kullanılacak platforma özel (iOS veya Android) 
   * AdMob Reklam Birimi ID'niz.
   */
  bannerID: string;

  /**
   * Reklamın boyutu.
   * @default BannerAdSize.ANCHORED_ADAPTIVE_BANNER
   */
  size?: BannerAdSize;
}

/**
 * Yeniden kullanılabilir Banner Reklam Componenti (TSX).
 * Reklam ID'sini 'bannerID' prop'u ile dışarıdan alır.
 * iOS için 'useForeground' optimizasyonunu içerir.
 */



/*
const BannerAdComponent: FC<BannerAdComponentProps> = ({
  bannerID,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {


  
 // --- ADMOB BAŞLATMA KODU BURADA ---
  useEffect(() => {
    // SDK'yı başlat
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        // Başlatma tamamlandı!
        // Tüm bağdaştırıcıların (eğer aracılık kullanıyorsanız) 
        // durumunu burada görebilirsiniz.
        console.log('Google Mobile Ads SDK başarıyla başlatıldı.', adapterStatuses);

        // TODO: SDK başladıktan sonra reklamları önceden yükleyebilirsiniz (isteğe bağlı)
        // örn. InterstitialAd.load(...)
      })
      .catch(error => {
        console.error('Google Mobile Ads SDK başlatılırken hata oluştu: ', error);
      });

  }, []); // Boş dizi '[]', bu effect'in component yüklendiğinde SADECE BİR KEZ çalışmasını sağlar.


  // Banner component'ine referans oluşturmak için
  const bannerRef = useRef<BannerAd>(null);

  // Dökümanda belirtildiği gibi, 'ANCHORED_ADAPTIVE_BANNER' boyutu için
  // 'TestIds.ADAPTIVE_BANNER' kullanmak daha doğrudur.
  const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : bannerID;

  // --- iOS Optimizasyonu ---
  // Uygulama askıdan geri döndüğünde (foreground) iOS'ta reklamı yeniden yükle.
  useForeground(() => {
    if (Platform.OS === 'ios') {
      console.log('BannerAdComponent: Uygulama ön plana geldi, iOS için reklam yeniden yükleniyor.');
      bannerRef.current?.load();
    }
  });
  
  // Canlı moddayken boş veya geçersiz bir ID gelirse uyar.
  if (!__DEV__ && (!bannerID || !bannerID.startsWith('ca-app-pub-'))) {
    console.warn(
      `BannerAdComponent: Geçersiz veya eksik bir 'bannerID' prop'u ("${bannerID}") aldınız.`
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        ref={bannerRef} // <-- Referansı buraya ekledik
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log(`BannerAdComponent (ID: ${adUnitId}) başarıyla yüklendi.`);
        }}
        onAdFailedToLoad={(error: Error) => {
          console.error(
            `BannerAdComponent (ID: ${adUnitId}) yüklenirken hata oluştu: `,
            error
          );
        }}
      />
    </View>
  );

  
};



const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

export default BannerAdComponent;

*/