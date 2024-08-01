import { Button, Tooltip } from "@mantine/core";
import {
  repayTokens,
  supportedChains,
  testErc20Address,
} from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import {
  useTokenBalance,
  useCabBalance,
  useModal,
  usePrepareUserOperation,
  useCABClient,
  useEoaAddress,
} from "@/hooks";
import { useMemo } from "react";
import { parseAbi } from "viem";

export function TransferButton({
  chainId,
  cab,
}: {
  chainId: number;
  cab: boolean;
}) {
  const chain = (
    supportedChains.find((chain) => chain.id === chainId) ?? supportedChains[0]
  ).chain;
  const { switchChain } = useSwitchChain();
  const { address } = useEoaAddress();
  const { address: smartAccountAddress, chainId: currentChainId } = useAccount();
  // const { data } = useCABClient({ chainId });
  // const smartAccountAddress = data?.address;
  const { data: tokenBalance } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  });
  const { data: cabBalance } = useCabBalance();
  const { openCABModal } = useModal();
  const { writeContracts, isPending, error } = useWriteContracts();
  console.log({ error });

  // const { write, isPending } = usePrepareUserOperation({
  //   chainId,
  //   onSuccess: ({ userOperation, repayTokensInfo, sponsorTokensInfo }) => {
  //     openCABModal?.({
  //       chainId,
  //       sponsorTokensInfo,
  //       repayTokensInfo,
  //       userOperation
  //     })
  //   }
  // })

  const disabled = useMemo(() => {
    return cab
      ? (cabBalance ?? 0n) < parseEther("0.01")
      : (tokenBalance ?? 0n) < parseEther("0.01");
  }, [tokenBalance, cabBalance, cab]);

  return (
    <Tooltip label="Insufficient balance" disabled={!disabled}>
      <Button
        variant="outline"
        disabled={disabled}
        loading={isPending || !address}
        onClick={async () => {
          if (!address) return;

          if (currentChainId !== chainId) {
            await switchChain({ chainId });
          }
          // todo: need to switch chains before this or it still gets sent to sepolia
          writeContracts({
            contracts: [
              {
                abi: erc20Abi,
                address: testErc20Address,
                functionName: "transfer",
                args: [address, parseEther("0.01")],
              },
            ],
            capabilities: {
              cab: {
                useCab: true,
              },
            },
          });

          // write({
          //   calls: [
          //     {
          //       to: testErc20Address,
          //       value: 0n,
          //       data: encodeFunctionData({
          //         abi: erc20Abi,
          //         functionName: "transfer",
          //         args: [address, parseEther("0.01")],
          //       }),
          //     }
          //   ],
          //   repayTokens
          // });
        }}
      >
        {`${chain.name}`}
      </Button>
    </Tooltip>
  );
}
