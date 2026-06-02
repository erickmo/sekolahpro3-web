# Ads Manager — Design

Date: 2026-06-02
Status: Approved (pending user review)
Repos: `sekolahpro-web` (frontend), `vernon_ads` (backend, own git on `master`)

## Goal

A banner-ads platform: managed from the SaaS admin app, served into every other
SekolahPro app. Each consuming app is a tracked "Property". Impressions and
clicks are recorded per creative + slot.

## Existing state (do not rebuild)

The `vernon_ads` Frappe app is already fully built (own git repo, branch
`master`) but **not installed on any site** and **not wired to any frontend**.

Doctypes (7):

| Doctype | Key fields |
|---|---|
| Property | `property_name` (PK), `status` (Active/Inactive), `platform` (Web/Mobile), `property_group` (Link), `url`, `api_key` |
| Property Group | name (PK), `description` |
| Ad Slot | `slot_key` (PK), `property` (Link), `ad_type` (Banner/Native/Interstitial/Video), `width`, `height`, `description` |
| Campaign | `campaign_name` (PK), `status` (Draft/Active/Paused/Completed), `customer` (Link), `property_group` (Link), `start_date`, `end_date`, `pricing_model` (CPM/CPC/Fixed), `budget`, `notes` |
| Ad Creative | `creative_name` (PK), `campaign` (Link), `ad_type`, `status` (Active/Inactive), `title`, `destination_url`, `width`, `height`, `image` (Attach Image), `video_url`, `body_html` |
| Ad Event | `ad_creative` (Link), `ad_slot` (Link), `event_type` (Impression/Click), `timestamp`, `ip_address`, `user_agent`, `utm_*` |
| Ads Customer | `customer_name` (PK), `status`, `email`, `phone`, `company`, `contact_person`, `notes` |

API (all `allow_guest=True`):

- `vernon_ads.api.get_ad.get_ad(slot, property_key)` → JSON creative + signed HMAC token + `track_url`/`click_url`. **Primary path for the SPA.**
- `vernon_ads.api.serve.js(slot, property_key)` → vanilla-JS injection (legacy, unused by us).
- `vernon_ads.api.track.track(token)` → records an Impression `Ad Event`.
- `vernon_ads.api.click.click(token, utm_*)` → records a Click `Ad Event`, returns `{redirect}`.

Selection flow (`utils.select_creative`): `Property(api_key, Active)` → `Ad Slot(slot_key, property)` → active `Campaign(property_group, date in range)` → matching `Ad Creative(ad_type, status Active, size)` → random pick. Tokens are HMAC-signed (`vernon_ads_token_secret`), 24 h TTL.

Backend tests already green.

## Decisions (from brainstorming)

- **Scope:** full-stack — frontend + deploy backend; backend stays doctype-driven (native Frappe, no framework bypass).
- **Backend site:** `saas.localhost` hosts `vernon_ads` and serves the ad API (ads are platform-level / cross-tenant).
- **Placement:** named slots per app (`<AdBanner slot="..." />`).
- **Targets:** all 6 consumer apps — `school`, `parent`, `student`, `merchant`, `landing`, `situs`.
- **Analytics:** concise — KPI (impressions/clicks/CTR) + breakdown tables (per campaign, per property) + daily trend. One `stats` endpoint.
- **Banner type:** image only (Banner). `body_html` ignored in the FE this round → no HTML sanitization dependency. Video/Native/Interstitial deferred.

## Delivery approach (chosen)

JSON API + shared React package. `<AdBanner>` calls `get_ad` (JSON), renders an
image+link via the design system, fires impression on viewport intersect, routes
clicks through `click`. Rejected: `serve.js` script-injection (awkward in SPA,
untestable), iframe (responsive + tracking pain).

## Architecture

```
saas.localhost  (Frappe + vernon_ads installed)
 ├─ /api/resource/<Doctype>      ← SaaS admin CRUD  (auth: SekolahPro Admin)
 ├─ get_ad / track / click       ← guest, CORS-enabled  ← all 6 consumer apps
 └─ api/stats.py (NEW)           ← analytics aggregation JSON (admin dashboard)

apps/saas (admin)      → new /ads/* module: dashboard, customers,
                          properties (+ slots), campaigns, creatives
packages/ads (NEW)     → <AdsProvider> + <AdBanner> + useAd hook + tracking
apps/{school,parent,student,merchant,landing,situs}
                       → wrap root in <AdsProvider adsBaseUrl propertyKey>,
                          drop <AdBanner slot="..."/> at named slots
```

## Components

