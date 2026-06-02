import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

const config: CrudConfig = {
  doctype: "Ad Slot",
  title: "Slot",
  description: "Titik penempatan banner di sebuah property (key di-slugify otomatis)",
  nameField: "slot_key",
  listFields: ["name", "slot_key", "property", "ad_type", "width", "height"],
  fields: [
    { name: "slot_key", label: "Slot Key", type: "text", required: true },
    { name: "property", label: "Property", type: "link", linkDoctype: "Property" },
    { name: "ad_type", label: "Tipe", type: "select", options: ["Banner", "Native", "Interstitial", "Video"] },
    { name: "width", label: "Lebar (px)", type: "number" },
    { name: "height", label: "Tinggi (px)", type: "number" },
    { name: "description", label: "Deskripsi", type: "textarea", hideInTable: true },
  ],
};

export const Route = createFileRoute("/ads/slots")({ component: () => <ResourceCrudPage config={config} /> });
