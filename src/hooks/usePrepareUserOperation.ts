import { GetEntryPointVersion, UserOperation, type EntryPoint } from 'permissionless/types'
import { Call, RepayToken, RepayTokenInfo, SponsorTokenInfo } from "@/types";
import { useKernelCABClient } from "@/hooks";
import { useMutation } from '@tanstack/react-query';

export type UsePrepareUserOperationParams = {
  chainId: number,
  onSuccess?: (
    { userOperation, repayTokensInfo, sponsorTokensInfo }: 
    { 
      userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>, 
      repayTokensInfo: RepayTokenInfo[] 
      sponsorTokensInfo: SponsorTokenInfo[]
    }
  ) => void
}

export function usePrepareUserOperation({
  chainId,
  onSuccess
}: UsePrepareUserOperationParams) {
  const { data } = useKernelCABClient({ chainId });
  const kernelAccount = data?.kernelClient?.account;
  const cabPaymasterClient = data?.cabPaymasterClient;

  const mutation = useMutation({
    mutationFn: async ({ calls, repayTokens }: { calls: Call[], repayTokens: RepayToken[] }) => {
      if (!kernelAccount || !cabPaymasterClient) {
        throw new Error('KernelAccount or CABPaymasterClient is not available');
      }

      const prepareUserOpFromCAB = await cabPaymasterClient.prepareUserOperationCABRequest({
        account: kernelAccount,
        userOperation: {
          callData: await kernelAccount.encodeCallData(calls)
        },
        repayTokens
      });

      return prepareUserOpFromCAB;
    },
    onSuccess: (data) => {
      onSuccess?.({
        userOperation: data.userOperation,
        sponsorTokensInfo: data.sponsorTokensInfo,
        repayTokensInfo: data.repayTokensInfo
      });
    },
    onError: (error) => {
      console.log("Error:", error);
    }
  });

  return {
    ...mutation,
    write: mutation.mutate
  }
}