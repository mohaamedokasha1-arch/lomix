/**
 * تدقيق أوصاف SEO على كل روابط sitemap — عبر HTTP فقط، بلا وصول لقاعدة البيانات.
 *
 * يتحقق من ثلاث خصائص لكل صفحة:
 *   1. وجود وصف غير فارغ.
 *   2. طوله داخل النطاق المفيد (افتراضيًا 70–165 حرفًا) — الأقصر يُهمل في نتائج
 *      البحث، والأطول يُقتطع.
 *   3. عدم تكرار الوصف نفسه في أكثر من صفحة (تكرار = صفحات تبدو مكرّرة لمحرّكات البحث).
 *
 * التشغيل:
 *   npm run seo:audit -- http://localhost:3000
 *   npm run seo:audit -- https://your-domain.com --max=160
 *
 * يخرج بكود 1 عند أي مخالفة، لذا يصلح بوابة قبل النشر.
 */

export {};

type Level = "error" | "warn" | "ok";
type Row = { path: string; status: number; length: number; description: string };

const args = process.argv.slice(2);
const baseArg = args.find((arg) => !arg.startsWith("--"));
const minArg = args.find((arg) => arg.startsWith("--min="));
const maxArg = args.find((arg) => arg.startsWith("--max="));
const min = minArg ? Number(minArg.split("=")[1]) : 70;
const max = maxArg ? Number(maxArg.split("=")[1]) : 165;

if (!baseArg || !/^https?:\/\//.test(baseArg)) {
  console.error("الاستخدام: npm run seo:audit -- https://your-domain.com [--min=70] [--max=165]");
  process.exit(2);
}

const base = baseArg.replace(/\/$/, "");
const results: { level: Level; label: string; detail?: string }[] = [];
const add = (level: Level, label: string, detail?: string) => results.push({ level, label, detail });

function decodeEntities(value: string) {
  return value
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** يحوّل أي رابط في sitemap إلى نفس الرابط على الخادم المفحوص. */
function toLocal(loc: string) {
  try {
    const url = new URL(loc);
    return base + url.pathname + url.search;
  } catch {
    return base + (loc.startsWith("/") ? loc : `/${loc}`);
  }
}

async function sitemapPaths() {
  const response = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`sitemap.xml أعاد ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => toLocal(match[1]));
}

async function audit(url: string): Promise<Row> {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  const html = await response.text();
  const match = html.match(/<meta name="description" content="([^"]*)"/);
  const description = match ? decodeEntities(match[1]) : "";
  return {
    path: url.slice(base.length) || "/",
    status: response.status,
    length: description.length,
    description,
  };
}

async function pool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>) {
  const out: R[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await worker(items[index]);
      }
    }),
  );
  return out;
}

async function main() {
  const urls = await sitemapPaths();
  if (!urls.length) throw new Error("sitemap.xml لا يحتوي روابط");
  add("ok", `${urls.length} رابطًا في sitemap`);

  const rows = await pool(urls, 6, audit);

  const broken = rows.filter((row) => row.status >= 400);
  if (broken.length) add("error", `${broken.length} صفحة لا تعيد < 400`, broken.slice(0, 3).map((r) => `${r.path} (${r.status})`).join(" · "));
  else add("ok", "كل الصفحات تعيد 200");

  const empty = rows.filter((row) => row.length === 0);
  if (empty.length) add("error", `${empty.length} صفحة بلا وصف`, empty.slice(0, 3).map((r) => r.path).join(" · "));
  else add("ok", "لا صفحة بلا وصف");

  const short = rows.filter((row) => row.length > 0 && row.length < min);
  if (short.length) {
    add(
      "error",
      `${short.length} وصفًا أقصر من ${min} حرفًا`,
      short.slice(0, 4).map((r) => `${r.path} (${r.length})`).join(" · "),
    );
  } else add("ok", `كل الأوصاف ≥ ${min} حرفًا`);

  const long = rows.filter((row) => row.length > max);
  if (long.length) {
    add(
      "warn",
      `${long.length} وصفًا أطول من ${max} حرفًا (يُقتطع في نتائج البحث)`,
      long.slice(0, 4).map((r) => `${r.path} (${r.length})`).join(" · "),
    );
  } else add("ok", `كل الأوصاف ≤ ${max} حرفًا`);

  const seen = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.description) continue;
    seen.set(row.description, [...(seen.get(row.description) ?? []), row.path]);
  }
  const duplicates = [...seen.entries()].filter(([, paths]) => paths.length > 1);
  if (duplicates.length) {
    add(
      "error",
      `${duplicates.length} وصفًا مكرّرًا`,
      duplicates.slice(0, 3).map(([text, paths]) => `${paths.length}× ${paths[0]} — ${text.slice(0, 40)}…`).join(" · "),
    );
  } else add("ok", "لا وصف مكرّر بين صفحتين");

  const lengths = rows.map((row) => row.length).sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)];
  add("ok", `الوسيط ${median} · الأقصر ${lengths[0]} · الأطول ${lengths[lengths.length - 1]}`);

  const icon: Record<Level, string> = { error: "✖", warn: "!", ok: "✓" };
  console.log(`\nتدقيق أوصاف SEO — ${base}  (النطاق ${min}–${max})\n`);
  for (const result of results) {
    console.log(`  ${icon[result.level]} ${result.label}${result.detail ? `  ${result.detail}` : ""}`);
  }
  const errors = results.filter((result) => result.level === "error").length;
  const warns = results.filter((result) => result.level === "warn").length;
  console.log(`\nالنتيجة: ${errors} خطأ · ${warns} تحذير\n`);
  process.exit(errors ? 1 : 0);
}

main().catch((error) => {
  console.error("✗ فشل التدقيق:", error);
  process.exit(1);
});
