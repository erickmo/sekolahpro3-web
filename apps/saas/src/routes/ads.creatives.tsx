import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

// image is an Attach Image (file URL string). For this round we accept a URL in a
// text field; uploading is out of scope (admin pastes an existing /files/... or CDN URL).
const config: CrudConfig = {
  doctype: "Ad Creative",
  title: "Creative",
  description: "Materi banner (image) per campaign",
  nameField: "creative_name",
  listFields: ["name", "creative_name", "campaign", "ad_type", "status", "title"],
  fields: [
    { name: "creative_name", label: "Nama Creative", type: "text", required: true },
    { name: "campaign", label: "Campaign", type: "link", linkDoctype: "Campaign" },
    { name: "ad_type", label: "Tipe", type: "select", options: ["Banner", "Native", "Interstitial", "Video"] },
    { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    { name: "title", label: "Judul", type: "text" },
    { name: "destination_url", label: "URL Tujuan", type: "text", hideInTable: true },
    { name: "image", label: "Image URL", type: "text", hideInTable: true },
    { name: "width", label: "Lebar (px)", type: "number", hideInTable: true },
    { name: "height", label: "Tinggi (px)", type: "number", hideInTable: true },
    { name: "video_url", label: "Video URL", type: "text", hideInTable: true },
  ],
};

export const Route = createFileRoute("/ads/creatives")({ component: () => <ResourceCrudPage config={config} /> });
