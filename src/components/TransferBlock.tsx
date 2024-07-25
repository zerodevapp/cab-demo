import { Button, Tooltip } from "@mantine/core";
import { useKernelClient } from "@zerodev/waas";
import { testErc20Address, supportedChains, repayTokens } from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData } from "viem";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import { useTokenBalance, useCabBalance, useModal, useGetStubData } from "@/hooks";

export default function TransferBlock({ cab }: { cab: boolean }) {
  const chainId = supportedChains[1].id;
  const { address } = useAccount();
  const { address: smartAccountAddress } = useKernelClient();
  const { data: tokenBalance, isPending: isTokenBalancePending } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  })
  const { data: cabBalance , isPending: isCabBalancePending } = useCabBalance();
  const { openCABModal } = useModal();
  const { data, write, isPending } = useGetStubData({
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
    const loaidng = cab ? isCabBalancePending : isTokenBalancePending;
    const disabled = cab ? (cabBalance ?? 0n) < parseEther("0.01") : (tokenBalance ?? 0n) < parseEther("0.01");
    return {
      disabled,
      loaidng
    }
  }, [tokenBalance, cabBalance, cab, isTokenBalancePending, isCabBalancePending]);

  return (
    <>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <Tooltip label="Insufficient balance" disabled={!disabled}>
          <Button
            variant="outline"
            disabled={disabled}
            loading={loaidng || isPending || !address}
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