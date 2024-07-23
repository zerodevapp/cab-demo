import { type KernelAccountClient } from "@zerodev/sdk";
import { GetEntryPointVersion, UserOperation, type EntryPoint } from 'permissionless/types'
import { useCallback, useState } from "react";
import { http } from 'viem';
import { Call, RepayToken, RepayTokenInfo, SponsorTokenInfo } from "@/types";
import { getChain, cabPaymasterUrl } from "@/utils/constants";
import { createZeroDevCABPaymasterClient } from "@zerodev/cab"
import { withdrawCall } from "@/utils/withdrawCall"
import { createInvoiceCall } from "@/utils/createInvoiceCall"

export type UseGetStubDataParams = {
  kernelClient: KernelAccountClient<EntryPoint> | undefined,
  chainId: number,
  onSuccess?: (
    { userOperation, repayTokensInfo }: 
    { 
      userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>, 
      repayTokensInfo: RepayTokenInfo[] 
      sponsorTokensInfo: SponsorTokenInfo[]
    }
  ) => void
}

export function useGetStubData({
  kernelClient,
  chainId,
  onSuccess
}: UseGetStubDataParams) {
  const [isPending, setIsPending] = useState(false);
  const [stubData, setStubData] = useState<{
    userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
    repayTokensInfo: RepayTokenInfo[]
  }>();

  const write = useCallback(async ({ calls, repayTokens }: { calls: Call[], repayTokens: RepayToken[] }) => {
    const kernelAccount = kernelClient?.account;
    if (!kernelAccount || !chainId) return undefined;

    try {
      setIsPending(true);
      const userOperation = await kernelClient.prepareUserOperationRequest({
        account: kernelAccount,
        userOperation: {
          callData: await kernelAccount.encodeCallData(calls)
        }
      })
      console.log("prepareUserOp", userOperation);
      const cabPaymasterClient = createZeroDevCABPaymasterClient({
        chain: getChain(chainId).chain,
        entryPoint: kernelAccount.entryPoint,
        transport: http(cabPaymasterUrl),
        account: kernelAccount
      })
      const sponsorTokenResponse = await cabPaymasterClient.getCabPaymasterSponsorTokens({
        userOperation: userOperation,
        entryPoint:  kernelAccount.entryPoint,
        sponsorChain: getChain(chainId).chain,
      });
      console.log("sponsorTokenResponse", sponsorTokenResponse);
      userOperation.callData = await kernelAccount.encodeCallData([
        ...withdrawCall({
            paymaster: sponsorTokenResponse.paymaster,
            accountAddress: kernelAccount.address,
            sponsorTokensInfo: sponsorTokenResponse.sponsorTokensInfo
        }),
        ...calls,
        createInvoiceCall({
            chainId,
            account: kernelAccount.address,
            nonce: userOperation.nonce,
            paymaster: sponsorTokenResponse.paymaster,
            repayTokensInfo: []
        })
      ])

      const paymasterStubDataRes = await cabPaymasterClient.getCabPaymasterStubData({
        userOperation,
        entryPoint: kernelAccount.entryPoint,
        sponsorChain: getChain(chainId).chain,
        repayTokens
      })
      console.log("paymasterStubDataRes", paymasterStubDataRes);
  
      userOperation.paymaster = paymasterStubDataRes.paymaster;
      userOperation.paymasterData = paymasterStubDataRes.paymasterData;
      userOperation.callGasLimit = paymasterStubDataRes.callGasLimit ?? 0n;
      userOperation.verificationGasLimit = paymasterStubDataRes.verificationGasLimit ?? 0n;
      userOperation.preVerificationGas = paymasterStubDataRes.preVerificationGas ?? 0n;
      userOperation.paymasterVerificationGasLimit = paymasterStubDataRes.paymasterVerificationGasLimit ?? 0n;
      userOperation.paymasterPostOpGasLimit = paymasterStubDataRes.paymasterPostOpGasLimit ?? 0n;
      userOperation.paymaster = paymasterStubDataRes.paymaster;
      userOperation.paymasterData = paymasterStubDataRes.paymasterData;
  
      userOperation.callData = await kernelAccount.encodeCallData([
        ...withdrawCall({
            paymaster: paymasterStubDataRes.paymaster,
            accountAddress: kernelAccount.address,
            sponsorTokensInfo: sponsorTokenResponse.sponsorTokensInfo
        }),
        ...calls,
        createInvoiceCall({
            chainId,
            account: kernelAccount.address,
            nonce: userOperation.nonce,
            paymaster: paymasterStubDataRes.paymaster,
            repayTokensInfo: paymasterStubDataRes.repayTokensInfo
        })
      ])

      setStubData({
        userOperation,
        repayTokensInfo: paymasterStubDataRes.repayTokensInfo
      })
      onSuccess?.({ userOperation, sponsorTokensInfo: sponsorTokenResponse.sponsorTokensInfo, repayTokensInfo: paymasterStubDataRes.repayTokensInfo });
    } catch (err) {
    } finally {
      setIsPending(false);
    }
    
  }, [kernelClient, chainId, onSuccess]);

  return {
    data: stubData,
    isPending,
    write
  }
}