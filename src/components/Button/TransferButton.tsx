import { Button, Tooltip } from "@mantine/core";
import { repayTokens, supportedChains, testErc20Address } from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData } from "viem";
import { useAccount } from "wagmi";
import { useTokenBalance, useCabBalance, useModal, usePrepareUserOperation, useKernelCABClient } from "@/hooks";
import { useMemo } from "react";

export function TransferButton({ chainId, cab }: { chainId: number, cab: boolean }) {
  const chain = (supportedChains.find(chain => chain.id === chainId) ?? supportedChains[0]).chain;
  const { address } = useAccount();
  const { data } = useKernelCABClient({ chainId });
  const smartAccountAddress = data?.address;
  const { data: tokenBalance } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  })
  const { data: cabBalance } = useCabBalance();
  const { openCABModal } = useModal();
  const { write, isPending } = usePrepareUserOperation({
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

  const disabled = useMemo(() => {
    return cab ? (cabBalance ?? 0n) < parseEther("0.01") : (tokenBalance ?? 0n) < parseEther("0.01");
  }, [tokenBalance, cabBalance, cab]);

  return (
    <Tooltip label="Insufficient balance" disabled={!disabled}>
      <Button
        variant="outline"
        disabled={disabled}
        loading={isPending || !address}
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
        {`${chain.name}`}
      </Button>
    </Tooltip>
  )
}