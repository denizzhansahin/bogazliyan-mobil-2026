import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Linking,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ScrollText, 
  Gavel,
  Mail,
  AlertTriangle 
} from 'lucide-react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- RENKLER VE TEMA ---
const COLORS = {
  primary: '#13c8ec', // Turkuaz
  bg: '#ffffff',
  textDark: '#111718',
  textGray: '#334155', // Okunabilirlik için biraz koyulaştırıldı
  border: '#e2e8f0',
  lightCyan: 'rgba(19, 200, 236, 0.1)', 
  lightRed: 'rgba(239, 68, 68, 0.08)',
  redText: '#ef4444',
  contactBg: '#f8fafc',
};

// Kalın yazı yardımcısı bileşen
const B = ({ children }) => <Text style={{ fontWeight: '800', color: COLORS.textDark }}>{children}</Text>;

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleContact = () => {
    // Buraya geçerli iletişim mailini girin
    Linking.openURL('mailto:mobilhaber2025@gmail.com'); 
  };

  const handleweb = () => {
    // Buraya geçerli iletişim mailini girin
    Linking.openURL('https://bogazliyan.linksphere.tr/gizlilik-politikas%C4%B1-kullan%C4%B1m-ko%C5%9Fullar%C4%B1-ve-lisans'); 
  };

  return (
     <SafeAreaView style={[styles.container,{
        paddingBottom: insets.bottom,
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 1. HEADER (ÜST BAR) */}
      <View style={{ backgroundColor: 'white' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yasal Sözleşmeler</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          
        
        {/* BAŞLIK VE SÜRÜM BİLGİSİ */}
        <View style={styles.topSection}>
            <Text style={styles.mainTitle}>YASAL BİLGİLENDİRME, GİZLİLİK VE LİSANS SÖZLEŞMESİ</Text>
            <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Sürüm: 1.0</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Güncelleme: 04.01.2026</Text>
                </View>
            </View>
            <Text style={styles.devText}>
                <B>Geliştirici:</B> Boğazlıyan Mobil Geliştirici Ekibi (İşbu metinde "Geliştirici" veya "Lisans Veren" olarak anılacaktır.)
            </Text>
        </View>

        {/* --- ÖNEMLİ UYARI KUTUSU (KABUL BEYANI) --- */}
        <View style={styles.warningBox}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8}}>
                <AlertTriangle size={20} color={COLORS.redText} />
                <Text style={[styles.sectionTitle, {color: COLORS.redText, fontSize: 15}]}>ÖNEMLİ YASAL UYARI VE KABUL BEYANI</Text>
            </View>
            <Text style={styles.warningText}>
                Lütfen "Boğazlıyan Mobil" uygulamasını ("Uygulama") indirmeden veya kullanmadan önce işbu sözleşmeyi dikkatlice okuyunuz.
            </Text>
            <Text style={styles.warningText}>
                Kullanıcı; uygulamanın <B>cihaza yüklendiği ilk andan</B>, <B>çalıştırıldığı ilk andan</B> ve <B>kullanıldığı her an</B> itibarıyla; aşağıda yer alan Gizlilik Politikası, Kullanım Koşulları ve Lisans Sözleşmesi hükümlerinin tamamını kayıtsız şartsız kabul etmiş sayılır. Bu kabul beyanı, kullanıcının uygulamayı cihazında barındırdığı süre boyunca geçerlidir.
            </Text>
            <Text style={[styles.warningText, {marginTop: 8, fontWeight:'bold'}]}>
                Eğer bu şartları kabul etmiyorsanız, uygulamayı derhal cihazınızdan kaldırınız ve kullanmayınız.
            </Text>

            <Text style={[styles.warningText, {marginTop: 8, fontWeight:'bold'}]}>
                Aşağıdaki bağlantıya tıklayarak, her zaman en güncel yasal metinlere erişebilirsiniz: Bu uygulama içindeki metinler bazen güncel olmayabilir. Aşağıdali linkte ise zaman güncel olan yasal metin vardır.
            </Text>
        </View>

        <TouchableOpacity style={styles.contactBtn} onPress={handleweb}>
            <Mail size={18} color="white" />
            <Text style={styles.contactBtnText}>Güncel olan Yasal Metinler için tıklayın!</Text>
          </TouchableOpacity>

        {/* --- BÖLÜM I: GİZLİLİK POLİTİKASI --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <ShieldCheck size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>BÖLÜM I: GİZLİLİK POLİTİKASI</Text>
          </View>
          
          <View style={styles.sectionBody}>
            <Text style={styles.subHeader}>1. GİRİŞ VE KAPSAM</Text>
            <Text style={styles.paragraph}>
              İşbu Gizlilik Politikası, Boğazlıyan Mobil uygulaması üzerinden sunulan hizmetler esnasında; kullanıcı verilerinin toplanma yöntemlerini, kullanım amaçlarını, üçüncü taraflarla paylaşım süreçlerini ve veri güvenliği önlemlerini detaylandırır. Geliştirici, kullanıcı mahremiyetine en üst düzeyde saygı göstermeyi ilke edinmiştir.
            </Text>

            <Text style={styles.subHeader}>2. TOPLANAN VERİLERİN TÜRÜ VE YÖNTEMİ</Text>
            
            <Text style={styles.miniHeader}>2.1. Geliştirici Tarafından Doğrudan Toplanmayan Veriler:</Text>
            <Text style={styles.paragraph}>
              Geliştirici, kullanıcılardan doğrudan kimlik tespiti yapmaya yarayan; T.C. Kimlik Numarası, Pasaport Numarası, ev adresi, kişisel finansal şifreler veya hassas sağlık verileri gibi bilgileri <B>kesinlikle talep etmez, sunucularında depolamaz ve işlemez.</B> Uygulama, üyelik zorunluluğu olmayan alanlarda tamamen anonim bir kullanım deneyimi sunar.
            </Text>

            <Text style={styles.miniHeader}>2.2. Hizmet Sağlayıcılar Aracılığıyla Otomatik Toplanan Teknik Veriler:</Text>
            <Text style={styles.paragraph}>
              Uygulamanın sürdürülebilirliği, reklam gösterimi ve teknik analizi için entegre edilen Üçüncü Taraf Hizmet Sağlayıcıları (Service Providers) tarafından, kullanıcının cihazından otomatik olarak aşağıdaki teknik veriler toplanabilir:
            </Text>
            <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• <B>Cihaz Kimlik Bilgileri:</B> Cihaz markası, modeli, işletim sistemi sürümü (Android/iOS), dil ayarları, saat dilimi ve IP adresi.</Text>
                <Text style={styles.bulletItem}>• <B>Reklam Kimliği (Advertising ID):</B> Google AdMob veya benzeri reklam ağları tarafından, kullanıcıya kişiselleştirilmiş (ilgi alanına dayalı) veya genel reklamlar sunmak amacıyla kullanılan benzersiz cihaz reklam kimliği.</Text>
                <Text style={styles.bulletItem}>• <B>Konum Verileri:</B> Uygulama içerisindeki "Nöbetçi Eczaneler", "Hava Durumu" veya "Harita" servislerinin doğru çalışabilmesi için; GPS, Wi-Fi veya baz istasyonu verileri kullanılarak elde edilen hassas veya kaba konum bilgileri. (Bu veriler anlık olarak işlenir, Geliştirici tarafından tarihçeli olarak kaydedilmez.)</Text>
                <Text style={styles.bulletItem}>• <B>Etkileşim ve Performans Verileri (Analytics):</B> Uygulamanın ne kadar süre kullanıldığı, hangi ekranlarda ne kadar vakit geçirildiği, uygulamanın çökme raporları (Crash Logs) ve performans metrikleri.</Text>
            </View>

            <Text style={styles.subHeader}>3. VERİLERİN KULLANIM AMACI</Text>
            <Text style={styles.paragraph}>Toplanan (üçüncü taraflarca işlenen) veriler şu amaçlarla kullanılır:</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Uygulamanın teknik işlevselliğini sağlamak ve hataları (bug) tespit edip düzeltmek.</Text>
                <Text style={styles.bulletItem}>• Kullanıcıya bölgesel (Boğazlıyan ve çevresi) içerik sunmak.</Text>
                <Text style={styles.bulletItem}>• Uygulamanın ücretsiz kalabilmesi için reklam gösterimlerini yönetmek.</Text>
                <Text style={styles.bulletItem}>• Yasal zorunluluklar dahilinde yetkili makamlara bilgi sağlamak.</Text>
            </View>

            <Text style={styles.subHeader}>4. ÜÇÜNCÜ TARAF HİZMET SAĞLAYICILAR VE SORUMLULUK</Text>
            <Text style={styles.paragraph}>
              Uygulama, Google AdMob, Google Firebase, Google Maps, Supabase ve benzeri altyapı sağlayıcılarını kullanır.
            </Text>
            <Text style={styles.paragraph}>
              Kullanıcı, bu üçüncü taraf servislerin kendi gizlilik politikalarına tabi olduğunu kabul eder. Geliştirici, bu firmaların veri işleme süreçlerinden, çerez (cookie) politikalarından veya olası veri ihlallerinden hukuken sorumlu tutulamaz.
            </Text>
          </View>
        </View>

        {/* --- BÖLÜM II: KULLANIM KOŞULLARI --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <ScrollText size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>BÖLÜM II: KULLANIM KOŞULLARI</Text>
          </View>
          
          <View style={styles.sectionBody}>
            <Text style={styles.subHeader}>1. HİZMETİN NİTELİĞİ VE BİLGİLENDİRME AMACI</Text>
            
            <Text style={styles.miniHeader}>1.1. Sadece Bilgilendirme:</Text>
            <Text style={styles.paragraph}>
              Boğazlıyan Mobil; yerel haberler, nöbetçi eczaneler, firma rehberi, ikinci el ilanları, otobüs saatleri ve hava durumu gibi içerikleri "Genel Bilgilendirme" amacıyla sunar.
            </Text>

            <Text style={styles.miniHeader}>1.2. Garanti Feragatnamesi:</Text>
            <Text style={styles.paragraph}>
              Geliştirici, uygulama içeriğinin; kesintisiz güncel kalacağını, %100 hatasız veya eksiksiz olduğunu, resmi makamlarca sağlanan verilerle birebir örtüştüğünü <B>garanti etmez.</B> Veriler, kaynaklardan çekilirken teknik gecikmeler veya hatalar oluşabilir.
            </Text>

            <Text style={styles.miniHeader}>1.3. Kullanıcı Sorumluluğu:</Text>
            <Text style={styles.paragraph}>
              Uygulamadaki verilere (örneğin nöbetçi eczane listesine veya otobüs saatine) güvenerek yapılacak her türlü fiziksel eylem, ticari işlem, seyahat planı veya sağlık girişimi tamamen kullanıcının kendi riskindedir. Yanlış veya güncel olmayan bilgi nedeniyle oluşabilecek maddi, manevi, bedeni zararlardan veya veri kayıplarından Geliştirici sorumlu tutulamaz.
            </Text>

            <Text style={styles.subHeader}>2. YASAL ROLLER</Text>
            <Text style={styles.paragraph}>Uygulamanın yasal statüsü 5651 sayılı Kanun ve ilgili mevzuatlar çerçevesinde aşağıda tanımlanmıştır:</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• <B>Yer Sağlayıcı (Hosting Provider):</B> Geliştirici; uygulama içerisinde kullanıcıların ilan eklemesine, firmaların tanıtım yapmasına veya yorum yazmasına olanak tanıyan altyapıyı sağladığı için "Yer Sağlayıcı" sıfatını haizdir. Geliştirici, yer sağladığı içeriği denetlemekle veya hukuka aykırı bir faaliyetin olup olmadığını araştırmakla yükümlü değildir.</Text>
                <Text style={styles.bulletItem}>• <B>İçerik Sağlayıcı (Content Provider):</B> Uygulama içerisindeki "İkinci El İlanları", "Firma Tanıtımları", "Kullanıcı Yorumları" alanlarında içeriği oluşturan kişi veya kurumlar "İçerik Sağlayıcı"dır. İçeriğin doğruluğundan, yasallığından ve telif haklarına uygunluğundan bizzat İçerik Sağlayıcı sorumludur.</Text>
                <Text style={styles.bulletItem}>• <B>Hizmet Sağlayıcı (Service Provider):</B> Uygulamanın teknik altyapısını (sunucu, veritabanı, harita) sunan üçüncü taraf firmalardır.</Text>
            </View>

            <Text style={styles.subHeader}>3. PAZARYERİ VE İLAN ALANLARI İÇİN ÖZEL KOŞULLAR</Text>
            <Text style={styles.paragraph}>
              Uygulama, alıcı ve satıcıları bir araya getiren bir platform sunduğunda:
            </Text>
            <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Geliştirici, alım-satım işleminin tarafı değildir.</Text>
                <Text style={styles.bulletItem}>• Listelenen ürünlerin kalitesi, güvenliği veya yasallığı konusunda Geliştirici kefil değildir.</Text>
                <Text style={styles.bulletItem}>• Kullanıcılar arasında doğabilecek dolandırıcılık, ödeme sorunları, kargo problemleri veya ayıplı mal teslimi gibi uyuşmazlıklarda Geliştirici hiçbir hukuki sorumluluk kabul etmez.</Text>
            </View>

            <Text style={styles.subHeader}>4. KULLANICI YÜKÜMLÜLÜKLERİ VE YASAKLI FAALİYETLER</Text>
            <Text style={styles.paragraph}>
              Kullanıcı; Türkiye Cumhuriyeti yasalarına, genel ahlaka ve kamu düzenine aykırı içerik paylaşamaz. Uygulamanın kaynak kodlarına müdahale edemez, tersine mühendislik yapamaz. Otomatik yazılımlar (bot, scraper) kullanarak veri çekemez. Bu maddelerin ihlali durumunda Geliştirici; kullanıcının erişimini süresiz engelleme ve yasal yollara başvurma hakkını saklı tutar.
            </Text>
          </View>
        </View>

        {/* --- BÖLÜM III: LİSANS SÖZLEŞMESİ --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Gavel size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>BÖLÜM III: SON KULLANICI LİSANS SÖZLEŞMESİ (EULA)</Text>
          </View>
          
          <View style={styles.sectionBody}>
            <Text style={styles.subHeader}>1. LİSANSIN VERİLMESİ VE KAPSAMI</Text>
            <Text style={styles.paragraph}>
              Geliştirici, işbu sözleşme şartlarına uyulması kaydıyla, Kullanıcıya Uygulamayı bir mobil cihaza indirmesi, kurması ve çalıştırması için; <B>Kişisel (Bireysel), Ticari Olmayan, Devredilemez, Münhasır Olmayan</B> ve <B>Geri Alınabilir</B> sınırlı bir kullanım lisansı verir. Bu lisans, uygulamanın mülkiyetinin kullanıcıya geçtiği anlamına gelmez; sadece kullanım hakkını ifade eder.
            </Text>

            <Text style={styles.subHeader}>2. LİSANS KISITLAMALARI</Text>
            <Text style={styles.paragraph}>
              Kullanıcı, Geliştiricinin önceden yazılı izni olmaksızın:
            </Text>
            <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Uygulamayı kiralayamaz, satamaz, alt lisans veremez veya ücret karşılığı dağıtamaz.</Text>
                <Text style={styles.bulletItem}>• Uygulamanın herhangi bir parçasını, tasarımını veya kodunu başka bir ürün veya hizmetin içinde kullanamaz.</Text>
                <Text style={styles.bulletItem}>• Uygulama üzerindeki telif hakkı uyarılarını veya mülkiyet bildirimlerini kaldıramaz.</Text>
            </View>

            <Text style={styles.subHeader}>3. FİKRİ MÜLKİYET HAKLARI VE SAHİPLİK</Text>
            <Text style={styles.miniHeader}>3.1. Geliştirici Mülkiyeti:</Text>
            <Text style={styles.paragraph}>
              Uygulamanın kaynak kodları, görsel arayüz tasarımı, veritabanı mimarisi, "Boğazlıyan Mobil" markası, logosu ve Geliştirici tarafından üretilen tüm özgün içerikler; Fikir ve Sanat Eserleri Kanunu ve uluslararası telif hakkı sözleşmeleri kapsamında korunmaktadır. Tüm haklar Geliştirici Ekibe aittir.
            </Text>

            <Text style={styles.miniHeader}>3.2. Üçüncü Taraf Bileşenler:</Text>
            <Text style={styles.paragraph}>
              Uygulama içerisinde kullanılan açık kaynak kodlu kütüphaneler, harita altlıkları, ikon setleri ve fontlar; ilgili hak sahiplerinin mülkiyetindedir. Kullanıcı, bu bileşenleri uygulamanın bütünlüğünden ayırarak tek başına kullanamaz.
            </Text>

            <Text style={styles.subHeader}>4. SÖZLEŞMENİN FESHİ</Text>
            <Text style={styles.paragraph}>
              Kullanıcının işbu sözleşmedeki herhangi bir maddeyi ihlal etmesi durumunda, lisans hakkı kendiliğinden ve ihbara gerek kalmaksızın sona erer. Geliştirici, uygulamanın yayınına son verme veya kullanıcının erişimini engelleme hakkına sahiptir.
            </Text>

            <Text style={styles.subHeader}>5. UYGULANACAK HUKUK VE YETKİLİ MAHKEME</Text>
            <Text style={styles.miniHeader}>5.1. Geliştirici ile Uyuşmazlıklar:</Text>
            <Text style={styles.paragraph}>
              Kullanıcı ve Geliştirici arasında, işbu sözleşmeden veya uygulamanın kullanımından doğacak her türlü uyuşmazlığın çözümünde <B>Türkiye Cumhuriyeti Kanunları</B> uygulanır. Yetkili merci <B>Türkiye Cumhuriyeti Mahkemeleri ve İcra Daireleridir.</B>
            </Text>

            <Text style={styles.miniHeader}>5.2. Hizmet Sağlayıcılar ile Uyuşmazlıklar:</Text>
            <Text style={styles.paragraph}>
              Kullanıcı ile üçüncü taraf Hizmet Sağlayıcılar (Google, Apple, Harita Servisleri vb.) arasında yaşanabilecek veri, hizmet veya teknik uyuşmazlıklarda; ilgili Hizmet Sağlayıcının merkezinin bulunduğu ülkenin kanunları geçerli olacaktır. Geliştirici bu tür uluslararası veya üçüncü taraf uyuşmazlıklarında taraf değildir.
            </Text>
          </View>
        </View>

        {/* --- İLETİŞİM KUTUSU --- */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>İletişim</Text>
          <Text style={styles.contactText}>
            Telif hakkı bildirimleri, hatalı içerik şikayetleri veya yasal sorularınız için Geliştirici Ekibi ile iletişime geçebilirsiniz.
          </Text>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <Mail size={18} color="white" />
            <Text style={styles.contactBtnText}>Geliştirici ile İletişime Geç</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 40}} />

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

  // HEADER
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // TOP SECTION
  topSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '600',
  },
  devText: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
  },

  // WARNING BOX
  warningBox: {
    backgroundColor: COLORS.lightRed,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  warningText: {
    fontSize: 13,
    color: '#7f1d1d', // Dark red
    lineHeight: 20,
    marginBottom: 4,
  },

  // SECTIONS
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.lightCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingLeft: 18, 
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0', 
    marginLeft: 18, 
  },
  
  // TYPOGRAPHY IN BODY
  subHeader: {
    fontSize: 15,
    fontWeight: '800', // Extra bold
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  miniHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textGray, 
    marginBottom: 10,
  },

  // LISTS
  bulletList: {
    marginTop: 4,
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.textGray,
    marginBottom: 6,
  },

  // CONTACT CARD
  contactCard: {
    marginTop: 10,
    backgroundColor: COLORS.contactBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textGray,
    marginBottom: 20,
  },
  contactBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  contactBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});