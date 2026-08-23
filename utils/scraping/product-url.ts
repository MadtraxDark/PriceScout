const UPPERCASE_TOKENS = new Set([
  "ai", "amd", "asus", "ddr4", "ddr5", "displayport", "fhd", "g-sync", "hdr", "hdr10", "hdmi", "hdd",
  "ips", "intel", "oled", "qd-oled", "qhd", "rgb", "rog", "rtx", "ssd", "uhd", "usb-c", "va", "wifi",
]);

const COMPOUND_TOKENS: Record<string, string> = {
  "a-i": "a.i.",
  "adaptive-sync": "adaptive-sync",
  "display-port": "displayport",
  "g-sync": "g-sync",
  "qd-oled": "qd-oled",
  "usb-c": "usb-c",
  "wi-fi": "wi-fi",
};

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function mergeSlugTokens(tokens: string[]) {
  const merged: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const pair = `${tokens[index]}-${tokens[index + 1]}`.toLowerCase();
    if (COMPOUND_TOKENS[pair]) {
      merged.push(COMPOUND_TOKENS[pair]);
      index += 1;
      continue;
    }
    if (/^\d+$/.test(tokens[index]) && /^\d+[a-z]+$/i.test(tokens[index + 1] || "")) {
      merged.push(`${tokens[index]}.${tokens[index + 1]}`);
      index += 1;
      continue;
    }
    merged.push(tokens[index]);
  }
  return merged;
}

function formatSlugToken(token: string, index: number) {
  const normalized = token.toLowerCase();
  if (UPPERCASE_TOKENS.has(normalized)) return normalized.toUpperCase();
  if (normalized === "a.i.") return "A.I.";
  if (normalized === "adaptive-sync") return "Adaptive-Sync";
  if (/^\d+(?:\.\d+)?[a-z]+$/.test(normalized)) return normalized.replace(/([a-z]+)$/, (unit) => unit === "hz" ? "Hz" : unit);
  if (/\d/.test(normalized)) return normalized.toUpperCase();
  if (/^[a-z]{2,}\d/.test(normalized)) return normalized.toUpperCase();
  return index === 0 ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

export function getProductNameFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const productIndex = segments.findIndex((segment) => segment.toLowerCase() === "produto");
    const slug = productIndex >= 0 ? segments.slice(productIndex + 2).join("-") : "";
    if (!slug) return null;
    const words = mergeSlugTokens(decodeSlug(slug).replace(/[_\s]+/g, "-").split("-").filter(Boolean));
    return words.map(formatSlugToken).join(" ").trim() || null;
  } catch {
    return null;
  }
}
