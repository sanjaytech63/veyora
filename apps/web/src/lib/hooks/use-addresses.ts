"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "../api/address-api";
import { addressKeys } from "../api/query-keys";
import {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@veyora/types";
import { toast } from "sonner";

export function useAddresses() {
  const queryClient = useQueryClient();

  const addressesQuery = useQuery<AddressDto[]>({
    queryKey: addressKeys.list(),
    queryFn: () => addressApi.listAddresses(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createAddressMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressApi.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      toast.success("Delivery address saved");
    },
    onError: (error: Error) => {
      toast.error("Could not save address", {
        description: error.message || "Please check the required fields.",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdateAddressPayload }) =>
      addressApi.updateAddress(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      toast.success("Address updated");
    },
    onError: (error: Error) => {
      toast.error("Could not update address", {
        description: error.message || "Please try again.",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      toast.success("Address removed");
    },
    onError: (error: Error) => {
      toast.error("Could not remove address", {
        description: error.message || "Please try again.",
      });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      toast.success("Default delivery address updated");
    },
    onError: (error: Error) => {
      toast.error("Could not set default address", {
        description: error.message || "Please try again.",
      });
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
