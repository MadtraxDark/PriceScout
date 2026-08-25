"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import ShinyText from "@/components/ShinyText";
import ImageViewer, { ImageWithState } from "@/components/ImageViewer";
import { catalogApi } from "@/utils/api/services";
import { resolveAssetUrl } from "@/utils/api/client";
import type { BrandAssetRecord, CatalogProduct, CatalogStore, EntityAssets, EntityAssetsPayload, ProductPreview } from "@/utils/api/contracts";

type View = "overview" | "products" | "stores" | "product" | "store";
type ScrapeStatus = "idle" | "loading" | "ready" | "error";
type ImportStepStatus = "pending" | "active" | "completed" | "error";
type ImportStep = { id: string; label: string; status: ImportStepStatus };
const scrapeProgressMessages = [
  "Acessando página do produto...",
  "Identificando produto...",
  "Coletando preços e condições...",
  "Verificando estoque e disponibilidade...",
  "Buscando marca e vendedor...",
  "Carregando imagens do produto...",
  "Preparando preview...",
];

const importStepDefinitions = [
  { id: "request", label: "Enviando a prévia aprovada..." },
  { id: "processing", label: "Aguardando o processamento da API..." },
  { id: "refresh", label: "Atualizando o catálogo..." },
] as const;

function initialImportSteps(): ImportStep[] {
  return importStepDefinitions.map((step) => ({ ...step, status: "pending" }));
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function Icon({ name }: { name: "grid" | "box" | "store" | "bell" | "plus" | "arrow" | "search" | "check" | "external" | "refresh" | "chevron-left" | "chevron-right" | "chevron-down" | "close" }) {
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
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo() { return <div className="logo"><span className="logo-mark"><span /></span><span>price<span className="logo-accent">scout</span></span></div>; }

function MediaImage({ src, alt, className = "", fallback = "Imagem indisponível" }: { src: string; alt: string; className?: string; fallback?: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  return <span className={`media-image ${className} ${status}`} aria-busy={status === "loading"}>
    {status === "loading" && <span className="media-skeleton" aria-hidden="true" />}
    {status === "error" ? <span className="media-error"><Icon name="box" /><span>{fallback}</span></span> : <img src={src} alt={alt} onLoad={() => setStatus("loaded")} onError={() => setStatus("error")} />}
  </span>;
}

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
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [scrapedProduct, setScrapedProduct] = useState<ProductPreview | null>(null);
  const [scrapeError, setScrapeError] = useState("");
  const [approvedPreview, setApprovedPreview] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [reviewedUrl, setReviewedUrl] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogStores, setCatalogStores] = useState<CatalogStore[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSteps, setImportSteps] = useState<ImportStep[]>(initialImportSteps);
  const [importError, setImportError] = useState("");
  const importPanelRef = useRef<HTMLDivElement | null>(null);
  const importSuccessRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!importing || !importPanelRef.current) return;
    gsap.fromTo(importPanelRef.current, { opacity: 0.72, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
  }, [importing, importSteps]);

  useEffect(() => {
    const markImage = (image: HTMLImageElement, state: "loaded" | "error") => {
      image.classList.remove("image-loaded", "image-error");
      image.classList.add(`image-${state}`);
    };
    const handleImageLoad = (event: Event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement) markImage(image, "loaded");
    };
    const handleImageError = (event: Event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement) markImage(image, "error");
    };
    const scanCompleteImages = () => document.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      if (image.complete) markImage(image, image.naturalWidth > 0 ? "loaded" : "error");
    });
    const observer = new MutationObserver(scanCompleteImages);
    scanCompleteImages();
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("load", handleImageLoad, true);
    document.addEventListener("error", handleImageError, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("load", handleImageLoad, true);
      document.removeEventListener("error", handleImageError, true);
    };
  }, [catalogProducts, scrapedProduct]);

  useEffect(() => {
    if (!scrapedProduct || !previewRef.current) {
      setPreviewVisible(false);
      return;
    }
    const previewElement = previewRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      setPreviewVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2);
    }, { threshold: [0, 0.2, 1] });
    observer.observe(previewElement);
    return () => observer.disconnect();
  }, [scrapedProduct]);

  useEffect(() => {
    void Promise.all([catalogApi.listProducts(), catalogApi.listStores()]).then(([productsResult, storesResult]) => {
      setCatalogProducts(productsResult.products ?? []);
      setCatalogStores(storesResult.stores ?? []);
      setCatalogError("");
    }).catch(() => setCatalogError("Não foi possível carregar os registros do catálogo.")).finally(() => setCatalogLoading(false));
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view");
    if (requestedView === "overview" || requestedView === "products" || requestedView === "stores" || requestedView === "product" || requestedView === "store") {
      window.setTimeout(() => setView(requestedView), 0);
    }
  }, []);

  async function reloadCatalog(): Promise<boolean> {
    try {
      const [productsResult, storesResult] = await Promise.all([catalogApi.listProducts(), catalogApi.listStores()]);
      setCatalogProducts(productsResult.products ?? []);
      setCatalogStores(storesResult.stores ?? []);
      setCatalogError("");
      return true;
    } catch {
      setCatalogError("Não foi possível atualizar os registros do catálogo.");
      return false;
    }
  }

  function revealPreview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parseHttpUrl(productUrl)) { setScrapeStatus("error"); setScrapeError("Informe um link de produto válido usando http:// ou https://."); return; }
    setScrapeStatus("loading"); setScrapeError(""); setNotice(""); setScrapedProduct(null); setApprovedPreview(false); setProgressIndex(0);
    let currentProgressIndex = 0;
    const progressTimer = window.setInterval(() => {
      currentProgressIndex = (currentProgressIndex + 1) % scrapeProgressMessages.length;
      setProgressIndex(currentProgressIndex);
    }, 1200);
    try {
      const result = await catalogApi.previewProduct(productUrl);
      if (!result.product) throw new Error("A API não retornou a prévia do produto.");
      setProgressIndex(scrapeProgressMessages.length - 1);
      setScrapedProduct(result.product); setReviewedUrl(productUrl); setScrapeStatus("ready");
      window.setTimeout(revealPreview, 80);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível coletar os dados do produto.";
      setScrapeStatus("error"); setScrapeError(`Falha na etapa “${scrapeProgressMessages[currentProgressIndex]}” ${message}`);
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  async function approvePreview() {
    if (!scrapedProduct || importing || approvedPreview) return;
    setImporting(true);
    setImportError("");
    setNotice("");
    setImportSteps(initialImportSteps());
    const setStep = (id: string, status: ImportStepStatus) => setImportSteps((steps) => steps.map((step) => step.id === id ? { ...step, status } : step));
    const completeStep = (id: string) => { setStep(id, "completed"); };
    let currentStepId = "request";
    try {
      currentStepId = "request";
      setStep(currentStepId, "active");
      completeStep("request");
      currentStepId = "processing";
      setStep(currentStepId, "active");
      const result = await catalogApi.importProduct(scrapedProduct);
      completeStep("processing");
      currentStepId = "refresh";
      setStep(currentStepId, "active");
      if (!await reloadCatalog()) throw new Error("As tabelas do catálogo não confirmaram a atualização.");
      completeStep("refresh");
      setApprovedPreview(true);
      setNotice(result.message || "Produto importado e confirmado pela API.");
      window.setTimeout(() => {
        setImporting(false);
        if (importSuccessRef.current) gsap.fromTo(importSuccessRef.current, { opacity: 0, y: 8, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" });
      }, 420);
      window.setTimeout(() => {
        setProductUrl("");
        setScrapedProduct(null);
        setScrapeStatus("idle");
        setScrapeError("");
        setApprovedPreview(false);
        setReviewedUrl("");
        setNotice("");
        setImportError("");
        setImportSteps(initialImportSteps());
        setProgressIndex(0);
        setPreviewVisible(false);
      }, 2100);
    } catch (error) {
      setStep(currentStepId, "error");
      const message = error instanceof Error ? error.message : "Não foi possível concluir a importação.";
      setImportError(message);
      setNotice("A importação foi interrompida. Os dados da prévia foram preservados para nova tentativa.");
      setImporting(false);
    }
  }

  function changeProductUrl(value: string) {
    setProductUrl(value);
    if (scrapedProduct && !discardPrompt && value !== reviewedUrl) setDiscardPrompt(true);
  }

  function keepPreviousProduct() {
    setProductUrl(reviewedUrl);
    setDiscardPrompt(false);
  }

  function discardPreviousProduct() {
    setScrapedProduct(null);
    setApprovedPreview(false);
    setReviewedUrl("");
    setDiscardPrompt(false);
    setScrapeStatus("idle");
    setProgressIndex(0);
    setPreviewVisible(false);
    setNotice("");
  }

  async function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedUrl = parseHttpUrl(storeUrl);
    if (!parsedUrl) { setNotice("Informe um link válido usando http:// ou https://."); return; }
    try {
      await catalogApi.createStore({ name: storeName, url: storeUrl });
      await reloadCatalog();
      setNotice(`A loja ${parsedUrl.hostname} foi cadastrada no catálogo.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a loja.");
    }
  }

  function openView(nextView: View) { setView(nextView); setNotice(""); setScrapeError(""); }

  return <main className="admin-shell">
    <aside className="sidebar"><div className="sidebar-top"><Logo /><span className="admin-badge">admin</span></div><nav className="main-nav" aria-label="Navegação principal"><p className="nav-label">Workspace</p>{navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => openView(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === "overview" && <span className="nav-arrow"><Icon name="arrow" /></span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot" /><div><strong>API conectada</strong><span>Operações centralizadas</span></div></div><div className="sidebar-bottom"><div className="user-profile"><span className="avatar">--</span><span><strong>Conta administrativa</strong><small>Identidade não carregada</small></span></div></div></aside>
    <section className="content-shell"><header className="topbar"><div className="mobile-logo"><Logo /></div><div className="search-box"><Icon name="search" /><input aria-label="Buscar no PriceScout" placeholder="Buscar no catálogo" /></div><div className="topbar-actions"><button className="icon-action" aria-label="Notificações"><Icon name="bell" /></button><div className="topbar-divider" /><span className="environment">API externa</span></div></header><div className="content">{catalogError && <p className="error-notice" role="status">{catalogError}</p>}{view === "overview" ? <Overview openView={openView} /> : view === "products" ? <CatalogView kind="products" openView={openView} products={catalogProducts} stores={catalogStores} loading={catalogLoading} /> : view === "stores" ? <CatalogView kind="stores" openView={openView} products={catalogProducts} stores={catalogStores} loading={catalogLoading} /> : <FormView view={view} notice={notice} onSubmit={view === "product" ? submitProduct : submitStore} productUrl={productUrl} onProductUrlChange={changeProductUrl} storeName={storeName} setStoreName={setStoreName} storeUrl={storeUrl} setStoreUrl={setStoreUrl} scrapeStatus={scrapeStatus} scrapedProduct={scrapedProduct} scrapeError={scrapeError} approvedPreview={approvedPreview} onApprove={approvePreview} progressMessage={scrapeProgressMessages[progressIndex]} previewVisible={previewVisible} onRevealPreview={revealPreview} previewRef={previewRef} importing={importing} importSteps={importSteps} importError={importError} importPanelRef={importPanelRef} importSuccessRef={importSuccessRef} />}</div>{discardPrompt && scrapedProduct && <DiscardDialog product={scrapedProduct} onKeep={keepPreviousProduct} onDiscard={discardPreviousProduct} />}</section>
  </main>;
}

function Overview({ openView }: { openView: (view: View) => void }) {
  return <><div className="page-intro"><div><p className="eyebrow">Visão geral</p><h1>Seu catálogo começa aqui.</h1><p className="intro-copy">Cole um link de produto, confira a coleta real e aprove a prévia antes de qualquer entrada no catálogo.</p></div><button className="primary-button" onClick={() => openView("product")}><Icon name="plus" /> Adicionar produto</button></div><section className="empty-state"><span className="empty-icon"><Icon name="grid" /></span><h2>Nenhum dado disponível</h2><p>Os indicadores, alertas e atividades aparecerão aqui somente depois que registros reais forem cadastrados e confirmados.</p><div className="empty-actions"><button className="primary-button" onClick={() => openView("product")}><Icon name="plus" /> Adicionar produto</button><button className="outline-button" onClick={() => openView("store")}>Adicionar site por link <Icon name="arrow" /></button></div></section></>;
}

function money(value: number | null) {
  return value === null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function CatalogView({ kind, openView, products, stores, loading }: { kind: "products" | "stores"; openView: (view: View) => void; products: CatalogProduct[]; stores: CatalogStore[]; loading: boolean }) {
  const isProducts = kind === "products";
  const rows = isProducts ? products : stores;
  return <div className="catalog-page"><div className="page-intro"><div><p className="eyebrow">Catálogo</p><h1>{isProducts ? "Produtos cadastrados." : "Lojas cadastradas."}</h1><p className="intro-copy">{isProducts ? "Identifique rapidamente cada produto pela imagem e pelo nome." : "Consulte as lojas e sites confirmados como fontes oficiais."}</p></div><button className="primary-button" onClick={() => openView(isProducts ? "product" : "store")}><Icon name="plus" /> {isProducts ? "Adicionar produto" : "Adicionar site por link"}</button></div>{loading ? <section className="empty-state"><h2>Carregando registros...</h2></section> : rows.length === 0 ? <section className="empty-state"><span className="empty-icon"><Icon name={isProducts ? "box" : "store"} /></span><h2>Nenhum registro disponível</h2><p>{isProducts ? "Os produtos aparecerão aqui depois que forem cadastrados e aprovados." : "As lojas aparecerão aqui depois que forem cadastradas e aprovadas."}</p><button className="outline-button" onClick={() => openView(isProducts ? "product" : "store")}><Icon name="plus" /> {isProducts ? "Cadastrar produto" : "Adicionar site por link"}</button></section> : isProducts ? <section className="catalog-grid" aria-label="Produtos cadastrados">{products.map((product) => <article className="catalog-card" key={product.id}><Link className="catalog-card-manage" href={`/admin/produtos/${product.id}`} aria-label={`Gerenciar ${product.name}`}><div className="catalog-card-media">{product.image_url ? <MediaImage key={product.image_url} src={product.image_url} alt="" className="catalog-media-image" /> : <span className="catalog-card-media-empty"><Icon name="box" /><span>Imagem não disponível</span></span>}</div><div className="catalog-card-body"><h2>{product.name}</h2><span className="catalog-card-link">Gerenciar produto <Icon name="arrow" /></span></div></Link><a className="catalog-card-source" href={product.product_url} target="_blank" rel="noreferrer">Abrir origem <Icon name="external" /></a></article>)}</section> : <section className="catalog-list">{stores.map((store) => <article className="catalog-row" key={store.id}><div className="catalog-row-icon"><Icon name="store" /></div><div className="catalog-row-main"><strong>{store.name}</strong><span>{store.hostname}</span></div><div className="catalog-row-meta"><b>{store.productCount} {store.productCount === 1 ? "produto" : "produtos"}</b><span>{store.url}</span></div><a className="catalog-row-link" href={store.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${store.name}`}><Icon name="external" /></a></article>)}</section>}</div>;
}

