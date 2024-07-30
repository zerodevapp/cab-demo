import { GetEntryPointVersion, UserOperation, type EntryPoint } from 'permissionless/types'
import { Call, RepayToken, RepayTokenInfo, SponsorTokenInfo } from "@/types";
import { useCABClient } from "@/hooks";
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
  const { data } = useCABClient({ chainId });
  const smartAccount = data?.account;
  const cabClient = data?.cabClient;

  const mutation = useMutation({
    mutationFn: async ({ calls, repayTokens }: { calls: Call[], repayTokens: RepayToken[] }) => {
      if (!smartAccount || !cabClient) {
        throw new Error('KernelAccount or CABPaymasterClient is not available');
      }

      const prepareUserOpFromCAB = await cabClient.prepareUserOperationRequestCAB({
        account: cabClient.account,
        transactions: calls,
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