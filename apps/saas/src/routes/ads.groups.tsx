import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

const config: CrudConfig = {
  doctype: "Property Group",
  title: "Property Group",
  description: "Kelompok aplikasi target campaign",
  nameField: "name",
  listFields: ["name", "description"],
  fields: [
    { name: "name", label: "Nama Group", type: "text", required: true },
    { name: "description", label: "Deskripsi", type: "textarea" },
  ],
};

export const Route = createFileRoute("/ads/groups")({ component: () => <ResourceCrudPage config={config} /> });
