// Type definitions + constants + helpers for modul Akuntansi.
//
// Backend: app `vernon_accounting` (Frappe). Doctypes are tenanted by
// `company`, NOT by `sekolah`. Until Sekolah↔Company mapping lands, the
// API layer does not auto-scope these queries — callers must pass a
// `company` filter explicitly when needed.
//
// Shapes mirror the Frappe doctype JSON field names (snake_case) so the
// objects can be POSTed back to /api/resource/{Doctype} without mapping.

import { frappeFetch, type FrappeError } from "@sekolahpro/api-client";

// ──────────────────────────────────────────────────────────────────────
// Doctype name constants — single source of truth, used by both data
// fetching hooks and route helpers.
// ──────────────────────────────────────────────────────────────────────

export const DOCTYPE = {
  ACCOUNT: "Account",
  JOURNAL_ENTRY: "Journal Entry",
  JOURNAL_ENTRY_ACCOUNT: "Journal Entry Account",
  PAYMENT_ENTRY: "Payment Entry",
  PAYMENT_ENTRY_REFERENCE: "Payment Entry Reference",
  GL_ENTRY: "GL Entry",
  OPENING_BALANCE_ENTRY: "Opening Balance Entry",
  PERIOD_CLOSING_VOUCHER: "Period Closing Voucher",
  BUDGET: "Budget",
  BUDGET_ACCOUNT: "Budget Account",
  BUDGET_AMENDMENT: "Budget Amendment",
  BUDGET_AMENDMENT_DETAIL: "Budget Amendment Detail",
  COST_CENTER: "Cost Center",
  ACCOUNTING_DIMENSION: "Accounting Dimension",
  SPT_MASA_PPN: "SPT Masa PPN",
  EFAKTUR_EXPORT: "e-Faktur Export",
  WITHHOLDING_TAX_ENTRY: "Withholding Tax Entry",
  PPH21_TER_RATE: "PPh 21 TER Rate",
  PPH4A2_RATE: "PPh 4a2 Rate",
  TAX_PERIOD: "Tax Period",
  TAX_TEMPLATE: "Tax Template",
  TAX_TEMPLATE_DETAIL: "Tax Template Detail",
  FISCAL_YEAR: "Fiscal Year",
  ACCOUNTING_PERIOD: "Accounting Period",
  CURRENCY_EXCHANGE: "Currency Exchange",
  VERNON_ACCOUNTING_SETTINGS: "Vernon Accounting Settings",
} as const;

export const VERNON_ACCOUNTING_DOCTYPES: readonly string[] = Object.values(DOCTYPE);

// ──────────────────────────────────────────────────────────────────────
// Selects (kept narrow — extend with Frappe values when needed)
// ──────────────────────────────────────────────────────────────────────

export type RootType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export type AccountType =
  | "Accumulated Depreciation"
  | "Bank"
  | "Cash"
  | "Chargeable"
  | "Cost of Goods Sold"
  | "Depreciation"
  | "Equity"
  | "Expense Account"
  | "Expenses Included In Valuation"
  | "Fixed Asset"
  | "Income Account"
  | "Payable"
  | "Receivable"
  | "Round Off"
  | "Stock"
  | "Stock Adjustment"
  | "Stock Received But Not Billed"
  | "Tax"
  | "Temporary";

export type CashFlowCategory = "Operating" | "Investing" | "Financing";

export type PaymentType = "Receive" | "Pay" | "Internal Transfer";

export type BudgetStatus = "Draft" | "Submitted" | "Amended";

export type WorkflowState = "Draft" | "Pending Approval" | "Approved";

export type SptStatus = "Draft" | "Filed";

export type EfakturStatus = "Draft" | "Exported" | "Submitted";

export type WhtTaxType = "PPh21" | "PPh22" | "PPh23" | "PPh4a2";

export type WhtStatus = "Draft" | "Submitted" | "Reported";

export type TerCategory = "A" | "B" | "C";

export type TaxPeriodType = "PPN" | "PPh21" | "PPh22" | "PPh23" | "PPh4a2";

export type Month12 =
  | "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun"
  | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";

export type OverspendAction = "None" | "Warn" | "Stop";

