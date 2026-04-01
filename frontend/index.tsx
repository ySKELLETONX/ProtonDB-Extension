import { Millennium, callable, definePlugin, IconsModule } from "@steambrew/client";

interface ProtonDBRating {
    tier: string;
    confidence: string;
    score: number;
    total: number;
    trendingTier: string;
}

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
const ratingCache = new Map<string, ProtonDBRating>();

async function fetchRating(appId: string): Promise<ProtonDBRating> {
    const cached = ratingCache.get(appId);
    if (cached) return cached;

    try {
        const raw = await GetProtonDBRating({ appid: appId });
        const rating: ProtonDBRating = JSON.parse(raw);
        ratingCache.set(appId, rating);
        return rating;
    } catch (err) {
        console.error("[ProtonDB] Failed to fetch rating:", err);
        return { tier: "unknown", confidence: "low", score: 0, total: 0, trendingTier: "unknown" };
    }
}

function createBadgeElement(rating: ProtonDBRating, appId: string): HTMLElement {
    const badge = document.createElement("a");
    badge.setAttribute(BADGE_ATTR, appId);
    badge.href = `https://www.protondb.com/app/${appId}`;
    badge.target = "_blank";

    const tierLabel = rating.tier.charAt(0).toUpperCase() + rating.tier.slice(1);
    badge.title = `ProtonDB: ${tierLabel} (${rating.total} reports)`;

    const bgColor = TIER_COLORS[rating.tier] || TIER_COLORS.unknown;

    badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        background: linear-gradient(135deg, ${bgColor}22, ${bgColor}44);
        border: 1px solid ${bgColor};
        border-radius: 4px;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s ease;
        margin-left: 12px;
        vertical-align: middle;
    `;

    badge.onmouseenter = () => { badge.style.background = `linear-gradient(135deg, ${bgColor}44, ${bgColor}66)`; };
    badge.onmouseleave = () => { badge.style.background = `linear-gradient(135deg, ${bgColor}22, ${bgColor}44)`; };

    const tierText = document.createElement("span");
    tierText.textContent = tierLabel;
    tierText.style.cssText = `
        color: ${bgColor};
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;

    badge.appendChild(tierText);
    return badge;
}

function extractAppId(pathname: string): string | null {
    const match = pathname.match(/\/library\/app\/(\d+)/);
    return match ? match[1] : null;
}

async function injectBadge(popupWindow: Window, appId: string): Promise<void> {
    try {
        const doc = popupWindow.document;

        if (doc.querySelector(`[${BADGE_ATTR}="${appId}"]`)) return;
        doc.querySelectorAll(`[${BADGE_ATTR}]`).forEach((el) => el.remove());

        const rating = await fetchRating(appId);
        if (rating.tier === "unknown") return;

        // Find the stats row in the game detail banner (near the play button)
        let target: Element | null = null;
        try {
            const elements = await Millennium.findElement(doc, '._1EAxK56o5a9Nieu5HYkJ4k', 5000);
            if (elements && elements.length > 0) {
                target = elements[elements.length - 1];
            }
        } catch (_) {
            // Element not found within timeout
        }

        if (!target) return;
        if (doc.querySelector(`[${BADGE_ATTR}="${appId}"]`)) return;

        const badge = createBadgeElement(rating, appId);
        target.parentElement?.insertBefore(badge, target.nextSibling);
    } catch (err) {
        console.error("[ProtonDB] Error injecting badge:", err);
    }
}

function setupNavigationObserver(popup: any): void {
    const popupWindow = popup?.m_popup;
    if (!popupWindow) return;

    let lastAppId = "";

    const check = () => {
        try {
            const loc = (window as any).MainWindowBrowserManager?.m_lastLocation;
            if (!loc) return;

            const appId = extractAppId(loc.pathname);
            if (!appId || appId === lastAppId) return;
            lastAppId = appId;

            injectBadge(popupWindow, appId);
        } catch (err) {
            console.error("[ProtonDB] Observer error:", err);
        }
    };

    const observer = new MutationObserver(check);
    observer.observe(popupWindow.document.body, { childList: true, subtree: true });
    check();
}

const SettingsPanel = () => {
    return <div style={{ padding: "16px" }}>
        <p>Displays ProtonDB compatibility ratings on Steam game pages.</p>
    </div>;
};

export default definePlugin(() => {
    try {
        const popupManager = (window as any).g_PopupManager;
        if (!popupManager) {
            return { title: "ProtonDB Extension", icon: <IconsModule.Network />, content: <SettingsPanel /> };
        }

        function handlePopup(popup: any): void {
            try {
                if (popup?.m_strName !== "SP Desktop_uid0") return;
                setupNavigationObserver(popup);
            } catch (err) {
                console.error("[ProtonDB] Error handling popup:", err);
            }
        }

        const existing = popupManager.GetExistingPopup?.("SP Desktop_uid0");
        if (existing) handlePopup(existing);
        popupManager.AddPopupCreatedCallback(handlePopup);
    } catch (err) {
        console.error("[ProtonDB] Init error:", err);
    }

    return {
        title: "ProtonDB Extension",
        icon: <IconsModule.Network />,
        content: <SettingsPanel />,
    };
});
