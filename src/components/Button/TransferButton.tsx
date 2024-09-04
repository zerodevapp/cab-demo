import { useEffect, useState } from "react";
import { Button, Tooltip } from "@mantine/core";
import { supportedChains, testErc20Address } from "@/utils/constants";
import { erc20Abi, parseEther } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useWriteContracts, useCallsStatus } from "wagmi/experimental";
import { useTokenBalance, useEoaAddress } from "@/hooks";
import { useReadCab } from "@magic-account/wagmi";
import { useMemo } from "react";
import { notifications } from "@mantine/notifications";

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
  const [transferPending, setTransferPending] = useState(false);
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const { address } = useEoaAddress();
  const { address: smartAccountAddress, chainId: currentChainId } =
    useAccount();
  const { refetch } = useTokenBalance({ address, chainId });
  const { refetch: refetchCabBalance } = useReadCab({structuralSharing: false});
  const { data: tokenBalance } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  });
  const { data: cabBalance } = useReadCab({structuralSharing: false});
  const { writeContractsAsync, data: id } = useWriteContracts();
  const { data: callsStatus, refetch: refetchCallsStatus } = useCallsStatus({
    id: id as string,
    query: {
      enabled: !!id,
      // Poll every 2 seconds until the calls are confirmed
      refetchInterval: (data) =>
        data.state.data?.status === "CONFIRMED" ? false : 2000,
      structuralSharing: false
    },
  });
  const status = callsStatus?.status;

  const disabled = useMemo(() => {
    return cab
      ? (cabBalance ?? 0n) < parseEther("0.01")
      : (tokenBalance ?? 0n) < parseEther("0.01");
  }, [tokenBalance, cabBalance, cab]);

  useEffect(() => {
    if (status === "CONFIRMED") {
      refetch();
      refetchCabBalance();
      refetchCallsStatus();
      setTransferPending(false);
      notifications.show({
        color: "green",
        message: "Successfully transfer 0.01 ETH to your eoa",
      });
    }
  }, [status, refetch, refetchCabBalance, refetchCallsStatus]);

  return (
    <Tooltip label="Insufficient balance" disabled={!disabled}>
      <Button
        variant="outline"
        disabled={disabled}
        loading={transferPending || isSwitchPending}
        onClick={async () => {
          if (!address) return;

          setTransferPending(true);

          if (currentChainId !== chainId) {
            await switchChainAsync({ chainId });
          }

          await writeContractsAsync({
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
