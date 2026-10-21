import Image from "next/image";
import Link from "next/link";
import { initials } from "@/lib/utils";
import type { TitleDetail } from "@/lib/queries";

const ROLE_LABEL: Record<string, string> = {
  DIRECTOR: "إخراج",
  WRITER: "كتابة",
  COMPOSER: "موسيقى",
  ACTOR: "تمثيل",
};

export function CastGrid({ cast }: { cast: TitleDetail["cast"] }) {
  if (!cast.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cast.map((person) => (
        <Link
          key={person.personId}
          href={`/person/${person.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-white/8 bg-ink-900/50 p-3 transition hover:border-brass-400/30 hover:bg-ink-850"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 text-[0.72rem] font-bold text-ink-200">
            {person.imagePath ? (
              <Image src={person.imagePath} alt="" fill sizes="44px" className="object-cover" />
            ) : (
              initials(person.nameAr)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.82rem] font-medium text-ink-100 group-hover:text-brass-200">
              {person.nameAr}
            </span>
            <span className="mt-0.5 block truncate text-[0.68rem] text-ink-500">
              {person.characterName ? `بدور ${person.characterName}` : ROLE_LABEL[person.role] ?? person.role}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function CrewList({ crew }: { crew: TitleDetail["crew"] }) {
  if (!crew.length) return null;
  return (
    <ul className="space-y-2.5">
      {crew.map((person) => (
        <li key={`${person.personId}-${person.role}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[0.72rem] text-ink-500">{ROLE_LABEL[person.role] ?? person.role}</span>
          <Link href={`/person/${person.slug}`} className="text-ink-100 transition hover:text-brass-200">
            {person.nameAr}
          </Link>
        </li>
      ))}
    </ul>
  );
}
