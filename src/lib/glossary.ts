// Arama modunda Türkçe soruların İngilizce belgelerle eşleşmesi için sigorta terimleri sözlüğü.
// Anahtar Türkçe kelimenin kökü: "sızıntıyı" → "sızıntı" ile başladığı için eşleşir.
// Üretken model kullanıldığında (Workers AI) bu sözlüğe gerek kalmaz; çok dilli vektör araması yapılır.

export const TR_EN: Record<string, string> = {
  'su': 'water', 'sızıntı': 'leak escape water gradually', 'sızdır': 'leak escape water', 'kaçak': 'escape water leak',
  'kaçağ': 'escape water leak', 'boru': 'pipe installation', 'patla': 'burst escape suddenly', 'donm': 'freezing',
  'don': 'freezing', 'muafiyet': 'excess', 'limit': 'limit most pay', 'teminat': 'cover', 'kapsa': 'cover covered',
  'karşıla': 'cover pay', 'öde': 'pay payment', 'hırsız': 'theft', 'çalın': 'theft stolen', 'çal': 'theft',
  'kilitli': 'locked secured', 'kulübe': 'shed outbuilding', 'bahçe': 'garden', 'boş': 'unoccupied',
  'tatil': 'unoccupied away', 'kış': 'winter november march', 'ısıtma': 'heating', 'kalorifer': 'heating',
  'kombi': 'boiler heating', 'bakım': 'service maintenance', 'çökme': 'subsidence', 'oturma': 'subsidence settlement',
  'çatlak': 'cracking crack', 'heyelan': 'landslip', 'sel': 'flood', 'fırtına': 'storm', 'yangın': 'fire',
  'duman': 'smoke', 'konaklama': 'accommodation', 'otel': 'accommodation hotel', 'kira': 'let', 'evcil': 'pets',
  'köpek': 'pets dog', 'kedi': 'pets cat', 'çiğne': 'chewing', 'tırmala': 'scratching', 'kanepe': 'contents',
  'koltuk': 'contents', 'mobilya': 'contents furniture', 'halı': 'carpets', 'mücevher': 'jewellery valuables',
  'değerli': 'valuables', 'eşya': 'contents', 'bina': 'buildings', 'yapı': 'buildings structure', 'tamir': 'repair',
  'onar': 'repair', 'acil': 'emergency', 'tesisatçı': 'plumber', 'kurut': 'drying', 'küf': 'mould', 'nem': 'damp',
  'yetki': 'authority', 'onay': 'authority approve', 'reddet': 'decline', 'ret': 'decline', 'şikâyet': 'complaint',
  'şikayet': 'complaint', 'süre': 'timelines days', 'kırılgan': 'vulnerable', 'yaşlı': 'vulnerable elderly older',
  'hasta': 'vulnerable unwell', 'suistimal': 'fraud', 'dolandırıc': 'fraud', 'sahte': 'fraud', 'şüphe': 'concerns fraud',
  'ekip lider': 'team leader', 'lider': 'leader', 'müşteri': 'customer', 'poliçe': 'policy wording', 'sürüm': 'version wording',
  'hasar': 'damage claim loss', 'talep': 'claim', 'dosya': 'claim', 'bildirim': 'notification', 'ilk': 'first',
  'arama': 'call', 'kimlik': 'identity', 'iptal': 'cancel', 'cayma': 'cancel days', 'prim': 'premium', 'iade': 'refund',
  'eksper': 'adjuster surveyor', 'mühendis': 'engineer', 'kanıt': 'evidence', 'fark': 'noticed knew noticeable',
  'bil': 'knew know', 'yavaş': 'gradually', 'ani': 'suddenly', 'elektrik': 'electricity', 'sigorta kutusu': 'fuse board',
  'vana': 'stopcock', 'kapat': 'turn off', 'kaza': 'accidental', 'kırıl': 'accidental damage', 'kısmi': 'part',
  'nakit': 'cash', 'tedarikçi': 'supplier', 'mutfak': 'kitchen', 'lavabo': 'sink', 'dolap': 'kitchen cabinet',
  'parke': 'floor', 'zemin': 'floor', 'duvar': 'walls', 'leke': 'staining', 'koku': 'smell', 'şiş': 'swelling',
  'gecikme': 'overdue', 'tutar': 'settlement value', 'hafta': 'weeks days', 'ay': 'months days', 'gün': 'days', 'gece': 'night tonight nights',
  'ev': 'home', 'evi': 'home', 'evde': 'home', 'kal': 'stay lived', 'bas': 'flood escape water', 'ayarla': 'arrange', 'ödü': 'pay', 'zarar': 'damage', 'kendim': 'claims handler',
  'ombudsman': 'ombudsman', 'garda': 'garda', 'polis': 'garda report', 'rapor': 'report', 'sorumlu': 'owner',
  'ödem': 'payment pay', 'üçüncü': 'third', 'banka': 'bank', 'mektup': 'letter', 'yazı': 'letter writing'
};

// İngilizce eş anlamlılar: soruda geçen günlük kelime belgedeki terime bağlanır
export const EN_SYN: Record<string, string> = {
  leak: 'escape water gradually', leaking: 'escape water gradually', leaked: 'escape water gradually',
  empty: 'unoccupied', vacant: 'unoccupied', away: 'unoccupied', deductible: 'excess', hotel: 'accommodation',
  dog: 'pets', cat: 'pets', pet: 'pets', chewed: 'chewing', stolen: 'theft', burglary: 'theft', burgled: 'theft',
  settle: 'settlement authority', approve: 'authority', complain: 'complaint', crack: 'cracking subsidence',
  cracks: 'cracking subsidence', frozen: 'freezing', mold: 'mould', reject: 'decline', refuse: 'decline',
  elderly: 'vulnerable', older: 'vulnerable', fraudulent: 'fraud', suspicious: 'fraud concerns', fix: 'repair',
  plumber: 'plumber plumbing', sofa: 'contents', furniture: 'contents', laptop: 'contents', flat: 'home',
  house: 'home', excess: 'excess', winter: 'november march', slow: 'gradually', slowly: 'gradually',
  noticed: 'knew know noticeable', notice: 'knew know noticeable', swollen: 'swelling', swelled: 'swelling',
  covering: 'cover pay', covered: 'cover pay', cover: 'cover pay', myself: 'claims handler', months: 'days', weeks: 'days',
  locked: 'secured locked', lock: 'secured'
};
