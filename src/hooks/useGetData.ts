import { type UserOperation, type GetEntryPointVersion, type EntryPoint } from "permissionless/types"
import { RepayToken } from "@/types";
import { useCallback, useState } from "react";
import { createZeroDevCABPaymasterClient } from "@zerodev/cab"
import { getChain, cabPaymasterUrl, getBundler } from "@/utils/constants";
import { http, type Hex } from 'viem';
import { sendUserOperation } from "permissionless/actions";
import { createBundlerClient } from "permissionless";
import { useCabKernelClient, useTokenBalance } from "@/hooks";
import { useAccount } from "wagmi";

export type UseGetDataParams = {
  chainId: number,
  onSuccess?: ({ userOpHash }: { userOpHash: Hex }) => void
}

export function useGetData({
  chainId,
  onSuccess,
}: UseGetDataParams) {
  const { data } = useCabKernelClient({ chainId });
  const kernelClient = data?.kernelClient;
  const cabPaymasterClient = data?.cabPaymasterClient;
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [userOpHash, setUserOpHash] = useState<Hex>();
  const { refetch } = useTokenBalance({ chainId, address: address });

  const write = useCallback(async ({ userOperation, repayTokens }: { 
    userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
    repayTokens: RepayToken[] 
  }) => {
    const kernelAccount = kernelClient?.account;
    if (!kernelAccount || !cabPaymasterClient) return undefined;

    try { 
      setIsPending(true);
      const paymasterDataRes = await cabPaymasterClient.getCabPaymasterData({
        userOperation,
        entryPoint: kernelAccount.entryPoint,
        sponsorChain: getChain(chainId).chain,
        repayTokens
      })
      console.log("paymasterDataRes", paymasterDataRes);

      userOperation.paymasterData = paymasterDataRes.paymasterData;
      
      const signature = await kernelAccount.signUserOperation(userOperation);
      userOperation.signature = signature;

      console.log("userOperation before send userOp", userOperation);
      
      const userOpHash = await sendUserOperation(kernelClient, {
        userOperation,
        entryPoint: kernelAccount.entryPoint,
      })
      const bundlerClient = createBundlerClient({
        chain: getChain(chainId).chain,
        entryPoint: kernelAccount.entryPoint,
        transport: http(getBundler(chainId)),
      })
      await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      })
      console.log("userOpHash", userOpHash);
      setUserOpHash(userOpHash)
      onSuccess?.({ userOpHash });
      refetch();
    } catch (error) {}
    finally {
      setIsPending(false);
    }
  }, [kernelClient, chainId, onSuccess, refetch, cabPaymasterClient]);

  return {
    data: userOpHash,
    isPending,
    write
  }
}