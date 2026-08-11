/**
 * Client runtime — nightly demand store.
 * One row per type section · Leaders / Trending tabs (Betsy Live style).
 */
import {
  DEMAND_STORE_API,
  DEMAND_STORE_POLL_MS,
  SECTION_ROW_CAPACITY,
  gseUpcSearchUrl,
  type DemandStoreBoard,
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
  /** Active board per section id (defaults from API). */
  const boardBySection = new Map<string, DemandStoreBoard>();
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

  function boardProducts(
    s: DemandStoreSection,
    board: DemandStoreBoard
  ): DemandStoreProduct[] {
    return board === "trending" ? s.trending : s.leaders;
  }

  function activeBoard(s: DemandStoreSection): DemandStoreBoard {
    return boardBySection.get(s.id) || s.defaultBoard;
  }

  function sectionCount(s: DemandStoreSection): number {
    return Math.max(s.leaders.length, s.trending.length);
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
    const gseUrl = gseUpcSearchUrl(p.upc);
    // Prefer GSE UPC search; fall back to dealer only if UPC is unusable.
    const href = gseUrl || p.url;
    const cta = gseUrl ? "Search on GSE →" : "Open dealer →";
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
            <span class="store-card__price">${formatPrice(p.price)}</span>
            <span class="store-card__retailer">via ${retailer}</span>
          </div>
          <p class="store-card__cta">${cta}</p>
        </div>
      </a>
    `;
  }

  function renderChips() {
    const bits = sections.map(
      (s) =>
        `<a class="store-chip" href="#section-${escapeHtml(s.id)}">${escapeHtml(s.label)} <span class="store-chip__n">${sectionCount(s)}</span></a>`
    );
    chipsEl.innerHTML = bits.join("");
  }

  function renderSheetList() {
    sheetList.innerHTML = sections
      .map(
        (s) =>
          `<a class="store-sheet-item" href="#section-${escapeHtml(s.id)}" data-jump="${escapeHtml(s.id)}">${escapeHtml(s.label)} · ${sectionCount(s)}</a>`
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

  function boardMetaLabel(board: DemandStoreBoard): string {
    return board === "trending"
      ? "Trending now · short window"
      : "Leaders · multi-day demand";
  }

  function tabsHtml(s: DemandStoreSection, active: DemandStoreBoard): string {
    const nL = s.leaders.length;
    const nT = s.trending.length;
    // Hide strip when only one board has products
    if (nL === 0 || nT === 0) return "";

    const tab = (id: DemandStoreBoard, label: string, n: number) => {
      const on = active === id;
      return `<button
        type="button"
        class="store-tab${on ? " store-tab--on" : ""}"
        role="tab"
        aria-selected="${on ? "true" : "false"}"
        data-store-tab="${id}"
        data-section="${escapeHtml(s.id)}"
        title="${id === "leaders" ? "Full prior window — stabler leaders" : "Short-window spikes — Trending now"}"
      >${label} <span class="store-tab__n">${n}</span></button>`;
    };

    return `
      <div class="store-tabs" role="tablist" aria-label="${escapeHtml(s.label)} demand board">
        ${tab("leaders", "Leaders", nL)}
        ${tab("trending", "Trending", nT)}
      </div>
    `;
  }

  function renderSection(s: DemandStoreSection): string {
    const board = activeBoard(s);
    const list = boardProducts(s, board);
    const cards = list.map(cardHtml).join("");
    return `
      <section class="store-section" id="section-${escapeHtml(s.id)}" aria-labelledby="heading-${escapeHtml(s.id)}" data-section-id="${escapeHtml(s.id)}">
        <header class="store-section__head">
          <div class="store-section__titles">
            <h2 class="store-section__title" id="heading-${escapeHtml(s.id)}">${escapeHtml(s.label)}</h2>
            <p class="store-section__meta" data-section-meta>${list.length} picks · ${boardMetaLabel(board)}</p>
          </div>
          ${tabsHtml(s, board)}
        </header>
        <div class="store-grid" data-section-grid>${cards || `<p class="store-section__empty">No picks on this board yet.</p>`}</div>
      </section>
    `;
  }

  function paintSectionGrid(sectionId: string) {
    const s = sections.find((x) => x.id === sectionId);
    if (!s) return;
    const el = feed.querySelector<HTMLElement>(
      `[data-section-id="${CSS.escape(sectionId)}"]`
    );
    if (!el) return;
    const board = activeBoard(s);
    const list = boardProducts(s, board);
    const grid = el.querySelector<HTMLElement>("[data-section-grid]");
    const meta = el.querySelector<HTMLElement>("[data-section-meta]");
    if (grid) {
      grid.innerHTML =
        list.map(cardHtml).join("") ||
        `<p class="store-section__empty">No picks on this board yet.</p>`;
      wireImages(grid);
    }
    if (meta) {
      meta.textContent = `${list.length} picks · ${boardMetaLabel(board)}`;
    }
    el.querySelectorAll<HTMLButtonElement>("[data-store-tab]").forEach((btn) => {
      const id = btn.getAttribute("data-store-tab") as DemandStoreBoard;
      const on = id === board;
      btn.classList.toggle("store-tab--on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function wireTabs(scope: ParentNode) {
    scope.querySelectorAll<HTMLButtonElement>("[data-store-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sectionId = btn.getAttribute("data-section");
        const board = btn.getAttribute("data-store-tab") as DemandStoreBoard;
        if (!sectionId || (board !== "leaders" && board !== "trending")) return;
        boardBySection.set(sectionId, board);
        paintSectionGrid(sectionId);
      });
    });
  }

  function renderFeed() {
    if (!sections.length) {
      feed.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = loading
        ? "Loading nightly demand shelf…"
        : "No shoppable demand picks yet. Check back after the next midnight refresh.";
      return;
    }
    emptyEl.hidden = true;
    feed.innerHTML = sections.map(renderSection).join("");
    wireImages(feed);
    wireTabs(feed);
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

  function filterProducts(list: DemandStoreProduct[] | undefined, cap: number) {
    return (list || [])
      .filter((p) => {
        // Keep if we can open GSE by UPC or still have a dealer URL fallback.
        if (gseUpcSearchUrl(p.upc)) return true;
        return typeof p.url === "string" && /^https?:\/\//i.test(p.url);
      })
      .slice(0, cap);
  }

  function normalizeSections(data: DemandStorePayload): DemandStoreSection[] {
    const cap =
      typeof data.meta?.sectionCapacity === "number" &&
      data.meta.sectionCapacity > 0
        ? Math.min(data.meta.sectionCapacity, SECTION_ROW_CAPACITY)
        : SECTION_ROW_CAPACITY;

    if (Array.isArray(data.sections) && data.sections.length) {
      return data.sections
        .map((s) => {
          // v6+: leaders + trending. Legacy: only products (treat as leaders).
          const leaders = filterProducts(
            s.leaders?.length ? s.leaders : s.products,
            cap
          );
          const trending = filterProducts(s.trending, cap);
          if (!leaders.length && !trending.length) {
            return null;
          }
          // Default = board with more products (tie → leaders). Maximize first paint.
          const finalBoard: DemandStoreBoard =
            trending.length > leaders.length ? "trending" : "leaders";
          const products = finalBoard === "trending" ? trending : leaders;

          return {
            id: s.id,
            label: s.label,
            leaders,
            trending,
            defaultBoard: finalBoard,
            products,
          } satisfies DemandStoreSection;
        })
        .filter((s): s is DemandStoreSection => s != null);
    }

    // Legacy flat list fallback — leaders only
    const products = filterProducts(data.products, cap);
    if (!products.length) return [];
    return [
      {
        id: "all",
        label: "Demand picks",
        leaders: products,
        trending: [],
        defaultBoard: "leaders",
        products,
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
      boardBySection.clear();
      for (const s of sections) {
        boardBySection.set(s.id, s.defaultBoard);
      }
      generatedAt = data.generatedAt || null;
      windowLabel = data.windowLabel || "Previous 24 hours";
      const n = sections.reduce(
        (a, s) => a + boardProducts(s, activeBoard(s)).length,
        0
      );
      setStatus(
        `${n} picks · ${windowLabel} · Leaders + Trending · cards open GSE by UPC · refreshed ${relativeTime(generatedAt)}`
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
