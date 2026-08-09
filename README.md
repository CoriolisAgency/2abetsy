# 2aBetsy.com

Official **Betsy AI** brand home — content and culture.  
Dealers → [GunSearchAgent](https://gunsearchagent.com) · Floor → [My Betsy](https://gunsearchagent.com/my-betsy) · Live demand → [Betsy Live](https://www.gunsearchengine.com/insights) · Shoppers → [GunSearchEngine](https://www.gunsearchengine.com).

## Stack

- [Astro](https://astro.build) (static) + Tailwind CSS v4  
- Host: **GitHub Pages**  
- Canon imagery from GunSearchEngine `public/betsy/images`

## Local

```bash
npm install
npm run dev
npm run build
```

## Deploy (GitHub Pages)

1. Create GitHub repo (e.g. `CoriolisAgency/2abetsy`), push `main`
2. Settings → Pages → Source: **GitHub Actions**
3. DNS for `2abetsy.com`:
   - Apex: GitHub Pages A records (or Cloudflare)
   - `www` CNAME → `<org>.github.io`
4. Repo `public/CNAME` is already `2abetsy.com`

## Docs

- [Brand & SEO strategy](docs/brand-seo-strategy.md)
- [SEO lattice](docs/seo-lattice.md)

## CTAs

Defined in `src/lib/links.ts` — `betsyLive` points at GSE Insights.
