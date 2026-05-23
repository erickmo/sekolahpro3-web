export interface Tenant {
  tenantId: string;
  name: string;
  logo: string | null;
  theme: { brandColor: string | null };
  features: string[];
}