// ──────────────────────────────────────────────────────────────────────
// Frappe document common fields (present on every parent doctype)
// ──────────────────────────────────────────────────────────────────────

export interface FrappeDoc {
  name: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: 0 | 1 | 2;
  idx?: number;
}

export type WithChildKeys = {
  parent?: string;
  parenttype?: string;
  parentfield?: string;
};

// ──────────────────────────────────────────────────────────────────────
// Doctype shapes
// ──────────────────────────────────────────────────────────────────────

export interface AccountPartyType extends FrappeDoc, WithChildKeys {
  party_doctype?: string;
}

export interface Account extends FrappeDoc {
  account_name: string;
  parent_account?: string;
  root_type?: RootType;
  account_type?: AccountType;
  cash_flow_category?: CashFlowCategory;
  currency?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  company?: string;
  allowed_party_types?: AccountPartyType[];
}

export interface JournalEntryAccount extends FrappeDoc, WithChildKeys {
  account: string;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  party_type?: string;
  party?: string;
  cost_center?: string;
  project?: string;
  branch?: string;
  account_currency?: string;
  exchange_rate?: number;
  debit?: number;
  credit?: number;
  reference_type?: string;
  reference_name?: string;
  user_remark?: string;
}

export interface JournalEntry extends FrappeDoc {
  naming_series?: string;
  posting_date: string;
  company: string;
  multi_currency?: 0 | 1;
  remarks?: string;
  user_remark?: string;
  tax_template?: string;
  accounts: JournalEntryAccount[];
  total_debit?: number;
  total_credit?: number;
}

export interface PaymentEntryReference extends FrappeDoc, WithChildKeys {
  reference_doctype: string;
  reference_name: string;
  total_amount?: number;
  outstanding_amount?: number;
  allocated_amount?: number;
}

export interface PaymentEntry extends FrappeDoc {
  naming_series?: string;
  payment_type: PaymentType;
  posting_date: string;
  company: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  paid_from?: string;
  paid_from_account_currency?: string;
  paid_amount: number;
  paid_to?: string;
  paid_to_account_currency?: string;
  received_amount?: number;
  pph_kategori?: string;
  pph_rate?: number;
  pph_amount?: number;
  pph_payable_account?: string;
  references?: PaymentEntryReference[];
  remarks?: string;
}

export interface GLEntry extends FrappeDoc {
  posting_date: string;
  due_date?: string;
  account: string;
  debit?: number;
  credit?: number;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  account_currency?: string;
  exchange_rate?: number;
  party_type?: string;
  party?: string;
  cost_center?: string;
  project?: string;
  branch?: string;
  voucher_type?: string;
  voucher_no?: string;
  company: string;
  remarks?: string;
  is_cancelled?: 0 | 1;
  against_voucher_type?: string;
  against_voucher?: string;
}

export interface BudgetAccount extends FrappeDoc, WithChildKeys {
  account: string;
  overspend_action?: OverspendAction;
  jan?: number; feb?: number; mar?: number; apr?: number;
  may?: number; jun?: number; jul?: number; aug?: number;
  sep?: number; oct?: number; nov?: number; dec?: number;
}

export interface Budget extends FrappeDoc {
  naming_series?: string;
  fiscal_year: string;
  company: string;
  cost_center?: string;
  branch?: string;
  project?: string;
  accounts: BudgetAccount[];
  status?: BudgetStatus;
}

export interface BudgetAmendmentDetail extends FrappeDoc, WithChildKeys {
  account: string;
  month: Month12;
  old_amount?: number;
  new_amount?: number;
  reason?: string;
}

export interface BudgetAmendment extends FrappeDoc {
  naming_series?: string;
  budget: string;
  fiscal_year?: string;
  company: string;
  workflow_state?: WorkflowState;
  details: BudgetAmendmentDetail[];
}

export interface CostCenter extends FrappeDoc {
  cost_center_name: string;
  parent_cost_center?: string;
  is_group?: 0 | 1;
  company?: string;
  disabled?: 0 | 1;
}

export interface AccountingDimension extends FrappeDoc {
  dimension_name: string;
  document_type?: string;
  mandatory?: 0 | 1;
  disabled?: 0 | 1;
}

