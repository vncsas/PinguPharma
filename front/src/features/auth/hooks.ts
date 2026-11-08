import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../users/keys";
import { authApi } from "./api";
import { authKeys } from "./keys";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => authApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      authApi.changePassword(current, next),
  });
}

export function useTwoFactorSetup(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.twoFactorSetup,
    queryFn: authApi.startTwoFactor,
    enabled,
  });
}

export function useConfirmTwoFactor() {
  return useMutation({ mutationFn: (code: string) => authApi.confirmTwoFactor(code) });
}

export function useDisableTwoFactor() {
  return useMutation({ mutationFn: authApi.disableTwoFactor });
}
