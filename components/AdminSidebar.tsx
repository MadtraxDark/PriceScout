"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const navigation = [
  { id: "overview", label: "Visão geral", href: "/admin", icon: "grid" },
  { id: "products", label: "Produtos cadastrados", href: "/admin?view=products", icon: "box" },
  { id: "favorites", label: "Favoritos", href: "/admin/favoritos", icon: "heart" },
  { id: "stores", label: "Lojas cadastradas", href: "/admin?view=stores", icon: "store" },
  { id: "product", label: "Adicionar produto", href: "/admin?view=product", icon: "plus" },
  { id: "changes", label: "Alterações", href: "/admin/catalogo/alteracoes", icon: "refresh" },
] as const;

function SidebarIcon({ name }: { name: (typeof navigation)[number]["icon"] | "arrow" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    box: <><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    store: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10c0 1.2 1 2 2.5 2S8 11.2 8 10c0 1.2 1 2 2.5 2s2.5-.8 2.5-2c0 1.2 1 2 2.5 2s2.5-.8 2.5-2c0 1.2 1 2 2.5 2s2.5-.8 2.5-2M9 20v-5h6v5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function PriceScoutLogo() {
  return <span className="logo"><span className="logo-mark"><span /></span><span>price<span className="logo-accent">scout</span></span></span>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view = requestedView === "products" || requestedView === "stores" || requestedView === "product"
    ? requestedView
    : "overview";

  function isActive(id: (typeof navigation)[number]["id"]) {
    if (pathname === "/admin/favoritos") return id === "favorites";
    if (pathname === "/admin/catalogo/alteracoes") return id === "changes";
    if (pathname.startsWith("/admin/produtos/")) return id === "products";
    return pathname === "/admin" && view === id;
  }

  return <aside className="sidebar" aria-label="Menu administrativo">
    <div className="sidebar-top"><Link href="/admin" aria-label="PriceScout, visão geral"><PriceScoutLogo /></Link><span className="admin-badge">admin</span></div>
    <nav className="main-nav" aria-label="Navegação principal">
      <p className="nav-label">Workspace</p>
      {navigation.map((item) => {
        const active = isActive(item.id);
        return <Link key={item.id} className={`nav-item${active ? " active" : ""}`} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label} title={item.label}>
          <SidebarIcon name={item.icon} /><span>{item.label}</span>{active && <span className="nav-arrow"><SidebarIcon name="arrow" /></span>}
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-note"><span className="live-dot" aria-hidden="true" /><div><strong>API conectada</strong><span>Operações centralizadas</span></div></div>
      <div className="user-profile"><span className="avatar" aria-hidden="true">--</span><span><strong>Conta administrativa</strong><small>Identidade não carregada</small></span></div>
    </div>
  </aside>;
}
