# Three-site SEO lattice (2aBetsy)

Source of truth for **character / media** ownership. Commercial operator SERPs stay on GSA; platform / shopper / OEM on GSE.

| Intent | Ranking owner | 2aBetsy role |
|--------|---------------|--------------|
| Betsy AI / 2A Betsy / who is Betsy | **2aBetsy** | Primary brand home |
| Media / Shorts / social | **2aBetsy** + social | Hub + outbound |
| GA alternative / FFL analytics / install | **GSA** | Soft CTA only |
| Gun store AI product guides | **GSA** | Soft CTA only |
| My Betsy **in-store hardware** | **GSA** `/my-betsy` | Soft CTA |
| Shopper multi-dealer search | **GSE** `/` | Link |
| **Betsy Live** (public demand map) | **GSE** `/betsy-live` | Link (label: Betsy Live) |
| **Betsy Alerts** (shopper watches) | **GSE** `/mybetsy` | Link — not My Betsy hardware |
| Super Intelligence / How Betsy trains / Ontology | **GSE** | Outbound essays |
| Brand Intelligence OEM | **GSE** `/betsy/enterprise` | Link |

## Brand glossary (locked)

| Term | Meaning |
|------|---------|
| **My Betsy** | In-store hardware only (GSA) |
| **Betsy Alerts** | Shopper restock / search watches (GSE) |
| **Betsy Live** | Public anonymized demand map (`/betsy-live`; `/insights` 301s) |
| **Brand Intelligence** | OEM product — never “Business Intelligence” |
| **GunSearchAgent** | Dealer product — GA replacement + optional inventory |

## Rules

1. One commercial ranking URL per operator intent — always **GSA**.
2. Live demand is **not** reimplemented here — CTA to Betsy Live on GSE.
3. No 4473 / ATF automation claims.
4. `sameAs`: X @2ABetsy, YouTube @BetsyAI, GSE `/betsy`, GSA, Coriolis.
5. Prefer soft CTAs; deep install SERPs stay on gunsearchagent.com.
