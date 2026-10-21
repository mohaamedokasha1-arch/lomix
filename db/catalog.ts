/**
 * كتالوج العرض التجريبي لـ Loomix.
 *
 * ⚠️ كل الأعمال والأسماء هنا خيالية وأصلية، صُمّمت خصيصًا لعرض المنصة.
 * لا تحتوي على بيانات أو صور محمية من أي موقع آخر. كل البوسترات والخلفيات
 * مُولَّدة بأصول أصلية داخل المشروع (public/art + public/media).
 *
 * استبدل هذا الكتالوج بمحتوى حقيقي مرخّص من لوحة التحكم عند الإطلاق.
 */

export type ArtVariant =
  | "beam"
  | "eclipse"
  | "aperture"
  | "dunes"
  | "monolith"
  | "grid"
  | "rings"
  | "arch";

export type PaletteKey =
  | "brass"
  | "sand"
  | "ember"
  | "teal"
  | "oxblood"
  | "indigo"
  | "steel"
  | "violet"
  | "forest"
  | "cyan";

export type CatalogType = "MOVIE" | "SERIES" | "ANIME";
export type CatalogStatus = "RELEASED" | "ONGOING" | "UPCOMING" | "ENDED" | "CANCELLED";

export type CatalogCredit = {
  nameAr: string;
  nameEn: string;
  role: "ACTOR" | "DIRECTOR" | "WRITER" | "COMPOSER";
  character?: string;
  bio?: string;
};

export type CatalogEpisode = {
  number: number;
  nameAr: string;
  overview?: string;
  airDate?: string;
  runtime?: number;
};

export type CatalogSeason = {
  number: number;
  nameAr?: string;
  year: number;
  overview?: string;
  episodes: CatalogEpisode[];
};

export type CatalogTitle = {
  slug: string;
  type: CatalogType;
  titleAr: string;
  titleEn: string;
  taglineAr?: string;
  overviewAr: string;
  year: number;
  releaseDate?: string;
  runtime?: number;
  status: CatalogStatus;
  countryCode: string;
  countryNameAr: string;
  language: string;
  genres: string[];
  rating: { value: number; source: string; count?: number };
  featured?: boolean;
  editorNote?: string;
  art: { variant: ArtVariant; palette: PaletteKey };
  /** خلفية فوتوغرافية أصلية مُولَّدة للأعمال المميزة */
  backdrop?: string;
  credits: CatalogCredit[];
  seasons?: CatalogSeason[];
};

export const GENRES: { slug: string; nameAr: string; nameEn: string; sort: number }[] = [
  { slug: "drama", nameAr: "دراما", nameEn: "Drama", sort: 1 },
  { slug: "thriller", nameAr: "إثارة", nameEn: "Thriller", sort: 2 },
  { slug: "action", nameAr: "أكشن", nameEn: "Action", sort: 3 },
  { slug: "crime", nameAr: "جريمة", nameEn: "Crime", sort: 4 },
  { slug: "mystery", nameAr: "غموض", nameEn: "Mystery", sort: 5 },
  { slug: "scifi", nameAr: "خيال علمي", nameEn: "Sci-Fi", sort: 6 },
  { slug: "fantasy", nameAr: "فانتازيا", nameEn: "Fantasy", sort: 7 },
  { slug: "adventure", nameAr: "مغامرة", nameEn: "Adventure", sort: 8 },
  { slug: "romance", nameAr: "رومانسي", nameEn: "Romance", sort: 9 },
  { slug: "comedy", nameAr: "كوميدي", nameEn: "Comedy", sort: 10 },
  { slug: "history", nameAr: "تاريخي", nameEn: "History", sort: 11 },
  { slug: "horror", nameAr: "رعب", nameEn: "Horror", sort: 12 },
  { slug: "family", nameAr: "عائلي", nameEn: "Family", sort: 13 },
  { slug: "animation", nameAr: "أنمي وتحريك", nameEn: "Animation", sort: 14 },
  { slug: "biography", nameAr: "سيرة ذاتية", nameEn: "Biography", sort: 15 },
  { slug: "documentary", nameAr: "وثائقي", nameEn: "Documentary", sort: 16 },
];

const ep = (number: number, nameAr: string, overview: string, airDate: string, runtime = 45): CatalogEpisode => ({
  number,
  nameAr,
  overview,
  airDate,
  runtime,
});