function FormView({ view, notice, onSubmit, productUrl, onProductUrlChange, storeName, setStoreName, storeUrl, setStoreUrl, scrapeStatus, scrapedProduct, scrapeError, approvedPreview, onApprove, progressMessage, previewVisible, onRevealPreview, previewRef, importing, importSteps, importError, importPanelRef, importSuccessRef }: { view: "product" | "store"; notice: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; productUrl: string; onProductUrlChange: (value: string) => void; storeName: string; setStoreName: (value: string) => void; storeUrl: string; setStoreUrl: (value: string) => void; scrapeStatus: ScrapeStatus; scrapedProduct: ProductPreview | null; scrapeError: string; approvedPreview: boolean; onApprove: () => void; progressMessage: string; previewVisible: boolean; onRevealPreview: () => void; previewRef: RefObject<HTMLElement | null>; importing: boolean; importSteps: ImportStep[]; importError: string; importPanelRef: RefObject<HTMLDivElement | null>; importSuccessRef: RefObject<HTMLDivElement | null> }) {
  const isProduct = view === "product";
  const detectedUrl = useMemo(() => parseHttpUrl(isProduct ? productUrl : storeUrl), [isProduct, productUrl, storeUrl]);
  const productFields = <>
    <label htmlFor="product-url">URL do produto<span className="required">Obrigatório</span></label>
    <input id="product-url" type="url" value={productUrl} onChange={(e) => onProductUrlChange(e.target.value)} placeholder="Cole o link oficial do produto" required />
    <p className="helper">A API identifica a loja e coleta os dados a partir do domínio informado.</p>
    {detectedUrl && <div className="detection-box supported"><strong>Endereço válido</strong><span>{detectedUrl.hostname}</span><small>A compatibilidade da fonte será validada pela API.</small></div>}
  </>;
  const storeFields = <>
    <label htmlFor="store-name">Nome da loja<span className="required">Obrigatório</span></label>
    <input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nome oficial da loja" required />
    <label htmlFor="store-url">Link do site<span className="required">Obrigatório</span></label>
    <input id="store-url" type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="Cole o link oficial" required />
    <p className="helper">Use uma URL completa começando com https://.</p>
  </>;
  return <div className="form-page">
    <div className="breadcrumb"><span>Visão geral</span><span>/</span><span>{isProduct ? "Adicionar produto" : "Adicionar site por link"}</span></div>
    <div className="form-layout">
      <div className="form-intro"><p className="eyebrow">Novo registro</p><h1>{isProduct ? "Cole o link. Revise o produto." : "Adicione um site por link."}</h1><p>{isProduct ? "A API consulta a página oficial e prepara uma prévia para sua aprovação." : "Cole o link oficial do site para registrar uma nova fonte de preços."}</p><div className="form-rail"><span className="rail-line" /><span>{isProduct ? "01" : "02"}</span><span>{isProduct ? "Coletar e revisar" : "Link da fonte"}</span></div></div>
      <form className="data-form" onSubmit={onSubmit}>
        <div className="form-card"><div className="form-card-heading"><span className="form-number">{isProduct ? "01" : "02"}</span><div><h2>{isProduct ? "Link do produto" : "Link do site"}</h2><p>{isProduct ? "O nome vem da página, nunca de um texto digitado manualmente." : "O link será revisado antes de entrar no monitoramento."}</p></div></div>{isProduct ? productFields : storeFields}</div>
        {isProduct && scrapeStatus === "loading" && <div className="scrape-progress" role="status" aria-live="polite"><span className="progress-pulse" /><ShinyText text={progressMessage} speed={2} delay={0} color="#728589" shineColor="#ffffff" spread={120} direction="left" yoyo={false} pauseOnHover={false} disabled={false} /></div>}
        <div className="form-footer"><span className="secure-note">A prévia não altera o catálogo canônico antes da sua aprovação.</span><button className="primary-button" type={isProduct && scrapeStatus === "ready" ? "button" : "submit"} onClick={isProduct && scrapeStatus === "ready" ? onRevealPreview : undefined} disabled={isProduct && scrapeStatus === "loading"}><Icon name={isProduct && scrapeStatus === "loading" ? "refresh" : isProduct && scrapeStatus === "ready" && previewVisible ? "chevron-down" : "arrow"} /> {isProduct && scrapeStatus === "loading" ? "Buscando produto" : isProduct && scrapeStatus === "ready" && previewVisible ? "Prévia exibida abaixo" : isProduct && scrapeStatus === "ready" ? "Ver prévia" : isProduct && scrapeStatus === "error" ? "Tentar novamente" : isProduct ? "Buscar produto" : "Enviar para revisão"}</button></div>
        {scrapeError && <p className="error-notice" role="alert">{scrapeError}</p>}
        {notice && <p className="success-notice" role="status"><Icon name={approvedPreview ? "check" : "refresh"} /> {notice}</p>}
      </form>
    </div>
    {scrapedProduct && <><SpecialStatusSummary product={scrapedProduct} />{(importing || approvedPreview || importError) && <ImportProgress steps={importSteps} importing={importing} error={importError} panelRef={importPanelRef} successRef={importSuccessRef} />}<ReviewPreview product={scrapedProduct} approved={approvedPreview} onApprove={onApprove} previewRef={previewRef} importing={importing} /></>}
  </div>;
}

