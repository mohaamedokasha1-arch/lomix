import localFont from "next/font/local";

/**
 * خطوط مُستضافة ذاتيًا (من حزم fontsource) — لا طلبات خارجية، لا CLS،
 * وتعمل في بيئات لا تصل إلى Google Fonts.
 */

export const kufi = localFont({
  src: [
    { path: "../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  preload: true,
});

export const plex = localFont({
  src: [
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  preload: true,
});

export const manrope = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-latin",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  preload: false,
});
