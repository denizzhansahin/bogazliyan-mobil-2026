import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Search,
    Star,
    MapPin,
    Phone,
    Navigation, // Directions icon için
    Utensils,
    Coffee,
    Scissors,
    Wrench,
    Stethoscope,
    LayoutGrid,
    ShoppingBag
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- SUPABASE IMPORTS ---
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// --- TİP TANIMLAMALARI ---
interface Place {
    id: string;
    name: string;
    category: string;
    rating: number;
    distance: string;
    image: string;
    isOpen: boolean;
    address: string;
    priceLevel: string;
    subCategory: string;
}

// --- RENK PALETİ ---
const COLORS = {
    primary: '#0db9f2',
    bg: '#f3f5f6', // background-light from HTML
    white: '#ffffff',
    textDark: '#111618',
    textGray: '#6b7280', // gray-500
    textLight: '#9ca3af', // gray-400
    green: '#10b981', // emerald-500
    red: '#ef4444',
    orange: '#f97316',
    cardBorder: '#f1f5f9',
};

// --- TİP TANIMLAMALARI ---
interface Place {
    id: string;
    name: string;
    category: string; // 'food', 'cafe', 'beauty', 'health', 'industry', 'market'
    rating: number;
    distance: string;
    image: string;
    isOpen: boolean;
    address: string;
    priceLevel: string; // ₺, ₺₺, ₺₺₺
    subCategory: string; // 'Türk Mutfağı', 'Kafe', 'Berber' vb.
}

{/* 
// --- KATEGORİLER ---
const CATEGORIES = [
    { id: 'all', label: 'Hepsi', icon: LayoutGrid },
    { id: 'food', label: 'Yemek', icon: Utensils },
    { id: 'cafe', label: 'Kafe', icon: Coffee },
    { id: 'beauty', label: 'Güzellik', icon: Scissors },
    { id: 'health', label: 'Sağlık', icon: Stethoscope },
    { id: 'industry', label: 'Sanayi', icon: Wrench },
];

// --- 20 ADET MOCK VERİ ---
const PLACES_DATA: Place[] = [
    { id: '1', name: 'Divan Restoran', category: 'food', rating: 4.8, distance: '0.5 km', isOpen: true, address: 'Mevlana Mah. Cumhuriyet Cad. No:14', priceLevel: '₺₺', subCategory: 'Türk Mutfağı', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800' },
    { id: '2', name: 'Kahve Evi 1984', category: 'cafe', rating: 4.5, distance: '1.2 km', isOpen: true, address: 'Çarşı Meydanı, Eski Belediye Arkası', priceLevel: '₺', subCategory: 'Kafe & Tatlı', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800' },
    { id: '3', name: 'Kuaför Ali', category: 'beauty', rating: 4.9, distance: '0.8 km', isOpen: false, address: 'Yeni Mahalle, Stadyum Yanı No:5', priceLevel: '₺', subCategory: 'Erkek Kuaförü', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800' },
    { id: '4', name: 'Boğazlıyan Market', category: 'market', rating: 4.2, distance: '2.1 km', isOpen: true, address: 'Kayseri Cad. Terminal Karşısı', priceLevel: '₺', subCategory: 'Süpermarket', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800' },
    { id: '5', name: 'Şifa Eczanesi', category: 'health', rating: 5.0, distance: '1.5 km', isOpen: true, address: 'Hastane Cad. No:12', priceLevel: '₺', subCategory: 'Eczane', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=800' },
    { id: '6', name: 'Oto Teknik Servis', category: 'industry', rating: 4.6, distance: '3.5 km', isOpen: true, address: 'Sanayi Sitesi 4. Blok', priceLevel: '₺₺', subCategory: 'Oto Tamir', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800' },
    { id: '7', name: 'Saray Fırını', category: 'food', rating: 4.7, distance: '0.3 km', isOpen: true, address: 'Meydan Cad. No:2', priceLevel: '₺', subCategory: 'Unlu Mamüller', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800' },
    { id: '8', name: 'Güzellik Merkezi', category: 'beauty', rating: 4.4, distance: '1.0 km', isOpen: true, address: 'Atatürk Bulvarı Kat:2', priceLevel: '₺₺₺', subCategory: 'Kadın Kuaförü', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800' },
    { id: '9', name: 'Merkez Diş Kliniği', category: 'health', rating: 4.9, distance: '0.6 km', isOpen: false, address: 'Lise Caddesi No:8', priceLevel: '₺₺', subCategory: 'Diş Hekimi', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800' },
    { id: '10', name: 'Lezzet Dünyası', category: 'food', rating: 4.3, distance: '1.8 km', isOpen: true, address: 'TOKİ Konutları Girişi', priceLevel: '₺', subCategory: 'Ev Yemekleri', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800' },
    { id: '11', name: 'Lastikçi Mehmet', category: 'industry', rating: 4.8, distance: '3.2 km', isOpen: true, address: 'Sanayi Sitesi 1. Blok', priceLevel: '₺', subCategory: 'Oto Lastik', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=800' },
    { id: '12', name: 'Çiçek Bahçesi', category: 'market', rating: 4.5, distance: '0.4 km', isOpen: true, address: 'Belediye Meydanı', priceLevel: '₺₺', subCategory: 'Çiçekçi', image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=800' },
    { id: '13', name: 'Kitap Kafe', category: 'cafe', rating: 4.7, distance: '0.9 km', isOpen: true, address: 'Kütüphane Yanı', priceLevel: '₺', subCategory: 'Kitap & Kahve', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800' },
    { id: '14', name: 'Veteriner Kliniği', category: 'health', rating: 4.9, distance: '2.5 km', isOpen: true, address: 'Sanayi Yolu Üzeri', priceLevel: '₺₺', subCategory: 'Veteriner', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800' },
    { id: '15', name: 'Mobilya Dünyası', category: 'industry', rating: 4.2, distance: '4.0 km', isOpen: false, address: 'Galericiler Sitesi', priceLevel: '₺₺₺', subCategory: 'Mobilya', image: 'https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800' },
    { id: '16', name: 'Pideci Hasan Usta', category: 'food', rating: 4.6, distance: '0.7 km', isOpen: true, address: 'Eski Sanayi İçi', priceLevel: '₺', subCategory: 'Pide & Lahmacun', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800' },
    { id: '17', name: 'Terzi Ahmet', category: 'industry', rating: 4.4, distance: '0.5 km', isOpen: true, address: 'Pasaj İçi No:12', priceLevel: '₺', subCategory: 'Terzi', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=800' },
    { id: '18', name: 'Spor Salonu', category: 'health', rating: 4.8, distance: '1.3 km', isOpen: true, address: 'Stadyum Karşısı', priceLevel: '₺₺', subCategory: 'Fitness', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800' },
    { id: '19', name: 'Pastane Tadım', category: 'food', rating: 4.5, distance: '0.2 km', isOpen: true, address: 'Hükümet Konağı Yanı', priceLevel: '₺', subCategory: 'Pastane', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800' },
    { id: '20', name: 'Demir Doğrama', category: 'industry', rating: 4.3, distance: '3.8 km', isOpen: false, address: 'Sanayi 3. Blok', priceLevel: '₺₺', subCategory: 'Demir & Kaynak', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800' },
];
*/}