function ImportProgress({ steps, importing, error, panelRef, successRef }: { steps: ImportStep[]; importing: boolean; error: string; panelRef: RefObject<HTMLDivElement | null>; successRef: RefObject<HTMLDivElement | null> }) {
  const failedStep = steps.find((step) => step.status === "error");
  const activeStep = steps.find((step) => step.status === "active");
  const completed = steps.every((step) => step.status === "completed");
  return <section className={`import-progress-panel ${error ? "has-error" : completed ? "is-success" : ""}`} ref={panelRef} aria-live="polite"><div className="import-progress-heading"><div><p className="eyebrow">Importação do produto</p><h2>{error ? "A importação foi interrompida" : completed ? "Produto importado com sucesso" : "Importando produto..."}</h2><p>{error ? `Falha em: ${failedStep?.label || "etapa não identificada"}` : activeStep ? "A API está processando esta etapa." : "Todas as etapas foram confirmadas pela API."}</p></div><span className="import-progress-counter">{steps.filter((step) => step.status === "completed").length}/{steps.length}</span></div><div className="import-steps">{steps.map((step) => <div className={`import-step ${step.status}`} key={step.id}><span className="import-step-mark">{step.status === "completed" ? <Icon name="check" /> : step.status === "error" ? <Icon name="close" /> : step.status === "active" ? <span className="import-step-pulse" /> : <span />}</span><span className="import-step-label">{step.status === "active" ? <ShinyText text={step.label} speed={2} delay={0} color="#728589" shineColor="#ffffff" spread={120} direction="left" yoyo={false} pauseOnHover={false} disabled={false} /> : step.label.replace("...", "")}</span></div>)}</div>{completed && <div className="import-success" ref={successRef} role="status"><Icon name="check" /><strong>Produto importado com sucesso</strong></div>}{error && <p className="error-notice import-error" role="alert">{error} Os dados da prévia foram preservados; corrija a configuração e tente novamente.</p>}</section>;
}

