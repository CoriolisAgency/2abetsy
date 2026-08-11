/**
 * Client runtime — nightly demand store, one row per ATF/type section.
 */
import {
  DEMAND_STORE_API,
  DEMAND_STORE_POLL_MS,
  SECTION_ROW_CAPACITY,
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

  function formatPrice(p: string | null): string {
    if (p == null || p === "") return "See price";
    const n = Number(p);
    if (!Number.isFinite(n)) return escapeHtml(String(p));
    return `$${n.toFixed(2)}`;
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
    const retailer = escapeHtml(p.retailer || "Dealer");
    const img =
      p.image_url && /^https?:\/\//i.test(p.image_url)
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
          <h3 class="store-card__title">${title}</h3>
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

  function renderChips() {
    const bits = sections.map(
      (s) =>
        `<a class="store-chip" href="#section-${escapeHtml(s.id)}">${escapeHtml(s.label)} <span class="store-chip__n">${s.products.length}</span></a>`
    );
    chipsEl.innerHTML = bits.join("");
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

  function renderFeed() {
    if (!sections.length) {
      feed.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = loading
        ? "Loading nightly demand shelf…"
        : "No shoppable demand picks with photos yet. Check back after the next midnight refresh.";
      return;
    }
    emptyEl.hidden = true;
    feed.innerHTML = sections
      .map((s) => {
        const cards = s.products.map(cardHtml).join("");
        return `
          <section class="store-section" id="section-${escapeHtml(s.id)}" aria-labelledby="heading-${escapeHtml(s.id)}">
            <header class="store-section__head">
              <h2 class="store-section__title" id="heading-${escapeHtml(s.id)}">${escapeHtml(s.label)}</h2>
              <p class="store-section__meta">${s.products.length} picks · prior 24h demand</p>
            </header>
            <div class="store-grid">${cards}</div>
          </section>
        `;
      })
      .join("");
    wireImages(feed);
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

  function normalizeSections(data: DemandStorePayload): DemandStoreSection[] {
    const cap =
      typeof data.meta?.sectionCapacity === "number" &&
      data.meta.sectionCapacity > 0
        ? Math.min(data.meta.sectionCapacity, SECTION_ROW_CAPACITY)
        : SECTION_ROW_CAPACITY;

    if (Array.isArray(data.sections) && data.sections.length) {
      return data.sections
        .map((s) => ({
          id: s.id,
          label: s.label,
          products: (s.products || [])
            .filter(
              (p) => typeof p.url === "string" && /^https?:\/\//i.test(p.url)
            )
            .slice(0, cap),
        }))
        .filter((s) => s.products.length > 0);
    }
    // Legacy flat list fallback — still one row max
    const products = (data.products || []).filter(
      (p) => typeof p.url === "string" && /^https?:\/\//i.test(p.url)
    );
    if (!products.length) return [];
    return [
      {
        id: "all",
        label: "Demand picks",
        products: products.slice(0, cap),
      },
    ];
  }

  async function load(silent = false) {
    if (loading) return;
    loading = true;
    if (!silent) {
      refreshBtn.disabled = true;
      refreshBtn.setAttribute("aria-busy", "true");
      if (!sections.length) {
        feed.innerHTML = `
          <section class="store-section">
            <div class="store-grid">
              ${Array.from({ length: SECTION_ROW_CAPACITY })
                .map(
                  () =>
                    `<div class="store-card store-card--skeleton" aria-hidden="true"></div>`
                )
                .join("")}
            </div>
          </section>
        `;
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
      sections = normalizeSections(data);
      generatedAt = data.generatedAt || null;
      windowLabel = data.windowLabel || "Previous 24 hours";
      const n = sections.reduce((a, s) => a + s.products.length, 0);
      setStatus(
        `${n} picks · ${windowLabel} · refreshed ${relativeTime(generatedAt)} · next update midnight ET`
      );
      renderChips();
      renderSheetList();
      renderFeed();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setStatus(`Shelf offline · ${msg}`);
      if (!sections.length) {
        emptyEl.hidden = false;
        emptyEl.textContent = "Could not load demand shelf. Tap refresh.";
        feed.innerHTML = "";
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
  sheet
    .querySelector("[data-store-sheet-scrim]")
    ?.addEventListener("click", () => closeSheet());

  void load(false);
  window.setInterval(() => {
    if (document.visibilityState === "hidden") return;
    void load(true);
  }, DEMAND_STORE_POLL_MS);
}
