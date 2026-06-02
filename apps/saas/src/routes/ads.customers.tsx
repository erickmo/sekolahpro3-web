import { createFileRoute } from "@tanstack/react-router";
import { ResourceCrudPage } from "../components/crud/ResourceCrudPage";
import type { CrudConfig } from "../components/crud/types";

const config: CrudConfig = {
  doctype: "Ads Customer",
  title: "Customer",
  description: "Pengiklan / pemasang iklan",
  nameField: "customer_name",
  listFields: ["name", "customer_name", "status", "email", "company"],
  fields: [
    { name: "customer_name", label: "Nama", type: "text", required: true },
    { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Telepon", type: "text", hideInTable: true },
    { name: "company", label: "Perusahaan", type: "text" },
    { name: "contact_person", label: "Kontak", type: "text", hideInTable: true },
    { name: "notes", label: "Catatan", type: "textarea", hideInTable: true },
  ],
};

export const Route = createFileRoute("/ads/customers")({ component: () => <ResourceCrudPage config={config} /> });
