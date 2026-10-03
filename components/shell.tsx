"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Layers3,
  UserRound,
  ArrowUpRight,
  Sprout,
} from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    {
      href: "/",
      label: "Обучение",
      icon: BookOpen,
      active: pathname === "/" || pathname.startsWith("/lessons"),
    },
    {
      href: "/sections",
      label: "Разделы",
      icon: Layers3,
      active: pathname.startsWith("/sections"),
    },
    {
      href: "/profile",
      label: "Профиль",
      icon: UserRound,
      active: pathname === "/profile" || pathname === "/admin",
    },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Практика — главная">
          <span className="brand-icon">
            <Sprout size={23} />
          </span>
          практика<span className="brand-dot">.</span>
        </Link>
        <span className="topbar-note">Маленькие шаги. Большие открытия.</span>
        <Link href="/profile" className="avatar" aria-label="Открыть профиль">
          <UserRound size={20} />
        </Link>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <span className="nav-label">ВАШЕ ПРОСТРАНСТВО</span>
          <nav aria-label="Основная навигация">
            {links.map(({ href, label, icon: Icon, active }) => (
              <Link
                href={href}
                key={href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={21} />
                {label}
                {active && <span className="nav-dot" />}
              </Link>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="small-star">✳</span>
            <p>
              Знания становятся
              <br />
              вашими, когда вы
              <br />
              пробуете.
            </p>
            <Link href="/sections">
              Найти свой урок <ArrowUpRight size={16} />
            </Link>
          </div>
          <span className="sidebar-footer">Учитесь в своём ритме</span>
        </aside>
        <main id="main" className="main-content">
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {links.map(({ href, label, icon: Icon, active }) => (
          <Link
            href={href}
            key={href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
