import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface ClaimMessageResponse {
  id: number;
  claimId: number;
  senderId: number;
  senderName: string;
  text: string;
  createdAt: string;
}

export const useGetClaimMessages = (claimId: number, options?: Omit<UseQueryOptions<ClaimMessageResponse[], unknown, ClaimMessageResponse[], string[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['claim-messages', claimId.toString()],
    queryFn: () => customFetch<ClaimMessageResponse[]>(`/api/claims/${claimId}/messages`, { method: "GET" }),
    ...options
  });
};

export const useSendClaimMessage = (claimId: number) => {
  return useMutation({
    mutationFn: (data: { text: string }) => customFetch<ClaimMessageResponse>(`/api/claims/${claimId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  });
};

export const useGenerateOtp = (claimId: number) => {
  return useMutation({
    mutationFn: () => customFetch<{ message: string, otp: string }>(`/api/claims/${claimId}/generate-otp`, {
      method: "POST"
    })
  });
};

export const useAcceptClaim = (claimId: number) => {
  return useMutation({
    mutationFn: () => customFetch<{ message: string }>(`/api/claims/${claimId}/accept`, {
      method: "POST"
    })
  });
};

export const useRejectClaim = (claimId: number) => {
  return useMutation({
    mutationFn: () => customFetch<{ message: string }>(`/api/claims/${claimId}/reject`, {
      method: "POST"
    })
  });
};
