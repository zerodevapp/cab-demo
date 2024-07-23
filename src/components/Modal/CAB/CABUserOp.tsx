import { useWalletClient } from "wagmi";
import { useKernelClient } from "@zerodev/waas";
import { Call } from "@/types";
import { useState, useEffect } from "react";
import {
  getChain,
  getPublicRpc,
  getBundler,
  testErc20Address,
  supportedChains,
} from "@/utils/constants";
import { createPublicClient, http } from 'viem';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  type KernelAccountClient,
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from 'permissionless'
import { type EntryPoint } from 'permissionless/types'
import { useGetStubData, useGetData, useModal } from "@/hooks";
import { Button, Loader } from "@mantine/core";

export default function CABUserOp({ calls, chainId }: { calls: Call[], chainId: number }) {
  const [activeStep, setActiveStep] = useState(0);
  const [kernelClient, setKernelClient] = useState<KernelAccountClient<EntryPoint>>();
  const { data: walletClient } = useWalletClient();
  const { kernelAccount } = useKernelClient();
  const { data, write, isPending } = useGetStubData({
    kernelClient,
    chainId
  })
  const { data: userOpHash, write: writeData, isPending: isPendingData } = useGetData({
    kernelClient,
    chainId
  })
  const { closeCABModal } = useModal();
  
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

  const repayTokens = [{
    address: testErc20Address,
    chainId: supportedChains[0].id,
  }];
 
  
  return (
    <div>
      {activeStep === 0 && (
        <div>
          {repayTokens.map((token, index) => (
            <div key={index}>
              <p>Address: {token.address}</p>
              <p>Chain ID: {token.chainId}</p>
              {/* Add selection logic here if needed */}
            </div>
          ))}
          <Button onClick={() => {
            setActiveStep(1);
            write({ calls, repayTokens })}
          }>Next</Button>
        </div>
      )}
      {activeStep === 1 && (
        isPending ? <Loader /> : (
          <div>
            {data?.repayTokens.map((token, index) => (
              <div key={index}>
                <p>Vault: {token.vault}</p>
                <p>Chain ID: {token.chainId}</p>
                <p>Amount: {token.amount}</p>
              </div>
            ))}
            <Button onClick={() => {
              if (!data) return;
              setActiveStep(2)
              writeData({ userOperation: data.userOperation, repayTokens })
            }}>Confirm</Button>
          </div>
        )
      )}
      {activeStep === 2 && (
        isPendingData ? <Loader /> : (
          <div>
            <p>UserOp Hash: {userOpHash}</p>
            <Button disabled={!closeCABModal} onClick={() => closeCABModal?.() }>Close</Button>
          </div>
        )
      )}
    </div>
  )
}