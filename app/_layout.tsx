import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export const unstable_settings = {
  anchor: '(tabs)',
};

//import mobileAds from 'react-native-google-mobile-ads';


// Token fonksiyonunu import edin
import { registerForPushNotificationsAsync } from '../src/notifications/registerForPush';

import { useRouter } from 'expo-router';
import 'react-native-reanimated';
import { useEffect, useRef } from 'react';




import { trackEvent, trackScreen } from '@/src/firebase/analytics';

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';


// 🔥 GLOBAL HANDLER (EN ÜSTTE OLMALI)
// 🔥 GLOBAL HANDLER: Uygulama ön plandayken bildirim davranışını yönetir
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Uygulama açıkken bildirim görünsün
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});





export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();


  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

  if (Platform.OS !== 'web' && pathname) {
    trackScreen(pathname);
  }

  }, [pathname])


  /*
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
*/


/*
  useEffect(() => {
    // 1. Uygulama açılınca Token al (Konsola yazar)
    registerForPushNotificationsAsync();

    // 2. Bildirime TIKLANDIĞINDA çalışacak listener
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;

        if (!data?.screen) return;

        trackEvent("notification_event", {
          item_id: data.id,
          source: 'notification',
        });

        const url = `${data.screen}?id=${data.id}` as const;
        router.push(url);
      });

    // 3. Uygulama AÇIKKEN bildirim geldiğinde çalışacak listener
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Uygulama açıkken bildirim geldi');
    });

    // TEMİZLİK (Cleanup) - Hata veren yer burasıydı, düzeltildi:
    return () => {
      if (responseListener) responseListener.remove();
      if (notificationListener) notificationListener.remove();
    };
  }, []);
*/

// 🔥 ÇİFT TETİKLEMEYİ ÖNLEYEN KİLİT (State yerine Ref kullanıyoruz ki render tetiklemesin)
  const lastNotificationId = useRef<string | null>(null);

// --- BİLDİRİM VE REKLAM YÖNETİMİ ---
// --- BİLDİRİM VE REKLAM YÖNETİMİ ---
  useEffect(() => {

    if (Platform.OS === 'web') {
      return; 
    }

    registerForPushNotificationsAsync();

    const handleNotificationNavigation = (response: Notifications.NotificationResponse) => {
      const { identifier } = response.notification.request;

      if (lastNotificationId.current === identifier) {
        return;
      }
      
      lastNotificationId.current = identifier;

      const data = response.notification.request.content.data;
      if (!data?.screen) return;

      trackEvent("notification_event", {
        item_id: data.id,
        source: 'notification',
      });

      const url = `${data.screen}?id=${data.id}`;
      
      setTimeout(() => {
        // @ts-ignore
        router.push(url);
      }, 1000); 
    };

    // 1️⃣ UYGULAMA KAPALIYKEN (Cold Start) - Fixed: Synchronous call
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      handleNotificationNavigation(response);
    }

    // 2️⃣ UYGULAMA ARKAPLANDA VEYA AÇIKKEN
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationNavigation(response);
    });

    // 3️⃣ UYGULAMA AÇIKKEN BİLDİRİM GELDİĞİNDE
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Uygulama açıkken bildirim geldi');
    });

    // TEMİZLİK (Cleanup) - Fixed: Direct .remove() call
    return () => {
      responseListener.remove();
      notificationListener.remove();
    };
  }, []);


  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pages/weather" options={{ headerShown: false }} />
          <Stack.Screen name="pages/menu" options={{ headerShown: false }} />
          <Stack.Screen name="pages/prayer-times" options={{ headerShown: false }} />
          <Stack.Screen name="pages/pharmacy" options={{ headerShown: false }} />
          <Stack.Screen name="pages/deals" options={{ headerShown: false }} />
          <Stack.Screen name="pages/deal-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/places" options={{ headerShown: false }} />
          <Stack.Screen name="pages/place-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/news" options={{ headerShown: false }} />
          <Stack.Screen name="pages/news-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/second-hand" options={{ headerShown: false }} />
          <Stack.Screen name="pages/second-hand-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/death-notices" options={{ headerShown: false }} />
          <Stack.Screen name="pages/campaigns" options={{ headerShown: false }} />
          <Stack.Screen name="pages/campaigns-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/taxis" options={{ headerShown: false }} />
          <Stack.Screen name="pages/taxi-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/outages" options={{ headerShown: false }} />
          <Stack.Screen name="pages/outage-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/jobs" options={{ headerShown: false }} />
          <Stack.Screen name="pages/job-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/public-institutions" options={{ headerShown: false }} />
          <Stack.Screen name="pages/public-institution-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/arts" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/dialect" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/music" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/nostalgia" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/places" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/recipes" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/allPoemsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/museumScreen" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/libraScreen" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/radioScreen" options={{ headerShown: false }} />
          <Stack.Screen name="pages/culture/artist" options={{ headerShown: false }} />
          <Stack.Screen name="pages/surveys" options={{ headerShown: false }} />
          <Stack.Screen name="pages/survey-detail" options={{ headerShown: false }} />
          <Stack.Screen name="pages/privacy-terms-license" options={{ headerShown: false }} />
          <Stack.Screen name="pages/notifications" options={{ headerShown: false }} />
          <Stack.Screen name="pages/notification-detail" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
