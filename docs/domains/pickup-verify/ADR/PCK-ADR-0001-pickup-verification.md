# PCK-ADR-0001: Mekanisme Verifikasi Penjemputan Token HMAC + PIN Fallback

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Verifikasi Penjemputan (Pickup Verification)

## Konteks

Aplikasi SekolahPro perlu memastikan bahwa siswa hanya diserahkan kepada orang tua/wali yang tersertifikasi oleh sistem sekolah. Opsi desain:

1. **PIN-only** — Petugas masukkan NIS + PIN per penjemput. Sederhana, tidak bergantung infrastruktur; tapi PIN 6 digit agak lemah (brute force dalam ~1 juta attempt), rate limiting saja tidak cukup untuk lingkungan gerbang sekolah di mana staff bisa terdesak.
2. **QR code + PIN fallback** — Parent app tampilkan QR code berputar setiap 30 detik (token HMAC signed server, 30 detik expire, single-use via jti). Petugas scan dengan @zxing/browser atau fallback PIN jika kamera rusak. Lebih kuat (token opak, server-side validation, single-use mencegah replay), tapi kompleksitas token lifecycle + polling parent untuk approval pada paid tier.
3. **One-time passcode via SMS** — Orang tua terima 6 digit SMS saat scan dimulai. Petugas enter PIN. Migitasi tapi memerlukan SMS gateway + latency.

**Pilihan:** Opsi 2 — token HMAC + PIN fallback. Rationale: keseimbangan keamanan (token opak single-use) dan resiliensi (PIN cadangan), sesuai dengan scale/tier SekolahPro (paid tier dapat tier-gating untuk pending approval, free tier instant).

## Keputusan

1. **Trust Model Server-Signed Token:**
   - Parent app tidak memiliki material signing — setiap QR diterbitkan backend.
   - Token = `base64url(payload.signature)` di mana payload = JSON `{nis, pickup_person_id, jti, exp}` dan signature = HMAC-SHA256 dengan server secret `PICKUP_TOKEN_SECRET` (Frappe site config, never on client).
   - Expire dalam 30 detik; backend track `jti` (JWT ID) per token. Konsumsi token record `jti` di Pickup Event row; replay dalam window 30 detik → `token_consumed` error.

2. **PIN Fallback BCrypt + Rate Limiting:**
   - Penjemput PIN opsional (6 digit, stored bcrypt cost 12, never returned API).
   - Rate limit: 3 attempt per orang per 15 menit. Attempt ke-4 → `pin_locked`.
   - Client-side + backend tolak weak patterns: 000000, 111111, 123456, 654321, 123123.
   - Reset PIN hanya via orang tua (tidak ada staff override desk).

3. **Tier-Gated Approval (Paid Only):**
   - Free tier: event auto-approve (status=approved, instant release allowed).
   - Paid tier: event pending sampai orang tua approve via parent app (status=pending). Petugas lihat spinner "Menunggu konfirmasi orang tua…", poll setiap 2 detik. Decline = red banner.
   - Backend gate di `staff_scan_token` dan `staff_verify_pin`: baca `tenant.features.includes("pickup_realtime_notify")` + parent.subscription_tier. Tier inference dari session user's Tenant.

4. **Single Source of Write Truth — No Shortcut Paths:**
   - Petugas tidak bisa bypass token/PIN verification (e.g., manual status=approved patch).
   - Setiap event creation + status flip via whitelisted API method (`staff_scan_token`, `staff_verify_pin`, `staff_complete_pickup`, `staff_decline_pickup`, `parent_respond_pickup`).
   - Audit trail lengkap: failed attempts juga logged di Pickup Event rows (status=declined, note=reason).

## Konsekuensi

### Positif

- **Keamanan cryptographic:** Token opak + short lifetime + single-use mencegah brute force / replay dalam praktik. Orang tua yang smart phone rusak masih punya PIN fallback.
- **Tier-gating yang jelas:** Paid tier mendapat parent confirmation step (risk mitigation untuk nilai tinggi); free tier dapat instant release (UX ringan).
- **Audit trail:** Setiap attempt (sukses/gagal) logged. Sekolah dapat lihat pattern (attempt PIN ganda, token expire count).
- **Tidak perlukan SMS gateway:** Hanya HTTPS + polling; infrastruktur minimal.

### Negatif

- **Complexity in lifetime management:** 30-second token window berarti parent perlu UI polling (auto-refresh 5 detik sebelum expire). Jika parent close app, next scan perlu token baru — UX friction. Mitigated by parent auto-refresh logic dalam useEffect.
- **Jti replay tracking:** Backend harus track consumed jti (atau HMAC lagi setiap verify). Opsi lain: short-lived cache (Redis/cache server) untuk "jti already used" — overhead kecil; memilih SQLite row insertion untuk simplicity (1 row per attempt acceptable).
- **PIN reset via parent:** Tidak ada desk recovery jika parent/orang tua hilang akses (e.g., HP rusak). Solusi: PIN optional (default zero), backup QR print atau SMS one-time passcode di release-blocked state — future.
- **Tier inference complexity:** Backend baca tenant.features + user.subscription_tier. Jika tier flag hilang/salah di data, sekolah bisa instant-approve saat seharusnya pending atau sebaliknya. Mitigated by clear logging (setiap scan log tier decision) + QA test tier boundaries.

### Trade-off Ditunda (YAGNI)

- Native push notifications — rely on app foreground + polling 2-3 detik (reasonable UX).
- Geofencing (scan hanya dalam perimeter GPS sekolah) — added complexity untuk location tracking; MVP tidak perlu.
- Face recognition / liveness check — security theater; tidak ada real threat model di sekolah zone.
- SMS OTP fallback — adds gateway cost + latency; PIN fallback sufficient.

## Referensi

- Spec: `docs/superpowers/specs/2026-05-29-pickup-verification-design.md`
- Plan: `docs/superpowers/plans/2026-05-29-pickup-verification.md`
- Parent app route: `apps/parent/src/routes/pickup.tsx`
- School app route: `apps/school/src/routes/sch.$sekolah.pickup-verify.tsx`
- Data hooks: `apps/parent/src/data/pickup.ts`, `apps/school/src/data/pickup.ts`