### A. Backend `vernon_ads` (own repo, branch off `master`)

- **Deploy:** install on `saas.localhost`; `bench set-config -g vernon_ads_token_secret <random>`; enable CORS for the 6 app origins in `saas.localhost/site_config.json` (`allow_cors` allowlist, not `*`).
- **NEW `api/stats.py`** — one `@frappe.whitelist()` method (≤10 lines) delegating to a helper that runs GROUP BY aggregation: totals (impressions/clicks/CTR), per-campaign, per-property, daily series over a date range. Justified low-code Priority 5: the React admin needs JSON; a native Query Report does not return cleanly to React.
- **`Ad Event` controller `before_insert`** sets `timestamp = frappe.utils.now()` (currently unset) — doctype controller method, Priority 1. Needed for the daily-trend series.
- **Seed fixtures:** 1 Property Group (`SekolahPro Apps`) + 6 Property records (one per app, generated `api_key`, `status=Active`) + starter Slots per property. Exported via `hooks.py` fixtures.

### B. `packages/ads` — new shared package `@sekolahpro/ads`

- `<AdsProvider adsBaseUrl propertyKey>` — React context holding the ads API base URL + this app's property key.
- `useAd(slot)` — fetches `get_ad?slot&property_key`, returns `{creative|null, loading}`.
- `<AdBanner slot className>` — renders image+link (Banner). `IntersectionObserver` fires impression `track` **once** when ≥50 % visible. Click → `GET click?token` → `window.open(redirect)`. No ad / error → renders nothing; reserves `width×height` to avoid layout shift.
- Tiny own `fetch` (guest, cross-origin, different base URL) — does **not** use `@sekolahpro/api-client`. Depends on `@sekolahpro/ui` + `@sekolahpro/config`.

### C. SaaS admin module (`apps/saas/src/routes/ads.*`)

- Sidebar: new **Ads** section.
- Routes: `ads.index` (analytics dashboard), `ads.customers`, `ads.properties` (+ slot management), `ads.campaigns`, `ads.creatives`. CRUD via `useResource*` hooks against `/api/resource/<Doctype>`.
- **Add the 7 vernon_ads doctypes to `TENANT_BLOCKLIST`** in `packages/api-client/src/frappeResource.ts` — they have no `sekolah` field; without this, auto-injected tenant filters break list queries.
- Route guard inherits root `RequireAuth roles={["SekolahPro Admin"]}`.

### D. Consumer wiring (6 apps)

- Each app root: wrap in `<AdsProvider adsBaseUrl={env.VITE_ADS_BASE} propertyKey={env.VITE_ADS_PROPERTY_KEY}>`.
- Named slots placed per app (e.g. `dashboard-top`, `sidebar`, `content-bottom`) — exact list fixed in the implementation plan.
- New env vars per app: `VITE_ADS_BASE`, `VITE_ADS_PROPERTY_KEY`. Add to `packages/config` env parsing.

## Data flow

`AdBanner` mounts → `GET get_ad?slot&property_key` → creative + signed token →
render image+link → on ≥50 % visible: `POST track {token}` (Impression, once) →
on click: `GET click?token` → `window.open(redirect)`.

## Security

- HMAC-signed tokens already gate `track`/`click` — creative IDs cannot be spoofed.
- `api_key` is a public read-key (guest serve) — safe to embed per app; not a secret.
- CORS restricted to the known app origins, never `*`.
- `body_html` not rendered this round → no XSS surface from creative HTML.

## Testing

- Backend (`vernon_ads`, pytest): `stats` aggregation (totals, per-campaign, per-property, daily series, CTR math); `Ad Event` timestamp default. Existing serve/track/click stay green.
- `packages/ads` (vitest + RTL): renders ad / renders nothing on no-ad; impression fires exactly once on intersect; click opens redirect; reserves dimensions.
- SaaS admin (vitest): CRUD views render with mocked resource hooks; `TENANT_BLOCKLIST` regression (vernon_ads doctypes not tenant-filtered).

## Scope boundaries (YAGNI)

- Banner (image) only. Video / Native / Interstitial deferred (backend supports; FE not built).
- No budget pacing / billing automation (campaign `budget` is display-only).
- No frequency capping, geo-targeting, or A/B weighting (selection stays random).
- `body_html` rich creatives deferred.

## Cross-repo / process notes

- Backend changes land in the `vernon_ads` repo (branch off `master`); frontend in `sekolahpro-web` (`feat/ads-manager` off `main`).
- Implementation runs in an isolated git worktree for the web repo (shared-checkout clobber risk per project memory).
