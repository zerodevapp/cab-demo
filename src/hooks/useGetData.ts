import { type UserOperation, type GetEntryPointVersion, type EntryPoint } from "permissionless/types"
import { type KernelAccountClient } from "@zerodev/sdk";
import { RepayToken } from "@/types";
import { useCallback, useState } from "react";
import { createZeroDevCABPaymasterClient } from "@zerodev/cab"
import { getChain, cabPaymasterUrl } from "@/utils/constants";
import { http, type Hex } from 'viem';
import { sendUserOperation } from "permissionless/actions";

export type UseGetDataParams = {
  kernelClient: KernelAccountClient<EntryPoint> | undefined,
  chainId: number,
}

export function useGetData({
  kernelClient,
  chainId,
}: UseGetDataParams) {
  const [isPending, setIsPending] = useState(false);
  const [userOpHash, setUserOpHash] = useState<Hex>();

  const write = useCallback(async ({ userOperation, repayTokens }: { 
    userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
    repayTokens: RepayToken[] 
  }) => {
    const kernelAccount = kernelClient?.account;
      if (!kernelAccount || !chainId) return undefined;

      try { 
        setIsPending(true);
        const cabPaymasterClient = createZeroDevCABPaymasterClient({
          chain: getChain(chainId).chain,
          entryPoint: kernelAccount.entryPoint,
          transport: http(cabPaymasterUrl),
          account: kernelAccount
        })
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
        console.log("userOpHash", userOpHash);
        setUserOpHash(userOpHash)
      } catch (error) {}
      finally {
        setIsPending(false);
      }
  }, [kernelClient, chainId]);

  return {
    data: userOpHash,
    isPending,
    write
  }
}