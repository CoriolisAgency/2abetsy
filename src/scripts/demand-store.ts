/**
 * Client runtime for Betsy demand store — mobile / right-thumb first.
 */
import {
  DEMAND_STORE_API,
  DEMAND_STORE_POLL_MS,
  type DemandStorePayload,
  type DemandStoreProduct,
} from "../lib/store";

const root = document.getElementById("betsy-demand-store");
if (!root) {
  /* page without store mount */
} else {
  const grid = root.querySelector<HTMLElement>("[data-store-grid]")!;
  const statusEl = root.querySelector<HTMLElement>("[data-store-status]")!;
  const chipsEl = root.querySelector<HTMLElement>("[data-store-chips]")!;
  const emptyEl = root.querySelector<HTMLElement>("[data-store-empty]")!;
  const refreshBtn = root.querySelector<HTMLButtonElement>("[data-store-refresh]")!;
  const topBtn = root.querySelector<HTMLButtonElement>("[data-store-top]")!;
  const filterBtn = root.querySelector<HTMLButtonElement>("[data-store-filter]")!;
  const sheet = root.querySelector<HTMLElement>("[data-store-sheet]")!;
  const sheetClose = root.querySelector<HTMLButtonElement>("[data-store-sheet-close]")!;
  const sheetList = root.querySelector<HTMLElement>("[data-store-sheet-list]")!;

  let products: DemandStoreProduct[] = [];
  let types: string[] = [];
  let activeType: string | null = null;
  let generatedAt: string | null = null;
  let loading = false;

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(p: string | null): string {
    if (p == null || p === "") return "See price";
    const n = Number(p);
    if (!Number.isFinite(n)) return escapeHtml(String(p));
    return `$${n.toFixed(2)}`;
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "just now";
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "just now";
    const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (sec < 45) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }

  function filtered(): DemandStoreProduct[] {
    if (!activeType) return products;
    const key = activeType.toLowerCase();
    return products.filter(
      (p) => (p.type || "").toLowerCase() === key
    );
  }

  function setStatus(text: string) {
    statusEl.textContent = text;
  }

  function renderChips() {
    const allActive = !activeType;
    const bits: string[] = [
      `<button type="button" class="store-chip${allActive ? " is-active" : ""}" data-type="">All</button>`,
    ];
    for (const t of types) {
      const on = activeType === t;
      bits.push(
        `<button type="button" class="store-chip${on ? " is-active" : ""}" data-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`
      );
    }
    chipsEl.innerHTML = bits.join("");
    chipsEl.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-type") || "";
        activeType = v || null;
        renderChips();
        renderSheetList();
        renderGrid();
      });
    });
  }

  function renderSheetList() {
    const bits: string[] = [
      `<button type="button" class="store-sheet-item${activeType ? "" : " is-active"}" data-type="">All demand</button>`,
    ];
    for (const t of types) {
      bits.push(
        `<button type="button" class="store-sheet-item${activeType === t ? " is-active" : ""}" data-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`
      );
    }
    sheetList.innerHTML = bits.join("");
    sheetList.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-type") || "";
        activeType = v || null;
        closeSheet();
        renderChips();
        renderSheetList();
        renderGrid();
      });
    });
  }

  function cardHtml(p: DemandStoreProduct): string {
    const badge =
      p.badge === "hot"
        ? `<span class="store-badge store-badge--hot">Hot</span>`
        : p.badge === "trending"
          ? `<span class="store-badge store-badge--trend">Trending</span>`
          : `<span class="store-badge">#${p.rank}</span>`;

    const brand = p.brand ? escapeHtml(p.brand) : "";
    const title = escapeHtml(p.title);
    const meta = [p.caliber, p.type].filter(Boolean).map((x) => escapeHtml(String(x))).join(" · ");
    const retailer = escapeHtml(p.retailer || "Dealer");
    const img = p.image_url
      ? `<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy" decoding="async" class="store-card__img" data-store-img />`
      : `<div class="store-card__ph" aria-hidden="true">🎯</div>`;

    return `
      <a
        class="store-card"
        href="${escapeHtml(p.url)}"
        target="_blank"
        rel="noopener noreferrer"
        data-product-id="${p.product_id}"
        data-upc="${escapeHtml(p.upc)}"
      >
        <div class="store-card__media">${img}${badge}</div>
        <div class="store-card__body">
          ${brand ? `<p class="store-card__brand">${brand}</p>` : ""}
          <h2 class="store-card__title">${title}</h2>
          ${meta ? `<p class="store-card__meta">${meta}</p>` : ""}
          <div class="store-card__foot">
            <span class="store-card__price">${formatPrice(p.price)}</span>
            <span class="store-card__retailer">at ${retailer}</span>
          </div>
          <p class="store-card__cta">Open dealer →</p>
        </div>
      </a>
    `;
  }

  function renderGrid() {
    const list = filtered();
    if (!list.length) {
      grid.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = loading
        ? "Loading live demand shelf…"
        : activeType
          ? `No in-stock offers for ${activeType} right now.`
          : "No shoppable demand picks yet — try refresh.";
      return;
    }
    emptyEl.hidden = true;
    grid.innerHTML = list.map(cardHtml).join("");
    grid.querySelectorAll<HTMLImageElement>("[data-store-img]").forEach((img) => {
      img.addEventListener("error", () => {
        const ph = document.createElement("div");
        ph.className = "store-card__ph";
        ph.setAttribute("aria-hidden", "true");
        ph.textContent = "🎯";
        img.replaceWith(ph);
      });
    });
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
      if (!products.length) {
        grid.innerHTML = Array.from({ length: 6 })
          .map(() => `<div class="store-card store-card--skeleton" aria-hidden="true"></div>`)
          .join("");
        emptyEl.hidden = true;
      }
    }
    try {
      const res = await fetch(DEMAND_STORE_API, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as DemandStorePayload;
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Only show demand picks that still have a product photo.
      products = (Array.isArray(data.products) ? data.products : []).filter(
        (p) => typeof p.image_url === "string" && /^https?:\/\//i.test(p.image_url)
      );
      types = Array.isArray(data.types) ? data.types : [];
      generatedAt = data.generatedAt || null;
      setStatus(
        `${products.length} live picks · updated ${relativeTime(generatedAt)} · Betsy AI`
      );
      renderChips();
      renderSheetList();
      renderGrid();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setStatus(`Shelf offline · ${msg}`);
      if (!products.length) {
        emptyEl.hidden = false;
        emptyEl.textContent = "Could not load demand shelf. Tap refresh.";
        grid.innerHTML = "";
      }
    } finally {
      loading = false;
      refreshBtn.disabled = false;
      refreshBtn.removeAttribute("aria-busy");
    }
  }

  refreshBtn.addEventListener("click", () => void load(false));
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  filterBtn.addEventListener("click", () => openSheet());
  sheetClose.addEventListener("click", () => closeSheet());
  sheet.querySelector("[data-store-sheet-scrim]")?.addEventListener("click", () => closeSheet());

  void load(false);
  window.setInterval(() => {
    if (document.visibilityState === "hidden") return;
    void load(true);
  }, DEMAND_STORE_POLL_MS);
}
