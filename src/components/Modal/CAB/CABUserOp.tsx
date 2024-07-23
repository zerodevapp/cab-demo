import { useAccount, useWalletClient } from "wagmi";
import { useKernelClient } from "@zerodev/waas";
import { RepayTokenInfo, SponsorTokenInfo } from "@/types";
import { useState, useEffect } from "react";
import {
  getChain,
  getPublicRpc,
  getBundler,
  supportedChains,
  repayTokens,
} from "@/utils/constants";
import { createPublicClient, http, formatEther } from 'viem';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  type KernelAccountClient,
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from 'permissionless'
import type { EntryPoint, GetEntryPointVersion, UserOperation } from 'permissionless/types'
import { useGetData, useModal, useTokenBalance } from "@/hooks";
import { Button, Card, Text, Group, Badge, ActionIcon, CopyButton, Tooltip, Flex, ThemeIcon } from "@mantine/core";
import { IconCopy, IconCheck } from '@tabler/icons-react';

export default function CABUserOp({
  sponsorTokensInfo,
  repayTokensInfo,
  userOperation,
  chainId,
}: { 
  sponsorTokensInfo: SponsorTokenInfo[] | undefined,
  repayTokensInfo: RepayTokenInfo[] | undefined, 
  userOperation: UserOperation<GetEntryPointVersion<EntryPoint>> | undefined, 
  chainId: number,
}) {
  const { address } = useAccount();
  const [activeStep, setActiveStep] = useState(0);
  const [kernelClient, setKernelClient] = useState<KernelAccountClient<EntryPoint>>();
  const { data: walletClient } = useWalletClient();
  const { kernelAccount } = useKernelClient();
  const { data: userOpHash, write: writeData, isPending: isPendingData } = useGetData({
    kernelClient,
    chainId,
    onSuccess: () => {
      setActiveStep(1);
      refetch();
    }
  })
  const { refetch } = useTokenBalance({ address,  chainId })
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

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section p="md">
        {activeStep === 0 && (
          (
            <>
              <Text size="lg" w={700} mb="md">Sponsor Tokens</Text>
              {sponsorTokensInfo?.map((token, index) => (
                <Card key={index} shadow="xs" p="sm" radius="md" withBorder mb="sm">
                  <Group p="apart">
                    <Text>Token</Text>
                    <Badge color="blue">{token.address.slice(0, 6)}...{token.address.slice(-4)}</Badge>
                  </Group>
                  <Group p="apart" mt="xs">
                    <Text>Chain</Text>
                    <Badge color="green">{supportedChains.find(chain => chain.id === chainId)?.chain.name || chainId}</Badge>
                  </Group>
                  <Group p="apart" mt="xs">
                    <Text>Amount</Text>
                    <Badge color="yellow">{formatEther(BigInt(token.amount))}</Badge>
                  </Group>
                </Card>
              ))}
              <Text size="lg" w={700} mb="md">Repay Tokens</Text>
              {repayTokensInfo?.map((token, index) => (
                <Card key={index} shadow="xs" p="sm" radius="md" withBorder mb="sm">
                  <Group p="apart">
                    <Text>Vault</Text>
                    <Badge color="blue">{token.vault.slice(0, 6)}...{token.vault.slice(-4)}</Badge>
                  </Group>
                  <Group p="apart" mt="xs">
                    <Text>Chain</Text>
                    <Badge color="green">{supportedChains.find(chain => chain.id === token.chainId)?.chain.name || token.chainId}</Badge>
                  </Group>
                  <Group p="apart" mt="xs">
                    <Text>Amount</Text>
                    <Badge color="yellow">{formatEther(token.amount)}</Badge>
                  </Group>
                </Card>
              ))}
              <Button fullWidth mt="md" loading={isPendingData} onClick={() => {
                if (!userOperation) return;
                writeData({ userOperation: userOperation, repayTokens });
              }}>Confirm Transaction</Button>
            </>
          )
        )}

        {activeStep === 1 && (
          <Flex direction="column" align="center" gap="md">
            <ThemeIcon color="teal" size="xl" radius="xl">
              <IconCheck size={30} />
            </ThemeIcon>            
            <Text size="sm" c="dimmed">UserOp Hash</Text>
            <Group gap="xs" p="center">
              <Text size="sm">{userOpHash?.slice(0, 6)}...{userOpHash?.slice(-4)}</Text>
              <CopyButton value={userOpHash || ''} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} size="sm">
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Button fullWidth mt="md" disabled={!closeCABModal} onClick={() => closeCABModal?.()}>
              Close
            </Button>
          </Flex>
        )}
      </Card.Section>
    </Card>
  );
}