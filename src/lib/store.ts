/**
 * Betsy AI demand storefront config (2abetsy.com/store).
 * Nightly prior-24h shelf from GSE public API · sections by ATF type.
 */

export const DEMAND_STORE_API =
  "https://www.gunsearchengine.com/api/public/demand-store";

/** Soft re-poll (nightly data — check a few times per day for deploy/cron). */
export const DEMAND_STORE_POLL_MS = 60 * 60_000;

/** One grid row per section (matches desktop 4-col layout). */
export const SECTION_ROW_CAPACITY = 4;

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
  badge: "hot" | "trending" | null;
};

/** Betsy Live–style board within a product-type section. */
export type DemandStoreBoard = "leaders" | "trending";

export type DemandStoreSection = {
  id: string;
  label: string;
  leaders: DemandStoreProduct[];
  trending: DemandStoreProduct[];
  /** Board with more products (tie → leaders). */
  defaultBoard: DemandStoreBoard;
  /** products for the default board (compat). */
  products: DemandStoreProduct[];
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