function SpecialStatusSummary({ product }: { product: ProductPreview }) {
  if (!product.special_status && !product.shipping_from) return null;
  return <section className="special-status-summary" aria-label="Condição especial do produto"><div className="special-status-heading"><span>Condição especial</span><strong>{product.special_status || "Informação de envio"}</strong></div>{product.shipping_from && <div className="special-status-date"><span>Envio a partir de</span><strong>{product.shipping_from}</strong></div>}</section>;
}

function DiscardDialog({ product, onKeep, onDiscard }: { product: ProductPreview; onKeep: () => void; onDiscard: () => void }) {
  return <div className="discard-backdrop" role="presentation"><section className="discard-dialog" role="dialog" aria-modal="true" aria-labelledby="discard-title"><span className="discard-mark"><Icon name="refresh" /></span><p className="eyebrow">Prévia em revisão</p><h2 id="discard-title">Descartar o produto anterior?</h2><p>Você começou a informar outro link. A prévia de <strong>{product.name || "produto atual"}</strong> será removida desta sessão se continuar.</p><div className="discard-actions"><button className="outline-button" onClick={onKeep}>Manter produto</button><button className="primary-button" onClick={onDiscard}>Descartar prévia</button></div></section></div>;
}

function formatStoreName(source?: string | null, urlStr?: string): string {
  if (source) {
    const s = source.toLowerCase();
    if (s === "magazine_luiza" || s === "magazineluiza") return "Magazine Luiza";
    if (s === "kabum") return "KaBuM!";
    if (s === "mercadolivre" || s === "mercado_livre") return "Mercado Livre";
    if (s === "amazon") return "Amazon Brasil";
    if (s !== "generic" && s !== "desconhecido") {
      return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  if (urlStr) {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, "");
    } catch {}
  }
  return "Loja oficial";
}

