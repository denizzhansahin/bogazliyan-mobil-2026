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
    Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';

// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const { width } = Dimensions.get('window');

// --- TİP TANIMLAMALARI ---
interface HourlyForecast {
    time: string;
    temp: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    isNow?: boolean;
}

interface DailyForecast {
    day: string;
    min: number;
    max: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    barStart: number;
    barWidth: number;
    gradientColors: string[];
}

interface WeatherDetail {
    label: string;
    value: string;
    subValue: string;
    icon: string;
    type: 'humidity' | 'wind' | 'rain' | 'visibility';
}

interface WeatherData {
    id: string;
    date: string;
    dayName: string;
    tempCurrent: number;
    tempMin: number;
    tempMax: number;
    description: string;
    icon: string;
    details: WeatherDetail[];
    hourly: HourlyForecast[];
}

const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // Dakika cinsinden fark (Örn: -180)
    // UTC zamanına ofset'i tersine ekleyerek yerel saati "UTC gibi" gösteriyoruz
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};


export default function WeatherScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
    const [weeklyForecast, setWeeklyForecast] = useState<DailyForecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDateStr, setCurrentDateStr] = useState('');


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
                    .eq('place', 'weather'), // ✅ FİLTRE: Sadece explore sayfasındakiler
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
            console.error('Veriler çekilemedi - weather:', error);
        } finally {
            console.log('passed');
        }
    };

    useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
        setCurrentDateStr(now.toLocaleDateString('tr-TR', options));

        fetchWeather();
    }, []);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            //const todayStr = new Date().toISOString().split('T')[0];



            // ✅ DÜZELTME 2: Güncellenmiş fonksiyonu kullanıyoruz
            const todayStr = getLocalDateString();
            console.log("Sorgulanan Tarih:", todayStr); // Konsoldan kontrol edebilirsin

            // 1. Bugünün ve sonraki günlerin verisini çek (Sıralı)
            const { data, error } = await supabase
                .from('weather_forecasts')
                .select('*')
                .gte('date', todayStr)
                .order('date', { ascending: true })
                .limit(6); // Bugün + 5 gün

            if (error) throw error;

            if (data && data.length > 0) {
                // Bugünün verisini bul
                // ✅ DÜZELTME 3: Tarih eşleşmesinde daha güvenli bir kontrol (Sadece string başlangıcına bakıyoruz)
                const todayData = data.find(d => d.date === todayStr) ?? data[0];
                const nextDays = data.filter(d => d.date !== todayData.date); // todayData referans alınarak filtrele

                if (todayData) {
                    // Detayları parse et
                    let detailList: WeatherDetail[] = [];
                    if (todayData.details) {
                        const d = todayData.details as any; // Tip güvenliği için cast edilebilir
                        detailList = [
                            { label: 'NEM', value: d.humidity || '-', subValue: '', icon: 'water-percent', type: 'humidity' },
                            { label: 'RÜZGAR', value: d.wind || '-', subValue: '', icon: 'weather-windy', type: 'wind' },
                            { label: 'YAĞIŞ', value: d.rain || '-', subValue: '', icon: 'weather-rainy', type: 'rain' },
                            { label: 'GÖRÜŞ', value: d.visibility || '-', subValue: '', icon: 'eye-outline', type: 'visibility' },
                        ];
                    }

                    // Saatlik tahmini parse et
                    let hourlyList: HourlyForecast[] = [];
                    if (todayData.hourly_forecast) {
                        // @ts-ignore
                        if (Array.isArray(todayData.hourly_forecast)) hourlyList = todayData.hourly_forecast;
                        // @ts-ignore
                        else if (typeof todayData.hourly_forecast === 'string') hourlyList = JSON.parse(todayData.hourly_forecast);
                    }

                    setCurrentWeather({
                        id: todayData.id,
                        date: todayData.date,
                        dayName: todayData.day_name,
                        tempCurrent: todayData.temp_current || 0,
                        tempMin: todayData.temp_min || 0,
                        tempMax: todayData.temp_max || 0,
                        description: todayData.description || '',
                        icon: todayData.icon || 'weather-sunny',
                        details: detailList,
                        hourly: hourlyList
                    });
                }

                // Haftalık veriyi formatla
                const weeklyList: DailyForecast[] = nextDays.map(d => {
                    // Renk ve ikon mantığı (Basitçe)
                    let iconName = d.icon || 'weather-partly-cloudy';
                    let color = '#9ca3af'; // gri
                    let gradient = ['#9ca3af', '#d1d5db'];

                    if (iconName.includes('sunny')) {
                        color = '#fde047';
                        gradient = ['#fde047', '#facc15'];
                    } else if (iconName.includes('rain')) {
                        color = '#60a5fa';
                        gradient = ['#60a5fa', '#3b82f6'];
                    }

                    // Bar hesaplaması (Basit bir normalizasyon -10 ile 40 arası)
                    const minTemp = d.temp_min || 0;
                    const maxTemp = d.temp_max || 0;
                    const range = 50; // -10 to 40
                    const start = ((minTemp + 10) / range) * 100;
                    const width = ((maxTemp - minTemp) / range) * 100;

                    return {
                        day: d.day_name.slice(0, 3), // "Pazartesi" -> "Paz"
                        min: minTemp,
                        max: maxTemp,
                        icon: iconName as any,
                        iconColor: color,
                        barStart: Math.max(0, start),
                        barWidth: Math.max(10, width),
                        gradientColors: gradient
                    };
                });

                setWeeklyForecast(weeklyList);
            }
        } catch (error) {
            console.error('Hava durumu verisi çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleShare = async () => {
        if (!currentWeather) return;
        try {
            await Share.share({
                message: `${currentWeather.date} - ${currentWeather.dayName} - ${currentWeather.description}  ${currentWeather.tempCurrent}   \nBoğazlıyan Mobil - Boğazlıyan uygulamasını indir, sen de aramıza katıl! https://bogazliyan.linksphere.tr/uygulama-indir`,
            });
        } catch (error) {
            console.log(error);
        }
    };






    return (
        <SafeAreaView style={[styles.container, {
            //paddingBottom: insets.bottom,
        }]}>
            <StatusBar barStyle="light-content" />

            {/* 1. BACKGROUND GRADIENT */}
            <LinearGradient
                colors={['#1e3a8a', '#312e81', '#111618']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Background Glow Effects */}
            <View style={[styles.glowCircle, { top: -80, right: -80, backgroundColor: 'rgba(13, 185, 242, 0.2)' }]} />
            <View style={[styles.glowCircle, { top: '30%', left: -80, backgroundColor: 'rgba(147, 51, 234, 0.2)', width: 300, height: 300 }]} />

            <View style={styles.safeArea}>

                {/* 2. HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassButton}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>



                    <View style={styles.headerTitleContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="location-on" size={18} color="#0db9f2" />
                            <Text style={styles.locationText}>Boğazlıyan, Yozgat</Text>
                        </View>
                        <Text style={styles.dateText}>{currentDateStr}</Text>
                    </View>

                    {/* Background Glow Effects */}
                    <TouchableOpacity style={styles.glassButton} onPress={handleShare}>
                        <Share2 size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* --- REKLAM ALANI: weather-0 --- */}
                {/* getAdByCode('weather-0') veri dönerse render eder, yoksa boş geçer */}
                {getAdByCode('weather-0') && (
                    <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                        <PromoCard
                            data={getAdByCode('weather-0')!}
                            height={140} // İstersen yüksekliği buradan özel ayarla
                        />
                    </View>
                )}




                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#0db9f2" />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* reklam */}
                        {currentWeather ? (
                            <>
                                {/* 3. HERO SECTION */}
                                <View style={styles.heroSection}>
                                    <View style={styles.heroIconContainer}>
                                        <View style={styles.iconGlow} />
                                        <MaterialCommunityIcons name={currentWeather.icon as any} size={110} color="white" style={{ zIndex: 10 }} />
                                    </View>

                                    <Text style={styles.heroTemp}>{currentWeather.tempCurrent}°</Text>

                                    <Text style={styles.heroDesc}>
                                        {currentWeather.description}
                                    </Text>

                                    <View style={styles.hlContainer}>
                                        <View style={styles.hlItem}>
                                            <MaterialIcons name="arrow-upward" size={16} color="white" />
                                            <Text style={styles.hlText}>{currentWeather.tempMax}°</Text>
                                        </View>
                                        <View style={styles.dividerDot} />
                                        <View style={styles.hlItem}>
                                            <MaterialIcons name="arrow-downward" size={16} color="white" />
                                            <Text style={styles.hlText}>{currentWeather.tempMin}°</Text>
                                        </View>
                                    </View>
                                </View>
                                {/* reklam */}
                                {/* 4. HOURLY FORECAST */}
                                {currentWeather.hourly && currentWeather.hourly.length > 0 && (
                                    <View style={styles.sectionContainer}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Saatlik Tahmin</Text>
                                            <Text style={styles.seeAllText}>Tümü</Text>
                                        </View>

                                        <BlurView intensity={20} tint="light" style={styles.glassPanel}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
                                                {currentWeather.hourly.map((item, index) => (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.hourlyItem,
                                                            item.isNow && styles.hourlyItemActive
                                                        ]}
                                                    >
                                                        <Text style={styles.hourlyTime}>{item.time}</Text>
                                                        <MaterialCommunityIcons name={item.icon} size={28} color={item.isNow ? "white" : "rgba(255,255,255,0.8)"} />
                                                        <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </BlurView>
                                    </View>
                                )}

                                {/* 5. DETAILS GRID */}
                                {currentWeather.details && currentWeather.details.length > 0 && (
                                    <View style={styles.gridContainer}>
                                        {currentWeather.details.map((item, index) => (
                                            <BlurView key={index} intensity={15} tint="light" style={styles.detailCard}>
                                                <View style={styles.detailHeader}>
                                                    <MaterialCommunityIcons name={item.icon as any} size={20} color="rgba(255,255,255,0.7)" />
                                                    <Text style={styles.detailLabel}>{item.label}</Text>
                                                </View>
                                                <Text style={styles.detailValue}>
                                                    {item.value}
                                                </Text>
                                                {item.subValue ? <Text style={styles.detailSubValue}>{item.subValue}</Text> : null}

                                                <MaterialCommunityIcons name={item.icon as any} size={48} color="rgba(255,255,255,0.05)" style={styles.detailBgIcon} />
                                            </BlurView>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: 'white' }}>Bugün için hava durumu verisi bulunamadı.</Text>
                            </View>
                        )}
                        {/* reklam */}

                        {/* 6. WEEKLY FORECAST */}
                        {weeklyForecast.length > 0 && (
                            <BlurView intensity={20} tint="light" style={[styles.glassPanel, { marginBottom: 40, marginHorizontal: 24 }]}>
                                <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialIcons name="calendar-today" size={16} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.sectionTitle}>5 Günlük Tahmin</Text>
                                    </View>
                                </View>

                                <View style={styles.dailyList}>
                                    {weeklyForecast.map((day, index) => (
                                        <View key={index}>
                                            <View style={styles.dailyRow}>
                                                <Text style={styles.dailyDayName}>{day.day}</Text>

                                                <View style={styles.dailyIconBox}>
                                                    <MaterialCommunityIcons name={day.icon} size={24} color={day.iconColor} />
                                                </View>

                                                <View style={styles.dailyBarContainer}>
                                                    <Text style={styles.dailyTempText}>{day.min}°</Text>

                                                    <View style={styles.barBackground}>
                                                        <LinearGradient
                                                            colors={day.gradientColors as any}
                                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                            style={[
                                                                styles.barFill,
                                                                {
                                                                    left: `${day.barStart}%`,
                                                                    width: `${day.barWidth}%`
                                                                }
                                                            ]}
                                                        />
                                                    </View>

                                                    <Text style={[styles.dailyTempText, { textAlign: 'left' }]}>{day.max}°</Text>
                                                </View>
                                            </View>
                                            {index < weeklyForecast.length - 1 && <View style={styles.separator} />}
                                        </View>
                                    ))}
                                </View>
                            </BlurView>
                        )}

                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111618',
    },
    safeArea: {
        flex: 1,
        //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: 20,
        paddingTop: 10,
    },
    glowCircle: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.6,
        transform: [{ scale: 1.2 }],
        // filter: 'blur(100px)', // React Native'de doğrudan blur filtresi yok, ImageBackground veya BlurView ile yapılır genelde. Şimdilik bu özellik web için çalışır.
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
        zIndex: 10,
    },
    glassButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    locationText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#bfdbfe',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },

    // Hero
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
        zIndex: 5,
    },
    heroIconContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    iconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderRadius: 50,
        // filter: 'blur(40px)',
        top: 10,
        left: 10,
    },
    heroTemp: {
        fontSize: 90,
        fontWeight: 'bold',
        color: 'white',
        includeFontPadding: false,
        lineHeight: 90,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    heroDesc: {
        color: '#dbeafe',
        fontSize: 16,
        textAlign: 'center',
        maxWidth: 250,
        marginTop: 8,
        fontWeight: '500',
    },
    hlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 12,
    },
    hlItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hlText: { color: 'white', fontWeight: 'bold' },
    dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },

    // Sections
    sectionContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
    },
    seeAllText: {
        color: '#0db9f2',
        fontSize: 12,
        fontWeight: '500',
    },
    glassPanel: {
        borderRadius: 24,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },

    // Hourly Scroll
    hourlyScroll: {
        gap: 12,
    },
    hourlyItem: {
        width: 68,
        height: 110,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    hourlyItemActive: {
        backgroundColor: 'rgba(13, 185, 242, 0.2)',
        borderColor: 'rgba(13, 185, 242, 0.4)',
    },
    hourlyTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
    hourlyTemp: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    // Detail Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    detailCard: {
        width: (width - 48 - 12) / 2, // 2 column calculation
        aspectRatio: 1.1,
        borderRadius: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailLabel: { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    detailValue: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    detailSubValue: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    detailBgIcon: { position: 'absolute', right: -10, top: -10, opacity: 0.2 },

    // Weekly List
    dailyList: { gap: 16 },
    dailyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 40,
    },
    dailyDayName: { width: 50, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
    dailyIconBox: { width: 40, alignItems: 'center' },
    dailyBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12 },
    dailyTempText: { width: 30, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    barBackground: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
    },
    barFill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        borderRadius: 3,
    },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },
});