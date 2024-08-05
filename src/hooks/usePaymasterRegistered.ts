import { useCallback } from "react";
import { useReadContract, useAccount } from "wagmi";
import { cabPaymasterAddress, invoiceManagerAddress, supportedChains } from "@/utils/constants";
import { invoiceManagerAbi } from "@/abis/invoiceManagerAbi";
import { isAddressEqual, zeroAddress } from "viem";
import { useMemo } from "react";

export function usePaymasterRegistered() {
  const { address } = useAccount();
  const refetchInterval = useCallback((data: any) => {
    const isRegistered = data && isAddressEqual(data?.[0]?? zeroAddress, cabPaymasterAddress);
    return isRegistered ? false : 5000; // Stop polling if registered, otherwise poll every 5 seconds
  }, []);
  const { data: repayChainRegistered, isPending: isRepayPending } = useReadContract({
    address: invoiceManagerAddress,
    abi: invoiceManagerAbi,
    functionName: "cabPaymasters",
    args: [address ?? '0x'],
    chainId: supportedChains[0].id,
    query: {
      refetchInterval,
    }
  });
  const { data: sponsorChainRegistered, isPending: isSponsorPending } = useReadContract({
    address: invoiceManagerAddress,
    abi: invoiceManagerAbi,
    functionName: "cabPaymasters",
    args: [address ?? '0x'],
    chainId: supportedChains[1].id,
    query: {
      refetchInterval,
    }
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