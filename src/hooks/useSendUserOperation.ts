import { type UserOperation, type GetEntryPointVersion, type EntryPoint } from "permissionless/types"
import { RepayToken } from "@/types";
import { getChain, getBundler, supportedChains } from "@/utils/constants";
import { http, type Hex } from 'viem';
import { createBundlerClient } from "permissionless";
import { useKernelCABClient, useTokenBalance } from "@/hooks";
import { useAccount } from "wagmi";
import { useMutation } from '@tanstack/react-query';

export type UseSendUserOperationParams = {
  chainId: number,
  onSuccess?: ({ userOpHash }: { userOpHash: Hex }) => void
}

export function useSendUserOperation({
  chainId,
  onSuccess,
}: UseSendUserOperationParams) {
  const { data } = useKernelCABClient({ chainId });
  const kernelClient = data?.kernelClient;
  const cabPaymasterClient = data?.cabPaymasterClient;
  const { address } = useAccount();
  const { refetch } = useTokenBalance({ chainId, address: address });

  const mutation = useMutation({
    mutationFn: async ({ userOperation, repayTokens }: { 
      userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
      repayTokens: RepayToken[] 
    }) => {
      const kernelAccount = kernelClient?.account;
      if (!kernelAccount || !cabPaymasterClient) {
        throw new Error('KernelAccount or CABPaymasterClient is not available');
      }

      const userOpHash = await cabPaymasterClient.sendUserOperationCAB({
        userOperation,
        repayTokens,
      });

      const bundlerClient = createBundlerClient({
        chain: getChain(chainId).chain,
        entryPoint: kernelAccount.entryPoint,
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