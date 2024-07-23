import { Button, Tooltip } from "@mantine/core";
import { useKernelClient } from "@zerodev/waas";
import {
  testErc20Address,
  supportedChains,
  repayTokens,
  getChain,
  getPublicRpc,
  getBundler,
} from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData, http, createPublicClient } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { useMemo, useEffect, useState } from "react";
import { useTokenBalance, useCabBalance, useModal, useGetStubData } from "@/hooks";
import { 
  createKernelAccount,
  createKernelAccountClient,
  type KernelAccountClient
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { walletClientToSmartAccountSigner } from 'permissionless'
import { type EntryPoint } from 'permissionless/types'

export default function TransferBlock({ cab }: { cab: boolean }) {
  const [kernelClient, setKernelClient] = useState<KernelAccountClient<EntryPoint>>();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { address: smartAccountAddress, kernelAccount } = useKernelClient();
  const { data: tokenBalance, isPending: isTokenBalancePending } = useTokenBalance({
    address: smartAccountAddress,
    chainId: supportedChains[1].id,
  })
  const { data: cabBalance , isPending: isCabBalancePending } = useCabBalance();
  const { openCABModal } = useModal();
  const chainId = supportedChains[1].id;
  const { data, write, isPending } = useGetStubData({
    kernelClient,
    chainId,
    onSuccess: ({ userOperation, repayTokensInfo, sponsorTokensInfo }) => {
      openCABModal?.({
        chainId,
        sponsorTokensInfo,
        repayTokensInfo,
        userOperation
      })
    }
  })
  
  const { disabled, loaidng } = useMemo(() => {
    const loaidng = isTokenBalancePending || isCabBalancePending;
    const disabled = cab ? (cabBalance ?? 0n) < parseEther("0.01") : (tokenBalance ?? 0n) < parseEther("0.01");
    return {
      disabled,
      loaidng
    }
  }, [tokenBalance, cabBalance, cab, isTokenBalancePending, isCabBalancePending]);


  useEffect(() => {
    const initializeKernelClient = async () => {
      if (!walletClient || !kernelAccount) return;
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
      setKernelClient(kernelClient);
    };

    initializeKernelClient();
  }, [walletClient, kernelAccount, chainId]);

  return (
    <>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <Tooltip label="Insufficient balance" disabled={!disabled}>
          <Button
            variant="outline"
            disabled={disabled}
            loading={loaidng || isPending}
            onClick={() => {
              if (!address) return;
              write({
                calls: [
                  {
                    to: testErc20Address,
                    value: 0n,
                    data: encodeFunctionData({
                      abi: erc20Abi,
                      functionName: "transfer",
                      args: [address, parseEther("0.01")],
                    }),
                  } 
                ],
                repayTokens
              });
            }}
          >
            {`Transfer 0.01 6TEST to EOA on ${supportedChains[1].chain.name}`}
          </Button>
        </Tooltip>
      </div>
    </>
  )
}