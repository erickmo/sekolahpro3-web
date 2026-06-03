# ADS-ADR-0001: Token HMAC + CORS terbatas + seleksi acak

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Ads Manager

## Konteks

SekolahPro memerlukan platform banner-ads yang aman untuk menayangkan iklan di 6 aplikasi konsumen (school, parent, student, merchant, landing, situs) yang dikelola dari admin SaaS terpusat (vernon_ads). Tantangan:

1. **Autentikasi guest**: iklan ditayangkan tanpa login user. Bagaimana verifikasi yang track/klik berasal dari creative yang valid, bukan dibuat-buat klien?
2. **Cross-origin requests**: landing dan situs adalah cross-origin. CORS harus dibatasi untuk keamanan.
3. **XSS dari destination URL**: admin author creative dengan destination_url. Bagaimana cegah klik membuka javascript: atau data: scheme?
4. **Seleksi creative**: dari many campaigns/creatives aktif, pilih mana untuk ditampilkan?

Keputusan ini merangkum tiga area keamanan/policy yang saling terkait.

## Keputusan

1. **Token HMAC (TTL 24 jam)**: setiap creative yang dikirim dari backend ke klien diiringi token yang ditandatangani HMAC-SHA256 dengan secret di `site_config.vernon_ads_token_secret`. Klien track/klik mengirim token kembali. Backend verifikasi token sebelum catat event. Creative ID di dalam token, jadi tidak bisa dipalsukan/ditukar klien. Implementasi: `vernon_ads.api.get_ad.get_ad` return creative + token; `track`/`click` endpoint valida token.

2. **CORS terbatas**: cross-origin requests (landing/situs ke vernon_ads) dibatasi ke origin tertentu (landing URL, situs URL), bukan `*`. Implementasi di backend CORS middleware or Frappe allow_origin setting.

3. **window.open scheme guard**: `AdBanner.safeHttpUrl()` parse destination URL dan reject protokol selain `http:` / `https:`. Jika invalid, jangan panggil `window.open`. Test: commit a3a5054 menambah test "does NOT open javascript: destination (XSS guard)".

4. **Seleksi creative acak**: dari pool campaign/creative valid (status Active, tanggal match, ad_type match), pilih satu secara acak. Bukan round-robin atau berdasarkan budget (no pacing di scope ini).

## Konsekuensi

### Positif
- **Token binding**: track/klik tidak bisa dipalsu dari klien. Creative ID tercengkeram token HMAC.
- **CORS boundary**: lintas-origin attacks melalui preflight request lebih sulit; origin terbatas.
- **XSS prevented**: window.open tidak merespons javascript:/data: URLs. Admin bisa author destination_url bebas; FE block berbahaya.
- **Acak neutral**: tidak ada bias tayang per advertiser; fair untuk multi-campaign.

### Negatif
- **Token management**: TTL 24 jam berarti cached creative expire, trigger re-fetch. Jika cache lama kemudian dipakai, token reject. Trade-off: cache simpel vs. re-request cost.
- **CORS list maintenance**: setiap origin baru (landing/situs baru) perlu di-whitelist di backend. Manual config burden.
- **Tidak ada smart targeting**: seleksi acak tidak optimasi frequency cap, geo, atau budget pacing. Campaign owner tidak kontrol impr/klik per property.

### Trade-off ditunda (YAGNI)
- **Budget pacing / billing**: tidak implement otomatis deductible budget. Tracker hanya catat; admin manual check spend.
- **Frequency cap**: tidak ada per-user impression limit per creative. User bisa lihat same ad berkali-kali.
- **Geo-targeting**: seleksi creative tidak filter berdasarkan IP/region.
- **Native / Interstitial / Video**: hanya Banner (gambar) di scope ini. Ad format lain ditunda.

## Referensi

- Backend: app `vernon_ads` (repo terpisah) di site `sekolahpro.localhost`
- Implementasi token: `packages/ads/src/client.ts` (trackImpression, resolveClick pass token); backend validate
- XSS guard: `packages/ads/src/AdBanner.tsx` safeHttpUrl() (lines 12–21), test line 76–87
- CORS: backend vernon_ads.api config (di repo terpisah)
- Commit XSS fix: a3a5054 "fix(ads): batasi window.open ke skema http(s) (cegah XSS)"
