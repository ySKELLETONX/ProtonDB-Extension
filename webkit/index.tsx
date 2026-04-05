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
};

const BADGE_ATTR = "data-protondb-badge";
const ratingCache = new Map<string, any>();

function extractAppId(): string | null {
    const match = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
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
        console.error("[ProtonDB] Failed to fetch rating:", err);
        return { tier: "unknown", total: 0 };
    }
}

function createBadge(tier: string, appId: string, total: number): HTMLElement {
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    const bgColor = TIER_COLORS[tier] || TIER_COLORS.unknown;

    // Create a container styled like a dev_row
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

async function injectBadge() {
    const appId = extractAppId();
    if (!appId) return;
    if (document.querySelector(`[${BADGE_ATTR}]`)) return;

    const rating = await fetchRating(appId);
    if (rating.tier === "unknown") return;

    // Insert after the last dev_row (developer/publisher) in the sidebar
    const devRows = document.querySelectorAll(".glance_ctn_responsive_left .dev_row");
    const lastDevRow = devRows.length > 0 ? devRows[devRows.length - 1] : null;

    if (!lastDevRow) {
        // Fallback: insert after release_date
        const releaseDate = document.querySelector(".glance_ctn_responsive_left .release_date");
        if (releaseDate) {
            const badge = createBadge(rating.tier, appId, rating.total);
            releaseDate.after(badge);
            return;
        }
        return;
    }

    const badge = createBadge(rating.tier, appId, rating.total);
    lastDevRow.after(badge);
}

export default async function WebkitMain() {
    console.log("[ProtonDB-webkit] WebkitMain running, URL:", window.location.href);

    // Only run on store app pages
    if (!window.location.href.match(/store\.steampowered\.com\/app\//)) {
        console.log("[ProtonDB-webkit] Not a store app page, skipping");
        return;
    }

    console.log("[ProtonDB-webkit] Store page detected, waiting for content...");

    // Wait for page content to load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => injectBadge(), 1000);
        });
    } else {
        setTimeout(() => injectBadge(), 1000);
    }
}
