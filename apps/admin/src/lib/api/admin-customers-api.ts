import { apiClient } from "./api-client";
import {
  CustomerDto,
  CustomerDetailDto,
  PaginatedCustomersDto,
  AdminCustomerListQuery,
  UpdateCustomerStatusPayload,
  AddressDto,
  PaginatedOrdersDto,
  CustomerActivityDto,
} from "@veyora/types";

export const adminCustomersApi = {
  listCustomers: (query?: AdminCustomerListQuery): Promise<PaginatedCustomersDto> =>
    apiClient.get<PaginatedCustomersDto>("/admin/customers", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getCustomer: (id: string): Promise<CustomerDetailDto> =>
    apiClient.get<CustomerDetailDto>(`/admin/customers/${id}`),

  getCustomerOrders: (id: string, query?: { page?: number; limit?: number }): Promise<PaginatedOrdersDto> =>
    apiClient.get<PaginatedOrdersDto>(`/admin/customers/${id}/orders`, {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getCustomerAddresses: (id: string): Promise<AddressDto[]> =>
    apiClient.get<AddressDto[]>(`/admin/customers/${id}/addresses`),

  updateCustomerStatus: (id: string, payload: UpdateCustomerStatusPayload): Promise<CustomerDto> =>
    apiClient.patch<CustomerDto>(`/admin/customers/${id}/status`, payload),

  updateCustomerNotes: (id: string, payload: { notes: string }): Promise<CustomerDto> =>
    apiClient.patch<CustomerDto>(`/admin/customers/${id}/notes`, payload),

  getCustomerActivity: (id: string): Promise<CustomerActivityDto[]> =>
    apiClient.get<CustomerActivityDto[]>(`/admin/customers/${id}/activity`),
};
