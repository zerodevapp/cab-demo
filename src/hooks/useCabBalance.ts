import { useQuery } from '@tanstack/react-query';
import { useWalletClient } from "wagmi";
export function useCabBalance() {
  const { data: client } = useWalletClient();

  return useQuery({
    queryKey: ['cabBalance', client?.account?.address],
    queryFn: async () => {
      if (!client?.account) {
        throw new Error("Address or cabClient is not available");
      }
      const balance: bigint = await client.transport.request({
        method: "yi_getCabBalance",
        params: []
      })
      return balance;
    },
    enabled: !!client?.account,
  });
}