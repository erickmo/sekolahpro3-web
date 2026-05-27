import { Routes, Route } from "react-router-dom";
import { SiteLayout } from "./layout/SiteLayout";
import { Home } from "./pages/Home";
import { Fitur } from "./pages/Fitur";
import { Berita } from "./pages/Berita";
import { BeritaDetail } from "./pages/BeritaDetail";
import { Partner } from "./pages/Partner";
import { Kontak } from "./pages/Kontak";
import { Login } from "./pages/Login";
import { Ppdb } from "./pages/Ppdb";
import { PpdbSukses } from "./pages/PpdbSukses";

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/fitur" element={<Fitur />} />
        <Route path="/berita" element={<Berita />} />
        <Route path="/berita/:slug" element={<BeritaDetail />} />
        <Route path="/partner" element={<Partner />} />
        <Route path="/kontak" element={<Kontak />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ppdb" element={<Ppdb />} />
        <Route path="/ppdb/sukses" element={<PpdbSukses />} />
      </Route>
    </Routes>
  );
}