export const CATALOG: CatalogTitle[] = [
  // ───────────────────────────── الأفلام ─────────────────────────────
  {
    slug: "shadow-of-the-sands",
    type: "MOVIE",
    titleAr: "ظل الرمال",
    titleEn: "Shadow of the Sands",
    taglineAr: "الصحراء لا تخفي شيئًا… بل تُعيده.",
    overviewAr:
      "عالم آثار يبحث عن مدينة مدفونة في قلب الصحراء الغربية، فيكتشف أن الخريطة التي بحوزته لم تُرسم للأرض، بل لذكرى رجل لم يعد. رحلة صمت وغبار تنتهي عند سؤال واحد: هل نبحث عن الكنز، أم عن أنفسنا؟",
    year: 2024,
    releaseDate: "2024-11-14",
    runtime: 128,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["drama", "adventure", "mystery"],
    rating: { value: 8.4, source: "تقييم تجريبي", count: 4210 },
    featured: true,
    editorNote: "تصوير طبيعي يمنح الصحراء شخصية مستقلة، ونهاية تُغلق الدائرة بهدوء نادر.",
    art: { variant: "dunes", palette: "sand" },
    backdrop: "/media/hero-sands.jpg",
    credits: [
      { nameAr: "سليم الرفاعي", nameEn: "Salim El-Refai", role: "DIRECTOR", bio: "مخرج مصري معروف بإيقاعه البطيء واهتمامه بالضوء الطبيعي." },
      { nameAr: "ياسر عبد الحميد", nameEn: "Yasser Abdel Hamid", role: "ACTOR", character: "د. رامي" },
      { nameAr: "نور الشامي", nameEn: "Nour El-Shamy", role: "ACTOR", character: "ليلى" },
      { nameAr: "حسناء البدر", nameEn: "Hasnaa El-Badr", role: "ACTOR", character: "الشيخة أم سعيد" },
      { nameAr: "عمر لطفي", nameEn: "Omar Lotfy", role: "WRITER" },
      { nameAr: "كريم مسعود", nameEn: "Karim Masoud", role: "COMPOSER" },
    ],
  },
  {
    slug: "orbit-of-silence",
    type: "MOVIE",
    titleAr: "مدار الصمت",
    titleEn: "Orbit of Silence",
    taglineAr: "على بُعد ألف كيلومتر من الأرض… للصمت صوت.",
    overviewAr:
      "مهندسة اتصالات تُرسَل إلى محطة مدارية مهجورة لاستعادة إشارة انقطعت قبل عام. هناك تكتشف أن الإشارة ليست رسالة، بل صرخة. وفيلم يطرح السؤال: ماذا يحدث لنا حين نصمت طويلًا؟",
    year: 2025,
    releaseDate: "2025-03-06",
    runtime: 116,
    status: "RELEASED",
    countryCode: "FR",
    countryNameAr: "فرنسا",
    language: "الفرنسية",
    genres: ["scifi", "drama", "mystery"],
    rating: { value: 8.1, source: "تقييم تجريبي", count: 2860 },
    featured: true,
    editorNote: "خيال علمي حميمي، يبني رهبته من الفراغ بدل المؤثرات.",
    art: { variant: "eclipse", palette: "indigo" },
    backdrop: "/media/hero-orbit.jpg",
    credits: [
      { nameAr: "كلير مورو", nameEn: "Claire Moreau", role: "DIRECTOR" },
      { nameAr: "ليلى بن صالح", nameEn: "Layla Ben Salem", role: "ACTOR", character: "إيمان" },
      { nameAr: "أنطوان دي سين", nameEn: "Antoine de Senn", role: "ACTOR", character: "الرائد جوليان" },
      { nameAr: "ميلود سعداوي", nameEn: "Miloud Saadaoui", role: "WRITER" },
    ],
  },
  {
    slug: "the-hall-of-shadows",
    type: "MOVIE",
    titleAr: "قاعة الظلال",
    titleEn: "The Hall of Shadows",
    taglineAr: "كل فيلم يترك ظلًا فيمن شاهده.",
    overviewAr:
      "في دار سينما قديمة على وشك الإغلاق، يعثر مُشغّل الأفلام على بكرة لا يعرف أحد اسمها. كل عرض لها يستدعي ذكرى لشخص من الحضور، وكل ذكرى تفتح بابًا لا يُغلق.",
    year: 2023,
    releaseDate: "2023-09-21",
    runtime: 112,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["mystery", "drama", "fantasy"],
    rating: { value: 8.7, source: "تقييم تجريبي", count: 6120 },
    featured: true,
    editorNote: "الفيلم الذي يحتفل بالسينما كفعل ذاكرة جماعي.",
    art: { variant: "arch", palette: "brass" },
    backdrop: "/media/hero-hall.jpg",
    credits: [
      { nameAr: "مصطفى درويش", nameEn: "Mostafa Darwish", role: "DIRECTOR" },
      { nameAr: "آدم الشرقاوي", nameEn: "Adam El-Sharkawy", role: "ACTOR", character: "حسن" },
      { nameAr: "ملك حسني", nameEn: "Malak Hosny", role: "ACTOR", character: "زينب" },
      { nameAr: "فتحي النجار", nameEn: "Fathi El-Naggar", role: "ACTOR", character: "عم سليمان" },
      { nameAr: "مصطفى درويش", nameEn: "Mostafa Darwish", role: "WRITER" },
    ],
  },
  {
    slug: "wednesday-cafe",
    type: "MOVIE",
    titleAr: "مقهى الأربعاء",
    titleEn: "Wednesday Café",
    taglineAr: "نفس الطاولة… نفس الحكاية، كل أسبوع.",
    overviewAr:
      "خمسة غرباء يلتقون كل أربعاء في مقهى صغير بالإسكندرية، بعد أن وصلتهم دعوة واحدة بخط يد لا يعرفونه. مع كل لقاء تتكشّف علاقة لم يتوقعها أحد.",
    year: 2022,
    releaseDate: "2022-06-02",
    runtime: 104,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["drama", "romance", "comedy"],
    rating: { value: 7.9, source: "تقييم تجريبي", count: 3310 },
    art: { variant: "beam", palette: "ember" },
    credits: [
      { nameAr: "هالة فتحي", nameEn: "Hala Fathy", role: "DIRECTOR" },
      { nameAr: "ياسمين قدري", nameEn: "Yasmin Qadri", role: "ACTOR", character: "داليا" },
      { nameAr: "شريف عوض", nameEn: "Sherif Awad", role: "ACTOR", character: "نادر" },
      { nameAr: "سلمى إبراهيم", nameEn: "Salma Ibrahim", role: "ACTOR", character: "هدى" },
      { nameAr: "هالة فتحي", nameEn: "Hala Fathy", role: "WRITER" },
    ],
  },
  {
    slug: "last-train-to-alexandria",
    type: "MOVIE",
    titleAr: "آخر قطار إلى الإسكندرية",
    titleEn: "Last Train to Alexandria",
    taglineAr: "الرحلة الأخيرة لا تنتهي حيث تتوقع.",
    overviewAr:
      "محاسب هادئ يستقل قطار منتصف الليل حاملًا حقيبة لا تخصه. بين محطتين، يتحول القطار إلى مسرح لجريمة قديمة، وكل راكب يحمل جزءًا من الحقيقة.",
    year: 2021,
    releaseDate: "2021-12-09",
    runtime: 121,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["thriller", "crime", "drama"],
    rating: { value: 8.0, source: "تقييم تجريبي", count: 3890 },
    art: { variant: "grid", palette: "steel" },
    credits: [
      { nameAr: "طارق منصور", nameEn: "Tarek Mansour", role: "DIRECTOR" },
      { nameAr: "أمير صبري", nameEn: "Amir Sabry", role: "ACTOR", character: "سامح" },
      { nameAr: "ريم الجندي", nameEn: "Reem El-Gendy", role: "ACTOR", character: "المحققة نادين" },
      { nameAr: "طارق منصور", nameEn: "Tarek Mansour", role: "WRITER" },
      { nameAr: "هشام البدري", nameEn: "Hesham El-Badry", role: "COMPOSER" },
    ],
  },
  {
    slug: "the-memory-of-water",
    type: "MOVIE",
    titleAr: "ذاكرة الماء",
    titleEn: "The Memory of Water",
    taglineAr: "الماء يتذكّر ما ننساه.",
    overviewAr:
      "بعد جفاف بحيرة صغيرة في الأطلس، تعود عائلة مفكّكة إلى قريتها لبيع الأرض. ما تجده في الطين ليس بئرًا، بل أرشيفًا لحياة كاملة اعتقدت أنها انتهت.",
    year: 2024,
    releaseDate: "2024-04-18",
    runtime: 109,
    status: "RELEASED",
    countryCode: "MA",
    countryNameAr: "المغرب",
    language: "العربية",
    genres: ["drama", "mystery", "fantasy"],
    rating: { value: 8.2, source: "تقييم تجريبي", count: 1980 },
    art: { variant: "dunes", palette: "teal" },
    credits: [
      { nameAr: "نجاة العمراني", nameEn: "Najat El-Amrani", role: "DIRECTOR" },
      { nameAr: "يوسف أزرق", nameEn: "Youssef Azraq", role: "ACTOR", character: "حمزة" },
      { nameAr: "حياة بوعزة", nameEn: "Hayat Bouazza", role: "ACTOR", character: "خالته رقية" },
      { nameAr: "نجاة العمراني", nameEn: "Najat El-Amrani", role: "WRITER" },
    ],
  },
  {
    slug: "iron-bird",
    type: "MOVIE",
    titleAr: "طائر الحديد",
    titleEn: "Iron Bird",
    taglineAr: "الهروب لا يعني الحرية… أحيانًا يعني البداية.",
    overviewAr:
      "ميكانيكي طائرات سابق في مطار مهجور يجد طفلًا مختبئًا في حظيرة، فيقرر تهريبه عبر الصحراء بطائرة لم تُطِر منذ عشرين عامًا. مطاردة لا تتوقف، وصداقة تُبنى بالبراغي والوقود.",
    year: 2023,
    releaseDate: "2023-02-16",
    runtime: 132,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["action", "adventure", "drama"],
    rating: { value: 7.6, source: "تقييم تجريبي", count: 5240 },
    art: { variant: "rings", palette: "ember" },
    credits: [
      { nameAr: "شريف كامل", nameEn: "Sherif Kamel", role: "DIRECTOR" },
      { nameAr: "حمزة عبد الله", nameEn: "Hamza Abdallah", role: "ACTOR", character: "منصور" },
      { nameAr: "زياد الصغير", nameEn: "Ziad El-Saghir", role: "ACTOR", character: "يوسف" },
      { nameAr: "شريف كامل", nameEn: "Sherif Kamel", role: "WRITER" },
    ],
  },
  {
    slug: "unread-letters",
    type: "MOVIE",
    titleAr: "رسائل لم تُقرأ",
    titleEn: "Unread Letters",
    taglineAr: "الاعتراف المتأخر يبقى اعترافًا.",
    overviewAr:
      "أستاذة لغة عربية متقاعدة تكتشف صندوق رسائل لم يُفتح في مكتبة مدرسة قديمة. بين الأوراق، اكتشفت أنها كانت محور قصة حب لم تعرف عنها شيئًا قط.",
    year: 2020,
    releaseDate: "2020-10-15",
    runtime: 97,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["drama", "romance"],
    rating: { value: 7.8, source: "تقييم تجريبي", count: 2470 },
    art: { variant: "eclipse", palette: "brass" },
    credits: [
      { nameAr: "منى رأفت", nameEn: "Mona Raafat", role: "DIRECTOR" },
      { nameAr: "سعاد عبد العال", nameEn: "Souad Abdel Aal", role: "ACTOR", character: "الأستاذة سعاد" },
      { nameAr: "كريم فؤاد", nameEn: "Karim Fouad", role: "ACTOR", character: "الشاب حمدي" },
      { nameAr: "منى رأفت", nameEn: "Mona Raafat", role: "WRITER" },
    ],
  },
  {
    slug: "night-garden",
    type: "MOVIE",
    titleAr: "حديقة الليل",
    titleEn: "Night Garden",
    taglineAr: "باب واحد… ومئة ليلة.",
    overviewAr:
      "طفلة تكتشف بابًا في حائط بيت جدتها في بيروت يقود إلى حديقة لا تتفتح إلا ليلًا. فيلم فانتازي عن الفقد، وعن الأشياء التي تتركها لنا الأسطورة حين لا نملك كلمات.",
    year: 2024,
    releaseDate: "2024-07-11",
    runtime: 103,
    status: "RELEASED",
    countryCode: "LB",
    countryNameAr: "لبنان",
    language: "العربية",
    genres: ["fantasy", "mystery", "family"],
    rating: { value: 8.3, source: "تقييم تجريبي", count: 1740 },
    art: { variant: "arch", palette: "violet" },
    credits: [
      { nameAr: "ندى خوري", nameEn: "Nada Khoury", role: "DIRECTOR" },
      { nameAr: "ريتا حبيب", nameEn: "Rita Habib", role: "ACTOR", character: "ميرا" },
      { nameAr: "جورج صليبا", nameEn: "Georges Saliba", role: "ACTOR", character: "الجد سليم" },
      { nameAr: "ندى خوري", nameEn: "Nada Khoury", role: "WRITER" },
    ],
  },
  {
    slug: "voice-of-asphalt",
    type: "MOVIE",
    titleAr: "صوت الأسفلت",
    titleEn: "Voice of Asphalt",
    taglineAr: "كل شارع له عدّاده الخاص.",
    overviewAr:
      "سائق تاكسي مسائي في القاهرة يربط بين ثلاث جرائم لم يحقق بها أحد. لا سلاح في يده سوى ذاكرة تبيع給她 كل قصص المدينة التي لم يسأل عنها أحد.",
    year: 2022,
    releaseDate: "2022-02-24",
    runtime: 118,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["crime", "thriller", "action"],
    rating: { value: 7.7, source: "تقييم تجريبي", count: 4820 },
    art: { variant: "grid", palette: "oxblood" },
    credits: [
      { nameAr: "أيمن قنديل", nameEn: "Ayman Kandil", role: "DIRECTOR" },
      { nameAr: "محمد عبد الستار", nameEn: "Mohamed Abdel-Sattar", role: "ACTOR", character: "عبده/حربي" },
      { nameAr: "سارة عبد الغفار", nameEn: "Sara Abdel-Ghaffar", role: "ACTOR", character: "المحققة أميرة" },
      { nameAr: "أيمن قنديل", nameEn: "Ayman Kandil", role: "WRITER" },
    ],
  },
  {
    slug: "half-moon",
    type: "MOVIE",
    titleAr: "نصف قمر",
    titleEn: "Half Moon",
    taglineAr: "لا شيء يكتمل، وبعض الأنصاف تكفي.",
    overviewAr:
      "ثلاثة إخوة يعودون إلى بيت أبيهم في تونس لتقسيم ميراث، لكن البدء ببوصلة أبيهم الغامضة يبدّل مفهوم الملكية والغيرة والمحبة.",
    year: 2025,
    releaseDate: "2025-01-30",
    runtime: 106,
    status: "RELEASED",
    countryCode: "TN",
    countryNameAr: "تونس",
    language: "العربية",
    genres: ["drama", "family"],
    rating: { value: 7.5, source: "تقييم تجريبي", count: 890 },
    art: { variant: "eclipse", palette: "teal" },
    credits: [
      { nameAr: "أنيس بن حميدة", nameEn: "Anis Ben Hamida", role: "DIRECTOR" },
      { nameAr: "هند الطرابلسي", nameEn: "Hind Trabelsi", role: "ACTOR", character: "سنية" },
      { nameAr: "مهدي بن عمر", nameEn: "Mehdi Ben Omar", role: "ACTOR", character: "مراد" },
      { nameAr: "أنيس بن حميدة", nameEn: "Anis Ben Hamida", role: "WRITER" },
    ],
  },
  {
    slug: "the-last-dinner-in-january",
    type: "MOVIE",
    titleAr: "العشاء الأخير في يناير",
    titleEn: "The Last Dinner in January",
    taglineAr: "عائلة واحدة… وسوء تفاهم كافٍ لعشرين سنة.",
    overviewAr:
      "عشاء عائلي في يناير يتحول إلى محاكمة سعيدة، حين يقرر الأب أن يقرأ وصيته بصوت عالٍ قبل الحلوى. كوميديا سوداء عن الطريقة التي نحب بها أقاربنا ونحن نتعارك معهم.",
    year: 2023,
    releaseDate: "2023-12-21",
    runtime: 94,
    status: "RELEASED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["comedy", "drama", "family"],
    rating: { value: 7.4, source: "تقييم تجريبي", count: 2610 },
    art: { variant: "beam", palette: "brass" },
    credits: [
      { nameAr: "إنجي شولي", nameEn: "Engy Shawky", role: "DIRECTOR" },
      { nameAr: "فتحي عبد الرحمن", nameEn: "Fathy Abdel Rahman", role: "ACTOR", character: "الأب" },
      { nameAr: "دينا سامي", nameEn: "Dina Samy", role: "ACTOR", character: "نهى" },
      { nameAr: "إنجي شولي", nameEn: "Engy Shawky", role: "WRITER" },
    ],
  },

  // ───────────────────────────── المسلسلات ─────────────────────────────
  {
    slug: "cairo-night",
    type: "SERIES",
    titleAr: "ليلة القاهرة",
    titleEn: "Cairo Night",
    taglineAr: "مدينة لا تنام… وقاتل لا ينسى.",
    overviewAr:
      "محقق تمنعه إدارة الشرطة من العمل في قضية قديمة، يبدأ تحقيقًا موازيًا في أزقّة القاهرة القديمة. مع كل ليلة، تظهر حلقة جديدة من شبكة تصل إلى أعلى مما يجرؤ على الاعتراف.",
    year: 2025,
    status: "ONGOING",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["crime", "thriller", "drama"],
    rating: { value: 8.6, source: "تقييم تجريبي", count: 7340 },
    featured: true,
    editorNote: "أفضل كتابة تلفزيونية مصرية عن المدينة في السنوات الأخيرة.",
    art: { variant: "grid", palette: "ember" },
    backdrop: "/media/hero-cairo.jpg",
    credits: [
      { nameAr: "هاني رأفت", nameEn: "Hany Raafat", role: "DIRECTOR" },
      { nameAr: "محمد فتحي", nameEn: "Mohamed Fathy", role: "ACTOR", character: "المحقق مراد" },
      { nameAr: "جميلة الناصر", nameEn: "Gamila El-Nasser", role: "ACTOR", character: "سلمى" },
      { nameAr: "إياد مخلص", nameEn: "Eyad Mokhles", role: "ACTOR", character: "الرائد هشام" },
      { nameAr: "هاني رأفت", nameEn: "Hany Raafat", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        nameAr: "الليلة الأولى",
        year: 2024,
        overview: "بداية التحقيق الموازي، وأول جريمة تُعاد فيها الأوراق إلى الطاولة.",
        episodes: [
          ep(1, "أزمة منتصف الليل", "جريمة في حارة ضيقة تعيد مراد إلى قضية أُغلقت قبل خمس سنوات.", "2024-03-01", 48),
          ep(2, "الشارع رقم صفر", "يتبع مراد خيطًا لا يراه أحد في خريطة المدينة.", "2024-03-08", 46),
          ep(3, "ظل على الجدار", "سلمى تتعرف على وجه من ماضٍ لم تروِه لأحد.", "2024-03-15", 47),
          ep(4, "أسماء مستعارة", "شهادة طفل تقلب ترتيب الشبهات.", "2024-03-22", 44),
          ep(5, "ليلة مفتوحة", "مداهمة تنتهي بجرح لا يظهر في التقارير.", "2024-03-29", 49),
          ep(6, "نهاية الشارع", "قرار مراد الأخير في الموسم الأول يضعه في مواجهة شرطته.", "2024-04-05", 52),
        ],
      },
      {
        number: 2,
        nameAr: "الليلة الثانية",
        year: 2025,
        overview: "الحقيقة تصبح أثقل، والثمن يُدفَع بالعلاقات لا بالمال.",
        episodes: [
          ep(1, "ماء وأسمنت", "مراد يعمل خارج القانون، والمدينة تتحرك بسرعة أكبر.", "2025-02-14", 47),
          ep(2, "صمت الأصدقاء", "الرائد هشام يُطلب منه الاختيار بين رتبته وضميره.", "2025-02-21", 45),
          ep(3, "رائحة المطر", "سلمى تصنع حليفًا من عدو قديم.", "2025-02-28", 46),
          ep(4, "غرفة بلا نافذة", "اعتقال يتحول إلى لقاء لا يقدر أحد على نسيانه.", "2025-03-07", 50),
          ep(5, "الاسم الأخير", "ملف مفقود يعود في حقيبة دبلوماسية.", "2025-03-14", 48),
          ep(6, "قبل الفجر", "كل الأطراف تلتقي في مكان واحد، ولا يخرج الجميع.", "2025-03-21", 55),
        ],
      },
    ],
  },
  {
    slug: "hayy-al-noor",
    type: "SERIES",
    titleAr: "حي النور",
    titleEn: "Hayy Al-Noor",
    taglineAr: "حارة واحدة… ألف حكاية.",
    overviewAr:
      "في حي شعبي بالقاهرة، تتعايش ثلاث عائلات حول سوق خضار صغير. مسلسل عن اليومي الذي لا يبدو بطوليًا، لكنه يحمل أبطالًا حقيقيين.",
    year: 2023,
    status: "ENDED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["drama", "family", "comedy"],
    rating: { value: 8.0, source: "تقييم تجريبي", count: 3980 },
    art: { variant: "arch", palette: "sand" },
    credits: [
      { nameAr: "سمير عبد العزيز", nameEn: "Samir Abdel Aziz", role: "DIRECTOR" },
      { nameAr: "عبد الرحمن مصطفى", nameEn: "Abdel Rahman Mostafa", role: "ACTOR", character: "المعلم أحمد" },
      { nameAr: "أمينة جمال", nameEn: "Amina Gamal", role: "ACTOR", character: "الحاجة زينب" },
      { nameAr: "سمير عبد العزيز", nameEn: "Samir Abdel Aziz", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2022,
        overview: "الانقسام الأول حول قرار الإدارة، وسؤال من يستحق الصوت.",
        episodes: [
          ep(1, "بائع الفجر", "عودة أحمد إلى الحي بعد سنوات من السفر تُشعل شائعات.", "2022-08-01", 40),
          ep(2, "خضار ونحاس", "سوق واحد وأسعار تختلف حسب من يسأل.", "2022-08-02", 41),
          ep(3, "بنت الجيران", "زواج مؤجل يعيد زينب إلى صورتها القديمة.", "2022-08-03", 39),
          ep(4, "خبر على السطح", "شقة صغيرة توجه العالم كله نحو حادثة لا يريد أحد أن يراها.", "2022-08-04", 42),
          ep(5, "المحضر", "معركة قانونية بلا محامين.", "2022-08-05", 40),
          ep(6, "نور الحي", "الحي يقرر أن يضيء بلا إذن.", "2022-08-06", 43),
        ],
      },
      {
        number: 2,
        year: 2023,
        overview: "المصارحة، والاعتراف بأن الرحيل أيضًا شكل من أشكال الحب.",
        episodes: [
          ep(1, "عودة الغائب", "أحمد يعود لتصفية حسابات لم يطلبها أحد.", "2023-08-01", 41),
          ep(2, "الأمانة", "وثيقة صغيرة تكشف تعاملات قديمة.", "2023-08-02", 40),
          ep(3, "زينة وفرح", "حفل زفاف يُبكي أكثر مما يُضحك.", "2023-08-03", 42),
          ep(4, "أرض الحرامية", "معركة مالكين وأصحاب حق بلا أوراق.", "2023-08-04", 39),
          ep(5, "يوم عادي", "لا يحدث شيء، ولهذا يُحدث كل شيء.", "2023-08-05", 38),
          ep(6, "حارة النور", "نهاية مفتوحة لشارع قرر ألا ينكسر.", "2023-08-06", 44),
        ],
      },
    ],
  },
  {
    slug: "investigation-bureau-the-lake",
    type: "SERIES",
    titleAr: "مكتب التحقيقات: البحيرة",
    titleEn: "Investigation Bureau: The Lake",
    taglineAr: "ما يغرق… لا يختفي.",
    overviewAr:
      "فريق تحقيق من ستة أشخاص يُرسَل إلى بحيرة صناعية بعد سلسلة اختفاءات. الهدوء المحيط بالمكان يخفي مأساة سابقة تبدأ بإهمال قديم وتنتهي بحقيقة لا تُصدق بسهولة.",
    year: 2024,
    status: "ENDED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["crime", "mystery", "thriller"],
    rating: { value: 8.2, source: "تقييم تجريبي", count: 2200 },
    art: { variant: "rings", palette: "steel" },
    credits: [
      { nameAr: "لينا عبد الحكيم", nameEn: "Lina Abdel Hakim", role: "DIRECTOR" },
      { nameAr: "طارق سيف", nameEn: "Tarek Seif", role: "ACTOR", character: "العقيد شريف" },
      { nameAr: "مي الحسيني", nameEn: "Mai El-Husseini", role: "ACTOR", character: "الدكتورة ريهام" },
      { nameAr: "لينا عبد الحكيم", nameEn: "Lina Abdel Hakim", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2024,
        overview: "التحقيق الأول: اختفاء ثلاثة صيادين في ليلة واحدة.",
        episodes: [
          ep(1, "مياه راكدة", "بلاغ باختفاء يُقابل بتردد رسمي.", "2024-01-10", 46),
          ep(2, "شاهد من الضفة", "طفل يروي ما رآه ويرفض أن يكرره.", "2024-01-17", 45),
          ep(3, "قاع صناعي", "غواصون يجدون ما لا ينتمي للمكان.", "2024-01-24", 47),
          ep(4, "ملف مهجور", "قضية قديمة تُفتح بالمصادفة.", "2024-01-31", 46),
          ep(5, "الطريق الترابي", "حاجز واحد يفصل بين شهادتين متعارضتين.", "2024-02-07", 48),
          ep(6, "سطح البحيرة", "الفريق يختار الحقيقة على الوظيفة.", "2024-02-14", 51),
        ],
      },
    ],
  },
  {
    slug: "heirs-of-silk",
    type: "SERIES",
    titleAr: "ورثة الحرير",
    titleEn: "Heirs of Silk",
    taglineAr: "التجارة تُبنى بالصبر… وتُفقد بجملة.",
    overviewAr:
      "دمشق، أواخر القرن التاسع عشر: عائلة تعمل في الحرير تواجه قرارًا يغيّر مصيرها، وملابساتٌ تحوّل صداقة قديمة إلى خصومة أجيال.",
    year: 2022,
    status: "ENDED",
    countryCode: "SY",
    countryNameAr: "سوريا",
    language: "العربية",
    genres: ["history", "drama", "family"],
    rating: { value: 8.5, source: "تقييم تجريبي", count: 2870 },
    art: { variant: "arch", palette: "oxblood" },
    credits: [
      { nameAr: "غسان الحلبي", nameEn: "Ghassan Halabi", role: "DIRECTOR" },
      { nameAr: "سميرة ناصر الدين", nameEn: "Samira Nasser", role: "ACTOR", character: "أم فؤاد" },
      { nameAr: "باسم الحمصي", nameEn: "Basem Homsi", role: "ACTOR", character: "فؤاد" },
      { nameAr: "غسان الحلبي", nameEn: "Ghassan Halabi", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2022,
        episodes: [
          ep(1, "أول خيط", "شحنة حرير تصل متأخرة وتفتح بابًا لحسابات قديمة.", "2022-03-02", 50),
          ep(2, "عقد الحرير", "توقيع على ورقة يقلب موازين العائلة.", "2022-03-09", 48),
          ep(3, "غريب الحارة", "زائر يطلب شراكة بشروط لا يفهمها أحد.", "2022-03-16", 49),
          ep(4, "لون الدم", "حريق في المستودع يشير إلى يد داخلية.", "2022-03-23", 47),
          ep(5, "وصية", "قراءة وصية الأب لا تريح أحدًا.", "2022-03-30", 50),
          ep(6, "ثمن الحرير", "قرار فؤاد الأخير ينقسم عليه حتى أصحاب الحق.", "2022-04-06", 53),
        ],
      },
    ],
  },
  {
    slug: "room-407",
    type: "SERIES",
    titleAr: "غرفة ٤٠٧",
    titleEn: "Room 407",
    taglineAr: "باب واحد… وأربعة ضيوف لا يعرفون بعضهم.",
    overviewAr:
      "في فندق قديم، تُحجز غرفة واحدة ليلة بعد ليلة لنزلاء لا يعرف بعضهم بعضًا. ما يجمعهم ليس الغرفة، بل حدث واحد لم يتحدث عنه أحد.",
    year: 2025,
    status: "ONGOING",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["thriller", "mystery", "drama"],
    rating: { value: 8.3, source: "تقييم تجريبي", count: 1520 },
    art: { variant: "monolith", palette: "violet" },
    credits: [
      { nameAr: "بسنت مراد", nameEn: "Bassant Morad", role: "DIRECTOR" },
      { nameAr: "رامي الجيار", nameEn: "Ramy El-Gayar", role: "ACTOR", character: "ضياء" },
      { nameAr: "هبة عبد المنعم", nameEn: "Heba Abdel Moneim", role: "ACTOR", character: "الموظفة رشا" },
      { nameAr: "بسنت مراد", nameEn: "Bassant Morad", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2025,
        overview: "ست ليالٍ، ستة نزلاء، وسجل حجز واحد.",
        episodes: [
          ep(1, "تسجيل وصول", "نزيل يطلب الغرفة رقمًا بالتحديد.", "2025-04-03", 44),
          ep(2, "خدمة الغرف", "صوت مكالمة من غرفة فارغة.", "2025-04-10", 43),
          ep(3, "إلغاء الحجز", "امرأة تصل باسم لا يخصها.", "2025-04-17", 45),
          ep(4, "مفتاح ثانٍ", "الموظفة رشا تفتح بابًا لم يُطلبه أحد.", "2025-04-24", 46),
          ep(5, "تسجيل خروج", "ضياء يعترف بشيء لا يخصه.", "2025-05-01", 47),
          ep(6, "الغرفة المجاورة", "النهاية تعيد البداية.", "2025-05-08", 50),
        ],
      },
    ],
  },
  {
    slug: "years-of-wind",
    type: "SERIES",
    titleAr: "سنوات الريح",
    titleEn: "Years of Wind",
    taglineAr: "ما يهدمه الوقت… يُعيد بناءه الأبناء.",
    overviewAr:
      "على مدى ثلاثة عقود، تتبع الحكاية ثلاث نساء من مدينة ساحلية، وكيف تتغير حياتهن مع كل تحوّل في المكان الذي يعشن فيه.",
    year: 2021,
    status: "ENDED",
    countryCode: "TN",
    countryNameAr: "تونس",
    language: "العربية",
    genres: ["history", "drama"],
    rating: { value: 8.1, source: "تقييم تجريبي", count: 1120 },
    art: { variant: "dunes", palette: "steel" },
    credits: [
      { nameAr: "محمود بوزيد", nameEn: "Mahmoud Bouzid", role: "DIRECTOR" },
      { nameAr: "أميرة السويسي", nameEn: "Amira Sassi", role: "ACTOR", character: "نجاة" },
      { nameAr: "فاطمة الزهراء", nameEn: "Fatma Zahra", role: "ACTOR", character: "لطيفة" },
      { nameAr: "محمود بوزيد", nameEn: "Mahmoud Bouzid", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2021,
        episodes: [
          ep(1, "بيت من طين", "بداية الحكاية في بيت على ساحل قديم.", "2021-05-06", 45),
          ep(2, "أول رحيل", "ريح تدفع النجاة إلى المدينة الكبيرة.", "2021-05-13", 44),
          ep(3, "ثوب العيد", "لطيفة تتزوج وتحلم بشيء آخر.", "2021-05-20", 46),
          ep(4, "أخبار الشمال", "رسائل تُقرأ بصوت عالٍ في الصالون.", "2021-05-27", 45),
          ep(5, "ماء مالح", "عودة مؤقتة لا تشبه التذكر.", "2021-06-03", 47),
          ep(6, "سنوات الريح", "الثلاث نساء في بيت واحد مرة أخرى.", "2021-06-10", 52),
        ],
      },
    ],
  },
  {
    slug: "watching-tower",
    type: "SERIES",
    titleAr: "برج المراقبة",
    titleEn: "Watching Tower",
    taglineAr: "من فوق، ترى كل شيء… إلا نفسك.",
    overviewAr:
      "حراسة أمنية في برج مراقبة على حدود بعيدة تبدأ بتسجيل ملاحظات لا يفهمها أحد، ثم تكتشف أن ما تراقبه يعرف عنها أكثر مما تعرف.",
    year: 2024,
    status: "ENDED",
    countryCode: "JO",
    countryNameAr: "الأردن",
    language: "العربية",
    genres: ["thriller", "action", "mystery"],
    rating: { value: 7.9, source: "تقييم تجريبي", count: 980 },
    art: { variant: "rings", palette: "cyan" },
    credits: [
      { nameAr: "رنا الفاعوري", nameEn: "Rana Fauri", role: "DIRECTOR" },
      { nameAr: "زين الحداد", nameEn: "Zein Haddad", role: "ACTOR", character: "الملازم أول فارس" },
      { nameAr: "لؤي العمري", nameEn: "Louay Omari", role: "ACTOR", character: "الرقيب خالد" },
      { nameAr: "رنا الفاعوري", nameEn: "Rana Fauri", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2024,
        episodes: [
          ep(1, "وردية ليلية", "فارس يتسلم برجًا يبدو بلا أحداث.", "2024-09-05", 43),
          ep(2, "سجل الأسماء", "خالد يوقع مكان شخص آخر.", "2024-09-12", 44),
          ep(3, "شعاع ضوئي", "إشارة تُلاحَظ من خارج البرج.", "2024-09-19", 45),
          ep(4, "انقطاع", "الراديو يصمت في اللحظة الخطأ.", "2024-09-26", 46),
          ep(5, "أمر مكتوب", "ورقة واحدة تغيّر مسار الوردية.", "2024-10-03", 44),
          ep(6, "خلف العدسة", "ما كان في المراقبة يراقب بدوره.", "2024-10-10", 49),
        ],
      },
    ],
  },
  {
    slug: "old-friends",
    type: "SERIES",
    titleAr: "الأصدقاء القدامى",
    titleEn: "Old Friends",
    taglineAr: "الصداقة الأولى لا تكبر معنا.",
    overviewAr:
      "أربعة أصدقاء من الجامعة يلتقون بعد خمسة عشر عامًا لإنقاذ مقهى كانوا يملكونه، ويكتشفون أن السنوات غيّرت كل شيء إلا الطريقة التي يضحكون بها.",
    year: 2022,
    status: "ENDED",
    countryCode: "EG",
    countryNameAr: "مصر",
    language: "العربية",
    genres: ["comedy", "drama", "family"],
    rating: { value: 7.6, source: "تقييم تجريبي", count: 1340 },
    art: { variant: "beam", palette: "teal" },
    credits: [
      { nameAr: "سارة البنا", nameEn: "Sara El-Banna", role: "DIRECTOR" },
      { nameAr: "أحمد العشري", nameEn: "Ahmed El-Ashry", role: "ACTOR", character: "كريم" },
      { nameAr: "مروة الخولي", nameEn: "Marwa El-Khouly", role: "ACTOR", character: "سها" },
      { nameAr: "سارة البنا", nameEn: "Sara El-Banna", role: "WRITER" },
    ],
    seasons: [
      {
        number: 1,
        year: 2022,
        episodes: [
          ep(1, "دعوة جماعية", "رسالة واحدة تجمع الأصدقاء الأربعة.", "2022-10-01", 38),
          ep(2, "مفتاح قديم", "دين قديم يعود بحديث ثقيل.", "2022-10-08", 37),
          ep(3, "قهوة بلا سكر", "سها تكتشف أنها قادرة على القول لا.", "2022-10-15", 39),
          ep(4, "حفل لم يحدث", "خطة احتفال تتحول إلى مصارحة.", "2022-10-22", 38),
          ep(5, "شروط الشراكة", "أربعة أصدقاء وعقد واحد.", "2022-10-29", 40),
          ep(6, "مكاننا", "المقهى يفتح أبوابه من جديد.", "2022-11-05", 42),
        ],
      },
    ],
  },

  // ───────────────────────────── الأنمي ─────────────────────────────
  {
    slug: "moon-blade",
    type: "ANIME",
    titleAr: "سيف القمر",
    titleEn: "Moon Blade",
    taglineAr: "من يملك السيف… يجب أن يملك نهايته.",
    overviewAr:
      "في عالم حيث يتفتت القمر كل قرن، يُختار صياد فتي لحمل سيف يحرس توازن الليل. رحلة تحوّل الطفل إلى سؤال، والسيف إلى مرآة.",
    year: 2024,
    status: "ONGOING",
    countryCode: "JP",
    countryNameAr: "اليابان",
    language: "اليابانية",
    genres: ["animation", "fantasy", "action", "adventure"],
    rating: { value: 8.9, source: "تقييم تجريبي", count: 9420 },
    art: { variant: "eclipse", palette: "indigo" },
    credits: [
      { nameAr: "كينجي يامادا", nameEn: "Kenji Yamada", role: "DIRECTOR" },
      { nameAr: "ريو ناكامورا", nameEn: "Ryo Nakamura", role: "WRITER" },
      { nameAr: "هاروكا إيتو", nameEn: "Haruka Ito", role: "ACTOR", character: "صوت أورا" },
      { nameAr: "كايتو ساتو", nameEn: "Kaito Sato", role: "ACTOR", character: "صوت هيو" },
    ],
    seasons: [
      {
        number: 1,
        year: 2024,
        overview: "الموسم الأول: الليلة التي انكسر فيها القمر نصفين.",
        episodes: [
          ep(1, "قرن جديد", "اختيار أورا يحوّل قريته إلى نقطة انقسام.", "2024-01-07", 24),
          ep(2, "حجر الندى", "أول تدريب يكشف ثمن السيف.", "2024-01-14", 24),
          ep(3, "الظل الأبيض", "خصم يطلب مواجهة بلا سلاح.", "2024-01-21", 24),
          ep(4, "الطريق عاليًا", "صعود الجبل يغيّر قواعد اللعبة.", "2024-01-28", 24),
          ep(5, "صوت الأم", "ذكرى تُعاد ولا تبدو صحيحة.", "2024-02-04", 24),
          ep(6, "نصفان", "القمر ينكسر، وأورا يقرر.", "2024-02-11", 25),
        ],
      },
    ],
  },
  {
    slug: "city-of-wires",
    type: "ANIME",
    titleAr: "مدينة الأسلاك",
    titleEn: "City of Wires",
    taglineAr: "المدينة تعمل… هل أحد يعرف لماذا؟",
    overviewAr:
      "مدينة مغلقة تعمل بآلات لا يعرف سكانها من بناها. مراهقة تكتشف ممرًا خلف جدار الصيانة، وتبدأ في طرح السؤال الذي مُنع على الجميع.",
    year: 2023,
    status: "ENDED",
    countryCode: "JP",
    countryNameAr: "اليابان",
    language: "اليابانية",
    genres: ["animation", "scifi", "mystery", "drama"],
    rating: { value: 8.4, source: "تقييم تجريبي", count: 5210 },
    art: { variant: "grid", palette: "cyan" },
    credits: [
      { nameAr: "ميو تاكاهاشي", nameEn: "Mio Takahashi", role: "DIRECTOR" },
      { nameAr: "سوتا كوباياشي", nameEn: "Sota Kobayashi", role: "WRITER" },
      { nameAr: "أكيرا موري", nameEn: "Akira Mori", role: "ACTOR", character: "صوت ناو" },
    ],
    seasons: [
      {
        number: 1,
        year: 2023,
        episodes: [
          ep(1, "جدار الصيانة", "ناو تسمع صوتًا لا يصدر عن الآلات.", "2023-04-02", 23),
          ep(2, "أسلاك حمراء", "دليل واحد يجعل الجميع متهمًا.", "2023-04-09", 23),
          ep(3, "المشرف", "من يراقب المدينة؟", "2023-04-16", 23),
          ep(4, "خط مباشر", "مكالمة من خارج الشبكة.", "2023-04-23", 24),
          ep(5, "مدينة بلا نافذة", "الخروج لا يشبه ما تصورته ناو.", "2023-04-30", 24),
        ],
      },
    ],
  },
  {
    slug: "tales-of-the-red-forest",
    type: "ANIME",
    titleAr: "حكايات الغابة الحمراء",
    titleEn: "Tales of the Red Forest",
    taglineAr: "الغابة لا تُروى… تُسمَع.",
    overviewAr:
      "طفلان يضلان الطريق في غابة يحكي عنها أهل القرية بتحفّظ. في كل شجرة ذكرى، وفي كل مخلوق درس صغير عن الخوف والصداقة.",
    year: 2022,
    status: "ENDED",
    countryCode: "JP",
    countryNameAr: "اليابان",
    language: "اليابانية",
    genres: ["animation", "adventure", "family", "fantasy"],
    rating: { value: 8.5, source: "تقييم تجريبي", count: 3620 },
    art: { variant: "monolith", palette: "forest" },
    credits: [
      { nameAr: "ياسوكو هيرانو", nameEn: "Yasuko Hirano", role: "DIRECTOR" },
      { nameAr: "ريو ناكامورا", nameEn: "Ryo Nakamura", role: "WRITER" },
      { nameAr: "إيمي أوكادا", nameEn: "Emi Okada", role: "ACTOR", character: "صوت توكو" },
    ],
    seasons: [
      {
        number: 1,
        year: 2022,
        episodes: [
          ep(1, "أوراق حمراء", "الطفلان يقطعان الطريق الممنوع.", "2022-07-03", 22),
          ep(2, "دليل صغير", "مخلوق يطلب مساعدة غريبة.", "2022-07-10", 22),
          ep(3, "ليل الغابة", "الظلام ليس عدوًا بالضرورة.", "2022-07-17", 22),
          ep(4, "بيت الحكاية", "شجرة تعرف اسم الجدة.", "2022-07-24", 23),
          ep(5, "العودة", "الطريق للخلف لا يشبه طريق المجيء.", "2022-07-31", 23),
        ],
      },
    ],
  },
  {
    slug: "tides",
    type: "ANIME",
    titleAr: "المد والجزر",
    titleEn: "Tides",
    taglineAr: "كل لقاء مؤجل… يترك أثرًا على الرمل.",
    overviewAr:
      "في بلدة ساحلية صغيرة، يتقابل فتى يعمل في إصلاح القوارب وفتاة تصل كل صيف. يكبران، ويتباعدان، ويعودان كل عام إلى نفس الرصيف — محاولة سينمائية لرسم الحب في المسافات الصغيرة.",
    year: 2025,
    status: "UPCOMING",
    countryCode: "JP",
    countryNameAr: "اليابان",
    language: "اليابانية",
    genres: ["animation", "drama", "romance"],
    rating: { value: 8.0, source: "تقييم تجريبي", count: 210 },
    art: { variant: "dunes", palette: "cyan" },
    credits: [
      { nameAr: "ناوكي فوجي", nameEn: "Naoki Fuji", role: "DIRECTOR" },
      { nameAr: "ميو تاكاهاشي", nameEn: "Mio Takahashi", role: "WRITER" },
    ],
    seasons: [],
  },
];

