import { Button, Tooltip } from "@mantine/core";
import { supportedChains, testErc20Address } from "@/utils/constants";
import { erc20Abi, parseEther, encodeFunctionData } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import {
  useWriteContracts,
  type UseWriteContractsParameters,
} from "wagmi/experimental";
import {
  useTokenBalance,
  useCabBalance,
  useModal,
  useEoaAddress,
} from "@/hooks";
import { useMemo } from "react";

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
  const { switchChainAsync } = useSwitchChain();
  const { address } = useEoaAddress();
  const { address: smartAccountAddress, chainId: currentChainId } =
    useAccount();
  console.log({ smartAccountAddress });
  const { data: tokenBalance } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  });
  const { data: cabBalance } = useCabBalance();
  const { writeContracts, isPending, error } = useWriteContracts();
  console.log({ error });

  const disabled = useMemo(() => {
    console.log({ tokenBalance, cabBalance, cab });
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
            await switchChainAsync({ chainId });
          }

          writeContracts({
            contracts: [
              {
                abi: erc20Abi,
                address: testErc20Address,
                functionName: "transfer",
                args: [address, parseEther("0.01")],
              },
            ],
          });
        }}
      >
        {`${chain.name}`}
      </Button>
    </Tooltip>
  );
}
