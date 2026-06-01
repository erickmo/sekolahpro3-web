import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./layout/SiteLayout";
import { Home } from "./pages/Home";
import { ProfilPage } from "./pages/ProfilPage";
import { BeritaIndex } from "./pages/BeritaIndex";
import { BeritaDetail } from "./pages/BeritaDetail";
import { AgendaPage } from "./pages/AgendaPage";
import { GaleriPage } from "./pages/GaleriPage";
import { PrestasiPage } from "./pages/PrestasiPage";
import { PpdbPage } from "./pages/PpdbPage";
import { PpdbSukses } from "./pages/PpdbSukses";
import { KontakPage } from "./pages/KontakPage";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/profil/:slug" element={<ProfilPage />} />
        <Route path="/berita" element={<BeritaIndex />} />
        <Route path="/berita/:slug" element={<BeritaDetail />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/galeri" element={<GaleriPage />} />
        <Route path="/prestasi" element={<PrestasiPage />} />
        <Route path="/ppdb" element={<PpdbPage />} />
        <Route path="/ppdb/sukses" element={<PpdbSukses />} />
        <Route path="/kontak" element={<KontakPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
