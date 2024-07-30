import { supportedChains, repayTokens } from "@/utils/constants";
import { useQuery } from '@tanstack/react-query';
import { useKernelCABClient } from "./useKernelCABClient";

export function useCabBalance() {
  const { data } = useKernelCABClient({ chainId: supportedChains[1].id });

  const cabPaymasterClient = data?.cabPaymasterClient;
  const address = data?.address;
  return useQuery({
    queryKey: ['cabBalance', address],
    queryFn: async () => {
      if (!address || !cabPaymasterClient) {
        throw new Error("Address or kernel account not available");
      }
      return await cabPaymasterClient.getCabBalance({
        address,
        repayTokens
      });
    },
    enabled: !!cabPaymasterClient || !!address,
  });
}