type IdentityMode = "wide" | "compact";

function readAssetValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;
  const record = value as BrandAssetRecord;
  if (record.available === false || typeof record.asset_url !== "string" || !record.asset_url.trim()) return null;
  return record.asset_url.trim();
}

function normalizeEntityAssets(payload: EntityAssetsPayload | null | undefined, scope?: "brand" | "store"): EntityAssets | null {
  if (!payload || typeof payload !== "object") return null;
  const source = scope && scope in payload
    ? (payload as Record<string, unknown>)[scope]
    : payload;
  if (!source || typeof source !== "object") return null;
  const scoped = source as Record<string, unknown>;
  const assetMap = scoped.assets && typeof scoped.assets === "object"
    ? scoped.assets as Record<string, unknown>
    : scoped;
  return {
    logo: readAssetValue(assetMap.logo),
    symbol: readAssetValue(assetMap.symbol),
    icon: readAssetValue(assetMap.icon),
    alt: typeof scoped.brand === "string" ? scoped.brand : typeof assetMap.alt === "string" ? assetMap.alt : null,
  };
}

function EntityIdentity({ name, assets, mode, className = "" }: { name: string; assets?: EntityAssetsPayload | null; mode: IdentityMode; className?: string }) {
  const [failedAsset, setFailedAsset] = useState<string | null>(null);
  const normalizedAssets = normalizeEntityAssets(assets);
  const candidates = mode === "wide"
    ? [{ src: normalizedAssets?.logo, kind: "logo" }, { src: normalizedAssets?.symbol, kind: "symbol" }, { src: normalizedAssets?.icon, kind: "icon" }]
    : [{ src: normalizedAssets?.symbol, kind: "symbol" }, { src: normalizedAssets?.icon, kind: "icon" }, { src: normalizedAssets?.logo, kind: "logo" }];
  const asset = candidates.find((candidate) => candidate.src && candidate.src !== failedAsset);

  if (!asset?.src) return <span className={`entity-identity entity-identity--text ${className}`}>{name}</span>;

  const hasVisibleName = asset.kind !== "logo";
  const resolvedSrc = resolveAssetUrl(asset.src);
  return (
    <span className={`entity-identity entity-identity--${asset.kind} ${className}`}>
      <img
        src={resolvedSrc}
        alt={hasVisibleName ? "" : normalizedAssets?.alt || name}
        crossOrigin={asset.src.startsWith("/") ? "use-credentials" : undefined}
        onError={() => setFailedAsset(asset.src || null)}
      />
      {hasVisibleName && <span>{name}</span>}
    </span>
  );
}

