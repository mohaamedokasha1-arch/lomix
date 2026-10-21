"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SearchDialog } from "@/components/site/search-dialog";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABEL, cn } from "@/lib/utils";

type SessionUser = { id: string; name: string; email: string; role: "ADMIN" | "EDITOR" | "VIEWER" };

export type HeaderNavItem = { href: string; label: string };

const DISCOVER = [
  { href: "/latest", label: "أحدث الإضافات", hint: "ما وصل حديثًا" },
  { href: "/trending", label: "الرائج الآن", hint: "اختيار المحررين" },
  { href: "/top-rated", label: "الأعلى تقييمًا", hint: "حسب التقييم المسجّل" },
  { href: "/most-viewed", label: "الأكثر مشاهدة", hint: "من عدّاد مشاهدات فعلي" },
];

export function SiteHeader({ user, nav }: { user: SessionUser | null; nav: HeaderNavItem[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const discoverRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(mobileOpen, mobileDialogRef);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDiscoverOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (discoverRef.current && !discoverRef.current.contains(event.target as Node)) setDiscoverOpen(false);
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const isDiscoverActive = DISCOVER.some((item) => isActive(item.href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || !isHome
            ? "border-b border-white/8 bg-ink-950/88 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-ink-950/85 via-ink-950/35 to-transparent",
        )}
      >
        <div className="container-page">
          <div className={cn("flex items-center justify-between gap-4 transition-all", scrolled ? "h-16" : "h-[4.5rem] md:h-20")}>
            <Link href="/" aria-label="لوميكس فيلم — الصفحة الرئيسية" className="shrink-0">
              <Logo size={scrolled ? 28 : 32} uid="header" />
            </Link>

            <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 lg:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(item.href) ? "text-ink-50" : "text-ink-200 hover:text-ink-50",
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-ember-400" />
                  )}
                </Link>
              ))}

              <div className="relative" ref={discoverRef}>
                <button
                  type="button"
                  onClick={() => setDiscoverOpen((v) => !v)}
                  aria-expanded={discoverOpen}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isDiscoverActive ? "text-ink-50" : "text-ink-200 hover:text-ink-50",
                  )}
                >
                  اكتشف
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", discoverOpen && "rotate-180")} />
                </button>
                {discoverOpen && (
                  <div className="absolute start-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-ink-850/97 p-1.5 shadow-2xl backdrop-blur-xl rise">
                    {DISCOVER.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col rounded-lg px-3 py-2.5 transition hover:bg-white/[0.06]"
                      >
                        <span className="text-sm font-medium text-ink-50">{item.label}</span>
                        <span className="mt-0.5 text-[0.7rem] text-ink-400">{item.hint}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-ink-300 transition hover:border-white/20 hover:text-ink-50 md:w-56 md:justify-between"
                aria-label="فتح البحث"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden text-xs md:inline">ابحث…</span>
                </span>
                <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[0.6rem] text-ink-400 md:inline">⌘K</kbd>
              </button>

              {user ? (
                <>
                  <Link
                    href="/watchlist"
                    className="hidden h-10 w-10 items-center justify-center rounded-xl text-ink-200 transition hover:bg-white/[0.06] hover:text-ink-50 sm:flex"
                    aria-label="قائمة المشاهدة"
                  >
                    <Bookmark className="h-[18px] w-[18px]" />
                  </Link>
                  <div className="relative" ref={accountRef}>
                    <button
                      type="button"
                      onClick={() => setAccountOpen((v) => !v)}
                      aria-expanded={accountOpen}
                      aria-haspopup="true"
                      className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] ps-1 pe-2.5 transition hover:border-white/20"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-400/15 text-xs font-bold text-ember-200">
                        {user.name.trim().slice(0, 2)}
                      </span>
                      <span className="hidden max-w-24 truncate text-xs font-medium text-ink-100 sm:inline">
                        {user.name}
                      </span>
                      <ChevronDown className="hidden h-3.5 w-3.5 text-ink-400 sm:inline" />
                    </button>
                    {accountOpen && (
                      <div className="absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-ink-850/97 p-1.5 shadow-2xl backdrop-blur-xl rise">
                        <div className="border-b border-white/8 px-3 py-2.5">
                          <p className="truncate text-sm font-semibold text-ink-50">{user.name}</p>
                          <p className="mt-0.5 truncate text-[0.7rem] text-ink-400">{user.email}</p>
                          <span className="mt-1.5 inline-block rounded border border-white/10 px-1.5 py-0.5 text-[0.65rem] text-ink-300">
                            {ROLE_LABEL[user.role]}
                          </span>
                        </div>
                        {user.role !== "VIEWER" && (
                          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-white/[0.06]">
                            <LayoutDashboard className="h-4 w-4" /> لوحة التحكم
                          </Link>
                        )}
                        <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-white/[0.06]">
                          <UserIcon className="h-4 w-4" /> الملف الشخصي
                        </Link>
                        <Link href="/watchlist" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-white/[0.06]">
                          <Bookmark className="h-4 w-4" /> قائمة المشاهدة
                        </Link>
                        <form action={logoutAction}>
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-signal-red/90 transition hover:bg-signal-red/10"
                          >
                            <LogOut className="h-4 w-4" /> تسجيل الخروج
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-xl bg-ember-400 px-4 text-sm font-semibold text-[#171006] transition hover:bg-ember-300 sm:flex"
                >
                  دخول
                </Link>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-100 transition hover:bg-white/[0.06] lg:hidden"
                aria-label="فتح القائمة"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* قائمة الهاتف */}
      <div
        className={cn(
          "fixed inset-0 z-[90] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <div
          className={cn("absolute inset-0 bg-ink-950/75 backdrop-blur-sm transition-opacity duration-300", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMobileOpen(false)}
        />
        <div
          ref={mobileDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقل"
          className={cn(
            "absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col border-s border-white/10 bg-ink-900 transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <Logo size={28} uid="header-mobile" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-ink-300 hover:bg-white/5 hover:text-ink-50"
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav aria-label="التنقل في الهاتف" className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-[0.95rem] font-medium transition",
                    isActive(item.href) ? "bg-ember-400/12 text-ember-200" : "text-ink-100 hover:bg-white/[0.05]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="mt-6 mb-2 px-3 text-[0.65rem] font-semibold tracking-[0.2em] text-ink-500">اكتشف</p>
            <nav className="space-y-1" aria-label="روابط الاكتشاف">
              {DISCOVER.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-ink-200 transition hover:bg-white/[0.05] hover:text-ink-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t border-white/8 p-4">
            {user ? (
              <div className="space-y-2">
                <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 hover:bg-white/[0.05]">
                  <UserIcon className="h-4 w-4" /> {user.name}
                </Link>
                {user.role !== "VIEWER" && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ember-200 hover:bg-white/[0.05]">
                    <LayoutDashboard className="h-4 w-4" /> لوحة التحكم
                  </Link>
                )}
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-signal-red/90 hover:bg-signal-red/10">
                    <LogOut className="h-4 w-4" /> تسجيل الخروج
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="flex h-10 items-center justify-center rounded-xl border border-white/15 text-sm text-ink-100">
                  دخول
                </Link>
                <Link href="/register" className="flex h-10 items-center justify-center rounded-xl bg-ember-400 text-sm font-semibold text-[#171006]">
                  حساب جديد
                </Link>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-[0.65rem] text-ink-500">
              <LogoMark size={16} uid="header-compact" />
              <span>لوميكس فيلم — دليل الاكتشاف السينمائي</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
