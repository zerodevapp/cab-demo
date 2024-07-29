import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getChain, getPublicRpc, getBundler, cabPaymasterUrl, getPaymaster } from "@/utils/constants";
import { walletClientToSmartAccountSigner } from 'permissionless'
import { http, createPublicClient } from 'viem';
import { useKernelClient } from "@zerodev/waas";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { createKernelCABClient } from "@zerodev/cab"

export type UseKernelCABClientParams = {
  chainId: number,
}

export function useKernelCABClient({
  chainId
}: UseKernelCABClientParams) {
  const { kernelAccount } = useKernelClient();
  const { data: walletClient } = useWalletClient();

  return useQuery({
    queryKey: ['cabKernelClient', chainId, kernelAccount?.address, walletClient?.account.address],
    queryFn: async () => {
      if (!walletClient || !kernelAccount) {
        throw new Error("Wallet client or kernel account not available");
      }

      const selectedChain = getChain(chainId);
      const publicClient = createPublicClient({
        transport: http(getPublicRpc(chainId)),
      });
      
      const validator = await signerToEcdsaValidator(publicClient, {
        signer: walletClientToSmartAccountSigner(walletClient as any),
        entryPoint: kernelAccount.entryPoint,
      });
      
      const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: validator,
        },
        entryPoint: kernelAccount.entryPoint,
      });
      const paymaster = getPaymaster(chainId);
      const kernelClientVerifyingPaymaster = createKernelAccountClient({
        account: account,
        chain: selectedChain.chain,
        entryPoint: account.entryPoint,
        bundlerTransport: http(getBundler(chainId), { timeout: 30000 }),
        middleware: {
          sponsorUserOperation: ({ userOperation, entryPoint }) => {
            const paymasterClient = createZeroDevPaymasterClient({
              chain: selectedChain.chain,
              entryPoint: entryPoint,
              transport: http(paymaster),
            }); 

            return paymasterClient.sponsorUserOperation({
              userOperation,
              entryPoint
            });
          }
        }, 
      })
      const kernelClient = createKernelAccountClient({
        account: account,
        chain: selectedChain.chain,
        entryPoint: account.entryPoint,
        bundlerTransport: http(getBundler(chainId)),
        middleware: {
          sponsorUserOperation: ({ userOperation, entryPoint }) => {
            return {
              callGasLimit: 0n,
              verificationGasLimit: 0n,
              preVerificationGas: 0n,
            } as any;
          },
        },
      });
      const cabPaymasterClient = createKernelCABClient(kernelClient, {
        transport: http(
          cabPaymasterUrl,
          {
            timeout: 30000
          }
        ),
      })

      return { address: account.address, kernelClient, cabPaymasterClient, kernelClientVerifyingPaymaster };
    },
    enabled: !!walletClient && !!kernelAccount,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