export default function PlacesScreen() {
    const insets = useSafeAreaInsets();

    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchText, setSearchText] = useState('');

    // State Tanımları
    const [places, setPlaces] = useState<Place[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Kategorileri Çek ('place' tipindeki)
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'place');

            if (catData) {
                // "Hepsi" seçeneğini başa ekle, ikonları eşleştir
                const formattedCategories = [
                    { id: 'all', label: 'Hepsi', icon: LayoutGrid },
                    ...catData.map(c => ({
                        id: c.id,
                        label: c.label,
                        icon: getCategoryIcon(c.id) // Helper fonksiyon
                    }))
                ];
                setCategories(formattedCategories);
            }

            // 2. Mekanları Çek (Kategori ismiyle beraber)
            const { data: placesData, error } = await supabase
                .from('places')
                .select(`
                    *,
                    categories ( label )
                `);

            if (error) throw error;

            if (placesData) {
                // DB verisini UI formatına dönüştür
                const formattedPlaces: Place[] = placesData.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    category: item.category_id || 'other',
                    rating: item.rating || 0,
                    // Aşağıdakiler DB'de olmadığı için varsayılan/random değerler atıyoruz
                    //distance: `${(Math.random() * 5).toFixed(1)} km`, 
                    image: item.image_url || "",
                    isOpen: true, // Şimdilik hepsi açık varsayalım
                    address: item.address || 'Adres belirtilmemiş',
                    priceLevel: '₺₺',
                    subCategory: item.categories?.label || 'Genel',
                    phone: item.phone,
                }));
                setPlaces(formattedPlaces);
            }

        } catch (error) {
            console.error('Mekanlar çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };



    // --- HELPER: Kategori ID'sine göre İkon Seçimi ---
    const getCategoryIcon = (id: string) => {
        switch (id) {
            case 'yeme-icme': return Utensils;
            case 'alisveris': return ShoppingBag;
            case 'saglik': return Stethoscope;
            case 'guzellik': return Scissors;
            case 'sanayi': return Wrench;
            case 'kafe': return Coffee;
            default: return LayoutGrid;
        }
    };

    // Filtreleme Mantığı
    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const matchesCategory = activeCategory === 'all' || place.category === activeCategory;
            const matchesSearch = place.name.toLowerCase().includes(searchText.toLowerCase()) ||
                place.subCategory.toLowerCase().includes(searchText.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchText, places]);



    // Kart Bileşeni
    const renderPlaceCard = ({ item }: { item: Place }) => (
        <TouchableOpacity
            activeOpacity={0.95}
            style={styles.cardContainer}
            onPress={() =>
                router.push({
                    pathname: '/pages/place-detail', // Detay sayfasına yönlendirme
                    params: { id: item.id },
                })
            }
        >
            {/* Görsel Alanı */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={500}
                />
                <View style={styles.imageOverlay} />

                <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)' }]}>
                    <Text style={styles.statusText}>{item.isOpen ? 'Şu an Açık' : 'Kapalı'}</Text>
                </View>

                <View style={styles.imageBottomInfo}>
                    <View style={styles.ratingBadge}>
                        <Star size={14} color={COLORS.orange} fill={COLORS.orange} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    {/* Görsel Alanı 
                    
                    <View style={styles.distanceBadge}>
                        
                        <Navigation size={12} color="white" />
                        <Text style={styles.distanceText}>{item.distance}</Text>
                    </View>
                    */}

                </View>
            </View>

            {/* İçerik Alanı */}
            <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.placeCategory}>{item.subCategory} • {item.priceLevel}</Text>
                    </View>
                </View>

                <View style={styles.addressRow}>
                    <MapPin size={16} color={COLORS.textGray} style={{ marginTop: 2 }} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => { if (item?.phone) Linking.openURL(`tel:${item.phone}`); }}>
                        <Phone size={18} color={COLORS.textDark} />
                        <Text style={styles.actionBtnTextSecondary}>Ara</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnPrimary}
                        onPress={() =>
                            router.push({
                                pathname: '/pages/place-detail', // Detay sayfasına yönlendirme
                                params: { id: item.id },
                            })
                        }
                    >
                        <Navigation size={18} color="white" />
                        <Text style={styles.actionBtnTextPrimary}>Detaylar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, {
            //paddingBottom: insets.bottom,
        }]}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* 1. STICKY HEADER (Arama ve Kategoriler) */}
            <View style={styles.header}>
                <View>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={COLORS.textDark} />
                        </TouchableOpacity>

                        <View style={styles.searchBox}>
                            <Search size={20} color={COLORS.textLight} />
                            <TextInput
                                placeholder="Boğazlıyan'da nereye gitsem?"
                                placeholderTextColor={COLORS.textLight}
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                    </View>
                    

                    {/* Kategoriler (Yatay Liste) */}
                    {/* Kategoriler */}
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                        renderItem={({ item }) => {
                            const isActive = activeCategory === item.id;
                            const IconComponent = item.icon; // Dinamik İkon
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.categoryChip,
                                        isActive && styles.categoryChipActive
                                    ]}
                                    onPress={() => setActiveCategory(item.id)}
                                >
                                    {IconComponent && (
                                        <IconComponent
                                            size={14}
                                            color={isActive ? 'white' : COLORS.textGray}
                                            style={{ marginRight: 6 }}
                                        />
                                    )}
                                    <Text style={[styles.categoryText, isActive && { color: 'white' }]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
          

            {/* 2. MEKAN LİSTESİ */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredPlaces}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPlaceCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: COLORS.textGray }}>Aradığınız kriterde mekan bulunamadı.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // Header Stilleri
    header: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        zIndex: 10,
        //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6', // gray-100
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
        height: '100%',
    },
    categoriesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30, // Tam yuvarlak
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#111618', // Black
        borderColor: '#111618',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '700', // Bold font from HTML
        color: '#4b5563', // gray-600
    },

    // Liste ve Kart Stilleri
    listContent: {
        padding: 20,
        gap: 24, // Kartlar arası boşluk
        paddingBottom: 50,
    },
    cardContainer: {
        backgroundColor: 'white',
        borderRadius: 24, // rounded-3xl
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
    },
    imageWrapper: {
        height: 256, // h-64
        width: '100%',
        position: 'relative',
        backgroundColor: '#e5e7eb',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: 'transparent', // Gradient yerine expo-linear-gradient kullanmak daha iyi olur ama basitlik için removed
        // Burada LinearGradient eklenebilir
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backdropFilter: 'blur(4px)', // iOS only
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    imageBottomInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        gap: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.orange,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    distanceText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    // Kart İçerik
    cardContent: {
        padding: 20,
        paddingTop: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    placeName: {
        fontSize: 20,
        fontWeight: '800', // Font-extrabold
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    placeCategory: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textGray, // gray-500
        marginTop: 4,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        marginBottom: 20,
    },
    addressText: {
        fontSize: 14,
        color: COLORS.textGray,
        flex: 1,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: 'white',
    },
    actionBtnTextSecondary: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151', // gray-700
    },
    actionBtnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#111618', // Black
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    actionBtnTextPrimary: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
});