import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    TextInput,
    Linking,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Search,
    Phone,
    Navigation,
    Landmark, // Belediye (account_balance)
    Hospital, // Sağlık (local_hospital)
    Shield,   // Emniyet (local_police)
    Gavel,    // Adliye (gavel)
    GraduationCap, // Eğitim (school)
    Building2 // Genel Kurum
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- RENKLER ---
const COLORS = {
    primary: '#137fec',
    bg: '#f6f7f8',
    white: '#ffffff',
    textDark: '#111418',
    textGray: '#617589',
    border: '#e2e8f0',
    // Kategori Renkleri
    blue: '#3b82f6',
    blueBg: '#eff6ff',
    red: '#ef4444',
    redBg: '#fef2f2',
    indigo: '#6366f1',
    indigoBg: '#eef2ff',
    orange: '#f97316',
    orangeBg: '#fff7ed',
    purple: '#a855f7',
    purpleBg: '#f3e8ff',
};

// --- TİP TANIMLARI ---
interface InstitutionUI {
    id: string;
    name: string;
    address: string;
    category: string;
    phone: string;
    locationLink: string;
    statusTag?: string;
    statusColor?: string;
}

// --- KATEGORİLER ---
const CATEGORIES = [
    { id: 'all', label: 'Hepsi' },
    { id: 'municipality', label: 'Belediye' },
    { id: 'security', label: 'Emniyet' },
    { id: 'health', label: 'Sağlık' },
    { id: 'education', label: 'Eğitim' },
    { id: 'justice', label: 'Adliye' },
];

// --- TİP TANIMLARI ---
type CategoryType = 'all' | 'municipality' | 'health' | 'security' | 'justice' | 'education';


{/* 
interface Institution {
    id: string;
    name: string;
    address: string;
    category: CategoryType;
    phone: string;
    locationLink: string;
    statusTag?: string; // "Açık", "7/24 Acil" vb.
    statusColor?: string; // Tag rengi
}

// --- KATEGORİLER ---
const CATEGORIES: { id: CategoryType; label: string }[] = [
    { id: 'all', label: 'Hepsi' },
    { id: 'municipality', label: 'Belediye' },
    { id: 'security', label: 'Emniyet' },
    { id: 'health', label: 'Sağlık' },
    { id: 'education', label: 'Eğitim' },
    { id: 'justice', label: 'Adliye' },
];

// --- MOCK DATA ---
const INSTITUTIONS: Institution[] = [
    {
        id: '1',
        name: 'Boğazlıyan Belediyesi',
        address: 'Aşağı Mah. Cumhuriyet Meydanı No:1',
        category: 'municipality',
        phone: '+903546451001',
        locationLink: 'geo:0,0?q=Boğazlıyan+Belediyesi',
        statusTag: 'Açık • 17:00\'da kapanır',
        statusColor: '#16a34a' // Green
    },
    {
        id: '2',
        name: 'Boğazlıyan Devlet Hastanesi',
        address: 'Mevlana Mah. Hastane Cad. No:1',
        category: 'health',
        phone: '112',
        locationLink: 'geo:0,0?q=Boğazlıyan+Devlet+Hastanesi',
        statusTag: '7/24 Acil',
        statusColor: '#2563eb' // Blue
    },
    {
        id: '3',
        name: 'İlçe Emniyet Müdürlüğü',
        address: 'Bahçelievler Mah. Atatürk Cad.',
        category: 'security',
        phone: '155',
        locationLink: 'geo:0,0?q=Boğazlıyan+Emniyet',
    },
    {
        id: '4',
        name: 'Boğazlıyan Adliyesi',
        address: 'Karakoç Mah. Şehitler Cad.',
        category: 'justice',
        phone: '+903546451000',
        locationLink: 'geo:0,0?q=Boğazlıyan+Adliyesi',
    },
    {
        id: '5',
        name: 'Halk Eğitim Merkezi',
        address: 'Yeni Mahalle, Lise Caddesi',
        category: 'education',
        phone: '+903546452000',
        locationLink: 'geo:0,0?q=Boğazlıyan+Halk+Eğitim',
    },
];
*/}



export default function PublicInstitutionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
    const [searchText, setSearchText] = useState('');


    const [institutions, setInstitutions] = useState<InstitutionUI[]>([]);
    const [loading, setLoading] = useState(true);

