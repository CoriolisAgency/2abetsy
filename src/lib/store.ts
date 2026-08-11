/**
 * Betsy AI demand storefront config (2abetsy.com/store).
 * Shelf is 100% automated from GSE public demand API.
 */

export const DEMAND_STORE_API =
  "https://www.gunsearchengine.com/api/public/demand-store";

/** Soft re-poll while the tab is visible */
export const DEMAND_STORE_POLL_MS = 3 * 60_000;

export type DemandStoreProduct = {
  rank: number;
  product_id: number;
  upc: string;
  title: string;
  brand: string | null;
  caliber: string | null;
  type: string | null;
  price: string | null;
  image_url: string | null;
  retailer: string;
  url: string;
  in_stock: true;
  demand_score: number;
  demand_weight: number;
  badge: "hot" | "trending" | null;
};

export type DemandStorePayload = {
  generatedAt: string;
  hours: number;
  windowLabel: string | null;
  products: DemandStoreProduct[];
  types: string[];
  meta: {
    source: "demand";
    curation: "betsy_ai";
    count: number;
    snapshotAgeMs: number | null;
  };
  error?: string;
};
