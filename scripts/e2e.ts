/**
 * فحص شامل عبر HTTP — يسجّل الدخول ويمرّ على المسار الحقيقي للوحة بلا متصفح.
 *
 * التشغيل (يحتاج خادمًا يعمل):
 *   npm run e2e
 *   npm run e2e -- --base http://localhost:3000
 *   npm run e2e -- --keep      # يترك العمل التجريبي للمعاينة اليدوية
 *
 * ماذا يفعل: ينشئ عملًا مؤقتًا بلا JavaScript (POST أصلي بنماذج الخادم)، يتأكد أنه مسودة
 * فيعاد 404، ينشره من صف القائمة، يعدّل حقلاً، ثم يحذفه من صفحة التأكيد ويتأكد أنه اختفى
 * من الواجهة واللوحة والخريطة. بعدها يفحص RBAC وحارس الرفع. يخرج بكود 1 عند أي فشل.
 */

export {};

type Check = { name: string; ok: boolean; detail?: string };

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith("--base="))?.split("=")[1];
const baseIndex = args.indexOf("--base");
const base = (baseArg ?? (baseIndex >= 0 ? args[baseIndex + 1] : undefined) ?? "http://localhost:3000").replace(/\/$/, "");
const keep = args.includes("--keep");

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "admin@loomix.tv", password: process.env.E2E_ADMIN_PASSWORD ?? "Loomix@2026" };
const VIEWER = { email: process.env.E2E_VIEWER_EMAIL ?? "viewer@loomix.tv", password: process.env.E2E_VIEWER_PASSWORD ?? "Viewer@2026" };

const stamp = Date.now().toString(36).slice(-6);
const SLUG = `e2e-check-${stamp}`;
const TITLE_AR = `فحص آلي ${stamp}`;

const checks: Check[] = [];
function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  return ok;
}

/* ——— طبقة HTTP: بلا متابعة توجيه حتى نرى 303 وأكوام الجلسة ——— */
type Res = { status: number; headers: Headers; body: string };

async function request(path: string, init: RequestInit = {}): Promise<Res> {
  const response = await fetch(base + path, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });
  const body = await response.text();
  return { status: response.status, headers: response.headers, body };
}

function hiddenInputs(html: string): [string, string][] {
  const fields: [string, string][] = [];
  for (const tag of html.match(/<input[^>]*>/g) ?? []) {
    if (!tag.includes('type="hidden"')) continue;
    const name = tag.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    fields.push([decode(name), decode(value)]);
  }
  return fields;
}

function decode(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** POST كـmultipart كما يفعل المتصفح — يحافظ على حقول `$ACTION_*` بلا أي تعديل. */
type FilePart = { field: string; filename: string; contentType: string; data: Buffer };

async function postForm(
  path: string,
  fields: [string, string][],
  cookie = "",
  files: FilePart[] = [],
): Promise<Res> {
  const boundary = `----loomix${Math.random().toString(16).slice(2)}`;
  const body = Buffer.concat([
    ...fields.map(([name, value]) =>
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        "utf8",
      ),
    ),
    ...files.map((file) =>
      Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
          "utf8",
        ),
        file.data,
        Buffer.from("\r\n", "utf8"),
      ]),
    ),
    Buffer.from(`--${boundary}--\r\n`, "utf8"),
  ]);
  return request(path, {
    method: "POST",
    body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      origin: base,
      ...(cookie ? { cookie } : {}),
    },
  });
}

function sessionCookie(res: Res): string | null {
  const raw = res.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : null;
}

async function login(email: string, password: string): Promise<{ cookie: string | null; status: number; blocked: boolean }> {
  const page = await request("/login");
  const actionFields = hiddenInputs(page.body).filter(([name]) => name.startsWith("$"));
  const res = await postForm("/login", [...actionFields, ["email", email], ["password", password], ["next", "/admin"]]);
  // حدّ المحاولات (10 لكل IP في 10 دقائق) قد يمنع الجلسة أثناء تشغيل متكرر.
  // نسجّل السبب صراحةً بدل أن يظهر كفشل RBAC مضلّل.
  const blocked = res.body.includes("محاولات كثيرة") || res.body.includes("قفل الحساب");
  if (blocked) {
    console.log(`\n  ! الدخول بحساب ${email} محجوب بحدّ المحاولات.`);
    console.log("    أوقف الخادم ثم: delete from rate_limit_entries; delete from sessions; ثم أعد التشغيل.\n");
  }
  return { cookie: sessionCookie(res), status: res.status, blocked };
}

