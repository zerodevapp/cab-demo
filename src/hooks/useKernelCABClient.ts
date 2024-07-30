import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getChain, getPublicRpc, getBundler, cabPaymasterUrl, getPimlicoRpc } from "@/utils/constants";
import { walletClientToSmartAccountSigner, ENTRYPOINT_ADDRESS_V07, createSmartAccountClient } from 'permissionless'
import { http, createPublicClient, WalletClient, PublicClient } from 'viem';
import { createCABClient } from "@zerodev/cab"
import { signerToEcdsaKernelSmartAccount, signerToSafeSmartAccount } from "permissionless/accounts"
import { createPimlicoPaymasterClient, createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { useAccountType } from "@/components/Provider/AccountProvider";

export type UseKernelCABClientParams = {
  chainId: number,
}

const getAccountFromType = (accountType: string, publicClient: PublicClient, walletClient: WalletClient) => {
  if (accountType === "kernel") {
    return signerToEcdsaKernelSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: walletClientToSmartAccountSigner(walletClient as any),
    })
  } else if (accountType === "safe") {
    return signerToSafeSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: walletClientToSmartAccountSigner(walletClient as any),
      safeVersion: "1.4.1",
    })
  }

  throw new Error("Unsupported account type");
}

export function useKernelCABClient({
  chainId
}: UseKernelCABClientParams) {
  const { account: accountType } = useAccountType();
  const { data: walletClient } = useWalletClient();

  return useQuery({
    queryKey: ['cabKernelClient', chainId, walletClient?.account.address, accountType],
    queryFn: async () => {
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      const selectedChain = getChain(chainId);
      const publicClient = createPublicClient({
        transport: http(getPublicRpc(chainId)),
      });
      const account = await getAccountFromType(accountType, publicClient, walletClient);

      const kernelClient = createSmartAccountClient({
        account: account,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        chain: selectedChain.chain,
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
      })

      const pimlicoPaymasterClient = createPimlicoPaymasterClient({
        transport: http(getPimlicoRpc(chainId)),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
      })
      const pimlicoBundlerClient = createPimlicoBundlerClient({
        transport: http(getPimlicoRpc(chainId)),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
      })
      const kernelClientVerifyingPaymaster = createSmartAccountClient({
        account: account,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        chain: selectedChain.chain,
        bundlerTransport: http(getBundler(chainId), { timeout: 30000 }),
        middleware: {
          sponsorUserOperation: pimlicoPaymasterClient.sponsorUserOperation, 
          gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast
        },
      })

      const cabPaymasterClient = createCABClient(kernelClient, {
        transport: http(
          cabPaymasterUrl,
          {
            timeout: 30000
          }
        ),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
      })

      return { address: account.address, account, kernelClient, cabPaymasterClient, kernelClientVerifyingPaymaster };
    },
    enabled: !!walletClient,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
