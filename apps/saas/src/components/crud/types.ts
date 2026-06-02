import type { ReactNode } from "react";

export type CrudFieldType = "text" | "number" | "select" | "link" | "textarea" | "date";

export interface CrudField {
  name: string;
  label: string;
  type: CrudFieldType;
  options?: string[];        // select
  linkDoctype?: string;      // link → options fetched from this doctype's names
  required?: boolean;
  readOnly?: boolean;        // editable=false; still shown in the form as read-only
  hideInTable?: boolean;
  render?: (value: unknown) => ReactNode; // custom table cell
}

export interface CrudConfig {
  doctype: string;
  title: string;
  description?: string;
  /** The PK field the user fills on create (e.g. "property_name"). */
  nameField: string;
  fields: CrudField[];
  /** Fields fetched for the list table (must include "name"). */
  listFields: string[];
}

export type CrudRow = Record<string, unknown> & { name: string };
