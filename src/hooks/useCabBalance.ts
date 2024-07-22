import { useReadContract } from "wagmi";
import { vaultManagerAddress, testErc20Address, supportedChains} from "@/utils/constants";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { useKernelClient } from "@zerodev/waas";
import { useMemo } from "react";

export function useCabBalance() {
  const { address } = useKernelClient();
  const { data: repayData, isPending: isRepayPending } = useReadContract({
    address: vaultManagerAddress,
    abi: vaultManagerAbi,
    functionName: "getAccountTokenBalance",
    args: [address, testErc20Address],
    chainId: supportedChains[0].id,
  })
  const { data: sponsorData, isPending: isSponsorPending } = useReadContract({
    address: vaultManagerAddress,
    abi: vaultManagerAbi,
    functionName: "getAccountTokenBalance",
    args: [address, testErc20Address],
    chainId: supportedChains[1].id,
  })

  const { balances, totalBalance } = useMemo(() => {
    return {
      totalBalance: (repayData ?? 0n) + (sponsorData ?? 0n ),
      balances: [
        {
          chain: supportedChains[0].chain,
          balance: repayData ?? 0n,
        },
        {
          chain: supportedChains[1].chain,
          balance: sponsorData ?? 0n,
        }
      ]
    }
  }, [repayData, sponsorData]);
  
  const isPending = useMemo(() => {
    return isRepayPending || isSponsorPending;
  }, [isRepayPending, isSponsorPending]);

  return {
    data: isPending ? undefined : {
      totalBalance,
      balances: balances.filter(balance => balance.balance > 0n)
    }, 
    isPending
  }

}