useEffect(() => {
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('public_institutions')
                .select('*')
                .order('name', { ascending: true }); // İsim sırasına göre

            if (error) throw error;

            if (data) {
                const formattedData: InstitutionUI[] = data.map((item) => ({
                    id: item.id,
                    name: item.name,
                    address: item.address || 'Adres bilgisi yok',
                    category: item.category,
                    phone: item.phone || '',
                    locationLink: item.location_link || '',
                    statusTag: item.status_tag,
                    statusColor: item.status_color || '#16a34a' // Varsayılan yeşil
                }));
                setInstitutions(formattedData);
            }
        } catch (error) {
            console.error('Kurumlar çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER: Kategoriye Göre Stil ---
    const getCategoryStyle = (cat: string) => {
        switch (cat) {
            case 'municipality': return { icon: Landmark, color: COLORS.primary, bg: '#eff6ff' };
            case 'health': return { icon: Hospital, color: COLORS.red, bg: COLORS.redBg };
            case 'security': return { icon: Shield, color: COLORS.indigo, bg: COLORS.indigoBg };
            case 'justice': return { icon: Gavel, color: COLORS.orange, bg: COLORS.orangeBg };
            case 'education': return { icon: GraduationCap, color: COLORS.purple, bg: COLORS.purpleBg };
            default: return { icon: Building2, color: COLORS.textGray, bg: '#f1f5f9' };
        }
    };

    // --- FİLTRELEME MANTIĞI ---
    const filteredData = useMemo(() => {
        return institutions.filter(item => {
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchText, institutions]);

    const handleCall = (phone: string) => {
        if(phone) Linking.openURL(`tel:${phone}`);
        else alert("Telefon numarası bulunamadı.");
    };
    
    const handleMap = (link: string) => {
        if(link) Linking.openURL(link);
        else alert("Konum bilgisi bulunamadı.");
    };

    // --- KART BİLEŞENİ ---
    const renderItem = ({ item }: { item: InstitutionUI }) => {
        const style = getCategoryStyle(item.category);
        const Icon = style.icon;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push({
        pathname: '/pages/public-institution-detail',
        params: { id: item.id },
      })} 
            >
                <View style={styles.cardContent}>
                    <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
                        <Icon size={28} color={style.color} />
                    </View>

                    <View style={styles.infoCol}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.address}>{item.address}</Text>

                        {item.statusTag && (
                            <View style={styles.tagContainer}>
                                <Text style={[styles.tagText, { color: item.statusColor }]}>{item.statusTag}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Aksiyon Butonları */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleCall(item.phone)}
                    >
                        <Phone size={18} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Ara</Text>
                    </TouchableOpacity>

                    <View style={styles.verticalDivider} />

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleMap(item.locationLink)}
                    >
                        <Navigation size={18} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Yol Tarifi</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

return (
            <SafeAreaView style={[styles.container,{
        //paddingBottom: insets.bottom,
      }]}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            {/* 1. HEADER & SEARCH */}
            <View style={styles.headerContainer}>
                <View>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <ArrowLeft size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Kamu Kurumları</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchBar}>
                            <Search size={20} color={COLORS.textGray} />
                            <TextInput
                                placeholder="Kurum ara..."
                                placeholderTextColor={COLORS.textGray}
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                    </View>

                    {/* Filter Chips */}
                    <FlatList
                        horizontal
                        data={CATEGORIES}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterList}
                        renderItem={({ item }) => {
                            const isActive = activeCategory === item.id;
                            return (
                                <TouchableOpacity
                                    style={[styles.chip, isActive && styles.chipActive]}
                                    onPress={() => setActiveCategory(item.id)}
                                >
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
 {/* reklam */}
            {/* 2. LISTE */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 20 }} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: COLORS.textGray }}>Kurum bulunamadı.</Text>
                        </View>
                    }
                />
            )}
             {/* reklam */}
        
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0

    },

    // Header Area
    headerContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 12,
    },
    topBar: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backBtn: {
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

    // Search
    searchWrapper: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f4',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textDark,
        height: '100%',
    },

    // Filters
    filterList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    chipTextActive: {
        color: 'white',
    },

    // List
    listContent: {
        padding: 16,
        gap: 16,
    },

    // Card
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCol: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    address: {
        fontSize: 13,
        color: COLORS.textGray,
        lineHeight: 18,
    },
    tagContainer: {
        marginTop: 8,
        backgroundColor: '#f0fdf4', // Light green bg default
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(22, 163, 74, 0.1)',
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Actions
    actionRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#fafafa',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#f1f5f9',
    },
});