import { apiFetch } from "@/lib/api-client";

export interface CustomerDTO {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
}

export const customersApi = {
  list: (search?: string) =>
    apiFetch<{ customers: CustomerDTO[] }>(
      `/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  create: (data: { name: string; document?: string | null; phone?: string | null; email?: string | null }) =>
    apiFetch<{ customer: CustomerDTO }>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
