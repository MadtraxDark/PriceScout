"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ImageViewer, { ImageWithState } from "@/components/ImageViewer";
import { catalogApi } from "@/utils/api/services";
import type { Product, ProductImage, TaxonomyItem } from "@/utils/api/contracts";


const fields: Array<{ key: keyof Product; label: string; type?: string }> = [
  { key: "name", label: "Nome" }, { key: "brand", label: "Marca" }, { key: "product_url", label: "URL do produto", type: "url" },
  { key: "seller", label: "Vendedor" }, { key: "shipping_from", label: "Envio a partir de" }, { key: "special_status", label: "Estado especial" },
  { key: "original_price", label: "Preço original", type: "number" }, { key: "pix_price", label: "Preço PIX", type: "number" }, { key: "pix_discount_percent", label: "Desconto PIX (%)", type: "number" },
  { key: "card_price", label: "Preço no cartão", type: "number" }, { key: "installments_quantity", label: "Quantidade de parcelas", type: "number" }, { key: "installment_amount", label: "Valor da parcela", type: "number" },
  { key: "price_difference_pix_to_card", label: "Diferença PIX x cartão", type: "number" }, { key: "stock_quantity", label: "Estoque", type: "number" },
];

function Icon({ name }: { name: "arrow" | "back" | "check" | "close" | "image" | "plus" | "refresh" | "trash" | "up" | "down" | "left" | "right" }) {
  const paths = { arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>, back: <><path d="M19 12H5M11 18l-6-6 6-6" /></>, check: <path d="m5 12 4 4L19 6" />, close: <><path d="m6 6 12 12M18 6 6 18" /></>, image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m4 17 5-5 3 3 2-2 6 5" /></>, plus: <><path d="M12 5v14M5 12h14" /></>, refresh: <><path d="M20 11a8 8 0 0 0-14-4L4 9" /><path d="M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2" /><path d="M20 20v-5h-5" /></>, trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>, up: <path d="m6 14 6-6 6 6" />, down: <path d="m6 10 6 6 6-6" />, left: <path d="m14 6-6 6 6 6" />, right: <path d="m10 6 6 6-6 6" /> };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function ProductAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<ProductImage | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProductImage | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [productDeletePrompt, setProductDeletePrompt] = useState(false);
  const [productDeleteProcessing, setProductDeleteProcessing] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  async function load(productId: string) {
    setLoading(true); setError("");
    try { const result = await catalogApi.getProduct(productId); setProduct(result.product); setDraft(result.product); setImages(result.images ?? []); setTaxonomy(result.taxonomy ?? []); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o produto."); } finally { setLoading(false); }
  }

  useEffect(() => { void params.then((value) => { setId(value.id); void load(value.id); }); }, [params]);
  const primary = useMemo(() => images.find((image) => image.id === product?.primary_image_id) ?? null, [images, product?.primary_image_id]);
  const createdAtDate = product?.created_at ? new Date(product.created_at) : null;
  const createdAtLabel = createdAtDate && !Number.isNaN(createdAtDate.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(createdAtDate)
    : "Data não informada";
  const hasUnsavedChanges = useMemo(() => Boolean(product && JSON.stringify(draft) !== JSON.stringify(product)), [draft, product]);
  const update = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value === "" ? null : ["number"].includes(fields.find((field) => field.key === key)?.type || "") ? Number(value) : value }));

  async function save() {
    if (!id) return;
    setSaving(true); setNotice(""); setError("");
    const editableKeys = ["name", "brand", "product_url", "seller", "shipping_from", "special_status", "original_price", "pix_price", "pix_discount_percent", "card_price", "installments_quantity", "installment_amount", "price_difference_pix_to_card", "stock_quantity", "availability"];
    const payload = Object.fromEntries(editableKeys.map((key) => [key, draft[key] ?? null]));
    try {
      const result = await catalogApi.updateProduct(id, payload);
      setProduct(result.product); setDraft(result.product); setNotice("Alterações salvas no produto canônico.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar as alterações.");
    } finally { setSaving(false); }
  }
  async function arrange(imageIds: string[], primaryImageId?: string) {
    const selectedPrimary = primaryImageId || product?.primary_image_id;
    if (!selectedPrimary) return;
    const nextImages = imageIds.map((imageId) => images.find((image) => image.id === imageId)).filter((image): image is ProductImage => Boolean(image));
    setImages(nextImages);
    setProduct((current) => current ? { ...current, primary_image_id: selectedPrimary } : current);
    setError("");
    setNotice("");
    try {
      const result = await catalogApi.updateProductImages(id, imageIds, selectedPrimary);
      setImages(result.images);
      setProduct((current) => current ? { ...current, primary_image_id: result.primary_image_id } : current);
      setNotice("Imagem principal atualizada.");
    } catch {
      setError("Não foi possível atualizar a galeria.");
      await load(id);
    }
  }
  async function deleteImage(image: ProductImage) { setDeleteError(""); setDeleteCandidate(image); }
  async function confirmDeleteProduct() {
    if (!id || productDeleteProcessing) return;
    setProductDeleteProcessing(true); setError("");
    try {
      await catalogApi.deleteProduct(id);
      router.replace("/admin?view=products");
    } catch (deleteProductError) {
      setError(deleteProductError instanceof Error ? deleteProductError.message : "Não foi possível excluir o produto.");
      setProductDeleteProcessing(false);
    }
  }
  async function confirmDeleteImage() { const image = deleteCandidate; if (!image || deleteProcessing) return; setDeleteProcessing(true); setDeleteError(""); try { await catalogApi.deleteProductImage(id, image.id); const next = images.filter((item) => item.id !== image.id); setImages(next); if (image.id === product?.primary_image_id) { const nextPrimary = next[0]; if (nextPrimary) await arrange(next.map((item) => item.id), nextPrimary.id); else setProduct((current) => current ? { ...current, primary_image_id: null } : current); } setNotice("Imagem excluída com sucesso."); window.setTimeout(() => setDeleteCandidate(null), 450); } catch { setDeleteError("Não foi possível excluir a imagem. Tente novamente."); } finally { setDeleteProcessing(false); } }
  async function addImage(event: React.FormEvent) { event.preventDefault(); if (!newImageUrl.trim()) return; setAddingImage(true); try { const result = await catalogApi.addProductImage(id, newImageUrl.trim()); setImages((current) => [...current, result.image]); setNewImageUrl(""); setNotice("Imagem adicionada à galeria."); } catch (addError) { setError(addError instanceof Error ? addError.message : "Não foi possível adicionar a imagem."); } finally { setAddingImage(false); } }
  function requestExit() { if (hasUnsavedChanges) setExitPrompt(true); else router.push("/admin?view=products"); }
  function exitWithoutSaving() { setExitPrompt(false); router.push("/admin?view=products"); }
  if (loading) return <main className="product-admin-shell"><p className="eyebrow">Produto</p><h1>Carregando área de gerenciamento...</h1></main>;
  if (!product) return <main className="product-admin-shell"><Link className="back-link" href="/admin"><Icon name="back" /> Voltar ao catálogo</Link><section className="empty-state"><h1>Produto indisponível</h1><p>{error || "O produto não foi encontrado."}</p></section></main>;
  return <main className="product-admin-shell"><header className="product-admin-header"><div><Link className="back-link" href="/admin"><Icon name="back" /> Catálogo</Link><p className="eyebrow">Área central do produto</p><h1>{product.name}</h1><p className="product-id">ID interno <code>{product.id}</code></p></div><div className="product-admin-actions"><button className="danger-button" type="button" onClick={() => setProductDeletePrompt(true)} disabled={productDeleteProcessing}><Icon name="trash" /> Excluir produto</button><button className="outline-button product-cancel-button" type="button" onClick={requestExit}>Cancelar</button><button className="primary-button" type="button" onClick={() => void save()} disabled={saving}><Icon name={saving ? "refresh" : "check"} /> {saving ? "Salvando..." : "Salvar alterações"}</button></div></header>{productDeletePrompt && <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (!productDeleteProcessing && event.target === event.currentTarget) setProductDeletePrompt(false); }}><section className="confirm-modal product-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" aria-describedby="delete-product-description"><div className="confirm-modal-preview product-delete-preview">{product.primary_image_url ? <ImageWithState src={product.primary_image_url} alt="" /> : <div className="product-delete-image-empty"><Icon name="image" /><span>Sem imagem de capa</span></div>}</div><div className="confirm-modal-content"><div className="confirm-modal-heading"><div><p className="eyebrow">Ação destrutiva</p><h2 id="delete-product-title">Excluir produto?</h2></div><button className="icon-action" type="button" onClick={() => setProductDeletePrompt(false)} disabled={productDeleteProcessing} aria-label="Fechar"><Icon name="close" /></button></div><div className="product-delete-identity"><strong>{product.name}</strong><span><b>Data de criação</b>{createdAtLabel}</span></div><p id="delete-product-description">Tem certeza de que deseja excluir este produto? A galeria de imagens e o histórico de preços relacionado também serão removidos.</p><div className="confirm-modal-actions"><button className="outline-button" type="button" onClick={() => setProductDeletePrompt(false)} disabled={productDeleteProcessing}>Cancelar</button><button className="danger-button" type="button" onClick={() => void confirmDeleteProduct()} disabled={productDeleteProcessing}>{productDeleteProcessing ? <><span className="loading-spinner" aria-hidden="true" /> Excluindo produto...</> : "Excluir produto"}</button></div></div></section></div>}{exitPrompt && <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExitPrompt(false); }}><section className="confirm-modal exit-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="exit-product-title" aria-describedby="exit-product-description"><div className="confirm-modal-content"><div className="confirm-modal-heading"><div><p className="eyebrow">Alterações pendentes</p><h2 id="exit-product-title">Sair sem salvar?</h2></div><button className="icon-action" type="button" onClick={() => setExitPrompt(false)} aria-label="Fechar"><Icon name="close" /></button></div><p id="exit-product-description">As alterações feitas nesta edição serão descartadas e você voltará para a lista de Produtos.</p><div className="confirm-modal-actions"><button className="outline-button" type="button" onClick={() => setExitPrompt(false)}>Continuar editando</button><button className="danger-button" type="button" onClick={exitWithoutSaving}>Sair sem salvar</button></div></div></section></div>}{error && <p className="error-notice" role="alert">{error}</p>}{notice && <p className="success-notice" role="status">{notice}</p>}<div className="product-admin-grid"><section className="product-admin-main"><AdminSection title="Informações gerais" eyebrow="01"><div className="product-fields">{fields.slice(0, 6).map((field) => <label key={field.key}>{field.label}<input type={field.type || "text"} value={draft[field.key] == null ? "" : String(draft[field.key])} onChange={(event) => update(field.key, event.target.value)} /></label>)}</div></AdminSection><AdminSection title="Taxonomia" eyebrow="02"><div className="taxonomy-path">{taxonomy.length === 0 ? <span>Taxonomia não cadastrada</span> : taxonomy.map((item) => <span key={item.category?.id || item.level}>{item.category?.name || "Categoria não identificada"}</span>)}</div></AdminSection><AdminSection title="Imagens do produto" eyebrow="03"><form className="image-add-form" onSubmit={addImage}><label>Adicionar imagem por URL<input type="url" value={newImageUrl} onChange={(event) => setNewImageUrl(event.target.value)} placeholder="Cole uma URL HTTPS de imagem" required /></label><button className="outline-button" type="submit" disabled={addingImage}><Icon name="plus" /> {addingImage ? "Adicionando..." : "Adicionar imagem"}</button></form>{images.length === 0 ? <div className="image-empty"><Icon name="image" /><p>Nenhuma imagem vinculada a este produto.</p></div> : <div className="product-gallery">{images.map((image, index) => <article className={`managed-image ${primary?.id === image.id ? "is-primary" : ""}`} key={image.id}><button className="managed-image-preview" type="button" onClick={() => setLightbox(image)}><ImageWithState src={image.image_url} alt={product.name} /></button><div className="managed-image-meta"><div className="managed-image-heading"><span className="image-order">{String(index + 1).padStart(2, "0")}</span><strong>{primary?.id === image.id ? <><Icon name="check" /> Imagem principal</> : "Imagem vinculada"}</strong></div><div className="image-actions"><button className="primary-image-action" type="button" onClick={() => void arrange(images.map((item) => item.id), image.id)} disabled={primary?.id === image.id}>Definir como principal</button><button className="icon-action" type="button" onClick={() => void arrange(images.map((item) => item.id).toSpliced(index, 1).toSpliced(index - 1, 0, image.id))} aria-label="Mover para cima" disabled={index === 0}><Icon name="up" /></button><button className="icon-action" type="button" onClick={() => void arrange(images.map((item) => item.id).toSpliced(index, 1).toSpliced(index + 1, 0, image.id))} aria-label="Mover para baixo" disabled={index === images.length - 1}><Icon name="down" /></button><button className="icon-action danger-action" type="button" onClick={() => void deleteImage(image)} aria-label="Excluir imagem"><Icon name="trash" /></button></div></div></article>)}</div>}</AdminSection></section><aside className="product-admin-side"><AdminSection title="Imagem principal" eyebrow="Capa do produto"><div className="primary-image-panel">{primary ? <ImageWithState key={primary.image_url} src={primary.image_url} alt={product.name} /> : <div className="image-empty"><Icon name="image" /><span>Sem capa definida</span></div>}<p>A capa é usada automaticamente no Catálogo e nas futuras superfícies da loja.</p></div></AdminSection><AdminSection title="Disponibilidade e estoque" eyebrow="04"><label className="field-label">Disponibilidade<select value={String(draft.availability || "unknown")} onChange={(event) => update("availability", event.target.value)}><option value="in_stock">Em estoque</option><option value="out_of_stock">Fora de estoque</option><option value="unknown">Não identificada</option></select></label><label className="field-label">Estoque<input type="number" value={draft.stock_quantity == null ? "" : String(draft.stock_quantity)} onChange={(event) => update("stock_quantity", event.target.value)} /></label></AdminSection><AdminSection title="Preços e condições" eyebrow="05"><div className="product-fields compact">{fields.slice(6, 14).map((field) => <label key={field.key}>{field.label}<input type={field.type || "text"} value={draft[field.key] == null ? "" : String(draft[field.key])} onChange={(event) => update(field.key, event.target.value)} /></label>)}</div></AdminSection><AdminSection title="Outras informações" eyebrow="06"><dl className="product-facts"><div><dt>Origem</dt><dd>{product.source}</dd></div><div><dt>ID externo</dt><dd>{product.external_product_id}</dd></div><div><dt>Loja</dt><dd>{product.store?.name || "Não identificada"}</dd></div></dl></AdminSection></aside></div>{deleteCandidate && <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (!deleteProcessing && event.target === event.currentTarget) setDeleteCandidate(null); }}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-image-title" aria-describedby="delete-image-description"><div className="confirm-modal-preview"><ImageWithState src={deleteCandidate.image_url} alt="" /></div><div className="confirm-modal-content"><div className="confirm-modal-heading"><div><p className="eyebrow">Ação destrutiva</p><h2 id="delete-image-title">Excluir imagem?</h2></div><button className="icon-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={deleteProcessing} aria-label="Fechar"><Icon name="close" /></button></div><p className="confirm-modal-image-name">{deleteCandidate.name || "Imagem vinculada"}</p><p id="delete-image-description">Esta imagem será removida da galeria do produto. Essa ação não pode ser desfeita.</p>{deleteError && <p className="error-notice" role="alert">{deleteError}</p>}<div className="confirm-modal-actions"><button className="outline-button" type="button" onClick={() => setDeleteCandidate(null)} disabled={deleteProcessing}>Cancelar</button><button className="danger-button" type="button" onClick={() => void confirmDeleteImage()} disabled={deleteProcessing}>{deleteProcessing ? <><span className="loading-spinner" aria-hidden="true" /> Excluindo imagem...</> : "Excluir imagem"}</button></div></div></section></div>}<ImageViewer key={lightbox?.id || "closed"} images={images.map((image) => ({ id: image.id, src: image.image_url, alt: product.name }))} initialIndex={Math.max(0, images.findIndex((image) => image.id === lightbox?.id))} title={product.name} open={Boolean(lightbox)} onClose={() => setLightbox(null)} /></main>;
}

function AdminSection({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <section className="admin-section"><div className="admin-section-heading"><span>{eyebrow}</span><h2>{title}</h2></div>{children}</section>; }




