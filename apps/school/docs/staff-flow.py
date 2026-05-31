"""Generate admin teacher-management flow diagram (PNG) for SchoolPro staff module."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.lines import Line2D

# Palette
BRAND = "#4f46e5"      # indigo
GURU = "#0ea5e9"       # sky
STAFF = "#f59e0b"      # amber
SHARED = "#10b981"     # emerald
INK = "#1e293b"
MUTE = "#64748b"
BG = "#ffffff"
CARD = "#f8fafc"

fig, ax = plt.subplots(figsize=(13, 9.5), dpi=200)
fig.patch.set_facecolor(BG)
ax.set_xlim(0, 130)
ax.set_ylim(0, 96)
ax.axis("off")

def box(x, y, w, h, text, fc, ec, tc="white", fs=10, bold=True, sub=None):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6,rounding_size=2.2",
                       fc=fc, ec=ec, lw=1.6, zorder=2)
    ax.add_patch(p)
    cy = y + h/2 + (1.6 if sub else 0)
    ax.text(x + w/2, cy, text, ha="center", va="center", color=tc,
            fontsize=fs, fontweight="bold" if bold else "normal", zorder=3)
    if sub:
        ax.text(x + w/2, y + h/2 - 2.4, sub, ha="center", va="center",
                color=tc, fontsize=7.4, zorder=3, alpha=0.92)
    return (x + w/2, y, x + w/2, y + h, x, y + h/2, x + w, y + h/2)

def arrow(p1, p2, color=MUTE, ls="-", lw=1.7, rad=0.0):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=15,
                        color=color, lw=lw, ls=ls,
                        connectionstyle=f"arc3,rad={rad}", zorder=1)
    ax.add_patch(a)

# Title
ax.text(65, 93, "Alur Admin Kelola Guru & Staff", ha="center", fontsize=18,
        fontweight="bold", color=INK)
ax.text(65, 89.3, "Modul Staff  /sch/:sekolah/staff", ha="center", fontsize=10,
        color=MUTE, family="monospace")

# 1. Dashboard
dash = box(50, 80, 30, 7, "1. Dashboard", BRAND, BRAND, sub="ringkasan: total · guru · staff · aktif")
# 2. Daftar Pegawai
daftar = box(50, 69, 30, 7.5, "2. Daftar Pegawai", BRAND, BRAND,
             sub='+ Tambah Pegawai -> pilih role')
arrow((dash[0], dash[1]), (daftar[2], daftar[3]), BRAND)

# Role split label
ax.text(65, 65.4, "Role menentukan jalur", ha="center", fontsize=9,
        color=MUTE, style="italic")

# Left column: GURU
ax.text(28, 62.5, "JALUR GURU", ha="center", fontsize=11, fontweight="bold", color=GURU)
g_mapel = box(11, 53.5, 34, 6.8, "3. Mapel Pengampu", GURU, GURU,
              sub="guru ↔ mapel ↔ kelas")
g_tugas = box(11, 44, 34, 6.8, "4. Penugasan", GURU, GURU,
              sub="beban ngajar / total JJM · Aktif")
g_sk = box(11, 34.5, 34, 6.8, "5. SK Mengajar", GURU, GURU,
           sub="per orang / Generate Massal")
arrow((daftar[2], daftar[1]), (g_mapel[6]+13, g_mapel[3]), GURU, rad=0.12)
arrow((g_mapel[0], g_mapel[1]), (g_tugas[2], g_tugas[3]), GURU)
arrow((g_tugas[0], g_tugas[1]), (g_sk[2], g_sk[3]), GURU)
ax.text(46.5, 47.4, "Aktif → Buat SK", ha="left", fontsize=7.3, color=MUTE)

# Right column: STAFF
ax.text(102, 62.5, "JALUR STAFF", ha="center", fontsize=11, fontweight="bold", color=STAFF)
s_jab = box(85, 53.5, 34, 6.8, "3. Jabatan (master)", STAFF, STAFF,
            sub="kelola jenis jabatan")
s_sk = box(85, 44, 34, 6.8, "4. SK Jabatan", STAFF, STAFF,
           sub="Terbitkan SK posisi")
arrow((daftar[7], daftar[1]+1), (s_jab[6]-13, s_jab[3]), STAFF, rad=-0.12)
arrow((s_jab[0], s_jab[1]), (s_sk[2], s_sk[3]), STAFF)

# SK workflow note (shared)
box(50, 44, 30, 6.8, "Workflow SK", "#ede9fe", BRAND, tc=BRAND, fs=9,
    sub="Diajukan→Disetujui→Diterbitkan")
arrow((45.3, 37.9), (49.6, 45.5), BRAND, ls="--", lw=1.2, rad=-0.1)
arrow((85, 47.4), (80.4, 47.4), BRAND, ls="--", lw=1.2)

# Shared: Berkas
berkas = box(38, 24, 54, 7, "6. Berkas (semua pegawai)", SHARED, SHARED,
             sub="lisensi / sertifikat · expiry · Perpanjang")
arrow((g_sk[0], g_sk[1]), (berkas[6]+12, berkas[3]), SHARED, rad=0.1)
arrow((s_sk[0], s_sk[1]), (berkas[7]-12, berkas[3]), SHARED, rad=-0.1)

# Detail
detail = box(38, 11.5, 54, 8, "7. Detail Pegawai  /staff/:nip", INK, INK,
             sub="Profil · Mengajar(guru) · Kepegawaian(staff) · Berkas · Kehadiran")
arrow((berkas[0], berkas[1]), (detail[2], detail[3]), MUTE)
arrow((daftar[0], daftar[1]-0.2), (detail[0], detail[3]+0.2), MUTE, ls="--", lw=1.2, rad=0.45)
ax.text(95.5, 40, "klik baris", ha="left", fontsize=7, color=MUTE, rotation=90, alpha=0.0)

# Legend
leg = [
    Line2D([0],[0], marker="s", color="w", markerfacecolor=BRAND, markersize=11, label="Umum / entry"),
    Line2D([0],[0], marker="s", color="w", markerfacecolor=GURU, markersize=11, label="Jalur Guru"),
    Line2D([0],[0], marker="s", color="w", markerfacecolor=STAFF, markersize=11, label="Jalur Staff"),
    Line2D([0],[0], marker="s", color="w", markerfacecolor=SHARED, markersize=11, label="Berkas (semua)"),
]
ax.legend(handles=leg, loc="lower center", ncol=4, frameon=False,
          bbox_to_anchor=(0.5, -0.02), fontsize=9)

plt.tight_layout()
import os
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "staff-flow.png")
plt.savefig(out, dpi=200, facecolor=BG, bbox_inches="tight")
print("saved", out)
