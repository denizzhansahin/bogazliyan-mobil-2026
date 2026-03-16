import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Linking,
    Dimensions,
    ActivityIndicator,
    Share
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Phone,
    Navigation,
    Globe,
    Share2,
    Info,
    Mail,
    MapPin,
    ChevronRight,
    Clock,
    HelpCircle
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { trackEvent } from '@/src/firebase/analytics';

const { width } = Dimensions.get('window');

// --- RENKLER ---
const COLORS = {
    primary: '#137fec',
    bg: '#f6f7f8',
    white: '#ffffff',
    textDark: '#111418',
    textGray: '#617589',
    border: '#e2e8f0',
    red: '#ef4444',
    green: '#22c55e',
};

// --- TİP TANIMI ---
interface WorkingHour {
    label: string;
    value: string;
    isOpen: boolean;
}

interface InstitutionDetail {
    id: string;
    name: string;
    type: string;
    image: string;
    about: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    locationLink: string;
    workingHours: WorkingHour[];
}

export default function PublicInstitutionDetailScreen() {
    const insets = useSafeAreaInsets();

    const router = useRouter();
    const { id } = useLocalSearchParams();

      useEffect(() => {
                if (!id) return;
                  trackEvent('public_institution_detail_view', {
                    item_id: id,
                    item_type: 'public_institution_detail',
                  });
            
              }, [id]);

    const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstitutionDetail();
    }, [id]);

    const fetchInstitutionDetail = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('public_institutions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                // Çalışma saatlerini parse et
                let hours: WorkingHour[] = [];
                if (data.working_hours) {
                    // @ts-ignore
                    if (Array.isArray(data.working_hours)) hours = data.working_hours;
                    // @ts-ignore
                    else if (typeof data.working_hours === 'string') hours = JSON.parse(data.working_hours);
                }

                // Kategori ismini Türkçeleştir
                const getTypeLabel = (cat: string) => {
                    switch(cat) {
                        case 'municipality': return 'Resmi Kamu Kurumu';
                        case 'health': return 'Sağlık Kurumu';
                        case 'security': return 'Emniyet Birimi';
                        case 'education': return 'Eğitim Kurumu';
                        case 'justice': return 'Adli Kurum';
                        default: return 'Kamu Kurumu';
                    }
                };

                const formattedData: InstitutionDetail = {
                    id: data.id,
                    name: data.name,
                    type: getTypeLabel(data.category),
                    image: data.image_url || 'https://via.placeholder.com/800x400',
                    about: data.description || 'Kurum hakkında detaylı bilgi bulunmamaktadır.',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    address: data.address || '',
                    locationLink: data.location_link || '',
                    workingHours: hours.length > 0 ? hours : [
                        { label: 'Hafta İçi', value: '08:30 - 17:30', isOpen: true },
                        { label: 'Hafta Sonu', value: 'Kapalı', isOpen: false }
                    ]
                };

                setInstitution(formattedData);
            }
        } catch (error) {
            console.error('Kurum detayı hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    // Aksiyonlar
    const handleCall = () => {
        if (institution?.phone) Linking.openURL(`tel:${institution.phone.replace(/ /g, '')}`);
    };
    const handleMap = () => {
        if (institution?.locationLink) Linking.openURL(institution.locationLink);
        else alert("Konum bilgisi mevcut değil.");
    };
    const handleWeb = () => {
        if (institution?.website) Linking.openURL(institution.website);
        else alert("Web sitesi mevcut değil.");
    };
    const handleEmail = () => {
        if (institution?.email) Linking.openURL(`mailto:${institution.email}`);
        else alert("E-posta adresi mevcut değil.");
    };
    
    const handleShare = async () => {
        if (!institution) return;
        try {
            await Share.share({
                message: `${institution.name} \nAdres: ${institution.address} \nTelefon: ${institution.phone}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!institution) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Kurum bulunamadı.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container,{
        paddingBottom: insets.bottom,
      }]}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* 1. HEADER */}
            <View style={{ backgroundColor: 'white' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kurum Detayı</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
 {/* reklam */}
       
                {/* 2. HERO IMAGE & TITLE */}
                <View style={styles.heroSection}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: institution.image }}
                            style={styles.heroImage}
                            contentFit="cover"
                        />
                    </View>
                    <Text style={styles.title}>{institution.name}</Text>
                    <Text style={styles.subtitle}>{institution.type}</Text>
                </View>

                {/* 3. QUICK ACTIONS */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleCall}>
                        <View style={styles.actionCircle}>
                            <Phone size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Ara</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleMap}>
                        <View style={styles.actionCircle}>
                            <Navigation size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Yol Tarifi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleWeb}>
                        <View style={styles.actionCircle}>
                            <Globe size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Web</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                        <View style={styles.actionCircle}>
                            <Share2 size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Paylaş</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. ABOUT CARD */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Info size={20} color={COLORS.primary} fill={COLORS.primary} />
                        <Text style={styles.cardTitle}>Hakkında</Text>
                    </View>
                    <Text style={styles.cardText}>{institution.about}</Text>
                </View>

                {/* 5. CONTACT INFO CARD */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <HelpCircle size={20} color={COLORS.primary} fill={COLORS.primary} />
                        <Text style={styles.cardTitle}>İletişim Bilgileri</Text>
                    </View>

                    <View style={styles.listContainer}>
                        {/* Telefon */}
                        <TouchableOpacity style={styles.listItem} onPress={handleCall}>
                            <View style={styles.listIconBox}>
                                <Phone size={20} color={COLORS.textGray} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listLabel}>Telefon</Text>
                                <Text style={styles.listValue}>{institution.phone || 'Belirtilmemiş'}</Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* E-posta */}
                        <TouchableOpacity style={styles.listItem} onPress={handleEmail}>
                            <View style={styles.listIconBox}>
                                <Mail size={20} color={COLORS.textGray} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listLabel}>E-posta</Text>
                                <Text style={styles.listValue}>{institution.email || 'Belirtilmemiş'}</Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Adres */}
                        <View style={[styles.listItem, { alignItems: 'flex-start' }]}>
                            <View style={[styles.listIconBox, { marginTop: 2 }]}>
                                <MapPin size={20} color={COLORS.textGray} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listLabel}>Adres</Text>
                                <Text style={styles.listValue}>{institution.address}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 6. MAP CARD (Görsel Statik, Link Dinamik) */}
                <View style={styles.mapCardContainer}>
                    <View style={styles.mapCard}>
                        <Image
                            source={require("../../assets/images/harita.jpg")}
                            style={styles.mapImage}
                        />
                        <View style={styles.mapPinContainer}>
                            <MapPin size={40} color={COLORS.red} fill={COLORS.red} />
                        </View>

                        <View style={styles.mapButtonContainer}>
                            <TouchableOpacity style={styles.mapButton} onPress={handleMap}>
                                <Navigation size={20} color="white" />
                                <Text style={styles.mapButtonText}>Yol Tarifi Al</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 7. WORKING HOURS */}
                <View style={[styles.card, { marginBottom: 30 }]}>
                    <View style={styles.cardHeader}>
                        <Clock size={20} color={COLORS.primary} fill={COLORS.primary} />
                        <Text style={styles.cardTitle}>Çalışma Saatleri</Text>
                    </View>

                    <View style={styles.hoursList}>
                        {institution.workingHours.map((item, index) => (
                            <View key={index}>
                                <View style={styles.hoursRow}>
                                    <Text style={styles.dayText}>{item.label}</Text>
                                    <Text style={[styles.timeText, !item.isOpen && styles.closedText]}>
                                        {item.value}
                                    </Text>
                                </View>
                                {index < institution.workingHours.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>
 {/* reklam */}
        
            </ScrollView>
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
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },

    content: {
        paddingBottom: 40,
    },

    // Hero
    heroSection: {
        backgroundColor: 'white',
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
    },
    imageContainer: {
        padding: 16,
        paddingTop: 16,
    },
    heroImage: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#637588',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Actions
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 16,
        marginTop: 24,
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    actionCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eff6ff', 
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textDark,
    },

    // Card Common
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    cardText: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.textDark,
    },

    // Lists
    listContainer: {
        marginTop: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    listIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        flex: 1,
    },
    listLabel: {
        fontSize: 12,
        color: '#637588',
        fontWeight: '500',
        marginBottom: 2,
    },
    listValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },

    // Map Card
    mapCardContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    mapCard: {
        flex: 1,
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapPinContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    mapButtonContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    mapButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    mapButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Hours
    hoursList: {
        marginTop: 4,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#637588',
    },
    closedText: {
        color: COLORS.red,
    },
});