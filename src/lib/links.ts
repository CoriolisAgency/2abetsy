/**
 * Outbound product + social links.
 * Commercial install SERPs stay on GSA; live demand on GSE Insights.
 */
export const LINKS = {
  home: "https://2abetsy.com",
  /** Automated demand store (this site) */
  store: "https://2abetsy.com/store",
  gsa: "https://gunsearchagent.com",
  gsaGa:
    "https://gunsearchagent.com/google-analytics-alternative-for-ffls",
  gsaDealers: "https://gunsearchagent.com/ai-for-gun-dealers",
  gsaGunStoreAi: "https://gunsearchagent.com/gun-store-ai",
  gsaHowTo:
    "https://gunsearchagent.com/how-to-add-ai-search-to-your-gun-store",
  /** My Betsy — in-store hardware (sales floor). Commercial pages on GSA. */
  myBetsy: "https://gunsearchagent.com/my-betsy",
  whyMyBetsy: "https://gunsearchagent.com/why-my-betsy",
  gse: "https://www.gunsearchengine.com",
  /** Betsy Live — network demand viz (not rebuilt here) */
  betsyLive: "https://www.gunsearchengine.com/betsy-live",
  /** Shopper restock / search watches on GSE (not in-store My Betsy hardware) */
  betsyAlerts: "https://www.gunsearchengine.com/mybetsy",
  brandIntel: "https://www.gunsearchengine.com/betsy/enterprise",
  /** Brand Intelligence Enterprise Co-Pilot (MCP) */
  enterpriseCopilot:
    "https://www.gunsearchengine.com/betsy/enterprise-copilot",
  gseBetsy: "https://www.gunsearchengine.com/betsy",
  superIntel:
    "https://www.gunsearchengine.com/betsy/super-intelligence-for-ffls",
  howTrains:
    "https://www.gunsearchengine.com/betsy/how-betsy-trains-betsy",
  ontology: "https://www.gunsearchengine.com/ontology",
  gunFriendly: "https://www.gunsearchengine.com/gun-friendly-ai",
  whyRefuses: "https://www.gunsearchengine.com/why-ai-refuses-firearms",
  x: "https://x.com/2ABetsy",
  youtube: "https://www.youtube.com/@BetsyAI",
  youtubeShorts: "https://www.youtube.com/@BetsyAI/shorts",
  coriolis: "https://coriolisagency.com",
  pressEmail: "mailto:betsy@coriolisagency.com",
} as const;

/** Shared sky link class for inline body copy */
export const linkClass =
  "font-medium text-sky-400 hover:underline underline-offset-2";

/** Paths relative to site root (no leading slash). Use with withBase(). */
export const CANON_PATHS = {
  headshot: "betsy/images/betsy-headshot-work.png",
  range: "betsy/images/betsy-at-the-range.jpg",
  outside: "betsy/images/betsy-outside.jpg",
  cutout: "betsy/images/betsy-outside-cutout.png",
  gaHero: "betsy/images/betsy-ga-alternative-hero.jpg",
  tzu: "betsy/images/betsy-tzu-art-of-war.jpg",
} as const;
