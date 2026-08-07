# 2aBetsy.com — agent notes

Static brand site for **Betsy AI** (Astro → GitHub Pages).

## Product lattice

- **This site:** character, culture, media, brand SEO
- **GunSearchAgent.com:** dealer product (GA for FFLs)
- **GunSearchEngine.com:** shoppers + **Betsy Live** (`/insights`) + platform + BI

Do **not** rebuild demand dashboards or chat here. Link out.

## Canon

Betsy stills under `public/betsy/images/` — sourced from GSE canon. Prefer headshot / range / outside for brand; avoid non-professional assets on the home path.

## Dev

```bash
npm install
npm run dev
npm run build   # → dist/
```

## Deploy

GitHub Actions → Pages (`deploy.yml`). Domain: `public/CNAME` = `2abetsy.com`.

## “push it”

1. status / diff  
2. stage relevant  
3. commit  
4. push `origin` current branch  
