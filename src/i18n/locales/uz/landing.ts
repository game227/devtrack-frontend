const uz: Record<string, string> = {
  'landing.nav.features': 'Imkoniyatlar',
  'landing.nav.github': 'GitHub',
  'landing.nav.how': 'Qanday ishlaydi',
  'landing.nav.tour': "Qo'llanma",
  'landing.signIn': 'Kirish',
  'landing.getStarted': 'Boshlash',
  'landing.eyebrow': 'Dasturchilar uchun loyiha boshqaruvi',
  'landing.heroTitle': 'Ishni boshqaring. Ishlab chiqishni tushuning.',
  'landing.heroText':
    "DevTrack tezkor vazifa kuzatuvini ishlab chiqish tahlili bilan birlashtiradi: loyiha salomatligi, faollik xronologiyasi va GitHub bilan bog'langan jarayon — bitta sokin, qorong'i ish maydonida.",
  'landing.ctaPrimary': 'Ish maydoni yaratish',
  'landing.ctaSecondary': 'Kirish',
  'landing.fact.i18n': "O'zbek va ingliz tilidagi interfeys",
  'landing.fact.github': 'GitHub OAuth va webhook',
  'landing.fact.health': 'Qoidaga asoslangan loyiha salomatligi',
  'landing.fact.telegram': 'Telegram orqali parolni tiklash',

  'landing.featuresTitle': "Kichik dasturchilar jamoasiga kerak bo'lgan hamma narsa",
  'landing.featuresText': 'Jira darajasidagi nazorat, Linear tezligi — ortiqcha rasmiyatchiliksiz.',
  'landing.f.board.title': 'Kanban doska',
  'landing.f.board.text':
    "Zaxiradan bajarilgangacha besh ustun. Kartani sudrang — sensorli ekranda esa holat menyusidan foydalaning.",
  'landing.f.health.title': 'Loyiha salomatligi',
  'landing.f.health.text':
    "Vazifalar bajarilishi, muddatlar, xatolar ulushi va haqiqiy faollikdan hisoblanadigan shaffof ball; xavflar ochiq ko'rsatiladi.",
  'landing.f.github.title': "GitHub bilan bog'langan",
  'landing.f.github.text':
    "Commit yoki pull request'da #42 ni eslating — u vazifaga bog'lanadi. Pull request birlashtirilsa, vazifa «Bajarildi» holatiga o'tadi.",
  'landing.f.timeline.title': 'Faollik xronologiyasi',
  'landing.f.timeline.text': "Har bir o'tkazish, izoh va birlashtirish — kunlar bo'yicha guruhlangan yagona tasmada.",
  'landing.f.analytics.title': 'Tahlil',
  'landing.f.analytics.text': "Holat, ustuvorlik, tur va ish yuklamasi bir qarashda, shuningdek sikllar bo'yicha bajarilish.",
  'landing.f.teams.title': 'Jamoalar va ish maydonlari',
  'landing.f.teams.text': "Ish maydonlari, jamoalar, sikllar va bosqichlar; egasi, admin va a'zo rollari bilan.",

  'landing.show.board.title': "Butun loyihani bitta doskada ko'ring",
  'landing.show.board.text':
    "Zaxira, qilinadigan, jarayonda, ko'rib chiqilmoqda va bajarildi — har bir kartada ijrochi, ustuvorlik va vazifa raqami bilan.",
  'landing.show.github.title': 'Kod va vazifalar — bitta hikoya',
  'landing.show.github.text':
    "Pull request va commit'lar o'zi eslatgan vazifada ko'rinadi. Pull request birlashtirilganda vazifa o'zi yopiladi, xronologiyada esa bir marta qayd etiladi.",
  'landing.show.health.title': "Loyiha sog'lomligini biling — va sababini ham",
  'landing.show.health.text':
    "Salomatlik bali o'zini izohlaydi: uzoq turib qolgan vazifalar, muddati o'tganlari va hal qilinmagan shoshilinch xatolar xavf sifatida ro'yxatlanadi.",
  'landing.show.timeline.title': "Hech narsa yo'qolmaydi",
  'landing.show.timeline.text':
    "Xronologiya kim, nima va qachon qilganini saqlaydi — o'tkazishlar, izohlar va birlashtirilgan pull request'lar.",

  'landing.howTitle': 'Noldan tayyor doskagacha uch qadamda',
  'landing.how.1.title': 'Ish maydoni yarating',
  'landing.how.1.text': "Ro'yxatdan o'ting, ish maydoniga nom bering va jamoadoshlarni taklif qiling.",
  'landing.how.2.title': "GitHub repozitoriyni ulang",
  'landing.how.2.text': "GitHub'ni bir marta ulang va loyiha uchun repozitoriyni tanlang — webhook o'zi sozlanadi.",
  'landing.how.3.title': 'Odatdagidek ishlang',
  'landing.how.3.text': "Commit va pull request'larda #vazifa raqamini yozing; DevTrack doskani yangilab boradi.",

  'landing.techTitle': 'Puxta qurilgan',
  'landing.tech.security':
    "GitHub tokenlari shifrlanadi, webhook'lar HMAC bilan tekshiriladi, sessiyalar JWT va yangilanuvchi tokenlar bilan ishlaydi.",
  'landing.tech.stack': 'Django REST + PostgreSQL, React + TypeScript va alohida FastAPI Telegram bot.',
  'landing.tech.tests': 'Backend, bot va frontend avtomatik testlar bilan qoplangan.',

  'landing.finalTitle': "Ishingizni aniq ko'rishga tayyormisiz?",
  'landing.finalText': 'Bir daqiqada ish maydoni yarating.',
  'landing.footer': '© {year} DevTrack',

  'landing.tourTitle': "Platformani bir daqiqada o'rganing",
  'landing.tourText': "Har kuni qiladigan beshta ishni ko'ring — yoki qadamni tanlang va u qanday ishlashini kuzating.",
  'landing.tour.create.title': 'Vazifa yarating',
  'landing.tour.create.text': "Sarlavha yozing, turi va ustuvorlikni tanlang — vazifa darhol doskaga tushadi.",
  'landing.tour.create.typed': "To'lov sahifasi qulaydi",
  'landing.tour.board.title': 'Doskada suring',
  'landing.tour.board.text': "Kartani ustunlar orasida sudrang — holat o'zgaradi. Har bir o'tkazish xronologiyaga yoziladi.",
  'landing.tour.board.card': 'Chegara: /v2/charges',
  'landing.tour.board.other.0': 'API hujjatini yozish',
  'landing.tour.board.other.1': 'Karta loglarini tekshirish',
  'landing.tour.board.other.2': "Webhook imzolarini qo'shish",
  'landing.tour.assign.title': 'Ijrochi va muddat belgilang',
  'landing.tour.assign.text': "Vazifa kimda ekanini va qachongacha bajarilishini tanlang. Sana rangi shoshilinchlikni ko'rsatadi.",
  'landing.tour.assign.legend': "Kulrang: vaqt bor · sariq: yaqin · qizil: muddati o'tgan",
  'landing.tour.github.title': "GitHub doskani o'zi yangilasin",
  'landing.tour.github.text': "Commit yoki pull request'da #id yozing. Pull request birlashtirilganda vazifa o'zi yopiladi.",
  'landing.tour.github.commit': "Kalit bo'yicha so'rovlarni cheklash",
  'landing.tour.github.merged': 'Pull request #{number} birlashtirildi',
  'landing.tour.github.auto': "Vazifa o'zi «Bajarildi» holatiga o'tdi",
  'landing.tour.keys.title': 'Klaviaturada tez ishlang',
  'landing.tour.keys.text': "Ctrl+K — buyruqlar paneli, C — yangi vazifa, G keyin B — doskaga o'tish.",
  'landing.tour.keys.typed': 'doska',
}

export default uz
