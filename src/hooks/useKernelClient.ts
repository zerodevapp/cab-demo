import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  getChain,
  getPublicRpc,
  getBundler,
  cabPaymasterUrl,
  getPimlicoRpc,
} from "@/utils/constants";
import {
  walletClientToSmartAccountSigner,
  ENTRYPOINT_ADDRESS_V07,
  createSmartAccountClient,
} from "permissionless";
import { http, createPublicClient, WalletClient, PublicClient } from "viem";
import { createCABClient } from "@zerodev/cab";
import {
  signerToEcdsaKernelSmartAccount,
  signerToSafeSmartAccount,
} from "permissionless/accounts";
import {
  createPimlicoPaymasterClient,
  createPimlicoBundlerClient,
} from "permissionless/clients/pimlico";
import { useAccountType } from "@/components/Provider/AccountProvider";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { KERNEL_V3_0 } from "@zerodev/sdk/constants"

export type useCABClientParams = {
  chainId: number;
};

const getAccountFromType = (
  accountType: string,
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  if (accountType === "kernel") {
    return signerToEcdsaKernelSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: walletClientToSmartAccountSigner(walletClient as any),
    });
  } else if (accountType === "safe") {
    return signerToSafeSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: walletClientToSmartAccountSigner(walletClient as any),
      safeVersion: "1.4.1",
    });
  }

  throw new Error("Unsupported account type");
};

export function useKernelClient({ chainId }: useCABClientParams) {
  const { account: accountType } = useAccountType();
  const { data: walletClient } = useWalletClient();

  return useQuery({
    queryKey: [
      "cabKernelClient1",
      chainId,
      walletClient?.account.address,
      accountType,
    ],
    queryFn: async () => {
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      const selectedChain = getChain(chainId);
      const publicClient = createPublicClient({
        transport: http(getPublicRpc(chainId)),
      });

    //   const walletClient = createClient({
    //     account: accounts[0],
    //     chain: connetedChain,
    //     name: "Connector Client",
    //     transport: (opts) =>
    //       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    //       custom(provider as ExplicitAny)({
    //         ...opts,
    //         retryCount: 0,
    //       }),
    //   }).extend(walletActions) as WalletClient<Transport, Chain, Account>;

      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_0,
        signer: walletClientToSmartAccountSigner(walletClient),
      });
      const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_0,
        plugins: {
          sudo: ecdsaValidator,
        },
      });
      //   const smartAccount = await getAccountFromType(accountType, publicClient, walletClient);

      //   const smartAccountClient = createSmartAccountClient({
      //     account: smartAccount,
      //     entryPoint: ENTRYPOINT_ADDRESS_V07,
      //     chain: selectedChain.chain,
      //     bundlerTransport: http(getBundler(chainId)),
      //     middleware: {
      //       sponsorUserOperation: ({ userOperation, entryPoint }) => {
      //         return {
      //           callGasLimit: 0n,
      //           verificationGasLimit: 0n,
      //           preVerificationGas: 0n,
      //         } as any;
      //       },
      //     },
      //   })

      //   // Question: why are we using pimlico directly  for paymaster
      //   const pimlicoPaymasterClient = createPimlicoPaymasterClient({
      //     transport: http(getPimlicoRpc(chainId)),
      //     entryPoint: ENTRYPOINT_ADDRESS_V07,
      //   })
      //   const pimlicoBundlerClient = createPimlicoBundlerClient({
      //     transport: http(getPimlicoRpc(chainId)),
      //     entryPoint: ENTRYPOINT_ADDRESS_V07,
      //   })
      //   const smartAccountClientVerifyingPaymaster = createSmartAccountClient({
      //     account: smartAccount,
      //     entryPoint: ENTRYPOINT_ADDRESS_V07,
      //     chain: selectedChain.chain,
      //     bundlerTransport: http(getBundler(chainId), { timeout: 30000 }),
      //     middleware: {
      //       sponsorUserOperation: pimlicoPaymasterClient.sponsorUserOperation,
      //       gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast
      //     },
      //   })

      //   const cabClient = createCABClient(smartAccountClient, {
      //     transport: http(
      //       cabPaymasterUrl,
      //       {
      //         timeout: 30000
      //       }
      //     ),
      //     entryPoint: ENTRYPOINT_ADDRESS_V07,
      //   })

      return {
        address: kernelAccount.address,
        account: kernelAccount,
      };
    },
    enabled: !!walletClient,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
