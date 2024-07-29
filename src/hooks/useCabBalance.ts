import { supportedChains, repayTokens } from "@/utils/constants";
import { useKernelClient } from "@zerodev/waas";
import { useQuery } from '@tanstack/react-query';
import { useKernelCABClient } from "./useKernelCABClient";

export function useCabBalance() {
  const { address, kernelAccount } = useKernelClient();
  const { data } = useKernelCABClient({ chainId: supportedChains[1].id });

  return useQuery({
    queryKey: ['cabBalance', address],
    queryFn: async () => {
      const cabPaymasterClient = data?.cabPaymasterClient;
      if (!address || !kernelAccount || !cabPaymasterClient) {
        throw new Error("Address or kernel account not available");
      }
      return await cabPaymasterClient.getCabBalance({
        address,
        repayTokens
      });
    },
    enabled: !!address && !!kernelAccount,
  });
}