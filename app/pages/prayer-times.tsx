import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import {
    ArrowLeft,
    MapPin,
    Settings,
    Sunrise,
    Sun,
    SunMedium,
    CloudSun,
    Sunset,
    Moon
} from 'lucide-react-native';
import { useNavigation } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

const { width } = Dimensions.get('window');

// --- TASARIM RENKLERİ ---
const COLORS = {
    primary: '#2bee6c',
    bgGradientStart: '#059669',
    bgGradientMid: '#0f2e22',
    bgGradientEnd: '#111827',
    textWhite: '#ffffff',
    textWhiteDim: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)', // Biraz daha belirgin
    // Aktif kart için daha solid bir renk verelim ki arkası görünmesin (Siyahlık sorunu için)
    activeCardBg: 'rgba(20, 80, 50, 0.8)', 
    activeBorder: 'rgba(43, 238, 108, 0.5)',
};

// --- TİP TANIMI ---
interface PrayerTimeUI {
    id: string;
    name: string;
    time: string;
    icon: any;
    isActive: boolean;
    isNext: boolean;
}

const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // Dakika cinsinden fark (Örn: -180)
    // UTC zamanına ofset'i tersine ekleyerek yerel saati "UTC gibi" gösteriyoruz
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export default function PrayerTimesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimeUI[]>([]);
    const [nextPrayer, setNextPrayer] = useState<PrayerTimeUI | null>(null);
    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [loading, setLoading] = useState(true);
    const [currentDateStr, setCurrentDateStr] = useState('');

    // Daire Animasyonu
    const circleSize = 280;
    const radius = 120;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    // Progress barı şimdilik %75 sabit tutuyoruz, dinamik hesaplama eklenebilir.
    const progress = 75; 
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        // Tarihi ayarla
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
        setCurrentDateStr(now.toLocaleDateString('tr-TR', options));

        fetchPrayerTimes();
    }, []);

    // nextPrayer değiştiğinde sayacı başlat
    useEffect(() => {
        if (nextPrayer) {
            calculateTimeLeft(); // İlk çalıştırma
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        }
    }, [nextPrayer]);

    const fetchPrayerTimes = async () => {
        try {
            setLoading(true);
            // ✅ DÜZELTME 2: Güncellenmiş fonksiyonu kullanıyoruz
            const todayStr = getLocalDateString();
            console.log("Sorgulanan Tarih:", todayStr); // Konsoldan kontrol edebilirsin

            const { data, error } = await supabase
                .from('prayer_times')
                .select('*')
                .eq('date', todayStr)
                .single();

            if (error) throw error;

            if (data) {
                const times = [
                    { id: '1', name: 'İmsak', time: data.imsak.slice(0, 5), icon: Sunrise },
                    { id: '2', name: 'Güneş', time: data.gunes.slice(0, 5), icon: SunMedium },
                    { id: '3', name: 'Öğle', time: data.ogle.slice(0, 5), icon: Sun },
                    { id: '4', name: 'İkindi', time: data.ikindi.slice(0, 5), icon: CloudSun },
                    { id: '5', name: 'Akşam', time: data.aksam.slice(0, 5), icon: Sunset },
                    { id: '6', name: 'Yatsı', time: data.yatsi.slice(0, 5), icon: Moon },
                ];

                // Aktif vakti hesapla
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                let activeIndex = -1;
                // Vakitleri dakika cinsine çevir
                const minutesArray = times.map(t => {
                    const [h, m] = t.time.split(':').map(Number);
                    return h * 60 + m;
                });

                // Hangi aralıktayız? (Geriye doğru kontrol en kolayıdır)
                for (let i = minutesArray.length - 1; i >= 0; i--) {
                    if (currentMinutes >= minutesArray[i]) {
                        activeIndex = i;
                        break;
                    }
                }
                // Eğer hiçbir vakitten büyük değilse (gece yarısından sonra, imsaktan önce),
                // o zaman önceki günün yatsısı aktiftir ama biz bugünün İmsak'ını bekliyoruzdur.
                // Bu durumda activeIndex -1 kalır.

                let nextIndex = 0;
                if (activeIndex === -1) {
                    // İmsak öncesi (Gece yarısı sonrası)
                    nextIndex = 0; // Hedef İmsak
                    // Aktif olarak Yatsı'yı (önceki günün) göstermek isteyebilirsin veya boş bırakırsın.
                    // Biz şimdilik en son vakti (Yatsı) aktif gibi gösterelim ama nextIndex İmsak olsun.
                    activeIndex = 5; 
                } else if (activeIndex === 5) {
                    // Yatsı vakti (İmsak'a kadar)
                    nextIndex = 0; // Hedef yarının İmsak'ı
                } else {
                    nextIndex = activeIndex + 1;
                }

                const uiData: PrayerTimeUI[] = times.map((t, index) => ({
                    ...t,
                    isActive: index === activeIndex,
                    isNext: index === nextIndex
                }));

                setPrayerTimes(uiData);
                // @ts-ignore
                setNextPrayer(uiData[nextIndex]);
            }
        } catch (error) {
            console.error('Namaz vakitleri hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeLeft = () => {
        // State içindeki nextPrayer güncel olmayabilir, bu yüzden callback içinde kullanmıyoruz.
        // Ancak useEffect dependency'e eklediğimiz için sorun yok.
        // Ama en garantisi, nextPrayer'ı bir ref veya yerel değişkenden okumaktır.
        // Burada basitlik adına state kullanıyoruz, useEffect hook'u bunu yönetiyor.
        
        if (!nextPrayer) return;

        const now = new Date();
        const [targetH, targetM] = nextPrayer.time.split(':').map(Number);
        
        let targetTime = new Date();
        targetTime.setHours(targetH, targetM, 0, 0);

        // Eğer hedef saat şu andan küçükse (örn: Gece 01:00'deyiz, hedef İmsak 05:00) -> Sorun yok.
        // Eğer hedef saat şu andan küçükse (örn: Gece 23:00'deyiz, hedef İmsak 05:00) -> Hedef yarın.
        // Veya: Hedef saat (05:00) < Şu an (23:00) ise hedef yarındır.
        if (targetTime < now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const diff = targetTime.getTime() - now.getTime();
        
        if (diff > 0) {
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
            // Süre dolduysa veriyi yenile (vakit değişti)
            fetchPrayerTimes();
        }
    };

    return (
        <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
            <StatusBar barStyle="light-content" />

            {/* 1. ARKA PLAN GRADIENT */}
            <LinearGradient
                colors={[COLORS.bgGradientStart, COLORS.bgGradientMid, COLORS.bgGradientEnd]}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.bgGlowTop} />

            <View style={styles.safeArea}>

                {/* 2. HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
                            <ArrowLeft color="white" size={20} />
                        </TouchableOpacity>

                        <View>
                            <View style={styles.locationRow}>
                                <MapPin size={16} color={COLORS.primary} />
                                <Text style={styles.locationTitle}>Boğazlıyan</Text>
                            </View>
                            <Text style={styles.dateText}>{currentDateStr}</Text>
                        </View>
                    </View>

                    {/* 2. HEADER 
                    <TouchableOpacity style={styles.glassBtn}>
                        <Settings color="white" size={20} />
                    </TouchableOpacity>
                    */}
                    
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        {/* 3. HERO (SAYAÇ) */}
                        <View style={styles.heroSection}>
                            <View style={styles.heroGlow} />

                            <View style={{ width: circleSize, height: circleSize, alignItems: 'center', justifyContent: 'center' }}>
                                <Svg width={circleSize} height={circleSize} style={{ position: 'absolute' }}>
                                    <Circle
                                        cx={circleSize / 2}
                                        cy={circleSize / 2}
                                        r={radius}
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    <Circle
                                        cx={circleSize / 2}
                                        cy={circleSize / 2}
                                        r={radius}
                                        stroke={COLORS.primary}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        rotation="-90"
                                        origin={`${circleSize / 2}, ${circleSize / 2}`}
                                    />
                                </Svg>

                                {/* BlurView yerine yarı saydam View kullanarak siyahlığı önleyelim */}
                                <View style={styles.heroGlassCircle}>
                                    <Text style={styles.heroLabel}>
                                        {nextPrayer ? `${nextPrayer.name.toUpperCase()} VAKTİNE` : 'BEKLENİYOR'}
                                    </Text>
                                    <Text style={styles.heroTime}>{timeLeft}</Text>
                                    <View style={styles.heroBadge}>
                                        <Text style={styles.heroBadgeText}>Sonraki Ezan</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* 4. VAKİT LİSTESİ */}
                        <ScrollView
                            style={styles.listContainer}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {prayerTimes.map((item) => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.card,
                                        item.isActive ? styles.activeCard : styles.glassCard
                                    ]}
                                >
                                    {/* Aktif Kart Sol Yeşil Çizgi */}
                                    {item.isActive && <View style={styles.activeBar} />}

                                    <View style={[styles.cardContent, item.isActive && { paddingLeft: 16 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                            <View style={[styles.iconBox, item.isActive ? styles.activeIconBox : styles.glassIconBox]}>
                                                <item.icon
                                                    size={24}
                                                    color={item.isActive ? '#000' : 'rgba(255,255,255,0.8)'}
                                                    strokeWidth={2}
                                                />
                                            </View>

                                            <View>
                                                <Text style={[styles.cardTitle, item.isActive && styles.activeTitle]}>
                                                    {item.name}
                                                </Text>
                                                {item.isActive && (
                                                    <Text style={styles.activeSubtitle}>ŞU ANKİ VAKİT</Text>
                                                )}
                                            </View>
                                        </View>

                                        <Text style={[styles.cardTime, item.isActive && styles.activeTime]}>
                                            {item.time}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgGradientEnd,
    },
    safeArea: {
        flex: 1,
        //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    // Arkaplan
    bgGlowTop: {
        position: 'absolute',
        top: -100,
        left: 0,
        right: 0,
        height: 400,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
        transform: [{ scaleX: 1.5 }],
        borderRadius: 200,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    glassBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        letterSpacing: -0.5,
    },
    dateText: {
        color: COLORS.textWhiteDim,
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 320,
        position: 'relative',
    },
    heroGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
        transform: [{ scale: 1.2 }],
    },
    heroGlassCircle: {
        width: 210,
        height: 210,
        borderRadius: 105,
        alignItems: 'center',
        justifyContent: 'center',
        // BlurView yerine yarı saydam düz renk (Siyahlığı önler)
        backgroundColor: 'rgba(20, 30, 30, 0.6)', 
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    heroTime: {
        color: 'white',
        fontSize: 48,
        fontWeight: '300',
        letterSpacing: -2,
        fontVariant: ['tabular-nums'],
    },
    heroBadge: {
        marginTop: 12,
        backgroundColor: 'rgba(43, 238, 108, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(43, 238, 108, 0.2)',
    },
    heroBadgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    // List
    listContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },

    // Cards Style
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    activeCard: {
        backgroundColor: COLORS.activeCardBg, // Daha opak bir renk
        borderWidth: 1,
        borderColor: COLORS.activeBorder,
        // Elevation'ı kaldırıp shadow'u manual verelim
        // elevation: 5, <-- Siyahlığın sebebi buydu
    },
    activeBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.primary,
    },

    // Icon Boxes
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassIconBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeIconBox: {
        backgroundColor: COLORS.primary,
    },

    // Texts
    cardTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    activeTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    activeSubtitle: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 2,
    },
    cardTime: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        fontVariant: ['tabular-nums'],
    },
    activeTime: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
});