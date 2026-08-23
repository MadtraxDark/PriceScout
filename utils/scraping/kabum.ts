import { Dataset, PlaywrightCrawler } from "@crawlee/playwright";
import type { Page } from "playwright";

export type KabumAvailability = "in_stock" | "out_of_stock" | "unknown";

export type KabumImage = {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export type KabumTaxonomyNode = {
  level: number;
  name: string;
  slug: string;
};

export type KabumProduct = {
  source: "kabum";
  url: string;
  productId: string | null;
  name: string | null;
  brand: string | null;
  originalPrice: number | null;
  pixPrice: number | null;
  pixDiscountPercent: number | null;
  cardPrice: number | null;
  installments: {
    quantity: number;
    amount: number;
    total: number;
  } | null;
  priceDifferencePixToCard: number | null;
  availability: KabumAvailability;
  stockQuantity: number | null;
  seller: string | null;
  special_status: string | null;
  shipping_from: string | null;
  taxonomy: KabumTaxonomyNode[];
  images: KabumImage[];
};

type RawMoney = { text: string; kind: "original" | "pix" | "other" };
type RawImage = {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

type RawKabumProduct = {
  url: string;
  productId: string | null;
  name: string | null;
  brand: string | null;
  brandUrl: string | null;
  brandLogoUrl: string | null;
  originalPriceText: string | null;
  pixPriceText: string | null;
  pixDiscountPercent: number | null;
  cardPriceText: string | null;
  installmentQuantity: number | null;
  installmentAmountText: string | null;
  availabilityText: string | null;
  stockQuantity: number | null;
  seller: string | null;
  special_status: string | null;
  shipping_from: string | null;
  taxonomy: KabumTaxonomyNode[];
  images: RawImage[];
  jsonLdPrice: number | null;
  jsonLdAvailability: string | null;
};

const MONEY_RE = /R\$\s*([\d.]+),([\d]{2})/i;

function parseMoney(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/\u00a0/g, " ").match(MONEY_RE);
  if (!match) return null;
  const parsed = Number(`${match[1].replace(/\./g, "")}.${match[2]}`);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeUrl(value: string | null, baseUrl: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function imageGroupKey(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    url.pathname = url.pathname
      .replace(/\/(?:xlarge|large|medium|small|thumbnail|thumb|original|full|zoom)\//i, "/")
      .replace(/_(?:gg|g|m|p)(?=\.[^./]+$)/i, "");
    return url.toString().toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function imageScore(image: RawImage): number {
  const path = image.url.toLowerCase();
  const suffixScore = /(?:\/xlarge\/|_gg\.)/.test(path)
    ? 600
    : /(?:\/large\/|_g\.)/.test(path)
      ? 500
      : /(?:\/original\/|\/full\/|\/zoom\/)/.test(path)
        ? 450
        : /(?:large|original|full|zoom)/.test(path)
          ? 400
          : /(?:\/medium\/|_m\.)/.test(path)
            ? 250
            : /(?:\/small\/|\/thumbnail\/|\/thumb\/|_p\.)/.test(path)
              ? 100
              : 0;
  return suffixScore + Math.min((image.width ?? 0) * (image.height ?? 0), 100_000_000) / 100_000;
}

function selectBestImages(images: RawImage[], baseUrl: string, productId: string | null): KabumImage[] {
  const groups = new Map<string, RawImage>();
  for (const image of images) {
    const url = normalizeUrl(image.url, baseUrl);
    if (!url) continue;
    const belongsToProduct = !productId || new RegExp(`(?:/fotos/|/sync_mirakl/|/)${productId}(?:/|$)`, "i").test(new URL(url).pathname);
    if (productId && !belongsToProduct) continue;
    const candidate = { ...image, url };
    const key = imageGroupKey(url);
    const previous = groups.get(key);
    if (!previous || imageScore(candidate) > imageScore(previous)) groups.set(key, candidate);
  }
  return [...groups.values()]
    .sort((a, b) => imageScore(b) - imageScore(a))
    .map((image) => ({
      url: image.url,
      alt: image.alt,
      width: image.width,
      height: image.height,
    }));
}

export function normalizeKabumProduct(raw: RawKabumProduct): KabumProduct {
  const pixPrice = raw.jsonLdPrice ?? parseMoney(raw.pixPriceText);
  const originalPrice = parseMoney(raw.originalPriceText);
  const installmentAmount = parseMoney(raw.installmentAmountText);
  const installments = raw.installmentQuantity && installmentAmount
    ? {
        quantity: raw.installmentQuantity,
        amount: installmentAmount,
        total: roundMoney(raw.installmentQuantity * installmentAmount),
      }
    : null;
  const cardPrice = parseMoney(raw.cardPriceText) ?? installments?.total ?? null;
  const calculatedDiscount = originalPrice && pixPrice
    ? roundMoney(((originalPrice - pixPrice) / originalPrice) * 100)
    : null;
  const availabilityValue = `${raw.availabilityText ?? ""} ${raw.jsonLdAvailability ?? ""}`.toLowerCase();
  const availability: KabumAvailability = /outofstock|outofstock|esgotado|indisponível|sem estoque/.test(availabilityValue)
    ? "out_of_stock"
    : /instock|em estoque|disponível/.test(availabilityValue)
      ? "in_stock"
      : "unknown";

  return {
    source: "kabum",
    url: raw.url,
    productId: raw.productId,
    name: raw.name,
    brand: raw.brand,
    originalPrice,
    pixPrice,
    pixDiscountPercent: raw.pixDiscountPercent ?? calculatedDiscount,
    cardPrice,
    installments,
    priceDifferencePixToCard: pixPrice !== null && cardPrice !== null
      ? roundMoney(cardPrice - pixPrice)
      : null,
    availability,
    stockQuantity: raw.stockQuantity,
    seller: raw.seller,
    special_status: raw.special_status,
    shipping_from: raw.shipping_from,
    taxonomy: raw.taxonomy,
    images: selectBestImages(raw.images, raw.url, raw.productId),
  };
}

export async function extractKabumProduct(page: Page, requestedUrl?: string): Promise<KabumProduct> {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page.waitForTimeout(1200);
  const raw = await page.evaluate((): RawKabumProduct => {
    const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
    const moneyPattern = /R\$\s*[\d.]+,[\d]{2}/i;
    const h1 = document.querySelector("h1");
    const name = clean(h1?.textContent) || null;
    const productId = location.pathname.match(/\/produto\/(\d+)/i)?.[1] ?? null;
    const candidates = h1 ? [h1, ...(() => {
      const ancestors: Element[] = [];
      let current = h1.parentElement;
      while (current && current !== document.body) {
        ancestors.push(current);
        current = current.parentElement;
      }
      return ancestors;
    })()] : [];
    const productRoot = candidates.find((element) => {
      const text = clean(element.textContent);
      return text.includes("Vendido e entregue por:") && moneyPattern.test(text);
    }) ?? document.querySelector("main") ?? document.body;
    const rootText = clean(productRoot.textContent);

    const jsonLdProducts = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((script) => {
        try {
          const parsed = JSON.parse(script.textContent ?? "null");
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      })
      .filter((value) => value && value["@type"] === "Product");
    const jsonLd = jsonLdProducts[0] ?? {};
    const jsonLdBrand = typeof jsonLd.brand === "string" ? jsonLd.brand : jsonLd.brand?.name;
    const jsonLdOffer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;

    const brandLink = [...productRoot.querySelectorAll('a[href*="/marcas/"]')].find((link) => {
      const image = link.querySelector("img");
      return Boolean(clean(image?.getAttribute("alt")) || clean(link.textContent));
    });
    const brandImage = brandLink?.querySelector("img");
    const brand = clean(brandImage?.getAttribute("alt")) || clean(brandLink?.textContent) || clean(jsonLdBrand) || null;
    const brandUrl = brandLink instanceof HTMLAnchorElement ? brandLink.href : null;
    const brandLogoUrl = brandImage?.currentSrc || brandImage?.src || null;

    const leafTexts = [...productRoot.querySelectorAll("*")]
      .filter((element) => element.children.length === 0)
      .map((element) => clean(element.textContent))
      .filter((text) => text && moneyPattern.test(text));
    const originalLeaf = [...productRoot.querySelectorAll("del, s, [class*='line-through']")]
      .map((element) => clean(element.textContent))
      .find((text) => moneyPattern.test(text));
    const pixMarker = [...productRoot.querySelectorAll("*")]
      .filter((element) => {
        const text = clean(element.textContent);
        return /à vista no pix/i.test(text) && moneyPattern.test(text);
      })
      .sort((left, right) => clean(left.textContent).length - clean(right.textContent).length)[0];
    const pixContainerText = clean(pixMarker?.textContent) || clean(pixMarker?.parentElement?.textContent) || "";
    const pixMatches = pixContainerText.match(/R\$\s*[\d.]+,[\d]{2}/gi) ?? [];
    const pixPriceText = pixMatches.at(-1) ?? null;
    const installmentMatch = rootText.match(/(?:ou\s+)?(\d{1,2})x\s*(R\$\s*[\d.]+,[\d]{2})\s*(?:s\/\s*juros)?/i);
    const percentageMatch = rootText.match(/(\d{1,3})%\s*de\s*desconto/i);
    const sellerMatch = rootText.match(/Vendido e entregue por:\s*(.+?)(?=Pré-venda|Pré venda|Envio a partir|Sobre o produto|$)/i);
    const stockMatch = rootText.match(/Restam\s*(\d+)\s*un\.?/i);
    const specialStatusPattern = /^(pré-venda|pré venda|em breve|lançamento|sob encomenda|por encomenda|aguardando reposição|reposição)$/i;
    const specialStatus = [...productRoot.querySelectorAll("span, strong, b, p")]
      .map((element) => clean(element.textContent))
      .find((text) => specialStatusPattern.test(text))
      ?? rootText.match(/\b(pré-venda|pré venda|em breve|lançamento|sob encomenda|por encomenda|aguardando reposição|reposição)\b/i)?.[1]
      ?? null;
    const shippingFrom = rootText.match(/envio\s+a\s+partir\s+de?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] ?? null;
    const availabilityText = [...productRoot.querySelectorAll("*")]
      .map((element) => clean(element.textContent))
      .find((text) => /^(Em estoque|Esgotado|Indisponível|Disponível)$/i.test(text)) ?? null;

    const slugify = (value: string) => clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " e ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const breadcrumbCandidates = [...document.querySelectorAll("nav, ol, [aria-label*='breadcrumb' i], [class*='breadcrumb' i]")]
      .map((element) => [...element.querySelectorAll("a")]
        .map((link) => ({
          name: clean(link.textContent).replace(/\s*>\s*$/g, ""),
          href: link instanceof HTMLAnchorElement ? link.href : "",
        }))
        .filter((item) => item.name && !/^você está em:?$/i.test(item.name) && !/^código\s*[:#-]?\s*\d+$/i.test(item.name)))
      .filter((items) => items.length > 0)
      .sort((left, right) => right.length - left.length);
    const taxonomy = (breadcrumbCandidates[0] ?? []).map((item, index) => {
      let slug = "";
      try {
        const path = new URL(item.href, location.href).pathname.split("/").filter(Boolean);
        slug = path.at(-1) ?? "";
      } catch {
        slug = "";
      }
      return { level: index + 1, name: item.name, slug: slugify(slug) || slugify(item.name) };
    }).filter((item) => item.name && item.slug);

    const images: RawImage[] = [];
    const addImage = (url: string | null, alt: string | null, width: number | null, height: number | null) => {
      if (!url) return;
      images.push({ url, alt: clean(alt) || null, width, height });
    };
    const productImagePath = productId
      ? new RegExp(`(?:/fotos/|/sync_mirakl/|/)${productId}(?:/|$)`, "i")
      : null;
    const imageBelongsToProduct = (url: string | null, alt: string | null, element?: Element) => {
      if (!url) return false;
      const normalizedAlt = clean(alt);
      if (productImagePath?.test(url)) return true;
      if (name && normalizedAlt === name) return true;
      if (element?.closest("[class*='gallery'], [class*='carousel'], [data-testid*='gallery'], [data-testid*='carousel']")) return true;
      return false;
    };
    const addImageElement = (image: HTMLImageElement) => {
      const alt = image.getAttribute("alt");
      const candidates = [
        image.currentSrc,
        image.getAttribute("src"),
        image.getAttribute("data-src"),
        image.getAttribute("data-lazy-src"),
        image.getAttribute("data-original"),
        image.getAttribute("data-large-image"),
        image.getAttribute("data-zoom-image"),
      ];
      for (const url of candidates) {
        if (imageBelongsToProduct(url, alt, image)) addImage(url, alt, image.naturalWidth || Number(image.getAttribute("width")) || null, image.naturalHeight || Number(image.getAttribute("height")) || null);
      }
      for (const entry of (image.getAttribute("srcset") ?? "").split(",")) {
        const [url, descriptor] = entry.trim().split(/\s+/);
        if (!imageBelongsToProduct(url || null, alt, image)) continue;
        const width = descriptor?.endsWith("w") ? Number(descriptor.slice(0, -1)) : null;
        addImage(url || null, alt, width, null);
      }
    };
    const addImagesFrom = (root: ParentNode) => {
      for (const image of root.querySelectorAll("img")) addImageElement(image as HTMLImageElement);
    };
    addImagesFrom(productRoot);

    const jsonLdImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
    for (const image of jsonLdImages) addImage(typeof image === "string" ? image : null, name, null, null);

    const addScriptImageUrls = (value: unknown) => {
      if (typeof value === "string") {
        const urls = value.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        for (const url of urls) if (imageBelongsToProduct(url, name)) addImage(url, name, null, null);
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) addScriptImageUrls(item);
        return;
      }
      if (!value || typeof value !== "object") return;
      for (const [key, item] of Object.entries(value)) {
        if (/image|photo|picture|gallery|media|thumbnail/i.test(key)) addScriptImageUrls(item);
        else if (typeof item === "object") addScriptImageUrls(item);
      }
    };
    for (const script of document.scripts) {
      const text = script.textContent ?? "";
      if (!productId || !text.includes(productId)) continue;
      try {
        addScriptImageUrls(JSON.parse(text));
      } catch {
        const urls = text.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        for (const url of urls) if (imageBelongsToProduct(url, name)) addImage(url, name, null, null);
      }
    }

    if (images.length === 0) {
      addImagesFrom(document);
    }

    return {
      url: location.href,
      productId,
      name,
      brand,
      brandUrl,
      brandLogoUrl,
      originalPriceText: originalLeaf ?? leafTexts[0] ?? null,
      pixPriceText,
      pixDiscountPercent: percentageMatch ? Number(percentageMatch[1]) : null,
      cardPriceText: null,
      installmentQuantity: installmentMatch ? Number(installmentMatch[1]) : null,
      installmentAmountText: installmentMatch?.[2] ?? null,
      availabilityText,
      stockQuantity: stockMatch ? Number(stockMatch[1]) : null,
      seller: sellerMatch ? clean(sellerMatch[1]).replace(/[\uE000-\uF8FF]/g, "").trim() : null,
      special_status: specialStatus,
      shipping_from: shippingFrom,
      taxonomy,
      images,
      jsonLdPrice: typeof jsonLdOffer?.price === "number" ? jsonLdOffer.price : null,
      jsonLdAvailability: typeof jsonLdOffer?.availability === "string" ? jsonLdOffer.availability : null,
    };
  });

  return normalizeKabumProduct({ ...raw, url: requestedUrl ?? raw.url });
}

export async function crawlKabumProducts(urls: string[]): Promise<KabumProduct[]> {
  const products: KabumProduct[] = [];
  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    requestHandler: async ({ page, request, log }) => {
      const product = await extractKabumProduct(page, request.url);
      products.push(product);
      await Dataset.pushData(product);
      log.info(`Produto KaBuM extraído: ${product.productId ?? request.url}`);
    },
    failedRequestHandler: async ({ request, log }) => {
      log.error(`Falha ao extrair produto KaBuM: ${request.url}`);
    },
  });
  await crawler.run(urls);
  return products;
}

export async function scrapeKabumProduct(url: string): Promise<KabumProduct> {
  let product: KabumProduct | null = null;
  let failure: string | null = null;
  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestsPerCrawl: 1,
    requestHandler: async ({ page, request }) => {
      product = await extractKabumProduct(page, request.url);
    },
    failedRequestHandler: async ({ request, errorMessages }) => {
      const lastMessage = Array.isArray(errorMessages) ? errorMessages.at(-1) : null;
      failure = typeof lastMessage === "string" ? lastMessage : `Falha ao abrir ${request.url}.`;
    },
  });
  await crawler.run([{ url, uniqueKey: `${url}#preview-${Date.now()}` }]);
  if (!product) throw new Error(failure || "O scraper não retornou dados do produto.");
  return product;
}
