# Shared ADR — Keputusan Lintas-Domain

Architecture Decision Records yang berlaku **global** (lintas domain): multi-tenancy,
autentikasi, integrasi lintas-app. Keputusan yang hanya menyangkut satu domain
disimpan di `docs/domains/{domain}/ADR/`, bukan di sini.

## Index

| ADR | Judul | Status |
|-----|-------|--------|
| [GLOBAL-ADR-0001](GLOBAL-ADR-0001-tenant-scoping.md) | Tenant scoping berbasis header + blocklist doctype global | Accepted |

## Konvensi

- Penomoran: `GLOBAL-ADR-NNNN-slug.md`.
- ADR domain memakai prefiks domain: `PERP-`, `EKS-`, `KOP-`, `SIT-`, `ASE-`, `AKA-`, `ADS-`.
- Sekali Accepted, ADR tidak dihapus — jika dibatalkan, tandai `Superseded by ...`.
- Backend (repo `vernon_*` terpisah) punya seri ADR sendiri (mis. `ADR-0043` tier ORG_ONLY);
  rujuk silang bila relevan, jangan duplikat nomornya.
