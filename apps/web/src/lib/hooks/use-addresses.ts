"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "../api/address-api";
import { addressKeys } from "../api/query-keys";
import { AddressDto, CreateAddressPayload, UpdateAddressPayload } from "@veyora/types";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

export function useAddresses() {
  const queryClient = useQueryClient();

  const addressesQuery = useQuery<AddressDto[]>({
    queryKey: addressKeys.list(),
    queryFn: () => addressApi.listAddresses(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createAddressMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressApi.createAddress(payload),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      notifyApiSuccess(address);
    },
    onError: (error: unknown) => {
      notifyApiError(error);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdateAddressPayload }) =>
      addressApi.updateAddress(addressId, payload),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      notifyApiSuccess(address);
    },
    onError: (error: unknown) => {
      notifyApiError(error);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.deleteAddress(addressId),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      notifyApiSuccess(address);
    },
    onError: (error: unknown) => {
      notifyApiError(error);
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.setDefaultAddress(addressId),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      notifyApiSuccess(address);
    },
    onError: (error: unknown) => {
      notifyApiError(error);
    },
  });

  const addresses = addressesQuery.data || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return {
    addresses,
    defaultAddress,
    isLoading: addressesQuery.isLoading,
    isError: addressesQuery.isError,
    error: addressesQuery.error,
    refetch: addressesQuery.refetch,
    createAddress: createAddressMutation.mutate,
    createAddressAsync: createAddressMutation.mutateAsync,
    isCreatingAddress: createAddressMutation.isPending,
    updateAddress: (addressId: string, payload: UpdateAddressPayload) =>
      updateAddressMutation.mutate({ addressId, payload }),
    deleteAddress: deleteAddressMutation.mutate,
    isDeletingAddress: deleteAddressMutation.isPending,
    setDefaultAddress: setDefaultAddressMutation.mutate,
    isSettingDefault: setDefaultAddressMutation.isPending,
  };
}
