"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi, InitiatePaymentRequest, RetryPaymentRequest } from "@/lib/api/payment-api";
import { paymentKeys, orderKeys } from "@/lib/api/query-keys";
import {
  PaymentOrderInitDto,
  VerifyPaymentPayload,
  PaymentVerificationResultDto,
  PaymentDetailsDto,
} from "@veyora/types";

export function usePayment() {
  const queryClient = useQueryClient();

  // 1. INITIATE PAYMENT
  const initiateMutation = useMutation<PaymentOrderInitDto, Error, InitiatePaymentRequest>({
    mutationFn: (payload) => paymentApi.initiatePayment(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.status(data.orderId) });
    },
  });

  // 2. VERIFY PAYMENT (Cryptographic Server-Side Verification)
  const verifyMutation = useMutation<PaymentVerificationResultDto, Error, VerifyPaymentPayload>({
    mutationFn: (payload) => paymentApi.verifyPayment(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.status(data.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });

  // 3. RETRY PAYMENT
  const retryMutation = useMutation<PaymentOrderInitDto, Error, RetryPaymentRequest>({
    mutationFn: (payload) => paymentApi.retryPayment(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.status(data.orderId) });
    },
  });

  return {
    initiatePaymentAsync: initiateMutation.mutateAsync,
    isInitiating: initiateMutation.isPending,
    initiateError: initiateMutation.error,

    verifyPaymentAsync: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    verifyError: verifyMutation.error,

    retryPaymentAsync: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    retryError: retryMutation.error,
  };
}

export function usePaymentStatus(orderId: string, enabled = true) {
  return useQuery<PaymentDetailsDto, Error>({
    queryKey: paymentKeys.status(orderId),
    queryFn: () => paymentApi.getPaymentStatus(orderId),
    enabled: Boolean(orderId) && enabled,
    staleTime: 1000 * 15,
  });
}
