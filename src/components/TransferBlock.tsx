import { Button } from "@mantine/core";
import { useSendUserOperation, useKernelClient } from "@zerodev/waas";
import { testErc20Address, supportedChains } from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData, Address } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { useMemo} from "react";
import { useTokenBalance, useCabBalance, useSendUserOperationWithCAB, useModal } from "@/hooks";

export default function TransferBlock({ cab }: { cab: boolean }) {
  const { address } = useAccount();
  const { address: smartAccountAddress, kernelAccount } = useKernelClient();
  const { data: tokenBalance, isPending: isTokenBalancePending } = useTokenBalance({
    address: smartAccountAddress,
    chainId: supportedChains[1].id,
  })
  const { data: cabBalance , isPending: isCabBalancePending } = useCabBalance();
  const { data: walletClient } = useWalletClient();
  const { openCABModal } = useModal();

  // const { write, isPending } = useSendUserOperationWithCAB({
  //   account: kernelAccount,
  //   walletClient: walletClient,
  //   chainId: supportedChains[1].id,
  // })
  
  const { disabled, loaidng } = useMemo(() => {
    const loaidng = isTokenBalancePending || isCabBalancePending;
    const disabled = cab ? (cabBalance?.totalBalance ?? 0n) < parseEther("0.01") : (tokenBalance ?? 0n) < parseEther("0.01");
    return {
      disabled,
      loaidng
    }
  }, [tokenBalance, cabBalance, cab, isTokenBalancePending, isCabBalancePending]);

  return (
    <>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <Button
          variant="outline"
          disabled={disabled}
          loading={loaidng}
          onClick={() => {
            if (!address || !openCABModal) return;

            openCABModal({
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
              chainId: supportedChains[1].id
            })
            // write({
            //   to: testErc20Address,
            //   value: 0n,
            //   data: encodeFunctionData({
            //     abi: erc20Abi,
            //     functionName: "transfer",
            //     args: [address, parseEther("0.01")],
            //   }),
            // })
          }}
        >
          {disabled ? "Insufficient Balance" : `Transfer 0.01 6TEST to EOA on ${supportedChains[1].chain.name}`}
        </Button>
      </div>
    </>
  )
}