function ReviewPreview({ product, approved, onApprove, previewRef, importing }: { product: ProductPreview; approved: boolean; onApprove: () => void; previewRef: RefObject<HTMLElement | null>; importing: boolean }) {
  const money = (value: number | null | undefined) =>
    value === null || value === undefined
      ? "Não informado"
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const galleryImages = useMemo(() => {
    const list: Array<{ url: string; alt: string | null }> = [];
    const seen = new Set<string>();

    const addImg = (imgUrl?: string | null, altText?: string | null) => {
      if (!imgUrl || typeof imgUrl !== "string") return;
      const cleanUrl = imgUrl.trim();
      if (!cleanUrl) return;
      const key = cleanUrl.split("?")[0].toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push({ url: cleanUrl, alt: altText || product.name || "Imagem do produto" });
    };

    if (product.main_image) {
      addImg(product.main_image, product.name);
    }
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && img.url) {
          addImg(img.url, img.alt);
        }
      }
    }
    return list;
  }, [product.images, product.main_image, product.name]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null;

  function moveImage(direction: -1 | 1) {
    if (galleryImages.length < 2) return;
    setSelectedImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length);
  }

  const storeLabel = formatStoreName(product.source, product.url);
  const storeAssets = normalizeEntityAssets(product.store_assets ?? product.brand_assets, "store");
  const brandAssets = normalizeEntityAssets(product.brand_assets, "brand");

  return (
    <section className="review-preview" ref={previewRef} aria-live="polite">
      <div className="review-heading">
        <div>
          <p className="eyebrow">Prévia coletada</p>
          <h2>{product.name || "Produto sem nome identificado"}</h2>
          {Array.isArray(product.taxonomy) && product.taxonomy.length > 0 && (
            <div className="review-taxonomy" aria-label="Categorias do produto">
              {product.taxonomy.map((item, idx) => (
                <span key={item.slug || item.name || idx} className="review-taxonomy-item">
                  {item.name}
                </span>
              ))}
            </div>
          )}
          <p>Confira os dados extraídos da página antes de aprovar.</p>
        </div>
        <a className="source-link" href={product.url} target="_blank" rel="noreferrer">
          Abrir página <Icon name="external" />
        </a>
      </div>

      <div className="review-grid">
        <div className="review-main">
          <div className="review-brand">
            <div className="review-brand-header">
              <div>
                <span>Marca</span>
                <EntityIdentity
                  name={product.brand || "Não identificada"}
                  assets={brandAssets}
                  mode="wide"
                  className="review-brand-identity"
                />
              </div>
            </div>

            <div className="review-identity-tags">
              <span className="review-tag">
                <b>Loja</b>
                <EntityIdentity name={storeLabel} assets={storeAssets} mode="compact" />
              </span>
              {product.mpn && (
                <span className="review-tag">
                  <b>Código do fabricante</b> {product.mpn}
                </span>
              )}
            </div>
          </div>

          <div className="review-fields">
            <div>
              <span>Preço original</span>
              <strong>{money(product.originalPrice)}</strong>
              <small>Valor de referência</small>
            </div>
            <div>
              <span>Preço no Pix</span>
              <strong className="review-accent">{money(product.pixPrice)}</strong>
              <small>
                {product.pixDiscountPercent === null || product.pixDiscountPercent === undefined
                  ? "Desconto não informado"
                  : `${product.pixDiscountPercent}% de desconto`}
              </small>
            </div>
            <div>
              <span>Preço no cartão</span>
              <strong>{money(product.cardPrice)}</strong>
              <small>
                {product.installments?.quantity && product.installments?.amount
                  ? `${product.installments.quantity}x de ${money(product.installments.amount)}`
                  : "Parcelamento não informado"}
              </small>
            </div>
            <div>
              <span>Economia no Pix</span>
              <strong>{money(product.priceDifferencePixToCard)}</strong>
              <small>Comparado ao cartão</small>
            </div>
          </div>

          <div className="review-meta">
            <span>
              <b>Disponibilidade</b>
              {product.availability === "in_stock"
                ? "Em estoque"
                : product.availability === "out_of_stock"
                ? "Fora de estoque"
                : "Não identificada"}
            </span>
            <span>
              <b>Estoque</b>
              {product.stockQuantity === null || product.stockQuantity === undefined
                ? "Não exibido"
                : `${product.stockQuantity} unidades`}
            </span>
            <span>
              <b>Vendido por</b>
              <EntityIdentity name={product.seller || "Não identificado"} assets={product.seller_assets} mode="wide" />
            </span>
            <span>
              <b>Entregue por</b>
              <EntityIdentity
                name={product.deliveryResponsible || product.seller || "Não identificado"}
                assets={product.delivery_assets}
                mode="wide"
              />
            </span>
            {product.special_status && (
              <span>
                <b>Condição especial</b>
                {product.special_status}
              </span>
            )}
            {product.shipping_from && (
              <span>
                <b>Envio a partir de</b>
                {product.shipping_from}
              </span>
            )}
          </div>
        </div>

        <div className="review-media">
          <div className="gallery-stage">
            {selectedImage ? (
              <button
                className="gallery-main-button"
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Ampliar imagem ${selectedImageIndex + 1} de ${galleryImages.length}`}
              >
                <ImageWithState
                  src={selectedImage.url}
                  alt={selectedImage.alt || product.name || "Imagem do produto"}
                />
              </button>
            ) : (
              <div className="media-empty">Imagem não encontrada</div>
            )}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="gallery-nav previous"
                  type="button"
                  onClick={() => moveImage(-1)}
                  aria-label="Imagem anterior"
                >
                  <Icon name="chevron-left" />
                </button>
                <button
                  className="gallery-nav next"
                  type="button"
                  onClick={() => moveImage(1)}
                  aria-label="Próxima imagem"
                >
                  <Icon name="chevron-right" />
                </button>
              </>
            )}
          </div>
          {galleryImages.length > 0 && (
            <div className="gallery-thumbnails" aria-label="Imagens do produto">
              {galleryImages.map((image, index) => (
                <button
                  className={`gallery-thumbnail ${index === selectedImageIndex ? "selected" : ""}`}
                  key={image.url}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-current={index === selectedImageIndex}
                >
                  <ImageWithState src={image.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <span className="gallery-summary">
            {galleryImages.length === 1
              ? "1 imagem do produto encontrada"
              : `${galleryImages.length} imagens do produto encontradas`}
          </span>
        </div>
      </div>

      <div className="review-actions">
        <span className="persistence-note">
          {approved
            ? "Importação concluída; o registro canônico e as relações foram confirmados."
            : "A loja será vinculada pelo domínio e criada junto do produto quando o catálogo estiver configurado."}
        </span>
        <button
          className="primary-button"
          onClick={onApprove}
          disabled={approved || importing}
        >
          <Icon name={importing ? "refresh" : "check"} />{" "}
          {importing ? "Importando produto..." : approved ? "Prévia aprovada" : "Aprovar prévia"}
        </button>
      </div>

      <ImageViewer
        key={`${lightboxOpen ? "open" : "closed"}-${selectedImageIndex}`}
        images={galleryImages.map((image) => ({
          id: image.url,
          src: image.url,
          alt: image.alt || product.name || "Imagem do produto",
        }))}
        initialIndex={selectedImageIndex}
        title={product.name || "Produto sem nome identificado"}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
}
