import { supportedChains, repayTokens, testErc20Address } from "@/utils/constants";
import { useQuery } from '@tanstack/react-query';
import { useCABClient } from "./useCABClient";

export function useCabBalance() {
  const { data } = useCABClient({ chainId: supportedChains[1].id });

  const cabClient = data?.cabClient;
  const address = data?.address;
  return useQuery({
    queryKey: ['cabBalance', address],
    queryFn: async () => {
      if (!address || !cabClient) {
        throw new Error("Address or cabClient is not available");
      }
      return await cabClient.getCabBalance({
        address,
        token: testErc20Address,
        repayTokens
      });
    },
    enabled: !!cabClient || !!address,
  });
}