import { RepayToken } from "@/types";
import { getChain, getBundler, supportedChains } from "@/utils/constants";
import { http, type Hex } from 'viem';
import { createBundlerClient } from "permissionless";
import { useCABClient, useTokenBalance } from "@/hooks";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useMutation } from '@tanstack/react-query';

export type UseSendUserOperationParams = {
  chainId: number,
  onSuccess?: ({ userOpHash }: { userOpHash: Hex }) => void
}

export function useSendUserOperation({
  chainId,
  onSuccess,
}: UseSendUserOperationParams) {
  const selectedChain = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data } = useCABClient({ chainId });
  const smartAccountClient = data?.smartAccountClient;
  const cabClient = data?.cabClient;
  const { address } = useAccount();
  const { refetch } = useTokenBalance({ chainId, address: address });

  const mutation = useMutation({
    mutationFn: async ({ userOperation, repayTokens }: { 
      userOperation: any;
      repayTokens: RepayToken[] 
    }) => {
      const smartAccount = smartAccountClient?.account;
      if (!smartAccount || !cabClient) {
        throw new Error('smartAccount or CABClient is not available');
      }
      if (selectedChain !== chainId) {
        await switchChainAsync?.({ chainId });
      }

      const userOpHash = await cabClient.sendUserOperationCAB({
        userOperation: userOperation,
        repayTokens,
      });

      const bundlerClient = createBundlerClient({
        chain: getChain(chainId).chain,
        entryPoint: smartAccount.entryPoint,
        transport: http(getBundler(chainId), { timeout: 60000 }),
      });

      if (chainId !== supportedChains[0].id) {
        await bundlerClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });
      }
      
      console.log("userOpHash", userOpHash);
      return userOpHash;
    },
    onSuccess: (userOpHash) => {
      onSuccess?.({ userOpHash });
      refetch();
    },
    onError: (error) => {
      console.error("Error in sendUserOperation:", error);
    }
  });

  return {
    data: mutation.data,
    isPending: mutation.isPending,
    write: mutation.mutate
  }
}