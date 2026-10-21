"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, X } from "lucide-react";
import { saveTitleAction, type AdminState } from "@/app/actions/admin";
import { Field, FormBanner, Select, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaField } from "@/components/admin/media-field";

type Genre = { id: string; nameAr: string; slug: string };
type Person = { id: string; nameAr: string };
type Credit = { personId: string; role: "ACTOR" | "DIRECTOR" | "WRITER" | "COMPOSER"; characterName?: string | null };

export type TitleFormValues = {
  id?: string;
  type: string;
  titleAr: string;
  titleEn: string | null;
  slug: string;
  taglineAr: string | null;
  overviewAr: string;
  releaseYear: number | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  status: string;
  countryCode: string | null;
  countryNameAr: string | null;
  language: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  ratingValue: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  state: string;
  featured: boolean;
  isDemo: boolean;
  editorNoteAr: string | null;
  externalSource: string | null;
  externalId: string | null;
};

const ROLE_OPTIONS = [
  { value: "ACTOR", label: "ممثل" },
  { value: "DIRECTOR", label: "مخرج" },
  { value: "WRITER", label: "كاتب" },
  { value: "COMPOSER", label: "موسيقى" },
] as const;

const ROLE_LABEL: Record<string, string> = { ACTOR: "ممثل", DIRECTOR: "مخرج", WRITER: "كاتب", COMPOSER: "موسيقى" };

