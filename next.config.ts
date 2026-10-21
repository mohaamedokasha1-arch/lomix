import type { NextConfig } from "next";

// سياسة محتوى عملية بلا nonce: كل سكربتات Next إمّا من نفس الأصل أو inline
// (bootstrap الهيدرشن)، فمنع أي مصدر خارجي للسكربتات يظل فعّالًا.
// لتشديد لاحق: انتقال إلى nonce عبر middleware عند الحاجة.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self'",
  // التريلرات تعمل عبر iframe رسمي من يوتيوب/Vimeo فقط — لا استضافة فيديو عندنا.
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  // لا نُضيف upgrade-insecure-requests: تكسر التشغيل المحلي عبر http://localhost
  // بلا فائدة تُذكر. HTTPS في الإنتاج مضمون بـ HSTS أدناه.
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "sharp"],
  // خطوط بطاقات المشاركة تُقرأ من القرص وقت الطلب بمسار متغيّر، فلا يستطيع
  // تتبّع الملفات اكتشافها. نُدرجها صراحةً حتى تُحزَم مع دوال الصور على Vercel.
  outputFileTracingIncludes: {
    "/movie/[slug]/opengraph-image*": ["./assets/fonts/**"],
    "/series/[slug]/opengraph-image*": ["./assets/fonts/**"],
    "/anime/[slug]/opengraph-image*": ["./assets/fonts/**"],
  },
  images: {
    // الصور تُخزَّن محليًا في مرحلة العرض التجريبي. في الإنتاج تُستخدم خدمة
    // تخزين كائنات خارجية ويُضاف نطاقها هنا (انظر docs/DEPLOYMENT.md).
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    // أعرض أصل عندنا 1584px (لقطات الهيرو) والبوسترات أصغر بكثير.
    // السماح بعرض 3840 يجعل المحسّن يُكبّر أصلًا صغيرًا ويرسل بايتات لا تفيد.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
