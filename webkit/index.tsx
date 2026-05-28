import { callable } from "@steambrew/webkit";

const GetProtonDBRating = callable<[{ appid: string }], string>("GetProtonDBRating");

const TIER_COLORS: Record<string, string> = {
    platinum: "#b5e2ff",
    gold: "#cfaf1d",
    silver: "#a5a5a5",
    bronze: "#cd7f32",
    borked: "#ff4444",
    pending: "#666666",
    unknown: "#666666",
    loading: "#555555",
};

const BADGE_ATTR = "data-protondb-badge";
const ratingCache = new Map<string, any>();

function extractAppIdFromUrl(url: string): string | null {
    const match = url.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
}

async function fetchRating(appId: string) {
    const cached = ratingCache.get(appId);
    if (cached) return cached;

    try {
        const raw = await GetProtonDBRating({ appid: appId });
        const rating = JSON.parse(raw);
        ratingCache.set(appId, rating);
        return rating;
    } catch (err) {
        return { tier: "unknown", total: 0 };
    }
}

// --- Store app page badge (sidebar dev_row style) ---

function createStoreBadge(tier: string, appId: string, total: number): HTMLElement {
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    const bgColor = TIER_COLORS[tier] || TIER_COLORS.unknown;

    const row = document.createElement("div");
    row.setAttribute(BADGE_ATTR, appId);
    row.className = "dev_row";
    row.style.cssText = "padding: 4px 0;";

    const subtitle = document.createElement("div");
    subtitle.className = "subtitle column";
    subtitle.textContent = "ProtonDB:";

    const summary = document.createElement("div");
    summary.className = "summary column";

    const link = document.createElement("a");
    link.href = `https://www.protondb.com/app/${appId}`;
    link.target = "_blank";
    link.title = `${total} reports — Click for details`;
    link.textContent = tierLabel;
    link.style.cssText = `
        color: ${bgColor} !important;
        font-weight: 700 !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-decoration: none !important;
    `;

    summary.appendChild(link);
    row.appendChild(subtitle);
    row.appendChild(summary);
    return row;
}

async function injectStorePageBadge() {
    const appId = extractAppIdFromUrl(window.location.href);
    if (!appId) return;
    if (document.querySelector(`[${BADGE_ATTR}]`)) return;

    const rating = await fetchRating(appId);
    if (rating.tier === "unknown") return;

    const devRows = document.querySelectorAll(".glance_ctn_responsive_left .dev_row");
    const lastDevRow = devRows.length > 0 ? devRows[devRows.length - 1] : null;

    if (!lastDevRow) {
        const releaseDate = document.querySelector(".glance_ctn_responsive_left .release_date");
        if (releaseDate) {
            releaseDate.after(createStoreBadge(rating.tier, appId, rating.total));
        }
        return;
    }

    lastDevRow.after(createStoreBadge(rating.tier, appId, rating.total));
}

// --- Search results / browse page badges ---

function createSearchBadge(tier: string): HTMLElement {
    const tierLabel = tier === "unknown" ? "N/A" : tier === "loading" ? "..." : tier.charAt(0).toUpperCase() + tier.slice(1);
    const bgColor = TIER_COLORS[tier] || TIER_COLORS.unknown;

    const badge = document.createElement("span");
    badge.className = "protondb-search-badge";
    badge.textContent = tierLabel;
    badge.style.cssText = `
        color: ${bgColor} !important;
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 8px;
        padding: 1px 6px;
        border: 1px solid ${bgColor}66;
        border-radius: 3px;
        background: ${bgColor}15;
        white-space: nowrap;
    `;

    return badge;
}

async function injectSearchBadge(row: Element) {
    if (row.querySelector(".protondb-search-badge")) return;

    const href = (row as HTMLAnchorElement).href;
    if (!href) return;

    const appId = extractAppIdFromUrl(href);
    if (!appId) return;

    const platforms = row.querySelector(".search_platforms");
    const target = platforms || row.querySelector(".search_name");
    if (!target) return;

    // Show loading placeholder
    const placeholder = createSearchBadge("loading");
    target.appendChild(placeholder);

    const rating = await fetchRating(appId);
    placeholder.replaceWith(createSearchBadge(rating.tier));
}

async function processSearchResults() {
    const rows = document.querySelectorAll(".search_result_row");
    if (rows.length === 0) return;

    // Process in batches of 5 to avoid hammering the API
    for (let i = 0; i < rows.length; i += 5) {
        const batch = Array.from(rows).slice(i, i + 5);
        await Promise.all(batch.map(row => injectSearchBadge(row)));
    }

    // Watch for new results loaded via infinite scroll
    const container = document.querySelector("#search_resultsRows");
    if (container) {
        const observer = new MutationObserver(() => {
            const newRows = container.querySelectorAll(".search_result_row:not(:has(.protondb-search-badge))");
            newRows.forEach(row => injectSearchBadge(row));
        });
        observer.observe(container, { childList: true });
    }
}

// --- Home page (New & Trending, Top Sellers, etc.) ---

async function injectTabItemBadge(item: Element) {
    if (item.querySelector(".protondb-search-badge")) return;

    const href = (item as HTMLAnchorElement).href;
    if (!href) return;

    const appId = extractAppIdFromUrl(href);
    if (!appId) return;

    const name = item.querySelector(".tab_item_name");
    if (!name) return;

    const placeholder = createSearchBadge("loading");
    name.appendChild(placeholder);

    const rating = await fetchRating(appId);
    const badge = createSearchBadge(rating.tier);
    placeholder.replaceWith(badge);
}

async function processHomePage() {
    // Only process tab_item elements (the list items in New & Trending, Top Sellers, etc.)
    const items = document.querySelectorAll("a.tab_item");
    if (items.length === 0) return;

    // Process in batches of 5
    for (let i = 0; i < items.length; i += 5) {
        const batch = Array.from(items).slice(i, i + 5);
        await Promise.all(batch.map(item => injectTabItemBadge(item)));
    }

    // Watch for tab switches loading new content
    const tabContents = document.querySelectorAll("[id^='tab_'][id$='_content']");
    tabContents.forEach(container => {
        const observer = new MutationObserver(() => {
            const newItems = container.querySelectorAll("a.tab_item:not(:has(.protondb-search-badge))");
            const batch = Array.from(newItems).slice(0, 10);
            batch.forEach(item => injectTabItemBadge(item));
        });
        observer.observe(container, { childList: true, subtree: true });
    });
}

// --- Entry point ---

export default async function WebkitMain() {
    const url = window.location.href;

    if (url.match(/store\.steampowered\.com\/app\//)) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => setTimeout(() => injectStorePageBadge(), 1000));
        } else {
            setTimeout(() => injectStorePageBadge(), 1000);
        }
        return;
    }

    // Store home page — New & Trending, Top Sellers, etc.
    if (url.match(/store\.steampowered\.com\/?(\?|$|#)/)) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => setTimeout(() => processHomePage(), 2000));
        } else {
            setTimeout(() => processHomePage(), 2000);
        }
        return;
    }

    if (url.match(/store\.steampowered\.com\/search/)) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => setTimeout(() => processSearchResults(), 1500));
        } else {
            setTimeout(() => processSearchResults(), 1500);
        }
        return;
    }
}