export function TitleForm({
  values,
  genres,
  selectedGenres,
  people,
  credits: initialCredits,
}: {
  values?: TitleFormValues;
  genres: Genre[];
  selectedGenres: string[];
  people: Person[];
  credits: Credit[];
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(saveTitleAction, null);
  const [type, setType] = useState(values?.type ?? "MOVIE");
  const [genreSlugs, setGenreSlugs] = useState<string[]>(selectedGenres);
  const [credits, setCredits] = useState<Credit[]>(initialCredits.length ? initialCredits : [{ personId: "", role: "ACTOR", characterName: "" }]);
  const [personQuery, setPersonQuery] = useState("");
  const [ratingValue, setRatingValue] = useState(values?.ratingValue?.toString() ?? "");

  const personOptions = useMemo(() => {
    const q = personQuery.trim();
    const filtered = q ? people.filter((person) => person.nameAr.includes(q)) : people;
    return filtered.slice(0, 60);
  }, [people, personQuery]);

  const toggleGenre = (slug: string) => {
    setGenreSlugs((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  };

  return (
    <form action={formAction} className="space-y-5">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="genres" value={JSON.stringify(genreSlugs)} />
      <input type="hidden" name="credits" value={JSON.stringify(credits.filter((c) => c.personId))} />

      <FormBanner state={state} />
      {values?.id && state?.ok && (
        <p className="text-[0.7rem] text-ink-400">
          لمعاينة النتيجة افتح{" "}
          <Link href={`/${values.type === "SERIES" ? "series" : values.type === "ANIME" ? "anime" : "movie"}/${values.slug}`} target="_blank" className="text-brass-200 underline">
            صفحة العمل
          </Link>{" "}
          (المسودات لا تظهر للجمهور).
        </p>
      )}

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">المعلومات الأساسية</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نوع العمل" required>
            <Select name="type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="MOVIE">فيلم</option>
              <option value="SERIES">مسلسل</option>
              <option value="ANIME">أنمي</option>
            </Select>
          </Field>

          <Field label="الاسم العربي" required error={state?.fieldErrors?.titleAr} hint="ما يظهر في كل الواجهة">
            <TextInput name="titleAr" defaultValue={values?.titleAr} required maxLength={200} />
          </Field>

          <Field label="الاسم الأصلي / الإنجليزي" optional error={state?.fieldErrors?.titleEn}>
            <TextInput name="titleEn" defaultValue={values?.titleEn ?? ""} dir="ltr" maxLength={200} />
          </Field>

          <Field label="الرابط (slug)" optional hint="يُنشأ تلقائيًا من الاسم إن تُرك فارغًا — تغييره يكسر الروابط القديمة">
            <TextInput name="slug" defaultValue={values?.slug} dir="ltr" maxLength={200} />
          </Field>

          <div className="md:col-span-2">
            <Field label="الوصف العربي" required error={state?.fieldErrors?.overviewAr}>
              <TextArea name="overviewAr" defaultValue={values?.overviewAr} rows={5} required maxLength={4000} />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="الجملة التعريفية (tagline)" optional>
              <TextInput name="taglineAr" defaultValue={values?.taglineAr ?? ""} maxLength={240} />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">الإصدار والتصنيف</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="سنة الإصدار" optional error={state?.fieldErrors?.releaseYear}>
            <TextInput name="releaseYear" type="number" min={1888} max={2100} defaultValue={values?.releaseYear ?? ""} />
          </Field>
          <Field label="تاريخ الإصدار الدقيق" optional hint="اتركه فارغًا إن لم يكن موثقًا">
            <TextInput name="releaseDate" type="date" defaultValue={values?.releaseDate ?? ""} />
          </Field>
          <Field label={type === "MOVIE" ? "مدة الفيلم (دقيقة)" : "مدة الحلقة (دقيقة)"} optional>
            <TextInput name="runtimeMinutes" type="number" min={1} max={1200} defaultValue={values?.runtimeMinutes ?? ""} />
          </Field>
          <Field label="حالة الإصدار" required>
            <Select name="status" defaultValue={values?.status ?? "RELEASED"}>
              <option value="RELEASED">صدر</option>
              <option value="ONGOING">مستمر</option>
              <option value="UPCOMING">قادم</option>
              <option value="ENDED">انتهى</option>
              <option value="CANCELLED">أُلغي</option>
            </Select>
          </Field>
          <Field label="رمز الدولة" optional hint="مثال: EG, US, JP">
            <TextInput name="countryCode" defaultValue={values?.countryCode ?? ""} dir="ltr" maxLength={3} />
          </Field>
          <Field label="اسم الدولة بالعربية" optional>
            <TextInput name="countryNameAr" defaultValue={values?.countryNameAr ?? ""} maxLength={80} />
          </Field>
          <Field label="اللغة الأصلية" optional>
            <TextInput name="language" defaultValue={values?.language ?? ""} maxLength={60} />
          </Field>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[0.72rem] font-medium text-ink-200">التصنيفات</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => {
              const active = genreSlugs.includes(genre.slug);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.slug)}
                  aria-pressed={active}
                  className={`rounded-full border px-2.5 py-1 text-[0.68rem] transition ${
                    active ? "border-brass-400/60 bg-brass-400/15 text-brass-200" : "border-white/12 text-ink-300 hover:border-white/30"
                  }`}
                >
                  {genre.nameAr}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">مصادر رسمية وتقييم</h2>
        <p className="mb-4 rounded-lg border border-signal-amber/20 bg-signal-amber/[0.05] p-2.5 text-[0.68rem] leading-5 text-ink-300">
          لا تُسجّل تقييمًا بدون مصدر. إن تركت القيمة فارغة لن يظهر أي تقييم في الموقع — وهذا أفضل من رقم مُفترض.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="قيمة التقييم (0–10)" optional>
            <TextInput
              name="ratingValue"
              type="number"
              step="0.1"
              min={0}
              max={10}
              defaultValue={values?.ratingValue ?? ""}
              onChange={(event) => setRatingValue(event.target.value)}
            />
          </Field>
          <Field label="مصدر التقييم" optional error={state?.fieldErrors?.ratingSource} hint={ratingValue ? "مطلوب عند وجود قيمة" : "مثال: IMDb، موقع النقاد"}>
            <TextInput name="ratingSource" defaultValue={values?.ratingSource ?? ""} maxLength={120} />
          </Field>
          <Field label="عدد المصوّتين" optional>
            <TextInput name="ratingCount" type="number" min={0} defaultValue={values?.ratingCount ?? ""} />
          </Field>
          <Field label="المصدر الخارجي" optional>
            <Select name="externalSource" defaultValue={values?.externalSource ?? ""}>
              <option value="">لا يوجد</option>
              <option value="TMDB">TMDB</option>
              <option value="IMDB">IMDb</option>
              <option value="MANUAL">إدخال يدوي</option>
              <option value="OFFICIAL">موقع رسمي</option>
            </Select>
          </Field>
          <Field label="المعرّف الخارجي" optional>
            <TextInput name="externalId" defaultValue={values?.externalId ?? ""} dir="ltr" maxLength={120} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">الصور</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <MediaField label="البوستر" name="posterPath" defaultValue={values?.posterPath} aspect="poster" optional hint="يُفضّل 2:3 — يظهر في الشبكات." />
          <MediaField label="الخلفية" name="backdropPath" defaultValue={values?.backdropPath} aspect="wide" optional hint="يُفضّل 16:9 — أعلى صفحة العمل." />
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-100">طاقم العمل</h2>
          <span className="text-[0.62rem] text-ink-500">{credits.filter((c) => c.personId).length} ارتباطًا</span>
        </div>

        <input
          type="search"
          value={personQuery}
          onChange={(event) => setPersonQuery(event.target.value)}
          placeholder="ابحث عن شخص لإضافته…"
          className="field mb-3 h-9 text-xs"
        />

        <ul className="space-y-2">
          {credits.map((credit, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-ink-950/40 p-2">
              <span className="num w-5 text-[0.62rem] text-ink-600">{index + 1}</span>
              <select
                value={credit.role}
                onChange={(event) =>
                  setCredits((current) =>
                    current.map((row, i) => (i === index ? { ...row, role: event.target.value as Credit["role"] } : row)),
                  )
                }
                className="field h-8 w-24 text-[0.7rem]"
                aria-label="الدور"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={credit.personId}
                onChange={(event) =>
                  setCredits((current) => current.map((row, i) => (i === index ? { ...row, personId: event.target.value } : row)))
                }
                className="field h-8 min-w-0 flex-1 text-[0.7rem]"
                aria-label="الشخص"
              >
                <option value="">— اختر شخصًا —</option>
                {personOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nameAr}
                  </option>
                ))}
                {credit.personId && !personOptions.some((p) => p.id === credit.personId) && (
                  <option value={credit.personId}>{people.find((p) => p.id === credit.personId)?.nameAr ?? credit.personId}</option>
                )}
              </select>
              <input
                value={credit.characterName ?? ""}
                onChange={(event) =>
                  setCredits((current) => current.map((row, i) => (i === index ? { ...row, characterName: event.target.value } : row)))
                }
                placeholder="اسم الشخصية (اختياري)"
                className="field h-8 w-40 text-[0.7rem]"
                aria-label="اسم الشخصية"
              />
              <button
                type="button"
                onClick={() => setCredits((current) => current.filter((_, i) => i !== index))}
                className="ms-auto flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:text-signal-red"
                aria-label={`حذف ${ROLE_LABEL[credit.role]}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCredits((current) => [...current, { personId: "", role: "ACTOR", characterName: "" }])}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/15 px-2.5 text-[0.68rem] text-ink-100 hover:border-white/30"
          >
            <Plus className="h-3.5 w-3.5" /> صف جديد
          </button>
          <Link href="/admin/people/new" target="_blank" className="text-[0.65rem] text-ink-400 underline hover:text-brass-200">
            إضافة شخص غير موجود
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-white/8 bg-ink-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">النشر وSEO</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="حالة النشر" required hint="المسودة لا تظهر للجمهور ولا في sitemap">
            <Select name="state" defaultValue={values?.state ?? "DRAFT"}>
              <option value="DRAFT">مسودة</option>
              <option value="PUBLISHED">منشور</option>
            </Select>
          </Field>
          <Field label="ملاحظة تحريرية داخلية" optional hint="لا تُعرض في الموقع">
            <TextInput name="editorNoteAr" defaultValue={values?.editorNoteAr ?? ""} maxLength={600} />
          </Field>
          <Field label="عنوان SEO" optional hint="إن تُرك فارغًا يُستخدم الاسم العربي + السنة">
            <TextInput name="seoTitle" defaultValue={values?.seoTitle ?? ""} maxLength={200} />
          </Field>
          <Field label="وصف SEO" optional hint="إن تُرك فارغًا يُقتطع من الوصف">
            <TextInput name="seoDescription" defaultValue={values?.seoDescription ?? ""} maxLength={400} />
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[0.72rem] text-ink-200">
              <input type="checkbox" name="featured" defaultChecked={values?.featured} className="h-3.5 w-3.5 accent-brass-400" />
              إبراز في الواجهة
            </label>
            <label className="flex items-center gap-2 text-[0.72rem] text-ink-200">
              <input type="checkbox" name="isDemo" defaultChecked={values?.isDemo} className="h-3.5 w-3.5 accent-brass-400" />
              محتوى تجريبي (يظهر عليه وسم «تجريبي»)
            </label>
            {values?.isDemo && (
              <p className="rounded-md bg-signal-amber/10 p-2 text-[0.62rem] leading-4 text-signal-amber">
                العمل التجريبي يجب أن يبقى موسومًا حتى يستبدله محتوى حقيقي.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-white/8 bg-ink-950/90 py-3 backdrop-blur">
        <p className="text-[0.65rem] text-ink-500">
          {values?.id ? "التعديلات تُسجَّل في سجل العمليات." : "سيُنشأ العمل ثم تُنقل إلى صفحته لإضافة المواسم والتريلرات."}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/admin/titles" className="inline-flex h-9 items-center rounded-lg border border-white/12 px-3 text-xs text-ink-200 hover:border-white/25">
            إلغاء
          </Link>
          <SubmitButton>{values?.id ? "حفظ التعديلات" : "إنشاء العمل"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export { Trash2 };
