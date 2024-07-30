import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  type Hex,
  encodeFunctionData,
  parseAbi,
  parseEther,
  erc20Abi,
} from 'viem';
import {
  vaultManagerAddress,
  getChain,
  cabPaymasterAddress,
  invoiceManagerAddress,
  testErc20Address,
  testErc20VaultAddress,
} from "@/utils/constants";
import { useChainId, useSwitchChain } from "wagmi";
import { invoiceManagerAbi } from "@/abis/invoiceManagerAbi";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { useKernelCABClient } from "./useKernelCABClient";

export type UseRegisterPaymasterParams = {  
  chainId: number;
  onSuccess?: () => void;
}

export function useRegisterPaymaster({
  chainId,
  onSuccess,
}: UseRegisterPaymasterParams) {
  const connectedChainId = useChainId(); 
  const { switchChainAsync } = useSwitchChain();
  const selectedChain = getChain(chainId);
  const isRepay = selectedChain.isRepay;

  const { data } = useKernelCABClient({ chainId });
  const kernelClient = data?.kernelClientVerifyingPaymaster;
  const accountAddress = data?.address;

  const txs = useMemo(() => {
    if (!accountAddress) return [];

    const amount = parseEther("0.3");
    const commonTx = {
      to: invoiceManagerAddress,
      data: encodeFunctionData({
        abi: invoiceManagerAbi,
        functionName: "registerPaymaster",
        args: [
          cabPaymasterAddress,
          cabPaymasterAddress,
          BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30) // now + 30 days
        ]
      }),
      value: 0n,
    };

    if (!isRepay) return [commonTx];

    return [
      commonTx,
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: parseAbi(["function mint(address,uint256)"]),
          functionName: "mint",
          args: [accountAddress, amount]
        }),
        value: 0n,
      },
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultManagerAddress, amount],
        }),
        value: 0n
      },
      {
        to: vaultManagerAddress,
        data: encodeFunctionData({
          abi: vaultManagerAbi,
          functionName: "deposit",
          args: [testErc20Address, testErc20VaultAddress, amount, false]
        }),
        value: 0n
      } 
    ];
  }, [isRepay, accountAddress]);

  const mutation = useMutation<Hex, Error, void>({
    mutationFn: async () => {
      if (!kernelClient || txs.length === 0) {
        throw new Error("Client or transactions not available");
      }
      if (connectedChainId !== chainId) {
        await switchChainAsync?.({ chainId });
      }
      return await kernelClient.sendTransactions({ transactions: txs });
    },
    onSuccess: (txHash) => {
      console.log("txHash", txHash);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Transaction failed:", error);
    },
  });

  return {
    hash: mutation.data,
    register: mutation.mutateAsync,
    isPending: mutation.isPending || !kernelClient || txs.length === 0,
  };
}