import { useReadContract } from "wagmi";
import { cabPaymasterAddress, invoiceManagerAddress, supportedChains } from "@/utils/constants";
import { useCABClient } from "@/hooks";
import { invoiceManagerAbi } from "@/abis/invoiceManagerAbi";
import { isAddressEqual } from "viem";
import { useMemo } from "react";

export function usePaymasterRegistered() {
  const { data } = useCABClient({ chainId: supportedChains[0].id });
  const address = data?.address ?? '0x';
  const { data: repayChainRegistered, isPending: isRepayPending } = useReadContract({
    address: invoiceManagerAddress,
    abi: invoiceManagerAbi,
    functionName: "cabPaymasters",
    args: [address],
    chainId: supportedChains[0].id,
  });
  const { data: sponsorChainRegistered, isPending: isSponsorPending } = useReadContract({
    address: invoiceManagerAddress,
    abi: invoiceManagerAbi,
    functionName: "cabPaymasters",
    args: [address],
    chainId: supportedChains[1].id,
  }); 

  const { isRepayRegistered, isSponsorRegistered, status } = useMemo(() => {
    const isRepayRegistered = repayChainRegistered && isAddressEqual(repayChainRegistered[0], cabPaymasterAddress);
    const isSponsorRegistered = sponsorChainRegistered && isAddressEqual(sponsorChainRegistered[0], cabPaymasterAddress);
    const status = isSponsorRegistered ? 2 : isRepayRegistered ? 1 : 0;

    return {
      isRepayRegistered: isRepayRegistered,
      isSponsorRegistered: isSponsorRegistered, 
      status: status
    }
  }, [repayChainRegistered, sponsorChainRegistered]);


  return {
    isRegistered: isRepayRegistered && isSponsorRegistered,
    isRepayRegistered: isRepayRegistered,
    status: status,
    isSponsorRegistered: isSponsorRegistered,
    isPending: isRepayPending || isSponsorPending,
  };
}