const accented = "áàâãäåéèêëíìîïóòôõöúùûüçñýÿ";
const plain = "aaaaaaeeeeiiiiooooouuuucnyy";
const replacements = new Map([...accented].map((char, index) => [char, plain[index]]));

export function normalizeSearch(text: string): string {
  return [...text].map((char) => {
    const lower = char.toLowerCase();
    return replacements.get(lower) ?? lower;
  }).join("");
}

export function searchTerms(query: string): string[] {
  return [...new Set(normalizeSearch(query).trim().split(/\s+/).filter(Boolean))];
}

export type SearchPart = { text: string; matched: boolean };

/** Map normalized positions back to original UTF-16 indices; render as React text. */
export function highlightParts(text: string, query: string): SearchPart[] {
  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of text) {
    const folded = normalizeSearch(char);
    for (let index = 0; index < folded.length; index += 1) {
      starts.push(offset);
      ends.push(offset + char.length);
    }
    normalized += folded;
    offset += char.length;
  }
  const ranges: [number, number][] = [];
  for (const term of searchTerms(query)) {
    let index = normalized.indexOf(term);
    while (index >= 0) {
      ranges.push([starts[index], ends[index + term.length - 1]]);
      index = normalized.indexOf(term, index + 1);
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }
  const parts: SearchPart[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (cursor < start) parts.push({ text: text.slice(cursor, start), matched: false });
    parts.push({ text: text.slice(start, end), matched: true });
    cursor = end;
  }
  if (cursor < text.length || !parts.length) parts.push({ text: text.slice(cursor), matched: false });
  return parts;
}