/** يستخرج نموذجًا يحوي معرّف الإجراء ورقم الكيان المطلوب. */
function formFor(html: string, needle: string): [string, string][] | null {
  for (const form of html.match(/<form[^>]*>[\s\S]*?<\/form>/g) ?? []) {
    if (form.includes(needle) && form.includes("$ACTION_ID_")) return hiddenInputs(form);
  }
  return null;
}


/**
 * يلغي الجلسة عبر نموذج الخروج الحقيقي (إجراء خادم بلا JS).
 * المدير يجد النموذج في `/admin`، والمشاهد لا يدخلها — فيُقرأ من `/profile`.
 */
async function logout(cookie: string): Promise<boolean> {
  for (const path of ["/admin", "/profile", "/"]) {
    const page = await request(path, { headers: { cookie } });
    for (const fragment of page.body.match(/<form[^>]*>[\s\S]*?<\/form>/g) ?? []) {
      if (!fragment.includes("$ACTION_ID_")) continue;
      const fields = hiddenInputs(fragment);
      if (!fields.length) continue;
      const res = await postForm(path, fields, cookie);
      if (res.status === 303 || res.status === 200) return true;
    }
  }
  return false;
}

async function main() {
  /* 1 — تسجيل الدخول */
  const admin = await login(ADMIN.email, ADMIN.password);
  if (!check("دخول المدير يعيد 303 وكوكي جلسة", admin.status === 303 && Boolean(admin.cookie), `${admin.status}`)) {
    return report();
  }
  const cookie = admin.cookie!;

  /* 2 — الوصول إلى اللوحة */
  const dashboard = await request("/admin", { headers: { cookie } });
  check("لوحة التحكم تفتح للمدير", dashboard.status === 200, String(dashboard.status));

  /* 3 — إنشاء عمل بلا JavaScript */
  const formPage = await request("/admin/titles/new", { headers: { cookie } });
  const createFields: [string, string][] = [
    ...hiddenInputs(formPage.body).filter(([name]) => name.startsWith("$")),
    ["genres", ""],
    ["credits", ""],
    ["posterPath", ""],
    ["backdropPath", ""],
    ["type", "MOVIE"],
    ["titleAr", TITLE_AR],
    ["titleEn", "E2E Check"],
    ["slug", SLUG],
    ["overviewAr", "عمل مؤقت ينشئه فحص آلي ثم يحذفه في نهاية الجولة."],
    ["releaseYear", "2026"],
    ["status", "RELEASED"],
    ["countryCode", "EG"],
    ["state", "DRAFT"],
  ];
  const created = await postForm("/admin/titles/new", createFields, cookie);
  const id = created.headers.get("location")?.match(/\/admin\/titles\/([0-9a-f-]{36})/)?.[1] ?? null;
  if (!check("إنشاء عمل بلا JS يعيد 303 مع معرّف", created.status === 303 && Boolean(id), `${created.status}`)) {
    return report();
  }

  try {
    /* 4 — المسودة لا تظهر للجمهور */
    const draft = await request(`/movie/${SLUG}`);
    check("المسودة تعيد 404 للزائر", draft.status === 404, String(draft.status));

    /* 5 — النشر من صف القائمة (نموذج خادم حقيقي) */
    const list = await request(`/admin/titles?q=${encodeURIComponent(TITLE_AR)}`, { headers: { cookie } });
    const toggle = formFor(list.body, id!);
    if (!check("صف القائمة يعرض نموذج نشر بلا JS", Boolean(toggle))) return report();
    const published = await postForm(`/admin/titles?q=${encodeURIComponent(TITLE_AR)}`, toggle!, cookie);
    check("النشر من الصف ينفّذ", published.status === 200 || published.status === 303, String(published.status));
    const live = await request(`/movie/${SLUG}`);
    check("العمل يظهر للجمهور بعد النشر", live.status === 200, String(live.status));

    /* 6 — تعديل حقلاً من صفحة التحرير */
    const editPage = await request(`/admin/titles/${id}`, { headers: { cookie } });
    // كل الحقول المخفية — ومنها `id` الذي يخبر الإجراء أن هذا تعديل لا إنشاء.
    const merged = new Map<string, string>(hiddenInputs(editPage.body));
    const tagline = `سطر تعديل آلي ${stamp}`;
    for (const [name, value] of [
      ["type", "MOVIE"],
      ["titleAr", TITLE_AR],
      ["titleEn", "E2E Check"],
      ["slug", SLUG],
      ["overviewAr", "عمل مؤقت ينشئه فحص آلي ثم يحذفه في نهاية الجولة."],
      ["taglineAr", tagline],
      ["releaseYear", "2026"],
      ["status", "RELEASED"],
      ["countryCode", "EG"],
      ["state", "PUBLISHED"],
    ] as [string, string][]) {
      merged.set(name, value);
    }
    const saved = await postForm(`/admin/titles/${id}`, [...merged.entries()], cookie);
    const afterSave = await request(`/movie/${SLUG}`);
    check("حفظ التعديل يظهر في الواجهة", afterSave.body.includes(tagline), `${saved.status}`);

    /* 7 — صفحة تأكيد الحذف + الحذف */
    const deletePage = await request(`/admin/titles/${id}/delete`, { headers: { cookie } });
    check("صفحة الحذف تحذّر بما سيُحذف", deletePage.status === 200 && deletePage.body.includes("سيُحذف"), String(deletePage.status));
    const deleteForm = formFor(deletePage.body, `value="${id}"`);
    if (!check("صفحة الحذف تحوي نموذجًا حقيقيًا", Boolean(deleteForm))) return report();
    const deleted = await postForm(`/admin/titles/${id}/delete`, deleteForm!, cookie);
    check("الحذف ينفّذ ويعيد التوجيه", deleted.status === 303, String(deleted.status));
    const gone = await request(`/movie/${SLUG}`);
    const adminGone = await request(`/admin/titles/${id}`, { headers: { cookie } });
    const sitemap = await request("/sitemap.xml");
    check("العمل مختفٍ من الواجهة واللوحة والخريطة", gone.status === 404 && adminGone.status === 404 && !sitemap.body.includes(SLUG), `${gone.status}/${adminGone.status}`);
  } finally {
    if (keep) {
      // اتُّخذ قرار الإبقاء: أعد النشر إن كان موجودًا ليبقى قابلًا للمعاينة.
      const alive = await request(`/admin/titles/${id}`, { headers: { cookie } });
      if (alive.status === 200) {
        console.log(`\n  أُبقي العمل التجريبي: /movie/${SLUG}`);
      }
    }
  }

  /* 8 — RBAC: مشاهد لا يدخل اللوحة */
  const viewer = await login(VIEWER.email, VIEWER.password);
  const forbidden = await request("/admin", { headers: viewer.cookie ? { cookie: viewer.cookie } : {} });
  const location = forbidden.headers.get("location") ?? "";
  check("المشاهد يُطرد من اللوحة", [301, 302, 303, 307, 308].includes(forbidden.status) && location.includes("forbidden"), `${forbidden.status} ${location}`);

  /* 8ب — كل مسارات اللوحة محمية على الخادم، لا بإخفاء الروابط فقط */
  const ADMIN_PATHS = [
    "/admin",
    "/admin/analytics",
    "/admin/audit",
    "/admin/backup",
    "/admin/curated",
    "/admin/genres",
    "/admin/homepage",
    "/admin/imports",
    "/admin/imports/new",
    "/admin/imports/1",
    "/admin/media",
    "/admin/messages",
    "/admin/navigation",
    "/admin/people",
    "/admin/people/new",
    "/admin/seo",
    "/admin/settings",
    "/admin/sources",
    "/admin/titles",
    "/admin/titles/bulk",
    "/admin/titles/new",
    "/admin/titles/1",
    "/admin/titles/1/delete",
    "/admin/titles/1/seasons",
    "/admin/titles/1/seasons/1",
    "/admin/trailers",
    "/admin/users",
    "/admin/users/1/password",
  ];
  const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);

  const anonymousLeaks: string[] = [];
  for (const path of ADMIN_PATHS) {
    const response = await request(path);
    const toLogin = (response.headers.get("location") ?? "").includes("/login");
    if (!isRedirect(response.status) || !toLogin) anonymousLeaks.push(`${path} → ${response.status}`);
  }
  check(
    `كل مسارات اللوحة تطلب جلسة (${ADMIN_PATHS.length})`,
    anonymousLeaks.length === 0,
    anonymousLeaks.slice(0, 4).join(" · "),
  );

  const viewerLeaks: string[] = [];
  if (viewer.cookie) {
    for (const path of ADMIN_PATHS) {
      const response = await request(path, { headers: { cookie: viewer.cookie } });
      const toForbidden = (response.headers.get("location") ?? "").includes("forbidden");
      if (!isRedirect(response.status) || !toForbidden) viewerLeaks.push(`${path} → ${response.status}`);
    }
  }
  check(
    `المشاهد محجوب عن كل مسارات اللوحة (${ADMIN_PATHS.length})`,
    Boolean(viewer.cookie) && viewerLeaks.length === 0,
    viewerLeaks.slice(0, 4).join(" · "),
  );

  /* 8ج — المحرر: محتوى بلا حدود إدارة (المستخدمون/SEO/النسخ الاحتياطي) */
  const editor = await login(
    process.env.E2E_EDITOR_EMAIL ?? "editor@loomix.tv",
    process.env.E2E_EDITOR_PASSWORD ?? "Editor@2026",
  );
  const ADMIN_ONLY_PAGES = ["/admin/users", "/admin/users/1/password", "/admin/seo", "/admin/backup"];
  const editorLeaks: string[] = [];
  for (const path of ADMIN_ONLY_PAGES) {
    const response = await request(path, { headers: editor.cookie ? { cookie: editor.cookie } : {} });
    const toForbidden = (response.headers.get("location") ?? "").includes("forbidden");
    if (!isRedirect(response.status) || !toForbidden) editorLeaks.push(`${path} → ${response.status}`);
  }
  check(
    "المحرر لا يفتح صفحات المدير العام",
    Boolean(editor.cookie) && editorLeaks.length === 0,
    editorLeaks.join(" · "),
  );
  const editorContent = await request("/admin/titles", { headers: editor.cookie ? { cookie: editor.cookie } : {} });
  check("المحرر يفتح صفحات المحتوى", editorContent.status === 200, String(editorContent.status));

  // حتى لو أرسل المحرر حقول SEO من نموذج مسموح له (إعدادات الموقع)،
  // يرفضها الإجراء على الخادم — لا يُعتمد على إخفاء الصفحة.
  const settingsPage = await request("/admin/settings", { headers: editor.cookie ? { cookie: editor.cookie } : {} });
  const settingsForm = (settingsPage.body.match(/<form[^>]*>[\s\S]*?<\/form>/g) ?? []).find((fragment) =>
    fragment.includes('name="site_name"'),
  );
  let seoEscalationBlocked = false;
  if (settingsForm) {
    const actionFields = hiddenInputs(settingsForm).filter(([name]) => name.startsWith("$"));
    const escalated = await postForm(
      "/admin/settings",
      [
        ...actionFields,
        ["site_name", "Loomix"],
        ["site_name_ar", "لوميكس"],
        ["tagline_ar", "دليل الاكتشاف السينمائي"],
        ["meta_description", "وصف"],
        ["contact_email", "hello@loomix.tv"],
        ["trailers_mailto", "hello@loomix.tv"],
        ["seo_index_titles", "false"],
      ],
      editor.cookie ?? "",
    );
    seoEscalationBlocked = escalated.body.includes("تتطلب صلاحية مدير عام");
  }
  check("المحرر لا يستطيع تغيير الفهرسة بإرسال مباشر", seoEscalationBlocked);

  /* 9 — حارس الرفع: محتوى نصي متنكّر كصورة */
  const fake = {
    field: "file",
    filename: "fake.png",
    contentType: "image/png",
    data: Buffer.from("this is plain text pretending to be a PNG image, long enough for magic-byte checks."),
  };
  const invalid = await postForm("/api/admin/upload", [], cookie, [fake]);
  check("ملف غير صالح يُرفض بـ415", invalid.status === 415, String(invalid.status));
  const anonymous = await postForm("/api/admin/upload", [], "", [fake]);
  check("الرفع بلا جلسة يُرفض بـ401", anonymous.status === 401, String(anonymous.status));

  /* 10 — تنظيف الجلستين (سجل التدقيق يبقى: سجل غير قابل للمحو) */
  if (!keep) {
    await logout(cookie);
    if (viewer.cookie) await logout(viewer.cookie);
    if (editor.cookie) await logout(editor.cookie);
    const after = await request("/admin", { headers: { cookie } });
    check(
      "الخروج يُبطل الجلسة على الخادم",
      [301, 302, 303, 307, 308].includes(after.status),
      String(after.status),
    );
  }

  return report();
}

function report() {
  console.log(`\nفحص شامل — ${base}\n`);
  for (const item of checks) {
    console.log(`  ${item.ok ? "✓" : "✖"} ${item.name}${item.detail ? `  (${item.detail})` : ""}`);
  }
  const failed = checks.filter((item) => !item.ok).length;
  console.log(`\n${checks.length - failed} ناجح · ${failed} فاشل\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("✗ انقطع الفحص:", error);
  process.exit(1);
});
