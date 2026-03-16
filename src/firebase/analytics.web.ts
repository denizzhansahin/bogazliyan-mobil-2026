// src/firebase/analytics.web.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';

// 1. Firebase Konsolundan aldığın Web Config objesi:
const firebaseConfig = {
  
};

// 2. Firebase'i Başlat (Sadece tarayıcı ortamındaysak)
let analytics: any = null;

if (typeof window !== 'undefined') {
  // Eğer daha önce başlatılmadıysa başlat, yoksa mevcut olanı al
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Analytics servisini başlat
  analytics = getAnalytics(app);
}

// --- TRACKING FONKSİYONLARI ---

export const trackEvent = async (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    // GA4 standardında event yolla
    firebaseLogEvent(analytics, eventName, params);
  } else {
    console.warn('Firebase Analytics web ortamında başlatılamadı.');
  }
};

export const trackScreen = async (screenName: string, params?: Record<string, any>) => {
  if (analytics) {
    // Web için 'screen_view' manuel tetikleme
    // GA4'te ekran adı 'firebase_screen' parametresiyle gider
    firebaseLogEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
      ...params,
    });
  }
};

export const trackButton = async (buttonName: string, screen: string, extra?: Record<string, any>) => {
  if (analytics) {
    firebaseLogEvent(analytics, 'button_click', {
      button_name: buttonName,
      screen_name: screen,
      ...extra,
    });
  }
};