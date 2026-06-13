// Paired picker for a Frappe Dynamic Link: a doctype select (the *_tipe
// field) + a record search scoped to the chosen doctype. Shared by
// NasabahFormModal (pihak_tipe/pihak) and PenyaluranZisModal
// (penerima_tipe/penerima).
import { FormField, SearchableSelect } from "@sekolahpro/ui";
import { searchLink } from "./searchLink";

export interface DynamicLinkOption {
  doctype: string;
  label: string;
  /** Display-name column on the target doctype (e.g. nama_lengkap). */
  labelField: string;
}

interface DynamicLinkPickerProps {
  options: ReadonlyArray<DynamicLinkOption>;
  /** Selected doctype (the *_tipe value). */
  doctype: string;
  onDoctypeChange: (doctype: string) => void;
  /** Selected record name (the dynamic link value). */
  value: string;
  onValueChange: (name: string) => void;
  typeLabel: string;
  valueLabel: string;
  required?: boolean;
  typeError?: string | undefined;
  valueError?: string | undefined;
}

export function DynamicLinkPicker(props: DynamicLinkPickerProps) {
  const {
    options, doctype, onDoctypeChange, value, onValueChange,
    typeLabel, valueLabel, required, typeError, valueError,
  } = props;
  const picked = options.find((o) => o.doctype === doctype);
  return (
    <>
      <FormField label={typeLabel} {...(required ? { required: true } : {})} error={typeError}>
        <SearchableSelect
          value={doctype}
          onChange={(v) => {
            onDoctypeChange(v);
            // Reset the record when the doctype changes — stale cross-doctype
            // names would silently point at the wrong table.
            onValueChange("");
          }}
          options={options.map((o) => ({ value: o.doctype, label: o.label }))}
          placeholder="— pilih tipe —"
        />
      </FormField>
      <FormField label={valueLabel} {...(required ? { required: true } : {})} error={valueError}>
        <SearchableSelect
          key={doctype}
          value={value}
          onChange={onValueChange}
          loadOptions={(q) => searchLink(picked?.doctype ?? "", picked?.labelField ?? "name", q)}
          placeholder={picked ? `Cari ${picked.label.toLowerCase()}…` : "Pilih tipe dulu"}
          disabled={!picked}
        />
      </FormField>
    </>
  );
}