export interface SptMasaPPN extends FrappeDoc {
  naming_series?: string;
  tax_period: string;
  company: string;
  status?: SptStatus;
  efaktur_export?: string;
  ppn_keluaran?: number;
  ppn_masukan?: number;
  ppn_kurang_bayar?: number;
}

export interface EfakturExport extends FrappeDoc {
  naming_series?: string;
  tax_period: string;
  company?: string;
  export_date?: string;
  status?: EfakturStatus;
  format?: "Coretax XML";
  nsfp_from?: string;
  nsfp_to?: string;
  file?: string;
}

export interface WithholdingTaxEntry extends FrappeDoc {
  naming_series?: string;
  tax_type: WhtTaxType;
  party_type?: "Customer" | "Supplier";
  party?: string;
  npwp?: string;
  tax_period?: string;
  company: string;
  posting_date: string;
  journal_entry?: string;
  pph4a2_kategori?: string;
  base_amount: number;
  tax_rate: number;
  tax_amount: number;
  status?: WhtStatus;
}

export interface PPh21TerRate extends FrappeDoc, WithChildKeys {
  category: TerCategory;
  income_from: number;
  income_to: number;
  rate: number;
}

export interface PPh4a2Rate extends FrappeDoc, WithChildKeys {
  kategori: string;
  rate: number;
  keterangan?: string;
}

export interface TaxPeriod extends FrappeDoc {
  period_name: string;
  tax_type: TaxPeriodType;
  month: number;
  year: number;
  company?: string;
  is_closed?: 0 | 1;
}

export interface TaxTemplateDetail extends FrappeDoc, WithChildKeys {
  tax_type: TaxPeriodType;
  tax_account?: string;
  rate_override?: number;
  pph22_type?: "impor" | "bendahara";
  pph23_type?: "jasa" | "dividen";
  pph4a2_kategori?: string;
  ptkp?: string;
}

export interface TaxTemplate extends FrappeDoc {
  template_name: string;
  company?: string;
  is_default?: 0 | 1;
  details: TaxTemplateDetail[];
}

export interface FiscalYear extends FrappeDoc {
  year_name: string;
  year_start_date: string;
  year_end_date: string;
  is_closed?: 0 | 1;
  company?: string;
}

export interface AccountingPeriod extends FrappeDoc {
  period_name: string;
  fiscal_year: string;
  start_date: string;
  end_date: string;
  is_closed?: 0 | 1;
  company?: string;
}

export interface CurrencyExchange extends FrappeDoc {
  date: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
}

export interface OpeningBalanceEntryAccount extends FrappeDoc, WithChildKeys {
  account: string;
  debit?: number;
  credit?: number;
}

export interface OpeningBalanceEntry extends FrappeDoc {
  naming_series?: string;
  posting_date: string;
  company: string;
  accounts: OpeningBalanceEntryAccount[];
  remarks?: string;
}

export interface PeriodClosingVoucher extends FrappeDoc {
  naming_series?: string;
  fiscal_year: string;
  period_closing_date: string;
  company: string;
  closing_account: string;
  remarks?: string;
}

export interface VernonAccountingSettings extends FrappeDoc {
  default_currency?: string;
  default_company?: string;
  ppn_rate?: number;
  pph22_rate_impor?: number;
  pph22_rate_bendahara?: number;
  pph23_rate_jasa?: number;
  pph23_rate_dividen?: number;
  pph4a2_rates?: PPh4a2Rate[];
  pph21_ter_rates?: PPh21TerRate[];
  nsfp_prefix?: string;
  nsfp_year?: string;
  nsfp_counter?: number;
  company_npwp?: string;
  ppn_output_account?: string;
  budget_overspend_action?: "Warn" | "Stop";
}

// ──────────────────────────────────────────────────────────────────────
// Formatters
// ──────────────────────────────────────────────────────────────────────

