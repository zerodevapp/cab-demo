import {
  vaultManagerAddress,
  getChain,
  cabPaymasterAddress,
  getBundler,
  invoiceManagerAddress,
  testErc20Address,
  testErc20VaultAddress,
  getPaymaster,
  getPublicRpc,
} from "@/utils/constants";
import {
  createKernelAccount,
  createZeroDevPaymasterClient,
  createKernelAccountClient,
  type KernelSmartAccount,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import type { EntryPoint } from 'permissionless/types'
import { useCallback, useState } from "react";
import { 
  type Hex,
  type WalletClient,
  http,
  encodeFunctionData,
  parseAbi,
  parseEther,
  erc20Abi,
  createPublicClient,
} from 'viem';
import { invoiceManagerAbi } from "@/abis/invoiceManagerAbi";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { notifications } from "@mantine/notifications";
import { walletClientToSmartAccountSigner } from 'permissionless'

export type UseRegisterPaymasterParams = { 
  account: KernelSmartAccount<EntryPoint>,
  walletClient: WalletClient | undefined,
  chainId: number,
  onSuccess?: () => void
}

export function useRegisterPaymaster({
  account,
  walletClient,
  chainId,
  onSuccess,
}: UseRegisterPaymasterParams) {
  const [hash, setHash] = useState<Hex>();
  const [isPending, setIsPending] = useState(false);

  const register = useCallback(async () => {
    if (!chainId || !walletClient?.account) return;

    const selectedChain = getChain(chainId);
    const isRepay = selectedChain.isRepay;

    const amount = parseEther("0.1");

    const txs = isRepay ? [
      // register paymaster, mint token, deposit to vaultManager
      {
        to: invoiceManagerAddress,
        data: encodeFunctionData({
          abi: invoiceManagerAbi,
          functionName: "registerPaymaster",
          args: [
            cabPaymasterAddress,
            cabPaymasterAddress,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30) // now + 30 days
          ]
        }),
        value: 0n,
      },
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: parseAbi(["function mint(address,uint256)"]),
          functionName: "mint",
          args: [account.address, amount]
        }),
        value: 0n,
      },
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultManagerAddress, amount],
        }),
        value: 0n
      },
      {
        to: vaultManagerAddress,
        data: encodeFunctionData({
          abi: vaultManagerAbi,
          functionName: "deposit",
          args: [testErc20Address, testErc20VaultAddress, amount, false]
        }),
        value: 0n
      } 
    ] : [
      {
        to: invoiceManagerAddress,
        data: encodeFunctionData({
          abi: invoiceManagerAbi,
          functionName: "registerPaymaster",
          args: [
            cabPaymasterAddress,
            cabPaymasterAddress,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30) // now + 30 days
          ]
        }),
        value: 0n,
      }
    ]
    const paymaster = getPaymaster(chainId);

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
      middleware: !paymaster ? undefined : {
        sponsorUserOperation: ({ userOperation, entryPoint }) => {
          const paymasterClient = createZeroDevPaymasterClient({
            chain: selectedChain.chain,
            entryPoint: entryPoint,
            transport: http(paymaster),
          });
          return paymasterClient.sponsorUserOperation({
            userOperation,
            entryPoint
          })
        }
      }
    })
    try {
      setIsPending(true);
      const txHash = await kernelClient.sendTransactions({
        transactions: txs, 
      })
      console.log("txHash", txHash);
      setHash(txHash);
      onSuccess?.();
    } catch (error) {
      console.log(error);
      notifications.show({
        color: "red",
        message: "Fail to register paymaster",
      })
    } finally {
      setIsPending(false);
    }
  }, [account, walletClient, chainId, onSuccess]);

  return {
    hash,
    register,
    isPending
  }
}