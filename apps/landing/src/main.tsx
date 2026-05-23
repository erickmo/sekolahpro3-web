import { ViteReactSSG } from "vite-react-ssg";
import type { RouteRecord } from "vite-react-ssg";
import { SiteLayout } from "./layout/SiteLayout";
import { Home } from "./pages/Home";
import { Fitur } from "./pages/Fitur";
import { Berita } from "./pages/Berita";
import { BeritaDetail } from "./pages/BeritaDetail";
import { Partner } from "./pages/Partner";
import { Kontak } from "./pages/Kontak";
import "./styles.css";

const routes: RouteRecord[] = [
  {
    path: "/",
    element: <SiteLayout />,
    entry: "src/layout/SiteLayout.tsx",
    children: [
      { index: true, element: <Home />, entry: "src/pages/Home.tsx" },
      { path: "fitur", element: <Fitur />, entry: "src/pages/Fitur.tsx" },
      { path: "berita", element: <Berita />, entry: "src/pages/Berita.tsx" },
      {
        path: "berita/:slug",
        element: <BeritaDetail />,
        entry: "src/pages/BeritaDetail.tsx",
      },
      { path: "partner", element: <Partner />, entry: "src/pages/Partner.tsx" },
      { path: "kontak", element: <Kontak />, entry: "src/pages/Kontak.tsx" },
    ],
  },
];

export const createRoot = ViteReactSSG({ routes });
