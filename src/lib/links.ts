/**
 * Outbound product + social links.
 * Commercial install SERPs stay on GSA; live demand on GSE Insights.
 */
export const LINKS = {
  home: "https://2abetsy.com",
  gsa: "https://gunsearchagent.com",
  gsaGa:
    "https://gunsearchagent.com/google-analytics-alternative-for-ffls",
  gse: "https://www.gunsearchengine.com",
  /** Betsy Live — network demand viz (not rebuilt here) */
  betsyLive: "https://www.gunsearchengine.com/insights",
  brandIntel: "https://www.gunsearchengine.com/betsy/enterprise",
  gseBetsy: "https://www.gunsearchengine.com/betsy",
  superIntel:
    "https://www.gunsearchengine.com/betsy/super-intelligence-for-ffls",
  howTrains:
    "https://www.gunsearchengine.com/betsy/how-betsy-trains-betsy",
  ontology: "https://www.gunsearchengine.com/ontology",
  x: "https://x.com/2ABetsy",
  youtube: "https://www.youtube.com/@BetsyAI",
  youtubeShorts: "https://www.youtube.com/@BetsyAI/shorts",
  coriolis: "https://coriolisagency.com",
  pressEmail: "mailto:betsy@coriolisagency.com",
} as const;

export const CANON = {
  headshot: "/betsy/images/betsy-headshot-work.png",
  range: "/betsy/images/betsy-at-the-range.jpg",
  outside: "/betsy/images/betsy-outside.jpg",
  cutout: "/betsy/images/betsy-outside-cutout.png",
  gaHero: "/betsy/images/betsy-ga-alternative-hero.jpg",
  tzu: "/betsy/images/betsy-tzu-art-of-war.jpg",
} as const;
