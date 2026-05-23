import { ViteReactSSG } from "vite-react-ssg";
import type { RouteRecord } from "vite-react-ssg";
import { App, Home, Fitur } from "./App";
import "./styles.css";

const routes: RouteRecord[] = [
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home />, entry: "src/App.tsx" },
      { path: "fitur", element: <Fitur />, entry: "src/App.tsx" },
    ],
  },
];

export const createRoot = ViteReactSSG({ routes });
