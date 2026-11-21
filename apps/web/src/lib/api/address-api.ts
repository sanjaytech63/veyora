import { apiClient } from "./api-client";
import {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@veyora/types";

export const addressApi = {
  listAddresses(): Promise<AddressDto[]> {
    return apiClient.get<AddressDto[]>("/addresses");
  },

  createAddress(payload: CreateAddressPayload): Promise<AddressDto> {
    return apiClient.post<AddressDto>("/addresses", payload);
  },

  updateAddress(addressId: string, payload: UpdateAddressPayload): Promise<AddressDto> {
    return apiClient.put<AddressDto>(`/addresses/${addressId}`, payload);
  },

  deleteAddress(addressId: string): Promise<null> {
    return apiClient.delete<null>(`/addresses/${addressId}`);
  },

  setDefaultAddress(addressId: string): Promise<AddressDto> {
    return apiClient.patch<AddressDto>(`/addresses/${addressId}/default`, {});
  },
};
