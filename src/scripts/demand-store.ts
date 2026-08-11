/**
 * Client runtime — nightly demand store.
 * Instant paint from build-time HTML + #demand-store-bootstrap / localStorage;
 * silent revalidate in background.
 */
import {
  DEMAND_STORE_API,
  DEMAND_STORE_LS_KEY,
  DEMAND_STORE_POLL_MS,
  SECTION_ROW_CAPACITY,
  formatStorePrice,
  gseUpcSearchUrl,
  normalizeDemandStoreSections,
  type DemandStorePayload,
  type DemandStoreProduct,
  type DemandStoreSection,
} from "../lib/store";

const root = document.getElementById("betsy-demand-store");
if (root) {
  const feed = root.querySelector<HTMLElement>("[data-store-feed]")!;
  const statusEl = root.querySelector<HTMLElement>("[data-store-status]")!;
  const chipsEl = root.querySelector<HTMLElement>("[data-store-chips]")!;
  const emptyEl = root.querySelector<HTMLElement>("[data-store-empty]")!;
  const refreshBtn =
    root.querySelector<HTMLButtonElement>("[data-store-refresh]")!;
  const topBtn = root.querySelector<HTMLButtonElement>("[data-store-top]")!;
  const filterBtn =
    root.querySelector<HTMLButtonElement>("[data-store-filter]")!;
  const sheet = root.querySelector<HTMLElement>("[data-store-sheet]")!;
  const sheetClose =
    root.querySelector<HTMLButtonElement>("[data-store-sheet-close]")!;
  const sheetList =
    root.querySelector<HTMLElement>("[data-store-sheet-list]")!;

  let sections: DemandStoreSection[] = [];
  let generatedAt: string | null = null;
  let windowLabel: string | null = null;
  let loading = false;

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "today";
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "today";
    const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }

  function setStatus(text: string) {
    statusEl.textContent = text;
  }

  function cardHtml(p: DemandStoreProduct): string {
    const badge =
      p.badge === "hot"
        ? `<span class="store-badge store-badge--hot">Hot</span>`
        : p.badge === "trending"
          ? `<span class="store-badge store-badge--trend">Trending</span>`
          : "";

    const brand = p.brand ? escapeHtml(p.brand) : "";
    const title = escapeHtml(p.title);
    const meta = [p.caliber, p.type]
      .filter(Boolean)
      .map((x) => escapeHtml(String(x)))
      .join(" · ");
    const gseUrl = gseUpcSearchUrl(p.upc);
    const href = gseUrl || p.url;
    const cta = gseUrl ? "Search GSE →" : "Open →";
    const img =
      p.image_url && /^https?:\/\//i.test(p.image_url)
        ? `<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy" decoding="async" class="store-card__img" data-store-img />`
        : `<div class="store-card__ph" aria-hidden="true">🎯</div>`;

    return `
      <a
        class="store-card"
        href="${escapeHtml(href)}"
        target="_blank"
        rel="noopener noreferrer"
        data-product-id="${p.product_id}"
        data-upc="${escapeHtml(p.upc)}"
      >
        <div class="store-card__media">${img}${badge}</div>
        <div class="store-card__body">
          ${brand ? `<p class="store-card__brand">${brand}</p>` : ""}
          <h3 class="store-card__title">${title}</h3>
          ${meta ? `<p class="store-card__meta">${meta}</p>` : ""}
          <div class="store-card__foot">
            <div class="store-card__price-block">
              <span class="store-card__from">from</span>
              <span class="store-card__price">${escapeHtml(formatStorePrice(p.price))}</span>
            </div>
            <span class="store-card__cta">${cta}</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderChips() {
    chipsEl.innerHTML = sections
      .map(
        (s) =>
          `<a class="store-chip" href="#section-${escapeHtml(s.id)}">${escapeHtml(s.label)} <span class="store-chip__n">${s.products.length}</span></a>`
      )
      .join("");
  }

  function renderSheetList() {
    sheetList.innerHTML = sections
      .map(
        (s) =>
          `<a class="store-sheet-item" href="#section-${escapeHtml(s.id)}" data-jump="${escapeHtml(s.id)}">${escapeHtml(s.label)} · ${s.products.length}</a>`
      )
      .join("");
    sheetList
      .querySelectorAll<HTMLAnchorElement>("[data-jump]")
      .forEach((a) => {
        a.addEventListener("click", () => closeSheet());
      });
  }

  function wireImages(scope: ParentNode) {
    scope.querySelectorAll<HTMLImageElement>("[data-store-img]").forEach((img) => {
      img.addEventListener("error", () => {
        const ph = document.createElement("div");
        ph.className = "store-card__ph";
        ph.setAttribute("aria-hidden", "true");
        ph.textContent = "🎯";
        img.replaceWith(ph);
      });
    });
  }

  function renderSection(s: DemandStoreSection): string {
    const list = s.products;
    return `
      <section class="store-section" id="section-${escapeHtml(s.id)}" aria-labelledby="heading-${escapeHtml(s.id)}" data-section-id="${escapeHtml(s.id)}">
        <header class="store-section__head">
          <div class="store-section__titles">
            <h2 class="store-section__title" id="heading-${escapeHtml(s.id)}">${escapeHtml(s.label)}</h2>
            <p class="store-section__meta">${list.length} picks · Leaders + Trending</p>
          </div>
        </header>
        <div class="store-grid" data-section-grid>${list.map(cardHtml).join("") || `<p class="store-section__empty">No picks yet.</p>`}</div>
      </section>
    `;
  }

  function applyPayload(data: DemandStorePayload, opts?: { silent?: boolean }) {
    sections = normalizeDemandStoreSections(data, SECTION_ROW_CAPACITY);
    generatedAt = data.generatedAt || null;
    windowLabel = data.windowLabel || "Previous 24 hours";
    const n = sections.reduce((a, s) => a + s.products.length, 0);
    if (n > 0) {
      setStatus(
        `${n} picks · ${windowLabel} · two rows per type · cards open GSE by UPC · refreshed ${relativeTime(generatedAt)}`
      );
      emptyEl.hidden = true;
      renderChips();
      renderSheetList();
      // Only rewrite DOM if feed empty or explicit refresh (avoid flicker on silent revalidate when HTML already good)
      const hasCards = feed.querySelector(".store-card");
      if (!opts?.silent || !hasCards) {
        feed.innerHTML = sections.map(renderSection).join("");
        wireImages(feed);
      }
      try {
        localStorage.setItem(DEMAND_STORE_LS_KEY, JSON.stringify(data));
      } catch {
        /* private mode */
      }
    } else if (!opts?.silent) {
      emptyEl.hidden = false;
      emptyEl.textContent =
        "No shoppable demand picks yet. Check back after the next midnight refresh.";
    }
  }

  function readBootstrap(): DemandStorePayload | null {
    try {
      const el = document.getElementById("demand-store-bootstrap");
      if (el?.textContent?.trim()) {
        return JSON.parse(el.textContent) as DemandStorePayload;
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(DEMAND_STORE_LS_KEY);
      if (raw) return JSON.parse(raw) as DemandStorePayload;
    } catch {
      /* ignore */
    }
    return null;
  }

  function openSheet() {
    sheet.hidden = false;
    sheet.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
  }

  function closeSheet() {
    sheet.hidden = true;
    sheet.removeAttribute("data-open");
    document.body.style.overflow = "";
  }

  async function load(silent = false) {
    if (loading) return;
    loading = true;
    if (!silent) {
      refreshBtn.disabled = true;
      refreshBtn.setAttribute("aria-busy", "true");
    }
    try {
      const res = await fetch(DEMAND_STORE_API, {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as DemandStorePayload;
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      applyPayload(data, { silent });
    } catch (e) {
      if (!silent && !sections.length && !feed.querySelector(".store-card")) {
        const msg = e instanceof Error ? e.message : "Failed to load";
        setStatus(`Shelf offline · ${msg}`);
        emptyEl.hidden = false;
        emptyEl.textContent = "Could not load demand shelf. Tap refresh.";
      }
    } finally {
      loading = false;
      refreshBtn.disabled = false;
      refreshBtn.removeAttribute("aria-busy");
    }
  }

  // Instant: bootstrap already in HTML from build; sync client state + LS.
  const boot = readBootstrap();
  if (boot) {
    sections = normalizeDemandStoreSections(boot);
    generatedAt = boot.generatedAt || null;
    windowLabel = boot.windowLabel || null;
    const n = sections.reduce((a, s) => a + s.products.length, 0);
    if (n > 0) {
      setStatus(
        `${n} picks · ${windowLabel || "demand"} · two rows per type · cards open GSE by UPC · refreshed ${relativeTime(generatedAt)}`
      );
      try {
        localStorage.setItem(DEMAND_STORE_LS_KEY, JSON.stringify(boot));
      } catch {
        /* ignore */
      }
    }
    wireImages(feed);
    // Refresh chips/sheet from data (SSR chips already present)
    if (sections.length) {
      renderChips();
      renderSheetList();
    }
  }

  refreshBtn.addEventListener("click", () => void load(false));
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  filterBtn.addEventListener("click", () => openSheet());
  sheetClose.addEventListener("click", () => closeSheet());
  sheet
    .querySelector("[data-store-sheet-scrim]")
    ?.addEventListener("click", () => closeSheet());

  // Background revalidate (does not block first paint)
  void load(true);
  window.setInterval(() => {
    if (document.visibilityState === "hidden") return;
    void load(true);
  }, DEMAND_STORE_POLL_MS);
}
