import { supportedChains, getChain, getBundler, getPublicRpc, cabPaymasterUrl, testErc20Address } from "@/utils/constants";
import { createKernelAccount, createKernelAccountClient, type KernelSmartAccount } from "@zerodev/sdk";
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import type { EntryPoint } from 'permissionless/types'
import { useCallback, useState } from "react";
import { 
  type Hex,
  type WalletClient,
  type Address,
  http,
  createPublicClient,
} from 'viem';
import { notifications } from "@mantine/notifications";
import { walletClientToSmartAccountSigner } from 'permissionless'
import { createZeroDevCABPaymasterClient } from "@zerodev/cab"
import { withdrawCall } from "@/utils/withdrawCall"
import { createInvoiceCall } from "@/utils/createInvoiceCall"
import { sendUserOperation } from "permissionless/actions";

export type UseSendUserOperationWithCABParams = { 
  account: KernelSmartAccount<EntryPoint>,
  walletClient: WalletClient | undefined,
  chainId: number,
}

export function useSendUserOperationWithCAB({
  account,
  walletClient,
  chainId,
}: UseSendUserOperationWithCABParams) {
  const [isPending, setIsPending] = useState(false);

  const write = useCallback(async ({ to, value, data }: { to: Address, value?: bigint, data: Hex  }) => {
    if (!chainId || !walletClient?.account) return;
    const repayTokens = [{
      address: testErc20Address,
      chainId: supportedChains[0].id,
    }];
  
    const selectedChain = getChain(chainId);
    const publicClient = createPublicClient({
      transport: http(getPublicRpc(chainId)),
    })
    
    const validator = await signerToEcdsaValidator(publicClient, {
      signer: walletClientToSmartAccountSigner(
        walletClient as any
      ),
      entryPoint: account.entryPoint,
    })

    const kernelAccount = await createKernelAccount(publicClient, {
      plugins: {
        sudo: validator
      },
      entryPoint: account.entryPoint,
    })

    const kernelClient = createKernelAccountClient({
      account: kernelAccount,
      chain: selectedChain.chain,
      entryPoint: kernelAccount.entryPoint,
      bundlerTransport: http(getBundler(chainId)),
      middleware: {
        sponsorUserOperation: ({ userOperation, entryPoint }) => {
          return {
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n,
          } as any
        }
      }
    })
    try {
      setIsPending(true);
      const userOperation = await kernelClient.prepareUserOperationRequest({
        userOperation: {
          callData: await kernelAccount.encodeCallData({
            to: to,
            value: value ?? 0n,
            data: data,
          }),
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
        entryPoint: kernelAccount.entryPoint,
        sponsorChain: getChain(chainId).chain,
      });
      console.log("sponsorTokenResponse", sponsorTokenResponse);

      userOperation.callData = await kernelAccount.encodeCallData([
        ...withdrawCall({
            paymaster: sponsorTokenResponse.paymaster,
            accountAddress: kernelAccount.address,
            sponsorTokensInfo: sponsorTokenResponse.sponsorTokensInfo
        }),
        {
            to: to,
            value: value ?? 0n,
            data: data,
        },
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

      userOperation.callGasLimit = paymasterStubDataRes.callGasLimit ?? 0n;
      userOperation.verificationGasLimit = paymasterStubDataRes.verificationGasLimit ?? 0n;
      userOperation.preVerificationGas = paymasterStubDataRes.preVerificationGas ?? 0n;
      userOperation.paymasterVerificationGasLimit = paymasterStubDataRes.paymasterVerificationGasLimit ?? 0n;
      userOperation.paymasterPostOpGasLimit = paymasterStubDataRes.paymasterPostOpGasLimit ?? 0n;
      userOperation.paymaster = paymasterStubDataRes.paymaster;
      userOperation.paymasterData = paymasterStubDataRes.paymasterData;

      console.log("userOperation", userOperation);

      userOperation.callData = await kernelAccount.encodeCallData([
        ...withdrawCall({
            paymaster: paymasterStubDataRes.paymaster,
            accountAddress: kernelAccount.address,
            sponsorTokensInfo: sponsorTokenResponse.sponsorTokensInfo
        }),
        {
          to: to,
          value: value ?? 0n,
          data: data,
        },
        createInvoiceCall({
            chainId,
            account: kernelAccount.address,
            nonce: userOperation.nonce,
            paymaster: paymasterStubDataRes.paymaster,
            repayTokensInfo: paymasterStubDataRes.repayTokensInfo
        })
      ])
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
      
    } catch (error) {
      console.log(error);
      notifications.show({
        color: "red",
        message: "Fail to register paymaster",
      })
    } finally {
      setIsPending(false);
    }
  }, [account, walletClient, chainId]);

  return {
    write,
    isPending
  }
}