export function formatRupiah(n: number | null | undefined): string {
  const v = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatNumber(n: number | null | undefined, digits = 0): string {
  const v = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPercent(n: number | null | undefined): string {
  const v = typeof n === "number" ? n : 0;
  return `${v.toFixed(2)}%`;
}

export function formatBulan(n: number): string {
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return names[(n - 1 + 12) % 12] ?? "—";
}

// ──────────────────────────────────────────────────────────────────────
// Status badge mapping — UI Badge tone
// ──────────────────────────────────────────────────────────────────────

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

export function docstatusBadge(d: 0 | 1 | 2 | undefined): { label: string; tone: BadgeTone } {
  if (d === 1) return { label: "Submitted", tone: "success" };
  if (d === 2) return { label: "Cancelled", tone: "danger" };
  return { label: "Draft", tone: "neutral" };
}

export function budgetStatusBadge(s: BudgetStatus | undefined): { label: string; tone: BadgeTone } {
  if (s === "Submitted") return { label: "Submitted", tone: "success" };
  if (s === "Amended") return { label: "Amended", tone: "warning" };
  return { label: "Draft", tone: "neutral" };
}

export function sptStatusBadge(s: SptStatus | undefined): { label: string; tone: BadgeTone } {
  if (s === "Filed") return { label: "Filed", tone: "success" };
  return { label: "Draft", tone: "neutral" };
}

export function efakturStatusBadge(s: EfakturStatus | undefined): { label: string; tone: BadgeTone } {
  if (s === "Submitted") return { label: "Submitted", tone: "success" };
  if (s === "Exported") return { label: "Exported", tone: "brand" };
  return { label: "Draft", tone: "neutral" };
}

export function whtStatusBadge(s: WhtStatus | undefined): { label: string; tone: BadgeTone } {
  if (s === "Reported") return { label: "Reported", tone: "brand" };
  if (s === "Submitted") return { label: "Submitted", tone: "success" };
  return { label: "Draft", tone: "neutral" };
}

export function workflowBadge(s: WorkflowState | undefined): { label: string; tone: BadgeTone } {
  if (s === "Approved") return { label: "Approved", tone: "success" };
  if (s === "Pending Approval") return { label: "Pending Approval", tone: "warning" };
  return { label: "Draft", tone: "neutral" };
}

// ──────────────────────────────────────────────────────────────────────
// Submit / cancel helpers — Frappe document workflow
// ──────────────────────────────────────────────────────────────────────

// Submits a doc (docstatus 0→1). Frappe's `frappe.client.submit` accepts
// the full doc body; for convenience callers usually pass just {doctype, name}.
export async function submitDoc<T extends FrappeDoc = FrappeDoc>(
  doctype: string,
  name: string,
): Promise<T> {
  return frappeFetch<T>("frappe.client.submit", { doc: { doctype, name } });
}

export async function cancelDoc<T extends FrappeDoc = FrappeDoc>(
  doctype: string,
  name: string,
): Promise<T> {
  return frappeFetch<T>("frappe.client.cancel", { doctype, name });
}

// ──────────────────────────────────────────────────────────────────────
// Misc
// ──────────────────────────────────────────────────────────────────────

export function sumDebit(rows: Pick<JournalEntryAccount, "debit">[]): number {
  return rows.reduce((acc, r) => acc + (r.debit ?? 0), 0);
}

export function sumCredit(rows: Pick<JournalEntryAccount, "credit">[]): number {
  return rows.reduce((acc, r) => acc + (r.credit ?? 0), 0);
}

export function isBalanced(rows: Pick<JournalEntryAccount, "debit" | "credit">[]): boolean {
  return Math.round((sumDebit(rows) - sumCredit(rows)) * 100) === 0;
}

export const ROOT_TYPES: readonly RootType[] = ["Asset", "Liability", "Equity", "Income", "Expense"];
export const PAYMENT_TYPES: readonly PaymentType[] = ["Receive", "Pay", "Internal Transfer"];
export const WHT_TAX_TYPES: readonly WhtTaxType[] = ["PPh21", "PPh22", "PPh23", "PPh4a2"];
export const TAX_PERIOD_TYPES: readonly TaxPeriodType[] = ["PPN", "PPh21", "PPh22", "PPh23", "PPh4a2"];
export const MONTH12: readonly Month12[] = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// re-export for convenience in route imports
export type { FrappeError };
