import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";

export interface SekolahCard {
  sekolah: string;
  nama: string;
  logo: string | null;
  role_sekolah: string;
  jenis: string | null;
  tingkat: string | null;
  status: string;
  subdomain: string | null;
  organisasi: string;
  organisasi_nama: string;
  slug: string;
}

export interface SekolahGroup {
  organisasi: string;
  organisasi_nama: string;
  schools: SekolahCard[];
}

export interface OnboardingCta {
  label: string;
  url: string;
}

export interface FooterContent {
  text: string;
  url: string | null;
  url_label: string | null;
}

export interface KoperasiCard {
  koperasi: string;
  nama: string;
  slug: string;
  role_koperasi: string;
  logo: string | null;
  status: string;
  organisasi: string;
  organisasi_nama: string;
}

export interface MySchoolsResponse {
  total_schools: number;
  org_count: number;
  groups: SekolahGroup[];
  onboarding: OnboardingCta | null;
  footer: FooterContent | null;
  koperasi: KoperasiCard[];
  koperasi_count: number;
}

export interface SelectSchoolResponse {
  ok: boolean;
  sekolah: string;
  nama: string;
  subdomain: string | null;
  role: string;
  slug: string;
}

export interface SelectKoperasiResponse {
  ok: boolean;
  koperasi: string;
  sekolah: string;
  nama: string;
  slug: string;
  role: string;
}

export const groupKeysShape = ["organisasi", "organisasi_nama", "schools"];

export function useMySchools(): UseQueryResult<MySchoolsResponse> {
  return useQuery<MySchoolsResponse>({
    queryKey: ["sekolah.list_my_sekolah"],
    queryFn: () =>
      frappeFetch<MySchoolsResponse>("sekolahpro.api.auth.list_my_sekolah", {}),
    staleTime: 60 * 1000,
  });
}

export function useSelectSchool(): UseMutationResult<
  SelectSchoolResponse,
  Error,
  { name: string }
> {
  return useMutation<SelectSchoolResponse, Error, { name: string }>({
    mutationFn: ({ name }) =>
      frappeFetch<SelectSchoolResponse>(
        "sekolahpro.api.auth.select_sekolah",
        { name },
      ),
  });
}

export function useSelectKoperasi(): UseMutationResult<
  SelectKoperasiResponse,
  Error,
  { name: string }
> {
  return useMutation<SelectKoperasiResponse, Error, { name: string }>({
    mutationFn: ({ name }) =>
      frappeFetch<SelectKoperasiResponse>(
        "sekolahpro.api.auth.select_koperasi",
        { name },
      ),
  });
}
