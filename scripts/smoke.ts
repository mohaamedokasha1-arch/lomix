/**
 * فحص دخان بعد النشر — يعمل عبر HTTP فقط، بلا وصول لقاعدة البيانات.
 *
 * التشغيل:
 *   npm run smoke -- https://your-domain.com
 *   npm run smoke -- https://your-domain.com --prod      # يمنع ظهور بيانات دخول تجريبية
 *   npm run smoke -- https://your-domain.com --crawl     # يفتح أول 40 رابطًا من sitemap
 *
 * يخرج بكود 1 عند أي فشل.
 */

export {};

type Level = "error" | "warn" | "ok";
type Result = { level: Level; label: string; detail?: string };

const args = process.argv.slice(2);
const baseArg = args.find((arg) => !arg.startsWith("--"));
const prod = args.includes("--prod");
const crawl = args.includes("--crawl");

if (!baseArg || !/^https?:\/\//.test(baseArg)) {
  console.error("الاستخدام: npm run smoke -- https://your-domain.com [--prod] [--crawl]");
  process.exit(2);
}

const base = baseArg.replace(/\/$/, "");
const results: Result[] = [];
const add = (level: Level, label: string, detail?: string) => results.push({ level, label, detail });

async function request(path: string, init?: RequestInit) {
  const response = await fetch(base + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: { "user-agent": "loomix-smoke/1.0" },
    ...init,
  });
  const body = await response.text();
  return { response, body };
}

