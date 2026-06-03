import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

const config: CrudConfig = {
  doctype: "Property",
  title: "Property (App)",
  description: "Aplikasi yang menayangkan banner — api_key dipakai di env app",
  nameField: "property_name",
  listFields: ["name", "property_name", "status", "platform", "property_group", "api_key"],
  fields: [
    { name: "property_name", label: "Nama Property", type: "text", required: true },
    { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    { name: "platform", label: "Platform", type: "select", options: ["Web", "Mobile"] },
    { name: "property_group", label: "Group", type: "link", linkDoctype: "Property Group" },
    { name: "url", label: "URL", type: "text", hideInTable: true },
    { name: "api_key", label: "API Key", type: "text", readOnly: true },
  ],
};

export const Route = createFileRoute("/ads/properties")({ component: () => <ResourceCrudPage config={config} /> });