/** تفاصيل الأعمال المميزة في الهيرو (بالترتيب). */
export const HERO_ORDER = [
  "shadow-of-the-sands",
  "cairo-night",
  "orbit-of-silence",
  "the-hall-of-shadows",
];

export const HOME_SECTIONS = [
  { key: "hero", titleAr: "مختارات Loomix", kind: "HERO" as const, source: "CURATED", sort: 1 },
  { key: "trending", titleAr: "الرائج هذا الأسبوع", subtitleAr: "يختاره المحررون من بين الأكثر تفاعلًا", kind: "POSTER_ROW" as const, source: "TRENDING", sort: 2 },
  { key: "latest", titleAr: "أحدث الإضافات", subtitleAr: "ما وصل إلى المكتبة حديثًا", kind: "POSTER_ROW" as const, source: "LATEST", sort: 3 },
  { key: "editors", titleAr: "اختيارات المحرر", subtitleAr: "قائمة تُبنى يدويًا، لا بخوارزمية", kind: "POSTER_ROW" as const, source: "EDITORS", sort: 4 },
  { key: "trailers", titleAr: "تريلرات جديدة", subtitleAr: "شاهد قبل أن تقرأ", kind: "TRAILER_ROW" as const, source: "TRAILERS", sort: 5 },
  { key: "top", titleAr: "الأعلى تقييمًا", subtitleAr: "حسب تقييمات مُسجَّلة بمصدرها", kind: "POSTER_ROW" as const, source: "TOP_RATED", sort: 6 },
  { key: "genres", titleAr: "اكتشف حسب النوع", subtitleAr: "من الأكشن إلى الوثائقي", kind: "GENRE_ROW" as const, source: "GENRES", sort: 7 },
];
