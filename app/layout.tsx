import type { Metadata, Viewport } from "next";
import { kufi, manrope, plex } from "@/app/fonts";
import { absoluteUrl } from "@/lib/utils";
import { siteJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: "لوميكس — دليل الاكتشاف السينمائي",
    template: "%s — لوميكس",
  },
  description:
    "لوميكس منصة عربية لاكتشاف الأفلام والمسلسلات والأنمي: بيانات دقيقة، تريلرات رسمية، وتجربة تصفح سينمائية هادئة.",
  applicationName: "Loomix",
  keywords: ["أفلام", "مسلسلات", "أنمي", "تريلرات", "لوميكس", "Loomix", "دليل سينمائي"],
  authors: [{ name: "Loomix" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "لوميكس",
    title: "لوميكس — دليل الاكتشاف السينمائي",
    description: "اكتشف الأفلام والمسلسلات والأنمي بتجربة سينمائية عربية هادئة.",
    images: [{ url: "/art/og-default.webp", width: 1200, height: 630, alt: "لوميكس" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "لوميكس — دليل الاكتشاف السينمائي",
    description: "اكتشف الأفلام والمسلسلات والأنمي بتجربة سينمائية عربية هادئة.",
    images: ["/art/og-default.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1 },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050608",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${plex.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:rounded-lg focus:bg-brass-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#171006]"
        >
          تخطَّ إلى المحتوى
        </a>
        {children}
        <script
          type="application/ld+json"
          // بيانات ثابتة مبنية من إعدادات الموقع فقط — لا مدخلات مستخدم.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
      </body>
    </html>
  );
}
