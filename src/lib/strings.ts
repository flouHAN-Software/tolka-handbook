// Arayüz metinleri: [İngilizce, Türkçe].
// İki dil birbirinden çevrilmez; her biri o dilde bir sigorta çalışanının söyleyeceği gibi ayrı yazılır.
// Türkçede "siz" hitabı kullanılır. Belgeler İngilizcedir (kurum İrlanda'da); Türkçe arayüzde alıntılar asıl dilinde kalır.

export const STR = {
  // kabuk
  'app.name': ['Handbook', 'Handbook'],
  'skip': ['Skip to content', 'İçeriğe geç'],
  'nav.label': ['Main', 'Ana menü'],
  'nav.ask': ['Ask', 'Sor'],
  'nav.documents': ['Documents', 'Belgeler'],
  'nav.history': ['History', 'Geçmiş'],
  'nav.quality': ['Answer quality', 'Yanıt kalitesi'],
  'nav.more': ['More', 'Daha fazla'],
  'concept': ['Concept project', 'Konsept çalışma'],
  'concept.by': ['Concept project by flouHAN Software', 'flouHAN Software konsept çalışması'],
  'concept.url': ['https://flouhan.com/en/work/document-assistant/', 'https://flouhan.com/tr/projeler/dokuman-asistani/'],
  'concept.note': [
    'Tolka Insurance, its people and its documents are made up for this demo.',
    'Tolka Insurance, çalışanları ve belgeleri bu deneme için kurgulandı.'
  ],
  'lang': ['Language', 'Dil'],
  'lang.switch': ['Türkçe arayüze geç', 'Switch to English'],
  'theme': ['Theme', 'Tema'],
  'theme.light': ['Light', 'Açık'],
  'theme.dark': ['Dark', 'Koyu'],
  'theme.toDark': ['Switch to dark theme', 'Koyu temaya geç'],
  'theme.toLight': ['Switch to light theme', 'Açık temaya geç'],
  'account': ['Signed in as', 'Giriş yapan'],

  // kişi (5. parçada rol seçimiyle değişecek)
  'role.claims': ['Claims handler', 'Hasar uzmanı'],
  'team.household': ['Household claims', 'Konut hasarları'],

  // ekranlar
  'ask.title': ['Ask the Handbook', "Handbook'a sorun"],
  'ask.lead': [
    'Ask about a policy, a claim or a procedure. Every answer shows the passage it comes from, and says so when the documents don’t cover it.',
    'Poliçe, hasar ya da prosedürle ilgili bir soru sorun. Her yanıt dayandığı bölümü gösterir; belgelerde bilgi yoksa bunu açıkça söyler.'
  ],
  'documents.title': ['Documents', 'Belgeler'],
  'documents.lead': [
    'The documents the assistant answers from. Each one has an owner and a review date, and only the roles listed can open it.',
    'Asistanın yanıt verdiği belgeler. Her belgenin bir sorumlusu ve gözden geçirme tarihi var; yalnızca listelenen roller açabilir.'
  ],
  'history.title': ['History', 'Geçmiş'],
  'history.lead': [
    'Your earlier questions and the answers you got. Open one to carry on where you left off.',
    'Daha önce sorduğunuz sorular ve aldığınız yanıtlar. Birini açıp kaldığınız yerden devam edin.'
  ],
  'quality.title': ['Answer quality', 'Yanıt kalitesi'],
  'quality.lead': [
    'Questions the documents couldn’t answer, grouped by what was missing, so the right owner can fix the document.',
    'Belgelerin yanıtlayamadığı sorular, eksiğin türüne göre gruplanmış hâlde; doğru sorumlu belgeyi düzeltebilsin diye.'
  ],
  'more.title': ['More', 'Daha fazla'],

  // roller ve ekipler
  'role.care': ['Customer care', 'Müşteri hizmetleri'],
  'role.siu': ['Special Investigations', 'Suistimal araştırma'],
  'role.knowledge': ['Knowledge team', 'Bilgi yönetimi'],
  'roles.claims': ['Claims', 'Hasar birimi'],
  'team.underwriting': ['Underwriting', 'Risk kabul'],
  'team.siu': ['Special Investigations Unit', 'Suistimal Araştırma Birimi'],
  'team.care': ['Customer care', 'Müşteri hizmetleri'],
  'team.relations': ['Customer relations', 'Müşteri ilişkileri'],
  'team.leadership': ['Claims leadership', 'Hasar yönetimi'],
  'team.knowledge': ['Knowledge team', 'Bilgi yönetimi'],

  // belge türleri
  'kind.wording': ['Policy wording', 'Poliçe şartları'],
  'kind.ipid': ['Product information', 'Ürün bilgi belgesi'],
  'kind.manual': ['Manual', 'Talimat'],
  'kind.guide': ['Guide', 'Rehber'],
  'kind.table': ['Authority table', 'Yetki tablosu'],
  'kind.procedure': ['Procedure', 'Prosedür'],
  'kind.callguide': ['Call guide', 'Görüşme rehberi'],
  'kind.list': ['List', 'Liste'],

  // gizlilik
  'cls.public': ['Public', 'Herkese açık'],
  'cls.internal': ['Internal', 'Şirket içi'],
  'cls.confidential': ['Confidential', 'Gizli'],
  'cls.strict': ['Strictly confidential', 'Çok gizli'],

  // kütüphane
  'lib.tabs': ['Show', 'Göster'],
  'lib.all': ['All', 'Tümü'],
  'lib.attention': ['Needs attention', 'İlgilenilmesi gereken'],
  'lib.earlier': ['Earlier versions', 'Önceki sürümler'],
  'lib.filter': ['Filter documents', 'Belgeleri süz'],
  'lib.filter.ph': ['Title, owner or team', 'Ad, sorumlu ya da birim'],
  'lib.col.doc': ['Document', 'Belge'],
  'lib.col.owner': ['Owner', 'Sorumlu'],
  'lib.col.inforce': ['In force from', 'Yürürlük'],
  'lib.col.review': ['Next review', 'Gözden geçirme'],
  'lib.col.access': ['Access', 'Erişim'],
  'lib.col.status': ['Status', 'Durum'],
  'lib.pages': ['{n} pages', '{n} sayfa'],
  'lib.earlierNote': ['Earlier version, still used for losses before {date}', 'Önceki sürüm; {date} öncesindeki hasarlarda geçerli'],
  'lib.none.filter': ['No documents match “{q}”.', '“{q}” ile eşleşen belge yok.'],
  'lib.none.filter.hint': ['Check the spelling, or search by owner or team.', 'Yazımı kontrol edin ya da sorumlu veya birim adıyla arayın.'],
  'lib.none.attention': ['Nothing needs attention.', 'İlgilenilmesi gereken belge yok.'],
  'lib.none.attention.hint': ['Every document has been read and is within its review date.', 'Bütün belgeler okundu ve gözden geçirme tarihleri geçmedi.'],
  'lib.clear': ['Clear filter', 'Süzgeci temizle'],
  'lib.yourRole': ['Showing the documents your role can open.', 'Rolünüzün açabildiği belgeler gösteriliyor.'],

  // durumlar
  'st.ready': ['Ready', 'Hazır'],
  'st.processing': ['Processing', 'İşleniyor'],
  'st.reading': ['Reading page {p} of {n}', 'Sayfa {p} / {n} okunuyor'],
  'st.overdue': ['Review overdue', 'Gözden geçirme gecikti'],
  'st.failed': ['Couldn’t read', 'Okunamadı'],
  'st.failed.why': ['Scanned, no text layer', 'Taranmış, metin katmanı yok'],
  'rv.overdue': ['Overdue since {date}', '{date} tarihinden beri gecikti'],
  'rv.soon': ['Due {date}', 'Son gün {date}'],
  'rv.superseded': ['Not reviewed: replaced', 'Gözden geçirilmez: yerini yenisi aldı'],
  'st.done': ['{title} is ready. The assistant can now answer from it.', '{title} hazır. Asistan artık bu belgeden yanıt verebilir.'],

  // ayrıntı paneli
  'd.close': ['Close', 'Kapat'],
  'd.back': ['Documents', 'Belgeler'],
  'd.who': ['Who can open it', 'Kimler açabilir'],
  'd.can': ['can open', 'açabilir'],
  'd.cannot': ['cannot open', 'açamaz'],
  'd.who.strict': ['Other roles can’t see that this document exists.', 'Diğer roller bu belgenin var olduğunu da göremez.'],
  'd.facts': ['Details', 'Bilgiler'],
  'd.owner': ['Owner', 'Sorumlu'],
  'd.inforce': ['In force from', 'Yürürlük tarihi'],
  'd.reviewed': ['Last reviewed', 'Son gözden geçirme'],
  'd.review': ['Next review', 'Sonraki gözden geçirme'],
  'd.file': ['File', 'Dosya'],
  'd.added': ['Added to the Handbook', 'Handbook’a eklendiği tarih'],
  'd.passages': ['Used in answers as', 'Yanıtlarda kullanılan'],
  'd.passages.n': ['{n} passages', '{n} bölüm'],
  'd.versions': ['Versions', 'Sürümler'],
  'd.version.current': ['In force from {date}', '{date} tarihinden beri yürürlükte'],
  'd.version.earlier': ['Used for losses before {date}', '{date} öncesindeki hasarlarda kullanılır'],
  'd.version.this': ['Shown here', 'Şu an açık'],
  'd.contents': ['Contents', 'İçindekiler'],
  'd.page': ['p. {n}', 's. {n}'],
  'd.open': ['Open document', 'Belgeyi aç'],

  // belge görüntüleyici
  'vw.back': ['Back to the document card', 'Belge kartına dön'],
  'vw.find': ['Search this document', 'Bu belgede ara'],
  'vw.find.ph': ['Word or phrase', 'Kelime ya da ifade'],
  'vw.count': ['{i} of {n}', '{i} / {n}'],
  'vw.none': ['No matches', 'Bulunamadı'],
  'vw.prev': ['Previous match', 'Önceki sonuç'],
  'vw.next': ['Next match', 'Sonraki sonuç'],
  'vw.version': ['Version', 'Sürüm'],
  'vw.compare': ['Compare with {v}', '{v} ile karşılaştır'],
  'vw.cmp.summary': [
    '{n} clauses changed between {a} and {b}. Removed words are struck through, added words are underlined.',
    '{a} ile {b} arasında {n} madde değişti. Çıkarılan kelimelerin üstü çizili, eklenenlerin altı çizili.'
  ],
  'vw.cmp.show': ['Show unchanged clauses', 'Değişmeyen maddeleri göster'],
  'vw.cmp.hide': ['Hide unchanged clauses', 'Değişmeyen maddeleri gizle'],
  'vw.cmp.unchanged': ['{n} unchanged clauses hidden', '{n} değişmeyen madde gizli'],
  'vw.added': ['added', 'eklendi'],
  'vw.removed': ['removed', 'çıkarıldı'],
  'vw.new': ['New clause', 'Yeni madde'],
  'vw.gone': ['Clause removed', 'Kaldırılan madde'],
  'vw.unavailable': ['There is no text to show yet', 'Gösterilecek metin henüz yok'],
  'src.open': ['Open the whole document', 'Belgenin tamamını aç'],

  // geçmiş
  'hist.none': ['You haven’t asked anything yet.', 'Henüz bir şey sormadınız.'],
  'hist.none.hint': ['Questions you ask on the Ask screen appear here, newest first.', 'Sor ekranında sorduğunuz sorular burada, en yenisi başta görünür.'],
  'hist.filter': ['Search your questions', 'Sorularınızda arayın'],
  'hist.nomatch': ['No questions match “{q}”.', '“{q}” ile eşleşen soru yok.'],
  'hist.q': ['{n} questions', '{n} soru'],
  'hist.q.1': ['1 question', '1 soru'],
  'hist.ai': ['written by Gemma 4', 'Gemma 4 yazdı'],
  'hist.search': ['search mode', 'arama modu'],
  'hist.none.n': ['{n} not in the documents', '{n} tanesi belgelerde yok'],
  'hist.sent': ['{n} sent to the Knowledge team', '{n} tanesi bilgi yönetimine gönderildi'],

  // rehber
  'nav.guide': ['How it works', 'Nasıl kullanılır'],
  'g.title': ['How the Handbook works', 'Handbook nasıl çalışır?'],
  'g.what': [
    'Tolka Handbook is the internal document assistant of Tolka Insurance, a home insurer in Dublin. Staff ask a question and get an answer built only from Tolka’s own documents, with the passage behind every sentence. Tolka, its people and its documents are made up for this concept project.',
    'Tolka Handbook, Dublin’deki konut sigortacısı Tolka Insurance’ın iç doküman asistanıdır. Çalışanlar soru sorar; yanıt yalnızca Tolka’nın kendi belgelerinden kurulur ve her cümlenin dayandığı bölüm gösterilir. Tolka, çalışanları ve belgeleri bu konsept çalışma için kurgulandı.'
  ],
  'g.what2': [
    'Every answer shows the passage it comes from, says so when the documents don’t cover something, and uses only the documents your role can open. Tolka, its people and its documents are made up for this concept project.',
    'Her yanıt dayandığı bölümü gösterir, belgelerde olmayan konuyu açıkça söyler ve yalnızca rolünüzün açabildiği belgeleri kullanır. Tolka, çalışanları ve belgeleri bu konsept çalışma için kurgulandı.'
  ],
  'g.screens': ['What each screen is for', 'Ekranlar ne işe yarar'],
  'g.s.ask': [
    'Ask a question. The answer appears on the left; the document it comes from opens on the right, with the passage marked.',
    'Soru sorun. Yanıt solda görünür; dayandığı belge sağda, ilgili bölüm işaretli olarak açılır.'
  ],
  'g.s.docs': [
    'The documents the Handbook answers from: who owns each one, when it must be reviewed, who can open it, and its earlier versions.',
    'Handbook’un yanıt verdiği belgeler: her birinin sorumlusu, gözden geçirme tarihi, kimlerin açabildiği ve önceki sürümleri.'
  ],
  'g.s.history': ['Your earlier questions, each ready to reopen.', 'Daha önceki sorularınız; her biri kaldığı yerden açılır.'],
  'g.s.quality': [
    'For the Knowledge team only: questions the Handbook couldn’t answer, grouped by what was missing.',
    'Yalnızca bilgi yönetimi için: Handbook’un yanıtlayamadığı sorular, eksiğin türüne göre gruplanmış.'
  ],
  'g.try': ['Try these first', 'Önce bunları deneyin'],
  'g.look': ['Look for:', 'Neye bakın:'],
  'g.t1': ['Ask about the escape of water excess.', 'Su kaçağı muafiyetini sorun.'],
  'g.t1.look': [
    'two documents disagree (€350 in a guide that is overdue for review, €400 in the policy), and the answer says which one applies. Click a number to see the passage marked in the document.',
    'iki belge çelişiyor: gözden geçirmesi gecikmiş rehberde €350, poliçede €400. Yanıt hangisinin geçerli olduğunu söylüyor. Bir numaraya tıklayın, bölüm belgede işaretli açılsın.'
  ],
  'g.t1.go': ['Ask as Ciarán, claims handler', 'Ciarán (hasar uzmanı) olarak sor'],
  'g.t2': ['Ask the same question for a loss on 20 February 2026.', 'Aynı soruyu 20 Şubat 2026’daki bir hasar için sorun.'],
  'g.t2.look': [
    'the answer switches to policy wording 2024.2 (€350) and says why: the wording in force on the date of loss applies.',
    'yanıt 2024.2 poliçe şartlarına (€350) geçiyor ve nedenini söylüyor: hasar tarihinde yürürlükteki şartlar geçerlidir.'
  ],
  'g.t2.go': ['Ask with the date of loss', 'Hasar tarihiyle sor'],
  'g.t3': ['Ask about fraud indicators as an investigator, then as a claims handler.', 'Suistimal göstergelerini önce araştırmacı, sonra hasar uzmanı olarak sorun.'],
  'g.t3.look': [
    'Aoife gets an answer from the fraud indicators. When Ciarán asks the same question, nothing comes from that document and it isn’t even named. Change account with “Switch account” in the menu.',
    'Aoife yanıtı suistimal göstergelerinden alıyor. Aynı soruyu Ciarán sorduğunda o belgeden hiçbir şey gelmiyor, adı bile geçmiyor. Hesabı menüdeki “Hesap değiştir” ile değiştirin.'
  ],
  'g.t3.go': ['Ask as Aoife, investigator', 'Aoife (araştırmacı) olarak sor'],
  'g.t4': ['Ask something the documents don’t cover.', 'Belgelerde olmayan bir şey sorun.'],
  'g.t4.look': [
    'the Handbook says it isn’t covered instead of guessing, and offers to send the question to the Knowledge team. Then sign in as Declan and find it in Answer quality.',
    'Handbook tahmin yürütmek yerine belgelerde olmadığını söylüyor ve soruyu bilgi yönetimine göndermeyi öneriyor. Sonra Declan olarak girip soruyu Yanıt kalitesi ekranında bulun.'
  ],
  'g.t4.go': ['Ask as Niamh, customer care', 'Niamh (müşteri temsilcisi) olarak sor'],
  'g.t5': ['Open the policy and compare it with the previous version.', 'Poliçeyi açıp önceki sürümle karşılaştırın.'],
  'g.t5.look': ['six clauses changed between 2024.2 and 2026.1, shown word by word.', '2024.2 ile 2026.1 arasında altı madde değişmiş; değişiklikler kelime kelime gösteriliyor.'],
  'g.t5.go': ['Open the policy', 'Poliçeyi aç'],
  'g.how': ['How answers are written', 'Yanıtlar nasıl yazılır'],
  'g.how1': [
    'The Handbook finds the passages closest to the question in the documents your role can open. Gemma 4, running on Cloudflare Workers AI, writes a short answer from those passages only, and every quote is checked against the document word for word.',
    'Handbook, rolünüzün açabildiği belgelerde soruya en yakın bölümleri bulur. Cloudflare Workers AI üzerinde çalışan Gemma 4 yalnızca bu bölümlerden kısa bir yanıt yazar; her alıntı belgeyle kelime kelime karşılaştırılır.'
  ],
  'g.how2': [
    'If the answer service isn’t available, the Handbook shows the closest passages instead and says so. In this demo, permissions are applied in the browser; in a real setup they are checked on the server.',
    'Yanıt hizmetine ulaşılamazsa Handbook bunun yerine en yakın bölümleri gösterir ve bunu söyler. Bu denemede yetkiler tarayıcıda uygulanır; gerçek kurulumda sunucuda denetlenir.'
  ],
  'g.start': ['Start with Ask', 'Sor ekranıyla başla'],
  'g.reset': ['Reset the demo', 'Denemeyi sıfırla'],
  'g.reset.ask': ['Delete your questions, added documents and changes in this browser?', 'Bu tarayıcıdaki sorularınız, eklediğiniz belgeler ve değişiklikler silinsin mi?'],
  'g.reset.yes': ['Reset', 'Sıfırla'],

  // yanıt kalitesi
  'gap.conflict': ['Documents disagree', 'Belgeler çelişiyor'],
  'gap.missing': ['Not in the documents', 'Belgelerde yok'],
  'gap.outdated': ['Overdue for review', 'Gözden geçirmesi gecikmiş'],
  'gap.unread': ['Couldn’t be read', 'Okunamayan belge'],
  'gap.unhelpful': ['Answer didn’t help', 'Yanıt işe yaramadı'],
  'iq.summary': [
    '{open} open issues behind {q} questions. The most common gap: {gap}.',
    '{q} sorunun arkasında {open} açık konu var. En sık görülen eksik: {gap}.'
  ],
  'iq.none.open': ['Nothing is waiting. Every question the Handbook couldn’t answer has been dealt with.', 'Bekleyen bir şey yok. Handbook’un yanıtlayamadığı her soru ele alındı.'],
  'iq.none.done': ['Nothing has been resolved yet.', 'Henüz çözülen konu yok.'],
  'iq.view': ['Show', 'Göster'],
  'iq.open': ['Open', 'Açık'],
  'iq.done': ['Resolved', 'Çözüldü'],
  'iq.questions': ['{n} questions', '{n} soru'],
  'iq.questions.1': ['1 question', '1 soru'],
  'iq.last': ['last asked {date}', 'son soru {date}'],
  'iq.owner': ['Owner: {name}', 'Sorumlu: {name}'],
  'iq.st.open': ['Open', 'Açık'],
  'iq.st.assigned': ['Assigned to {name} on {date}', '{date} tarihinde {name} adlı kişiye atandı'],
  'iq.st.resolved': ['Resolved on {date}', '{date} tarihinde çözüldü'],
  'iq.what': ['What is wrong', 'Sorun ne'],
  'iq.asked': ['Questions asked', 'Sorulan sorular'],
  'iq.live': ['sent from the Handbook', 'Handbook’tan gönderildi'],
  'iq.docs': ['Documents', 'Belgeler'],
  'iq.actions': ['What to do', 'Ne yapılacak'],
  'iq.assign': ['Assign to {name}', '{name} adlı kişiye ata'],
  'iq.resolve': ['Mark as resolved', 'Çözüldü olarak işaretle'],
  'iq.reopen': ['Reopen', 'Yeniden aç'],
  'iq.note': ['What was changed?', 'Ne değiştirildi?'],
  'iq.note.hint': ['For example: “Guide 3.2 now says €400, in line with the policy.”', 'Örneğin: “Rehberin 3.2 sürümü artık poliçeyle aynı şekilde €400 diyor.”'],
  'iq.note.err': ['Describe what was changed', 'Neyin değiştirildiğini yazın'],
  'iq.save': ['Mark as resolved', 'Çözüldü olarak kaydet'],
  'iq.cancel': ['Cancel', 'Vazgeç'],
  'iq.resolution': ['What was changed', 'Ne değiştirildi'],
  'iq.assigned.say': ['Assigned to {name}.', '{name} adlı kişiye atandı.'],
  'iq.resolved.say': ['Marked as resolved.', 'Çözüldü olarak işaretlendi.'],
  'iq.seed': [
    'Questions before 24 Nov 2026 are made up for this demo. Questions you send from the Handbook appear here too.',
    '24 Kas 2026 öncesindeki sorular bu deneme için kurgulandı. Handbook’tan gönderdiğiniz sorular da burada görünür.'
  ],

  // hesaplar ve roller
  'job.care': ['Customer care agent', 'Müşteri temsilcisi'],
  'job.claims': ['Claims handler', 'Hasar uzmanı'],
  'job.siu': ['Investigator', 'Suistimal araştırmacısı'],
  'job.knowledge': ['Knowledge manager', 'Bilgi yönetimi sorumlusu'],
  'jobteam.care': ['Customer care', 'Müşteri hizmetleri'],
  'jobteam.claims': ['Household claims', 'Konut hasarları'],
  'jobteam.siu': ['Special Investigations Unit', 'Suistimal Araştırma Birimi'],
  'jobteam.knowledge': ['Knowledge team', 'Bilgi yönetimi'],
  'si.title': ['Who are you signing in as?', 'Kim olarak giriş yapıyorsunuz?'],
  'si.lead': [
    'Each role sees different documents, so the same question can get a different answer. Try one question as two roles.',
    'Her rol farklı belgeleri görür; bu yüzden aynı soru farklı yanıt alabilir. Bir soruyu iki farklı rolle sorup deneyin.'
  ],
  'si.sees.care': [
    'Answers customers on the phone. Sees the policy, customer documents and call guides, but not the claims manual or the authority limits.',
    'Müşterileri telefonda yanıtlar. Poliçeyi, müşteri belgelerini ve görüşme rehberlerini görür; hasar talimatını ve yetki limitlerini görmez.'
  ],
  'si.sees.claims': [
    'Handles household claims. Also sees the claims manual and the authority limits.',
    'Konut hasarı dosyalarını yürütür. Bunlara ek olarak hasar talimatını ve yetki limitlerini görür.'
  ],
  'si.sees.siu': [
    'Investigates claims that may be fraudulent. The only role that can open the fraud indicators.',
    'Suistimal şüphesi olan dosyaları inceler. Suistimal göstergelerini açabilen tek rol.'
  ],
  'si.sees.knowledge': [
    'Keeps the Handbook up to date: adds documents and works through the questions it couldn’t answer.',
    'Handbook’u güncel tutar: belge ekler ve yanıtlanamayan soruları ele alır.'
  ],
  'si.count': ['Can open {n} current documents', 'Yürürlükteki {n} belgeyi açabilir'],
  'si.as': ['Continue as {name}', '{name} olarak devam et'],
  'si.back': ['Keep the current account', 'Şu anki hesapla devam et'],
  'si.note': [
    'These are demo accounts with no password. In a real setup the Handbook uses Tolka’s own sign-in, and permissions are checked on the server, not in the browser.',
    'Bunlar parolasız deneme hesaplarıdır. Gerçek kurulumda Handbook, Tolka’nın kendi giriş sistemini kullanır ve yetkiler tarayıcıda değil sunucuda denetlenir.'
  ],
  'acct.switch': ['Switch account', 'Hesap değiştir'],
  'gate.title': ['Answer quality is for the Knowledge team', 'Yanıt kalitesi ekranı bilgi yönetimi içindir'],
  'gate.text': [
    'Your role is {role}. This screen shows the questions the Handbook couldn’t answer, so the Knowledge team can fix the documents. If you have a question it couldn’t answer, use “Send to the Knowledge team” under the answer.',
    'Rolünüz: {role}. Bu ekran, Handbook’un yanıtlayamadığı soruları gösterir; bilgi yönetimi belgeleri buna göre düzeltir. Yanıtlanamayan bir sorunuz varsa yanıtın altındaki “Bilgi yönetimine gönderin” düğmesini kullanın.'
  ],
  'denied.title': ['This document isn’t shared with your role', 'Bu belge rolünüzle paylaşılmıyor'],
  'denied.text': [
    'Documents are shared by role, and yours is {role}. If a colleague sent you this link, ask them for the passage you need, or ask your team leader to request access.',
    'Belgeler role göre paylaşılır; sizin rolünüz {role}. Bağlantıyı bir iş arkadaşınız gönderdiyse ihtiyacınız olan bölümü ondan isteyin ya da ekip liderinizden erişim talep etmesini isteyin.'
  ],
  'denied.back': ['Go to your documents', 'Belgelerinize dönün'],
  'd.overdue.title': ['This document is overdue for review', 'Bu belgenin gözden geçirme tarihi geçti'],
  'd.overdue.text': [
    'It was due on {date}. Answers that use it say so, and the owner has been reminded.',
    'Son gün {date} idi. Bu belgeden verilen yanıtlar bunu belirtir; sorumluya hatırlatma gitti.'
  ],
  'd.soon.title': ['Review due in {n} days', 'Gözden geçirmeye {n} gün kaldı'],
  'd.soon.text': ['The owner will be reminded a week before {date}.', 'Sorumluya {date} tarihinden bir hafta önce hatırlatılacak.'],
  'd.earlier.title': ['This is an earlier version', 'Bu, önceki sürüm'],
  'd.earlier.text': [
    'Version {v} replaced it on {date}. It is still used for claims where the loss happened before that date.',
    '{date} tarihinde yerini {v} sürümü aldı. Hasarın bu tarihten önce olduğu dosyalarda hâlâ kullanılır.'
  ],
  'd.processing.title': ['Being read', 'Okunuyor'],
  'd.processing.text': [
    'The assistant can’t use this version until every page has been read.',
    'Bütün sayfalar okunana kadar asistan bu sürümü kullanamaz.'
  ],
  'd.password.title': ['This PDF is protected with a password', 'Bu PDF parolayla korunuyor'],
  'd.password.text': [
    'Remove the password and add the file again, or ask {owner} for an unprotected copy.',
    'Parolayı kaldırıp dosyayı yeniden ekleyin ya da belgenin sorumlusundan ({owner}) korumasız bir kopya isteyin.'
  ],
  'd.unreadable.title': ['This file couldn’t be opened', 'Bu dosya açılamadı'],
  'd.unreadable.text': [
    'It may be damaged. Save it again from the program that created it, then add it again.',
    'Dosya bozulmuş olabilir. Onu oluşturan programda yeniden kaydedip tekrar ekleyin.'
  ],
  'd.empty.title': ['This file is empty', 'Bu dosya boş'],
  'd.empty.text': ['Check that you chose the right file, then add it again.', 'Doğru dosyayı seçtiğinizi kontrol edip yeniden ekleyin.'],
  'd.remove': ['Remove from the Handbook', 'Handbook’tan kaldır'],
  'd.remove.ask': ['Remove “{title}”? The assistant will stop answering from it.', '“{title}” kaldırılsın mı? Asistan artık bu belgeden yanıt vermez.'],
  'd.remove.yes': ['Remove', 'Kaldır'],
  'd.remove.no': ['Keep it', 'Kalsın'],
  'd.removed': ['{title} was removed.', '{title} kaldırıldı.'],
  'd.uploaded': ['Added in this browser', 'Bu tarayıcıda eklendi'],
  'd.session': ['This browser’s storage is full, so the document will be kept only until you close the tab.', 'Bu tarayıcının depolama alanı dolu; belge yalnızca sekme kapanana kadar tutulacak.'],

  // belge ekleme
  'add.open': ['Add a document', 'Belge ekle'],
  'add.title': ['Add a document', 'Belge ekle'],
  'add.lead': [
    'The file is read in your browser and isn’t uploaded. When you ask a question, only the few passages that match it are sent to Cloudflare Workers AI to write the answer.',
    'Dosya tarayıcınızda okunur, bir sunucuya yüklenmez. Soru sorduğunuzda yalnızca soruya uyan birkaç bölüm, yanıtı yazması için Cloudflare Workers AI’ye gönderilir.'
  ],
  'add.errors': ['There is a problem', 'Formda düzeltilmesi gereken yerler var'],
  'add.file': ['File', 'Dosya'],
  'add.file.choose': ['Choose a file', 'Dosya seçin'],
  'add.file.drop': ['or drag it here', 'ya da buraya sürükleyin'],
  'add.file.hint': ['PDF, Word (.docx), TXT or Markdown, up to 20 MB', 'PDF, Word (.docx), TXT ya da Markdown; en fazla 20 MB'],
  'add.file.change': ['Choose a different file', 'Başka bir dosya seçin'],
  'add.sample': ['No file to hand? Use a sample:', 'Elinizde dosya yoksa örneklerden birini kullanın:'],
  'add.sample.text': ['Home Emergency Cover (PDF with text)', 'Acil Durum Teminatı (metinli PDF)'],
  'add.sample.scan': ['Boiler service leaflet (scanned PDF)', 'Kombi bakım broşürü (taranmış PDF)'],
  'add.sample.tr': ['Staff handbook in Turkish (PDF with text)', 'Türkçe personel el kitabı (metinli PDF)'],
  'add.sample.docx': ['Hybrid working policy (Word)', 'Hibrit çalışma politikası (Word)'],
  'add.f.title': ['Title', 'Belgenin adı'],
  'add.f.kind': ['Type', 'Türü'],
  'add.f.version': ['Version', 'Sürüm'],
  'add.f.version.hint': ['For example 1.0 or 2026.1', 'Örneğin 1.0 ya da 2026.1'],
  'add.f.inforce': ['In force from', 'Yürürlük tarihi'],
  'add.f.owner': ['Owner', 'Sorumlu'],
  'add.f.owner.hint': ['The person who keeps this document up to date', 'Belgeyi güncel tutmaktan sorumlu kişi'],
  'add.f.access': ['Who can open it', 'Kimler açabilir'],
  'add.acc.public': ['Everyone at Tolka. It can also be given to customers.', 'Tolka’daki herkes. Müşteriyle de paylaşılabilir.'],
  'add.acc.internal': ['Everyone at Tolka, but not customers.', 'Tolka’daki herkes; müşterilerle paylaşılmaz.'],
  'add.acc.confidential': ['Claims, Special Investigations and the Knowledge team.', 'Hasar birimi, Suistimal araştırma ve Bilgi yönetimi.'],
  'add.acc.strict': ['Special Investigations only. You won’t be able to open it yourself.', 'Yalnızca Suistimal araştırma. Siz de açamayacaksınız.'],
  'add.f.review': ['Review every', 'Gözden geçirme sıklığı'],
  'add.rev.6': ['6 months', '6 ayda bir'],
  'add.rev.12': ['Year', 'Yılda bir'],
  'add.rev.24': ['2 years', '2 yılda bir'],
  'add.submit': ['Add to the Handbook', 'Handbook’a ekle'],
  'add.cancel': ['Cancel', 'Vazgeç'],
  'err.file': ['Select a file to add', 'Eklenecek dosyayı seçin'],
  'err.type': ['The selected file must be a PDF, Word (.docx), TXT or Markdown file', 'Seçilen dosya PDF, Word (.docx), TXT ya da Markdown olmalı'],
  'err.size': ['The selected file must be smaller than 20 MB', 'Seçilen dosya 20 MB’tan küçük olmalı'],
  'err.title': ['Enter a title', 'Belgenin adını yazın'],
  'err.version': ['Enter a version, for example 1.0', 'Bir sürüm yazın, örneğin 1.0'],
  'err.inforce': ['Enter the date the document comes into force', 'Belgenin yürürlüğe girdiği tarihi girin'],
  'add.added': ['{title} was added. It is being read now.', '{title} eklendi, şimdi okunuyor.'],
  'add.added.hidden': ['{title} was added. Your role can’t open documents at that classification, so it isn’t in your list.', '{title} eklendi. Rolünüz bu gizlilik düzeyindeki belgeleri açamadığı için listenizde görünmüyor.'],
  'add.ready': ['{title} has been read: {n} passages. The assistant can now answer from it.', '{title} okundu: {n} bölüm. Asistan artık bu belgeden yanıt verebilir.'],
  // soru-yanıt
  'ask.label': ['Ask about a policy, claim or procedure', 'Poliçe, hasar ya da prosedürle ilgili sorunuz'],
  'ask.ph': ['For example: what is the escape of water excess?', 'Örneğin: su kaçağı muafiyeti ne kadar?'],
  'ask.submit': ['Ask', 'Sor'],
  'ask.hint': [
    'Answers come only from documents your role can open.',
    'Yanıtlar yalnızca rolünüzün açabildiği belgelerden gelir.'
  ],
  'ans.grade': ['Showing the row for your grade: {grade}.', 'Sizin unvanınızın satırı gösteriliyor: {grade}.'],
  'ask.empty': ['Write a question first', 'Önce bir soru yazın'],
  'ask.date.add': ['Add the date of loss', 'Hasar tarihini ekle'],
  'ask.date': ['Date of loss', 'Hasar tarihi'],
  'ask.date.hint': ['Decides which version of the policy wording applies', 'Poliçe şartlarının hangi sürümünün geçerli olduğunu belirler'],
  'ask.date.remove': ['Remove date', 'Tarihi kaldır'],
  'ask.new': ['New question', 'Yeni soru'],
  'ask.opts': ['Options', 'Seçenekler'],
  'ask.you': ['You asked', 'Sorunuz'],
  'ask.lossDate': ['Date of loss: {date}', 'Hasar tarihi: {date}'],
  'start.try': ['Try one of these', 'Şunlardan biriyle başlayın'],
  'start.role': ['For you as {role}', '{role} olarak sizin için'],
  'start.cover': ['Cover', 'Teminat'],
  'start.limits': ['Limits and authority', 'Limitler ve yetki'],
  'start.process': ['Procedure', 'Prosedür'],
  'start.upload': [
    'You can also add your own document on the Documents screen and ask about it here.',
    'Belgeler ekranından kendi belgenizi ekleyip burada ona da soru sorabilirsiniz.'
  ],
  'start.upload.link': ['Go to Documents', 'Belgelere git'],
  'mode.search': [
    'Search mode. No language model wrote this: these are the passages closest to your question. Check that they answer it before you rely on them.',
    'Arama modu. Bu yanıtı bir dil modeli yazmadı; sorunuza en yakın bölümler gösteriliyor. Güvenmeden önce sorunuzu gerçekten yanıtladıklarını kontrol edin.'
  ],
  'mode.search.tr': [
    'Turkish questions are matched to the English documents through a glossary of insurance terms.',
    'Türkçe sorular İngilizce belgelerle bir sigorta terimleri sözlüğü üzerinden eşleştirilir.'
  ],
  'ans.level': ['The most restricted of its {n} sources: {doc}', '{n} kaynağın en kısıtlısı: {doc}'],
  'ans.level.one': ['From one source: {doc}', 'Tek kaynaktan: {doc}'],
  'ans.wording.today': [
    'Uses policy wording {v}, in force today. If the loss happened before {date}, add the date of loss.',
    'Bugün yürürlükteki {v} poliçe şartları kullanıldı. Hasar {date} tarihinden önceyse hasar tarihini ekleyin.'
  ],
  'ans.wording.date': [
    'Uses policy wording {v}, because the loss happened on {loss}. The wording in force on the date of loss applies.',
    'Hasar {loss} tarihinde olduğu için {v} poliçe şartları kullanıldı. Hasar tarihinde yürürlükte olan şartlar geçerlidir.'
  ],
  'ans.notSearched': ['Not searched: {list}.', 'Aranmayanlar: {list}.'],
  'ans.processing': ['still being read', 'hâlâ okunuyor'],
  'ans.failed': ['couldn’t be read', 'okunamadı'],
  'ans.sources': ['Passages', 'Bölümler'],
  'ans.page': ['page {n}', 's. {n}'],
  'ans.clause': ['clause {n}', 'md. {n}'],
  'ans.overdue': ['Review overdue since {date}', '{date} tarihinden beri gözden geçirilmedi'],
  'ans.show': ['Show in document', 'Belgede göster'],
  'ans.showing': ['Shown in document', 'Belgede açık'],
  'ans.copy': ['Copy with sources', 'Kaynaklarıyla kopyala'],
  'ans.copied': ['Copied with sources.', 'Kaynaklarıyla kopyalandı.'],
  'ans.handoff': ['Doesn’t answer it? Send to the Knowledge team', 'Yanıtlamıyor mu? Bilgi yönetimine gönderin'],
  'ans.none.title': ['The documents your role can open don’t cover this.', 'Rolünüzün açabildiği belgelerde bu konu yok.'],
  'ans.none.text': [
    'The Handbook doesn’t guess. Rephrase the question, or send it to the Knowledge team. They will answer you and update the right document.',
    'Handbook tahmin yürütmez. Soruyu başka sözcüklerle sorun ya da bilgi yönetimine gönderin; size yanıt verip ilgili belgeyi güncellerler.'
  ],
  'ans.send': ['Send to the Knowledge team', 'Bilgi yönetimine gönder'],
  'ans.sent': [
    'Sent to the Knowledge team on {date} at {time}. Their answer will appear in History.',
    '{date} {time} itibarıyla bilgi yönetimine gönderildi. Yanıtları Geçmiş ekranında görünecek.'
  ],
  'ans.ready': ['Answer ready: {n} passages.', 'Yanıt hazır: {n} bölüm.'],
  'ans.ready.none': ['The documents don’t cover this question.', 'Belgelerde bu sorunun yanıtı yok.'],
  'src.title': ['Source', 'Kaynak'],
  'src.empty.title': ['Sources open here', 'Kaynaklar burada açılır'],
  'src.empty.text': [
    'When you ask a question, the passage behind each answer opens here, marked in the document itself.',
    'Bir soru sorduğunuzda her yanıtın dayandığı bölüm burada, belgenin kendi içinde işaretlenmiş olarak açılır.'
  ],
  'src.back': ['Back to the answer', 'Yanıta dön'],
  'src.close': ['Close the document', 'Belgeyi kapat'],
  'src.inforce': ['In force from {date}', 'Yürürlük: {date}'],
  'src.owner': ['Owner: {name}', 'Sorumlu: {name}'],
  'src.review': ['Next review {date}', 'Sonraki gözden geçirme {date}'],

  // model modu
  'mode.label': ['Answers', 'Yanıtlar'],
  'mode.ai': ['Written by Gemma 4', 'Gemma 4 yazsın'],
  'mode.searchOnly': ['Search only', 'Yalnızca arama'],
  'mode.ai.hint': [
    'Gemma 4 runs on Cloudflare Workers AI. Only the few passages that match your question are sent to it.',
    'Gemma 4, Cloudflare Workers AI üzerinde çalışır. Ona yalnızca sorunuza uyan birkaç bölüm gönderilir.'
  ],
  'ai.searching': ['Finding the passages that answer the question, by wording and by meaning…', 'Soruyu yanıtlayan bölümler hem kelimeyle hem anlamla aranıyor…'],
  'ai.pending': [
    'Gemma 4 is writing an answer from {n} passages on Cloudflare Workers AI. This usually takes a few seconds.',
    'Gemma 4, Cloudflare Workers AI üzerinde {n} bölümden yanıt yazıyor. Bu genellikle birkaç saniye sürer.'
  ],
  'ai.by': [
    'Written by {model} on Cloudflare Workers AI from {n} passages, using only what they say.',
    '{model} yazdı (Cloudflare Workers AI); yalnızca {n} bölümün söylediklerini kullandı.'
  ],
  'ai.quotes.ok': ['Every quote matches the documents word for word.', 'Bütün alıntılar belgeyle birebir eşleşiyor.'],
  'ai.quotes.dropped': [
    '{n} quote didn’t match the documents and was removed.',
    '{n} alıntı belgeyle eşleşmediği için çıkarıldı.'
  ],
  'ai.partial': ['Part of the question isn’t covered by the documents.', 'Sorunun bir kısmı belgelerde yok.'],
  'ai.cached': ['Same question asked earlier today: answer reused.', 'Aynı soru bugün sorulmuştu; o yanıt kullanıldı.'],
  'ai.quotes': ['Quotes', 'Alıntılar'],
  'ai.sources': ['Sources', 'Kaynaklar'],
  'fb.quota': [
    'Today’s free Workers AI allowance has been used, so this answer comes from search mode. It resets at 00:00 UTC.',
    'Workers AI’nin bugünkü ücretsiz kotası doldu; bu yanıt arama modundan geliyor. Kota 00:00 UTC’de yenilenir.'
  ],
  'fb.rate': [
    'This connection has asked a lot of questions today, so this answer comes from search mode.',
    'Bu bağlantıdan bugün çok soru soruldu; bu yanıt arama modundan geliyor.'
  ],
  'fb.offline': [
    'The answer service couldn’t be reached, so this answer comes from search mode.',
    'Yanıt hizmetine ulaşılamadı; bu yanıt arama modundan geliyor.'
  ],
  'fb.access': [
    'The server refused: a passage didn’t match its document, or your role can’t open it. The closest passages are shown instead.',
    'Sunucu reddetti: bir bölüm belgesiyle eşleşmedi ya da rolünüz o belgeyi açamıyor. Bunun yerine en yakın bölümler gösteriliyor.'
  ],
  'fb.busy': [
    'Workers AI didn’t respond in time, so this answer comes from search mode. Try again in a minute.',
    'Workers AI zamanında yanıt vermedi; bu yanıt arama modundan geliyor. Bir dakika sonra yeniden deneyin.'
  ],
  'add.failed': ['{title} couldn’t be read. Open it to see why.', '{title} okunamadı. Nedenini görmek için belgeyi açın.'],
  'd.failed.title': ['This PDF has no selectable text', 'Bu PDF’te seçilebilir metin yok'],
  'd.failed.text': [
    'It looks like a scan. Upload a copy with a text layer, or ask {owner} for the original file. Until then, the assistant can’t answer from it.',
    'Taranmış bir kopya gibi görünüyor. Metin katmanı olan bir kopya yükleyin ya da asıl dosyayı belgenin sorumlusundan ({owner}) isteyin. O zamana kadar asistan bu belgeden yanıt veremez.'
  ],

  // Bu proje hakkında (altın kural 5) ve telif satırı
  'nav.about': ['About this project', 'Bu proje hakkında'],
  'copy': ['© 2026 flouHAN Software. All rights reserved.', '© 2026 flouHAN Software. Tüm hakları saklıdır.'],
  'ab.lead': [
    'Tolka Handbook is a concept project by flouHAN Software: a document assistant for an insurer that works end to end. This page covers how to use it, what was built and with which tools, and where the same structure can be put to work.',
    'Tolka Handbook, flouHAN Software’in konsept çalışmasıdır: bir sigorta şirketi için hazırlanmış, uçtan uca çalışan bir doküman asistanı. Bu sayfada uygulamanın nasıl kullanıldığı, hangi işlerin hangi araçlarla yapıldığı ve aynı yapının başka nerelerde kullanılabileceği anlatılıyor.'
  ],
  'ab.use': ['How to use it', 'Nasıl kullanılır'],
  'ab.use1': [
    'The demo opens as Ciarán, a claims handler. Each of the four roles opens different documents, and you can switch at any time from the menu.',
    'Demo, hasar uzmanı Ciarán olarak açılır. Dört rolün her biri farklı belgeleri açar; menüden istediğiniz zaman rol değiştirebilirsiniz.'
  ],
  'ab.use2': ['Ask in your own words, or start from a suggestion on the Ask screen.', 'Sorunuzu kendi cümlelerinizle yazın ya da Sor ekranındaki önerilerden biriyle başlayın.'],
  'ab.use3': [
    'Select a yellow number in the answer. The document opens at that clause, with the passage marked.',
    'Yanıttaki sarı numaralardan birine tıklayın. Belge o maddede açılır, ilgili bölüm işaretlidir.'
  ],
  'ab.use4': [
    'Add a date of loss and ask about the excess again: the answer moves to the policy wording in force on that date.',
    'Hasar tarihi ekleyip muafiyeti yeniden sorun: yanıt, o tarihte yürürlükte olan poliçe şartlarına göre değişir.'
  ],
  'ab.use5': [
    'Add a PDF or Word file of your own from the Ask screen and ask about it: the answers come only from that document. Documents shows each document’s owner and review date, and compares two versions.',
    'Sor ekranından kendi PDF ya da Word dosyanızı ekleyip ona soru sorun: yanıtlar yalnızca o belgeden gelir. Belgeler ekranında her belgenin sorumlusu ve gözden geçirme tarihi görünür, iki sürüm karşılaştırılır.'
  ],
  'ab.use6': [
    'Sign in as Declan, the knowledge manager, to see the questions the documents couldn’t answer.',
    'Bilgi yönetimi sorumlusu Declan olarak girip belgelerin yanıtlayamadığı soruları görün.'
  ],
  'ab.guide': ['Open the guide', 'Rehberi açın'],
  'ab.built': ['What was built', 'Bu projede yapılanlar'],
  'ab.built.lead': ['Each item is a part of the app you can try for yourself.', 'Her madde, uygulamada kendiniz deneyebileceğiniz bir parçadır.'],
  'ab.sk.ai': ['AI integration', 'Yapay zeka entegrasyonu'],
  'ab.sk.ai.d': [
    'Answers are written by Gemma 4 on Cloudflare Workers AI, using only the passages the search found, and stream onto the screen as they are written. Source numbers and quotes are added once the answer has been checked: every quote is compared word for word with the document. Four models were tried on the same six questions before Gemma 4 was chosen.',
    'Yanıtları Cloudflare Workers AI üzerindeki Gemma 4 yazar; yalnızca aramanın bulduğu bölümleri kullanır ve metin yazıldıkça ekrana akar. Kaynak numaraları ve alıntılar yanıt denetlendikten sonra eklenir: her alıntı belgeyle kelimesi kelimesine karşılaştırılır. Gemma 4, dört model aynı altı soruyla denendikten sonra seçildi.'
  ],
  'ab.sk.api': ['API development', 'API geliştirme'],
  'ab.sk.api.d': [
    'The app talks to two endpoints of its own on Cloudflare Workers: /api/handbook/answer streams the answer as server-sent events, and /api/handbook/embed turns text into vectors. They check where each request comes from, limit requests per person, keep a daily usage budget and cache results in a SQLite-backed Durable Object.',
    'Uygulama, Cloudflare Workers üzerinde çalışan iki ucuyla konuşur: /api/handbook/answer yanıtı yazıldıkça akış hâlinde (server-sent events) gönderir, /api/handbook/embed metni vektöre çevirir. Uçlar isteğin nereden geldiğini denetler, kişi başına istek sayısını sınırlar, günlük kullanım bütçesini tutar ve sonuçları SQLite tabanlı bir Durable Object’te önbelleğe alır.'
  ],
  'ab.sk.search': ['Search', 'Arama'],
  'ab.sk.search.d': [
    'Two searches, merged with Reciprocal Rank Fusion: BM25 on the wording, with English and Turkish stemming and extra weight for the asker’s role, and meaning search with bge-m3 vectors, which finds the clause even when the question uses other words or another language. Search can be limited to one document. When the model can’t be reached, the app falls back to word search and says so on screen.',
    'İki arama, Reciprocal Rank Fusion ile birleştirilir: kelimeye göre BM25 (İngilizce ve Türkçe kök bulma, soranın rolüne göre ek ağırlık) ve bge-m3 vektörleriyle anlam araması; soru başka kelimelerle ya da başka bir dilde sorulsa da doğru maddeyi bulur. Arama tek bir belgeyle sınırlanabilir. Modele ulaşılamazsa uygulama kelime aramasına geçer ve bunu ekranda yazar.'
  ],
  'ab.sk.scale': ['Scale', 'Ölçek'],
  'ab.sk.scale.d': [
    'Measured with the app’s own search code on an archive grown to 50,220 passages (the 11 documents copied 180 times), on this machine with Node 24: the word index builds in about half a second, and each question takes about 36 ms by wording and 45 ms by meaning. Past that size the vectors would move from the browser to an index on the server.',
    'Uygulamanın kendi arama koduyla, 50.220 bölüme büyütülmüş bir arşivde ölçüldü (11 belge 180 kez çoğaltıldı; bu bilgisayarda, Node 24 ile): kelime dizini yaklaşık yarım saniyede kuruluyor, her soru kelimeyle yaklaşık 36 ms, anlamla 45 ms sürüyor. Daha büyük arşivlerde vektörler tarayıcıdan sunucudaki bir dizine taşınır.'
  ],
  'ab.sk.docs': ['Document processing', 'Belge işleme'],
  'ab.sk.docs.d': [
    'PDFs are read in the browser with pdf.js. Word files (.docx) are opened by a small ZIP and XML reader written for this app, with no extra library. Headings, numbered clauses, lists and tables are picked out; scanned, password-protected and empty files are told apart. Two versions of a document are compared word by word.',
    'PDF dosyaları tarayıcıda pdf.js ile okunur. Word dosyaları (.docx) bu uygulama için yazılmış küçük bir ZIP ve XML okuyucuyla, ek kütüphane olmadan açılır. Başlıklar, numaralı maddeler, listeler ve tablolar ayrıştırılır; taranmış, parolalı ve boş dosyalar birbirinden ayırt edilir. Bir belgenin iki sürümü kelime kelime karşılaştırılır.'
  ],
  'ab.sk.access': ['Role-based access', 'Rol bazlı yetkilendirme'],
  'ab.sk.access.d': [
    'Four roles, each with its own documents. Search only looks at what the role can open, and the server checks again before the model runs: every passage must match its document word for word, and the role must be allowed to open it. Every answer shows the classification of its most restricted source, and a document the role can’t open is never named.',
    'Dört rol var ve her birinin kendi belgeleri. Arama yalnızca rolün açabildiği belgelerde yapılır; model çalışmadan önce sunucu da denetler: her bölüm kendi belgesiyle kelimesi kelimesine eşleşmeli ve rol o belgeyi açabilmeli. Her yanıtta dayandığı en kısıtlı belgenin gizlilik düzeyi yazar; rolün açamadığı belgenin adı hiç geçmez.'
  ],
  'ab.sk.auto': ['Test and recording automation', 'Test ve kayıt otomasyonu'],
  'ab.sk.auto.d': [
    'Playwright opens every screen at three widths, in two languages and two themes, checks accessibility with axe-core and goes through each flow: more than 200 checks a run. The screenshots and captioned videos on the case study are recorded from the demo by script in the same way.',
    'Playwright her ekranı üç genişlikte, iki dilde ve iki temada açar, erişilebilirliği axe-core ile denetler ve her akışı baştan sona dener: her çalıştırmada 200’den fazla kontrol. Vaka sayfasındaki ekran görüntüleri ve altyazılı videolar da demodan aynı yolla, betikle kaydedilir.'
  ],
  'ab.sk.a11y': ['Accessibility', 'Erişilebilirlik'],
  'ab.sk.a11y.d': [
    'Built to WCAG 2.1 AA: full keyboard use, screen reader announcements, high-contrast mode, reduced motion and a typeface drawn for readers with low vision.',
    'WCAG 2.1 AA’ya göre yapıldı: klavyeyle tam kullanım, ekran okuyucu duyuruları, yüksek karşıtlık modu, hareketi azaltma tercihi ve az gören okurlar için çizilmiş bir yazı tipi.'
  ],
  'ab.sk.lang': ['Two languages', 'İki dil'],
  'ab.sk.lang.d': [
    'The English and Turkish interfaces are written separately, not translated. Questions can be asked in Turkish about the English documents, and a Turkish PDF can be added and asked about in Turkish.',
    'İngilizce ve Türkçe arayüz birbirinden çevrilmedi, ayrı ayrı yazıldı. İngilizce belgeler hakkında Türkçe soru sorulabilir; Türkçe bir PDF eklenip ona Türkçe soru da sorulabilir.'
  ],
  'ab.tools': ['Languages and tools', 'Kullanılan diller ve araçlar'],
  'ab.tl.lang': ['Languages', 'Diller'],
  'ab.tl.ui': ['Interface', 'Arayüz'],
  'ab.tl.server': ['Server', 'Sunucu'],
  'ab.tl.ai': ['Models', 'Modeller'],
  'ab.tl.docs': ['Document reading', 'Belge okuma'],
  'ab.tl.test': ['Testing and recording', 'Test ve kayıt'],
  'ab.tl.type': ['Typefaces', 'Yazı tipleri'],
  'ab.uses': ['What it could become', 'Bu yapıyla neler yapılabilir'],
  'ab.uses1': [
    'Connected to where your documents already live (SharePoint, Google Drive, Confluence or a file server) through their APIs, with company sign-in.',
    'Belgelerinizin zaten durduğu yere bağlanabilir: SharePoint, Google Drive, Confluence ya da bir dosya sunucusu; API’leri üzerinden ve şirket hesabıyla girişle.'
  ],
  'ab.uses2': [
    'Draft replies to customer emails or support tickets with the sources attached, for a person to check before they go out.',
    'Müşteri e-postalarına ya da destek taleplerine kaynakları ekli yanıt taslakları hazırlayabilir; gönderilmeden önce bir kişi kontrol eder.'
  ],
  'ab.uses3': [
    'Search contracts, procedures or technical manuals across thousands of files, in more than one language.',
    'Binlerce dosya içinde sözleşme, prosedür ya da teknik el kitabı arayabilir, birden çok dilde.'
  ],
  'ab.uses4': [
    'Run the model on your own servers when documents must not leave the company.',
    'Belgelerin şirket dışına çıkmaması gerekiyorsa model kendi sunucularınızda çalışabilir.'
  ],
  'ab.uses5': [
    'Report what people ask and what the documents miss, so each owner knows what to update.',
    'Çalışanların ne sorduğunu ve belgelerin neyi karşılamadığını raporlayabilir; her sorumlu neyi güncellemesi gerektiğini bilir.'
  ],
  'ab.uses6': [
    'Work for one person, too: an assistant over your own notes, papers or course material.',
    'Tek bir kişi için de çalışabilir: kendi notlarınız, makaleleriniz ya da ders materyaliniz üzerinde bir asistan.'
  ],
  'ab.quote': ['Get a quote for a similar project', 'Benzer bir proje için teklif alın'],
  'ab.quote.url': ['https://flouhan.com/en/#contact', 'https://flouhan.com/tr/#contact'],
  'ab.licence': ['Copyright and licence', 'Telif ve lisans'],
  'ab.licence1': [
    'The design and source code of this app belong to flouHAN Software. The source is published on GitHub so it can be read and reviewed; it may not be copied, changed or used without written permission.',
    'Bu uygulamanın tasarımı ve kaynak kodu flouHAN Software’e aittir. Kaynak kod, incelenebilmesi için GitHub’da yayımlanmıştır; yazılı izin alınmadan kopyalanamaz, değiştirilemez ve kullanılamaz.'
  ],
  'ab.source': ['Source code on GitHub', 'GitHub’daki kaynak kod'],
  'ab.case': ['Case study', 'Vaka çalışması'],
  'g.about': [
    'The languages, tools and techniques behind the app, and what the same structure could be used for, are on the About this project screen.',
    'Uygulamada kullanılan diller, araçlar ve teknikler ile aynı yapının başka nelerde kullanılabileceği “Bu proje hakkında” ekranında anlatılıyor.'
  ],

  // İlk ziyaret ve "kendi belgenizle deneyin"
  'start.who': ['You are asking as {name}, {job}. Answers use only the documents this role can open.', '{name} ({job}) olarak soruyorsunuz. Yanıtlar yalnızca bu rolün açabildiği belgelerden gelir.'],
  'start.switch': ['Switch role', 'Rolü değiştir'],
  'own.title': ['Try it with your own document', 'Kendi belgenizle deneyin'],
  'own.text': [
    'Add a PDF or Word file and the answers will come only from it. The file is read in your browser and isn’t uploaded.',
    'Bir PDF ya da Word dosyası ekleyin; yanıtlar yalnızca o belgeden gelsin. Dosya tarayıcınızda okunur, bir sunucuya yüklenmez.'
  ],
  'own.add': ['Add a document', 'Belge ekleyin'],
  'own.dialog': ['Add your own document', 'Kendi belgenizi ekleyin'],
  'own.submit': ['Add and ask', 'Ekle ve sor'],
  'own.ready': ['“{title}” is ready. Ask your question; answers come only from this document.', '“{title}” hazır. Sorunuzu yazın; yanıtlar yalnızca bu belgeden gelir.'],
  'add.demo': [
    'In this demo anyone can add a document. In a real set-up, adding documents belongs to the Knowledge team.',
    'Bu demoda herkes belge ekleyebilir. Gerçek kurulumda belge eklemek bilgi yönetiminin işidir.'
  ],
  'scope.label': ['Search limited to one document', 'Arama tek belgeyle sınırlı'],
  'scope.only': ['Asking only “{title}”', 'Yalnızca “{title}” içinde soruluyor'],
  'scope.reading': ['being read, page {page} of {pages}', 'okunuyor, {pages} sayfanın {page}. sayfası'],
  'scope.reading0': ['being read', 'okunuyor'],
  'scope.failed': ['this file couldn’t be read, so there is nothing to search', 'bu dosya okunamadı, aranacak metin yok'],
  'scope.clear': ['Ask all documents', 'Bütün belgelere sor'],
  'd.askOnly': ['Ask only this document', 'Yalnızca bu belgeye sor'],
  'g.role': ['You’re in as {name}, {job}. Each role sees different documents, and you can switch whenever you like.', '{name} ({job}) olarak girdiniz. Her rol farklı belgeleri görür; istediğiniz zaman değiştirebilirsiniz.'],
  'g.role.go': ['Choose another role', 'Başka bir rol seçin'],
  'g.t6': ['Add a PDF or Word file of your own and ask about it.', 'Kendi PDF ya da Word dosyanızı ekleyip ona soru sorun.'],
  'g.t6.look': [
    'the answer comes only from your document, with its passage marked. The file stays in your browser.',
    'yanıt yalnızca sizin belgenizden gelir, ilgili bölüm işaretlenir. Dosya tarayıcınızda kalır.'
  ],
  'g.t6.go': ['Add a document', 'Belge ekle'],
  'g.more': [
    'How answers are written and the tools behind the app are on the About this project screen.',
    'Yanıtların nasıl yazıldığı ve uygulamada kullanılan araçlar “Bu proje hakkında” ekranında.'
  ]
} as const satisfies Record<string, readonly [string, string]>;

export type Key = keyof typeof STR;
