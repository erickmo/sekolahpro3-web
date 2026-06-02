import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

const config: CrudConfig = {
  doctype: "Campaign",
  title: "Campaign",
  description: "Kampanye iklan terjadwal per property group",
  nameField: "campaign_name",
  listFields: ["name", "campaign_name", "status", "customer", "property_group", "start_date", "end_date"],
  fields: [
    { name: "campaign_name", label: "Nama Campaign", type: "text", required: true },
    { name: "status", label: "Status", type: "select", options: ["Draft", "Active", "Paused", "Completed"] },
    { name: "customer", label: "Customer", type: "link", linkDoctype: "Ads Customer" },
    { name: "property_group", label: "Property Group", type: "link", linkDoctype: "Property Group" },
    { name: "start_date", label: "Mulai", type: "date" },
    { name: "end_date", label: "Selesai", type: "date" },
    { name: "pricing_model", label: "Pricing", type: "select", options: ["CPM", "CPC", "Fixed"], hideInTable: true },
    { name: "budget", label: "Budget", type: "number", hideInTable: true },
    { name: "notes", label: "Catatan", type: "textarea", hideInTable: true },
  ],
};

export const Route = createFileRoute("/ads/campaigns")({ component: () => <ResourceCrudPage config={config} /> });
