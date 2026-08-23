"use client";

import { FormEvent, useMemo, useState } from "react";
import { detectStoreFromUrl } from "@/utils/scraping/store-detector";

type View = "overview" | "products" | "stores" | "product" | "store";

function Icon({ name }: { name: "grid" | "box" | "store" | "bell" | "plus" | "arrow" | "search" | "check" | "external" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    box: <><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    store: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10c0 1.2 1 2 2.5 2S8 11.2 8 10c0 1.2 1 2 2.5 2s2.5-.8 2.5-2c0 1.2 1 2 2.5 2s2.5-.8 2.5-2c0 1.2 1 2 2.5 2s2.5-.8 2.5-2M9 20v-5h6v5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    external: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M19 14v5H5V5h5" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo() { return <div className="logo"><span className="logo-mark"><span /></span><span>price<span className="logo-accent">scout</span></span></div>; }

const navItems: { id: View; label: string; icon: "grid" | "box" | "store" }[] = [
  { id: "overview", label: "Visão geral", icon: "grid" },
  { id: "products", label: "Produtos cadastrados", icon: "box" },
  { id: "stores", label: "Lojas cadastradas", icon: "store" },
  { id: "product", label: "Adicionar produto", icon: "box" },
  { id: "store", label: "Adicionar site por link", icon: "store" },
];

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [notice, setNotice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  function submitProduct(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const detection = detectStoreFromUrl(productUrl); if (!detection) { setNotice("Informe um link de produto válido usando http:// ou https://."); return; } if (!detection.supported) { setNotice(`A loja ${detection.hostname} foi reconhecida, mas ainda não possui um scraper específico configurado.`); return; } setNotice(`Produto encaminhado para o scraper específico de ${detection.hostname}.`); setProductUrl(""); }
  function submitStore(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const detection = detectStoreFromUrl(storeUrl); if (!detection) { setNotice("Informe um link válido usando http:// ou https://."); return; } if (!detection.supported) { setNotice(`A loja ${detection.hostname} foi reconhecida, mas ainda não possui um scraper específico configurado.`); return; } setNotice(`Link da loja ${detection.hostname} encaminhado para o scraper específico.`); setStoreName(""); setStoreUrl(""); }
  function openView(nextView: View) { setView(nextView); setNotice(""); }
  return <main className="admin-shell">
    <aside className="sidebar"><div className="sidebar-top"><Logo /><span className="admin-badge">admin</span></div><nav className="main-nav" aria-label="Navegação principal"><p className="nav-label">Workspace</p>{navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => openView(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === "overview" && <span className="nav-arrow"><Icon name="arrow" /></span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot" /><div><strong>Dados conectados</strong><span>Aguardando fonte oficial</span></div></div><div className="sidebar-bottom"><div className="user-profile"><span className="avatar">--</span><span><strong>Conta administrativa</strong><small>Identidade não carregada</small></span></div></div></aside>
    <section className="content-shell"><header className="topbar"><div className="mobile-logo"><Logo /></div><div className="search-box"><Icon name="search" /><input aria-label="Buscar no PriceScout" placeholder="Buscar no catálogo" /></div><div className="topbar-actions"><button className="icon-action" aria-label="Notificações"><Icon name="bell" /></button><div className="topbar-divider" /><span className="environment">Ambiente não informado</span></div></header><div className="content">{view === "overview" ? <Overview openView={openView} /> : view === "products" ? <CatalogView kind="products" openView={openView} /> : view === "stores" ? <CatalogView kind="stores" openView={openView} /> : <FormView view={view} notice={notice} onSubmit={view === "product" ? submitProduct : submitStore} productUrl={productUrl} setProductUrl={setProductUrl} storeName={storeName} setStoreName={setStoreName} storeUrl={storeUrl} setStoreUrl={setStoreUrl} />}</div></section>
  </main>;
}

function Overview({ openView }: { openView: (view: View) => void }) {
  return <><div className="page-intro"><div><p className="eyebrow">Visão geral</p><h1>Seu catálogo começa aqui.</h1><p className="intro-copy">Ainda não há dados oficiais carregados. Adicione um produto ou um site por link para iniciar o catálogo.</p></div><button className="primary-button" onClick={() => openView("product")}><Icon name="plus" /> Adicionar produto</button></div><section className="empty-state"><span className="empty-icon"><Icon name="grid" /></span><h2>Nenhum dado disponível</h2><p>Os indicadores, alertas e atividades aparecerão aqui somente depois que registros reais forem cadastrados e confirmados.</p><div className="empty-actions"><button className="primary-button" onClick={() => openView("product")}><Icon name="plus" /> Adicionar produto</button><button className="outline-button" onClick={() => openView("store")}>Adicionar site por link <Icon name="arrow" /></button></div></section></>;
}

function CatalogView({ kind, openView }: { kind: "products" | "stores"; openView: (view: View) => void }) {
  const isProducts = kind === "products";
  return <div className="catalog-page"><div className="page-intro"><div><p className="eyebrow">Catálogo</p><h1>{isProducts ? "Produtos cadastrados." : "Lojas cadastradas."}</h1><p className="intro-copy">{isProducts ? "Consulte os produtos confirmados na fonte oficial do catálogo." : "Consulte as lojas e sites confirmados como fontes oficiais."}</p></div><button className="primary-button" onClick={() => openView(isProducts ? "product" : "store")}><Icon name="plus" /> {isProducts ? "Adicionar produto" : "Adicionar site por link"}</button></div><section className="empty-state"><span className="empty-icon"><Icon name={isProducts ? "box" : "store"} /></span><h2>Nenhum registro disponível</h2><p>{isProducts ? "Os produtos aparecerão aqui depois que forem cadastrados e aprovados." : "As lojas aparecerão aqui depois que um link for cadastrado e aprovado."}</p><button className="outline-button" onClick={() => openView(isProducts ? "product" : "store")}><Icon name="plus" /> {isProducts ? "Cadastrar produto" : "Adicionar site por link"}</button></section></div>;
}

function FormView({ view, notice, onSubmit, productUrl, setProductUrl, storeName, setStoreName, storeUrl, setStoreUrl }: { view: "product" | "store"; notice: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; productUrl: string; setProductUrl: (value: string) => void; storeName: string; setStoreName: (value: string) => void; storeUrl: string; setStoreUrl: (value: string) => void }) {
  const isProduct = view === "product";
  const detectedStore = useMemo(() => isProduct ? null : detectStoreFromUrl(storeUrl), [isProduct, storeUrl]);
  return <div className="form-page"><div className="breadcrumb"><button type="button" onClick={() => window.location.reload()}>Visão geral</button><span>/</span><span>{isProduct ? "Adicionar produto" : "Adicionar site por link"}</span></div><div className="form-layout"><div className="form-intro"><p className="eyebrow">Novo registro</p><h1>{isProduct ? "Adicione um produto." : "Adicione um site por link."}</h1><p>{isProduct ? "Cole o link do produto. A loja será reconhecida pelo domínio e a coleta seguirá para o scraper específico." : "Cole o link oficial do site para registrar uma nova fonte de preços."}</p><div className="form-rail"><span className="rail-line" /><span>{isProduct ? "01" : "02"}</span><span>{isProduct ? "Link e loja" : "Link da fonte"}</span></div></div><form className="data-form" onSubmit={onSubmit}><div className="form-card"><div className="form-card-heading"><span className="form-number">{isProduct ? "01" : "02"}</span><div><h2>{isProduct ? "Link do produto" : "Link do site"}</h2><p>{isProduct ? "O nome e a loja serão derivados da página oficial." : "O link será revisado antes de entrar no monitoramento."}</p></div></div>{isProduct ? <><label htmlFor="url">URL do produto<span className="required">Obrigatório</span></label><input id="url" type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="Cole o link oficial" required /><p className="helper">A loja será reconhecida pelo domínio do link e o scraper correspondente será selecionado.</p>{detectedStore && <div className={`detection-box ${detectedStore.supported ? "supported" : "unsupported"}`}><strong>Loja reconhecida</strong><span>{detectedStore.hostname}</span><small>{detectedStore.supported ? "Scraper específico disponível." : "Scraper específico ainda não configurado."}</small></div>}</> : <><label htmlFor="name">Nome da loja<span className="required">Obrigatório</span></label><input id="name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nome oficial da loja" required /><label htmlFor="url">Link do site<span className="required">Obrigatório</span></label><input id="url" type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="Cole o link oficial" required /><p className="helper">Use uma URL completa começando com https://.</p>{detectedStore && <div className={`detection-box ${detectedStore.supported ? "supported" : "unsupported"}`}><strong>Loja reconhecida</strong><span>{detectedStore.hostname}</span><small>{detectedStore.supported ? "Scraper específico disponível." : "Scraper específico ainda não configurado."}</small></div>}</>}</div><div className="form-footer"><span className="secure-note">Os dados entram em revisão antes de alterar o catálogo canônico.</span><button className="primary-button" type="submit"><Icon name="check" /> Encaminhar para scraper</button></div>{notice && <p className="success-notice" role="status"><Icon name="check" /> {notice}</p>}</form></div></div>;
}
