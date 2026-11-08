import { apiFetch } from "@/lib/api-client";

export interface CustomerDTO {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
}

export interface CustomerInput {
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
}

export const customersApi = {
  list: (search?: string) =>
    apiFetch<{ customers: CustomerDTO[] }>(
      `/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  create: (data: CustomerInput) =>
    apiFetch<{ customer: CustomerDTO }>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: CustomerInput) =>
    apiFetch<{ customer: CustomerDTO }>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => apiFetch<void>(`/customers/${id}`, { method: "DELETE" }),
};
