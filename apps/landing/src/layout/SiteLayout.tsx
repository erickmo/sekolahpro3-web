import { Outlet } from "react-router-dom";
import { AdsProvider } from "@sekolahpro/ads";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

const adsBase = (import.meta.env.VITE_ADS_BASE as string | undefined) ?? "";
const adsKey = (import.meta.env.VITE_ADS_PROPERTY_KEY as string | undefined) ?? "";

export function SiteLayout() {
  return (
    <AdsProvider baseUrl={adsBase} propertyKey={adsKey}>
      <div className="min-h-screen flex flex-col bg-bg text-fg">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AdsProvider>
  );
}
