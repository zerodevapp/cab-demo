import { supportedChains, cabPaymasterUrl, repayTokens, getChain } from "@/utils/constants";
import { http } from "viem";
import { useKernelClient } from "@zerodev/waas";
import { createZeroDevCABPaymasterClient } from "@zerodev/cab"
import { useQuery } from '@tanstack/react-query';

export function useCabBalance() {
  const { address, kernelAccount } = useKernelClient();

  return useQuery({
    queryKey: ['cabBalance', address],
    queryFn: async () => {
      if (!address || !kernelAccount) {
        throw new Error("Address or kernel account not available");
      }

      const cabPaymasterClient = createZeroDevCABPaymasterClient({
        chain: getChain(supportedChains[1].id).chain,
        entryPoint: kernelAccount.entryPoint,
        transport: http(cabPaymasterUrl),
        account: kernelAccount
      });

      const balance = await cabPaymasterClient.getCabBalance({
        address,
        repayTokens
      });

      return balance;
    },
    enabled: !!address && !!kernelAccount,
  });
}