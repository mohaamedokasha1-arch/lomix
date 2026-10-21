"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  ChevronLeft,
  Clapperboard,
  DatabaseBackup,
  Film,
  FolderTree,
  Import,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  Menu,
  MonitorPlay,
  Search,
  Settings,
  Shield,
  Tags,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABEL, cn } from "@/lib/utils";

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "نظرة عامة",
    items: [
      { href: "/admin", label: "لوحة المعلومات", Icon: LayoutDashboard },
      { href: "/admin/analytics", label: "التحليلات", Icon: BarChart3 },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { href: "/admin/titles", label: "الأعمال", Icon: Film },
      { href: "/admin/people", label: "الأشخاص", Icon: Users },
      { href: "/admin/genres", label: "التصنيفات", Icon: Tags },
      { href: "/admin/trailers", label: "التريلرات", Icon: Clapperboard },
      { href: "/admin/media", label: "مكتبة الوسائط", Icon: FolderTree },
    ],
  },
  {
    title: "الصفحة الرئيسية",
    items: [
      { href: "/admin/homepage", label: "الأقسام والترتيب", Icon: ListOrdered },
      { href: "/admin/curated", label: "قوائم الترند والمميزة", Icon: Bookmark },
    ],
  },
  {
    title: "الاستيراد والرسائل",
    items: [
      { href: "/admin/imports", label: "سجل الاستيراد", Icon: Import },
      { href: "/admin/messages", label: "الرسائل والطلبات", Icon: Mail },
    ],
  },
  {
    title: "النظام",
    items: [
      { href: "/admin/users", label: "المستخدمون والأدوار", Icon: Shield, adminOnly: true },
      { href: "/admin/settings", label: "إعدادات الموقع", Icon: Settings },
      { href: "/admin/seo", label: "SEO والفهرسة", Icon: Search, adminOnly: true },
      { href: "/admin/backup", label: "النسخ الاحتياطي", Icon: DatabaseBackup, adminOnly: true },
      { href: "/admin/audit", label: "سجل العمليات", Icon: MonitorPlay },
    ],
  },
];

export function AdminShell({
  user,
  children,
  pendingBadges,
}: {
  user: { name: string; email: string; role: "ADMIN" | "EDITOR" | "VIEWER" };
  children: React.ReactNode;
  pendingBadges?: { messages?: number; brokenTrailers?: number; failedImports?: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const badges: Record<string, number> = {
    "/admin/messages": pendingBadges?.messages ?? 0,
    "/admin/trailers": pendingBadges?.brokenTrailers ?? 0,
    "/admin/imports": pendingBadges?.failedImports ?? 0,
  };

  return (
    <div className="min-h-dvh bg-ink-950" dir="rtl">
      {/* شريط علوي */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-ink-950/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-200 hover:bg-white/5 lg:hidden"
              aria-label="فتح قائمة الإدارة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <LogoMark size={26} />
              <span className="text-sm font-semibold text-ink-100">لوميكس · الإدارة</span>
            </Link>
            <span className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[0.6rem] text-ink-400 sm:inline">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="hidden h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-ink-300 transition hover:bg-white/5 hover:text-ink-50 sm:flex"
            >
              عرض الموقع <ChevronLeft className="h-3 w-3" />
            </Link>
            <Link href="/profile" className="flex h-8 items-center gap-2 rounded-lg px-2 text-xs text-ink-200 hover:bg-white/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brass-400/15 text-[0.6rem] font-bold text-brass-200">
                {user.name.slice(0, 2)}
              </span>
              <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-signal-red/10 hover:text-signal-red"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        <aside className="fixed inset-y-0 start-0 top-14 z-30 hidden w-64 overflow-y-auto border-e border-white/8 bg-ink-900/60 p-3 lg:block">
          <SidebarContent groups={GROUPS} isActive={isActive} badges={badges} role={user.role} />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 start-0 w-[82%] max-w-xs overflow-y-auto border-e border-white/10 bg-ink-900 p-3">
              <div className="mb-3 flex items-center justify-between px-2 py-1">
                <span className="text-sm font-semibold text-ink-100">الإدارة</span>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-300 hover:bg-white/5" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent groups={GROUPS} isActive={isActive} badges={badges} role={user.role} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ms-64 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  isActive,
  badges,
  role,
}: {
  groups: NavGroup[];
  isActive: (href: string) => boolean;
  badges: Record<string, number>;
  role: string;
}) {
  return (
    <nav aria-label="أقسام لوحة التحكم" className="space-y-5 pb-8">
      {groups.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || role === "ADMIN");
        if (!items.length) return null;
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-2.5 text-[0.6rem] font-semibold tracking-[0.18em] text-ink-600">{group.title}</p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                const badge = badges[item.href];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] transition",
                        active
                          ? "bg-brass-400/12 font-medium text-brass-200"
                          : "text-ink-300 hover:bg-white/[0.04] hover:text-ink-100",
                      )}
                    >
                      <item.Icon className={cn("h-4 w-4 shrink-0", active ? "text-brass-300" : "text-ink-500")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge ? (
                        <span className="num rounded-full bg-signal-red/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-signal-red">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