async function main() {
  /* 1 — الصفحة الرئيسية */
  let home = "";
  let homeHeaders = new Headers();
  try {
    const { response, body } = await request("/");
    home = body;
    homeHeaders = response.headers;
    if (response.status === 200) add("ok", "الرئيسية تعيد 200");
    else add("error", `الرئيسية تعيد ${response.status}`);
  } catch (error) {
    add("error", "تعذّر الوصول إلى الموقع", error instanceof Error ? error.message : String(error));
    return report();
  }

  if (/<html[^>]+lang="ar"[^>]*dir="rtl"/.test(home) || /<html[^>]+dir="rtl"[^>]*lang="ar"/.test(home)) {
    add("ok", "اللغة عربية والاتجاه RTL");
  } else {
    add("error", "وسم <html> لا يحمل lang=\"ar\" dir=\"rtl\"");
  }

  /* 2 — رؤوس الأمان */
  const csp = homeHeaders.get("content-security-policy") ?? "";
  if (csp.includes("default-src 'self'") && csp.includes("object-src 'none'")) add("ok", "CSP مفعّل على الصفحات");
  else add("error", "CSP ناقص أو غائب", csp.slice(0, 120) || "—");

  for (const [header, expected, label] of [
    ["x-frame-options", "SAMEORIGIN", "X-Frame-Options"],
    ["referrer-policy", "", "Referrer-Policy"],
    ["x-content-type-options", "nosniff", "X-Content-Type-Options"],
  ] as const) {
    const value = homeHeaders.get(header) ?? "";
    if (value && (!expected || value.toLowerCase().includes(expected.toLowerCase()))) add("ok", `${label} مضبوط`);
    else add("error", `${label} غائب أو غير صحيح`, value || "—");
  }

  if (homeHeaders.get("x-powered-by")) add("warn", "X-Powered-By مكشوف", homeHeaders.get("x-powered-by") ?? "");
  else add("ok", "X-Powered-By مخفي");

  if (base.startsWith("https://")) {
    if (homeHeaders.get("strict-transport-security")) add("ok", "HSTS مفعّل");
    else add(prod ? "error" : "warn", "HSTS غائب على https");
  } else {
    add("warn", "الموقع يعمل على http — HSTS لا يُطبَّق خارج https");
  }

  /* 3 — robots وsitemap */
  try {
    const { response, body } = await request("/robots.txt");
    if (response.status !== 200) add("error", `robots.txt يعيد ${response.status}`);
    else if (!/Disallow:\s*\/admin/.test(body)) add("error", "robots.txt لا يمنع /admin");
    else if (!/Sitemap:/i.test(body)) add("error", "robots.txt لا يشير إلى sitemap");
    else add("ok", "robots.txt يمنع اللوحة ويشير إلى sitemap");
  } catch {
    add("error", "تعذّر جلب robots.txt");
  }

  let locs: string[] = [];
  try {
    const { response, body } = await request("/sitemap.xml");
    if (response.status !== 200) add("error", `sitemap.xml يعيد ${response.status}`);
    locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] ?? "").filter(Boolean);
    if (!locs.length) add("error", "sitemap.xml بلا روابط");
    else if (locs.some((loc) => !loc.startsWith(base))) add("error", "sitemap يحتوي روابط خارج النطاق");
    else add("ok", `sitemap.xml يحوي ${locs.length} رابطًا`);
  } catch {
    add("error", "تعذّر جلب sitemap.xml");
  }

  /* 4 — 404 حقيقي ولوحة محمية */
  try {
    const { response, body } = await request("/movie/__smoke_missing__");
    if (response.status !== 404) {
      add("error", `المسار غير الموجود يعيد ${response.status} بدل 404`);
    } else if (!/<meta name="robots" content="[^"]*noindex/.test(body)) {
      add("error", "صفحة 404 بلا noindex — قد تُفهرس");
    } else if (!/<title>[^<]*غير موجودة/.test(body)) {
      add("error", "صفحة 404 بعنوان غير واضح");
    } else {
      add("ok", "404 حقيقي: كود 404 + noindex + عنوان واضح");
    }
  } catch {
    add("error", "تعذّر فحص 404");
  }

  try {
    const { response } = await request("/admin");
    const location = response.headers.get("location") ?? "";
    if ([301, 302, 303, 307, 308].includes(response.status) && location.includes("/login")) add("ok", "اللوحة تعيد التوجيه إلى الدخول");
    else if (response.status === 200) add("error", "اللوحة مفتوحة بلا جلسة!", "الصفحة أعادت 200");
    else add("warn", `اللوحة تعيد ${response.status}`, location);
  } catch {
    add("error", "تعذّر فحص حماية اللوحة");
  }

  /* 5 — صفحة الدخول وبيانات العرض */
  try {
    const { response, body } = await request("/login");
    if (response.status !== 200) add("error", `/login تعيد ${response.status}`);
    else if (prod && /Loomix@2026|Editor@2026|Viewer@2026/.test(body)) {
      add("error", "صفحة الدخول تعرض كلمة مرور تجريبية في الإنتاج");
    } else add("ok", "صفحة الدخول نظيفة");
  } catch {
    add("error", "تعذّر جلب /login");
  }

  /* 6 — البيانات المنظّمة */
  const ldBlocks = [...home.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? "");
  if (!ldBlocks.length) add("warn", "لا توجد بيانات منظّمة في الرئيسية");
  else {
    let org = false;
    let site = false;
    let valid = true;
    for (const raw of ldBlocks) {
      try {
        const data = JSON.parse(raw) as { "@graph"?: { "@type"?: string }[]; "@type"?: string };
        const nodes = data["@graph"] ?? [data];
        for (const node of nodes) {
          if (node["@type"] === "Organization") org = true;
          if (node["@type"] === "WebSite") site = true;
        }
      } catch {
        valid = false;
      }
    }
    if (!valid) add("error", "JSON-LD غير صالح");
    else if (!org || !site) add("warn", "JSON-LD ناقص", `Organization=${org} WebSite=${site}`);
    else add("ok", "JSON-LD صالح ويحوي Organization + WebSite");
  }

  /* 6b — بيانات منظّمة لصفحة قائمة: CollectionPage + ItemList بأرقام حقيقية */
  try {
    const { response, body } = await request("/movies");
    if (response.status !== 200) {
      add("warn", "/movies لا يعيد 200 — تعذّر فحص بيانات القوائم");
    } else {
      const blocks = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? "");
      type Node = { "@type"?: string; mainEntity?: { "@type"?: string; numberOfItems?: number; itemListElement?: { url?: string }[] } };
      let collection: Node | null = null;
      let invalid = false;
      for (const raw of blocks) {
        try {
          const parsed = JSON.parse(raw) as { "@graph"?: Node[] } & Node;
          const nodes = parsed["@graph"] ?? [parsed];
          for (const node of nodes) if (node["@type"] === "CollectionPage") collection = node;
        } catch {
          invalid = true;
        }
      }
      const list = collection?.mainEntity;
      if (invalid) add("error", "JSON-LD غير صالح في /movies");
      else if (!collection) add("error", "/movies بلا CollectionPage في JSON-LD");
      else if (!list || list["@type"] !== "ItemList" || !list.numberOfItems) add("error", "CollectionPage بلا ItemList بأرقام");
      else if ((list.itemListElement ?? []).some((item) => !item.url?.startsWith(base))) add("error", "عناصر ItemList لا تشير إلى هذا النطاق");
      else add("ok", `بيانات القوائم سليمة (${list.numberOfItems} عنصرًا في /movies)`);
    }
  } catch {
    add("warn", "تعذّر فحص بيانات القوائم المنظّمة");
  }

  /* 7 — صور المشاركة الاجتماعية لكل عمل */
  const titleLink = home.match(/href="(\/(?:movie|series|anime)\/[^"?#]+)"/)?.[1];
  if (!titleLink) {
    add("warn", "لا يوجد رابط عمل في الرئيسية — تعذّر فحص صورة المشاركة");
  } else {
    try {
      const { body: page } = await request(titleLink);
      const ogUrl = page.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      if (!ogUrl) add("error", `صفحة ${titleLink} بلا og:image`);
      else {
        const response = await fetch(ogUrl, { signal: AbortSignal.timeout(20000) });
        const type = response.headers.get("content-type") ?? "";
        // Next يرسل الصورة مجزّأة بلا content-length، فنقيس الجسم فعليًا.
        const size = (await response.arrayBuffer()).byteLength;
        if (response.status !== 200 || !type.startsWith("image/")) {
          add("error", "صورة المشاركة لا تُرسم", `${response.status} ${type}`);
        } else if (size > 600_000) {
          add("warn", `صورة المشاركة ثقيلة (${Math.round(size / 1024)}KB) — بعض التطبيقات تتجاهلها`);
        } else {
          add("ok", `صورة مشاركة ديناميكية تعمل (${Math.round(size / 1024)}KB)`);
        }
      }
    } catch {
      add("warn", "تعذّر فحص صورة المشاركة");
    }
  }

  /* 8 — كاش الأصول الثابتة */
  const asset = home.match(/\/_next\/static\/[^"']+\.(?:js|css)/)?.[0];
  if (asset) {
    try {
      const response = await fetch(base + asset, { signal: AbortSignal.timeout(15000) });
      const cache = response.headers.get("cache-control") ?? "";
      if (response.status === 200 && /immutable/.test(cache) && /max-age=31536000/.test(cache)) add("ok", "الأصول الثابتة immutable سنة");
      else add("warn", "كاش الأصول الثابتة غير متوقع", cache || "—");
    } catch {
      add("warn", "تعذّر فحص كاش الأصول");
    }
  }

  /* 9 — واجهة البحث */
  try {
    const { response, body } = await request(`/api/search?q=${encodeURIComponent("ظل")}`);
    if (response.status !== 200) add("warn", `/api/search يعيد ${response.status}`);
    else {
      const parsed = JSON.parse(body) as { results?: unknown[] };
      const count = Array.isArray(parsed.results) ? parsed.results.length : 0;
      if (count > 0) add("ok", `البحث يعمل (${count} نتيجة لـ«ظل»)`);
      else add("warn", "البحث يعيد صفرًا — تأكد أن القاعدة تحوي أعمالًا منشورة");
    }
  } catch {
    add("warn", "تعذّر فحص /api/search");
  }

  /* 10 — زحف مختصر (اختياري) */
  if (crawl && locs.length) {
    const sample = locs.slice(0, 40);
    let failures = 0;
    for (const loc of sample) {
      try {
        const response = await fetch(loc, { redirect: "manual", signal: AbortSignal.timeout(20000) });
        if (response.status >= 400) failures += 1;
      } catch {
        failures += 1;
      }
    }
    if (failures) add("error", `${failures} من ${sample.length} رابطًا في sitemap لا يعيد < 400`);
    else add("ok", `${sample.length} رابطًا من sitemap تعمل`);
  }

  return report();
}

function report() {
  const icon: Record<Level, string> = { error: "✖", warn: "!", ok: "✓" };
  console.log(`\nفحص الدخان — ${base}${prod ? " (إنتاج)" : ""}\n`);
  for (const result of results) {
    console.log(`  ${icon[result.level]} ${result.label}${result.detail ? `  ${result.detail}` : ""}`);
  }
  const errors = results.filter((r) => r.level === "error").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log(`\nالنتيجة: ${errors} خطأ · ${warns} تحذير\n`);
  process.exit(errors ? 1 : 0);
}

main().catch((error) => {
  console.error("✗ فشل الفحص:", error);
  process.exit(1);
});
