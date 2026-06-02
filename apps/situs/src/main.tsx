import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AdsProvider } from "@sekolahpro/ads";
import { App } from "./App";
import "./styles.css";
import "./templates/skins.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const adsBase = (import.meta.env.VITE_ADS_BASE as string | undefined) ?? "";
const adsKey = (import.meta.env.VITE_ADS_PROPERTY_KEY as string | undefined) ?? "";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdsProvider baseUrl={adsBase} propertyKey={adsKey}>
          <App />
        </AdsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
