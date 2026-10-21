import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const AR_LOCALE = "ar-EG-u-nu-latn";

/** أرقام لاتينية مع فواصل عربية — أوضح للقراءة السريعة في واجهة سينمائية */
export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat(AR_LOCALE).format(value);
}

export function formatRating(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return value.toFixed(1);
}

export function formatDate(value: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(AR_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function relativeTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const rtf = new Intl.RelativeTimeFormat(AR_LOCALE, { numeric: "auto" });
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.round(months / 12), "year");
}

export function runtimeLabel(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} ساعة`;
  return `${m} دقيقة`;
}

export const TITLE_TYPE_LABEL: Record<string, string> = {
  MOVIE: "فيلم",
  SERIES: "مسلسل",
  ANIME: "أنمي",
};

export const STATUS_LABEL: Record<string, string> = {
  RELEASED: "صدر",
  ONGOING: "مستمر",
  UPCOMING: "قيد الإنتاج",
  ENDED: "منتهٍ",
  CANCELLED: "ملغى",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "مدير عام",
  EDITOR: "محرر محتوى",
  VIEWER: "مستخدم",
};

export const TRAILER_KIND_LABEL: Record<string, string> = {
  OFFICIAL: "تريلر رسمي",
  TEASER: "إعلان تشويقي",
  PROMO: "مقطع ترويجي",
};

export const TRAILER_HEALTH_LABEL: Record<string, string> = {
  OK: "سليم",
  BROKEN: "معطل",
  CHECKING: "قيد الفحص",
  UNVERIFIED: "لم يُفحص",
};

export const MESSAGE_STATUS_LABEL: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد المعالجة",
  RESOLVED: "تم الحل",
};

export const GENRE_SOURCE_LABEL: Record<string, string> = {
  LATEST: "أحدث الإضافات",
  TOP_RATED: "الأعلى تقييمًا",
  TRENDING: "الرائج",
  EDITORS: "اختيارات المحرر",
  TRAILERS: "تريلرات",
  GENRES: "تصنيفات",
  CURATED: "مُنسّق يدويًا",
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/**
 * صيغة العدد العربية: مفرد/مثنى/جمع قلة/تمييز مفرد.
 * تُستخدم في عناوين SEO حتى لا يظهر «1 أعمال» أو «11 حلقات».
 */
export function arabicCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  const mod = n % 100;
  return mod >= 3 && mod <= 10 ? `${n} ${few}` : `${n} ${many}`;
}

export function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** يستخرج معرّف فيديو يوتيوب من أي صيغة رابط شائعة. */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0])) {
        return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function absoluteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** يمنع الوصول لمسارات مفتوحة (open redirect) عند العودة بعد الدخول. */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
