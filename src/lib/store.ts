/**
 * Betsy AI demand storefront config (2abetsy.com/store).
 * Nightly shelf from GSE · sections by ATF type · combined Leaders+Trending.
 */

export const DEMAND_STORE_API =
  "https://www.gunsearchengine.com/api/public/demand-store";

/**
 * Soft re-poll for nightly data. API is edge-cached (s-maxage=1h);
 * recheck a few times a day in case midnight cron landed.
 */
export const DEMAND_STORE_POLL_MS = 6 * 60 * 60_000;

/** Two grid rows per section (4 columns × 2 on desktop). */
export const SECTION_ROW_CAPACITY = 8;

/** GSE homepage UPC search (matches Betsy Live openBetsyUpcSearch). */
export const GSE_ORIGIN = "https://www.gunsearchengine.com";

/** Build GSE `/?upc=` URL for a product barcode. */
export function gseUpcSearchUrl(upc: string | null | undefined): string | null {
  if (!upc) return null;
  const digits = String(upc).replace(/\D/g, "");
  // Homepage extractUpc accepts a range of barcode lengths; allow 8–14 for store.
  if (digits.length < 8 || digits.length > 14) return null;
  return `${GSE_ORIGIN}/?upc=${encodeURIComponent(digits)}`;
}

export type DemandStoreProduct = {
  rank: number;
  product_id: number;
  upc: string;
  title: string;
  brand: string | null;
  caliber: string | null;
  type: string | null;
  type_key?: string | null;
  price: string | null;
  image_url: string | null;
  retailer: string;
  url: string;
  in_stock: boolean;
  demand_score: number;
  demand_weight: number;
  /** Hot / Trending pills on cards (no board tabs). */
  badge: "hot" | "trending" | null;
};

export type DemandStoreSection = {
  id: string;
  label: string;
  /** Combined Leaders + Trending collection. */
  products: DemandStoreProduct[];
  /** Optional legacy fields from older API payloads. */
  leaders?: DemandStoreProduct[];
  trending?: DemandStoreProduct[];
  defaultBoard?: "leaders" | "trending";
};

export type DemandStorePayload = {
  generatedAt: string;
  hours: number;
  windowLabel: string | null;
  refreshMode?: "nightly";
  sections?: DemandStoreSection[];
  products: DemandStoreProduct[];
  types: string[];
  meta: {
    source: "demand";
    curation: "betsy_ai";
    count: number;
    snapshotAgeMs: number | null;
    sectionCapacity?: number;
  };
  error?: string;
};

/** localStorage key for instant return visits */
export const DEMAND_STORE_LS_KEY = "2abetsy-demand-store-v1";

export function formatStorePrice(p: string | null | undefined): string {
  if (p == null || p === "") return "See price";
  const n = Number(p);
  if (!Number.isFinite(n)) return String(p);
  return `$${n.toFixed(2)}`;
}

function productOpenable(p: DemandStoreProduct): boolean {
  if (gseUpcSearchUrl(p.upc)) return true;
  return typeof p.url === "string" && /^https?:\/\//i.test(p.url);
}

/** Normalize API payload into sections for SSR + client (max 8 per section). */
export function normalizeDemandStoreSections(
  data: DemandStorePayload | null | undefined,
  cap = SECTION_ROW_CAPACITY
): DemandStoreSection[] {
  if (!data) return [];
  const limit =
    typeof data.meta?.sectionCapacity === "number" &&
    data.meta.sectionCapacity > 0
      ? Math.min(data.meta.sectionCapacity, cap)
      : cap;

  if (Array.isArray(data.sections) && data.sections.length) {
    return data.sections
      .map((s) => {
        let products = (s.products?.length ? s.products : s.leaders) || [];
        if (!products.length && s.trending?.length) {
          products = s.trending;
        }
        // Merge legacy dual boards if both present and products empty
        if (!products.length && (s.leaders?.length || s.trending?.length)) {
          const byUpc = new Map<string, DemandStoreProduct>();
          for (const p of s.leaders || []) byUpc.set(p.upc, p);
          for (const p of s.trending || []) {
            if (!byUpc.has(p.upc)) byUpc.set(p.upc, p);
          }
          products = [...byUpc.values()];
        }
        products = products.filter(productOpenable).slice(0, limit);
        if (!products.length) return null;
        return { id: s.id, label: s.label, products };
      })
      .filter((s): s is DemandStoreSection => s != null);
  }

  const products = (data.products || [])
    .filter(productOpenable)
    .slice(0, limit);
  if (!products.length) return [];
  return [{ id: "all", label: "Demand picks", products }];
}

/** Build-time / SSR fetch of nightly snapshot (fast edge cache). */
export async function fetchDemandStoreBootstrap(): Promise<DemandStorePayload | null> {
  try {
    const res = await fetch(DEMAND_STORE_API, {
      headers: { Accept: "application/json" },
      // Astro static build: always hit origin/CDN at build time
    });
    if (!res.ok) return null;
    return (await res.json()) as DemandStorePayload;
  } catch {
    return null;
  }
}
