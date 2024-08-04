import { useEffect } from "react";
import { Button } from "@mantine/core";
import {
  testErc20Address,
  vaultManagerAddress,
  testErc20VaultAddress,
  getPaymaster,
  supportedChains,
} from "@/utils/constants";
import { useCabBalance } from "@build-with-yi/wagmi";
import { useMemo, useCallback, useState } from "react";
import { parseEther, parseAbi, erc20Abi } from "viem";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { notifications } from "@mantine/notifications";
import { useAccount, useSwitchChain } from "wagmi";
import { useWriteContracts, useCallsStatus } from "wagmi/experimental";

export function DepositButton() {
  const [isDepositPending, setIsDepositPending] = useState(false);
  const { refetch } = useCabBalance();
  const { writeContracts, data: id } = useWriteContracts();
  const { switchChainAsync } = useSwitchChain();
  const { data: callsStatus, refetch: refetchCallsStatus } = useCallsStatus({
    id: id as string,
    query: {
      enabled: !!id,
      // Poll every 2 seconds until the calls are confirmed
      refetchInterval: (data) =>
        data.state.data?.status === "CONFIRMED" ? false : 2000,
    },
  });
  const { address: accountAddress, chainId: currentChainId } = useAccount();
  const disabled = !accountAddress || !refetch;

  const txs = useMemo(() => {
    if (!accountAddress) return [];
    const amount = parseEther("0.3");

    return [
      {
        address: testErc20Address,
        abi: parseAbi(["function mint(address,uint256)"]),
        functionName: "mint",
        args: [accountAddress, amount],
      },
      {
        address: testErc20Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultManagerAddress, amount],
      },
      {
        address: vaultManagerAddress,
        abi: vaultManagerAbi,
        functionName: "deposit",
        args: [testErc20Address, testErc20VaultAddress, amount, false],
      },
    ];
  }, [accountAddress]);

  useEffect(() => {
    console.log("callsStatus", callsStatus?.status);
    if (callsStatus?.status === "CONFIRMED") {
      refetchCallsStatus();
      setTimeout(() => {
        refetch();
        setIsDepositPending(false);
        notifications.show({
          color: "green",
          message: "Deposit Success",
        });
      }, 1000);
    }
  }, [callsStatus?.status, refetch, refetchCallsStatus]);

  const deposit = useCallback(async () => {
    if (!refetch) return;
    try {
      setIsDepositPending(true);

      if (currentChainId !== supportedChains[0].id) {
        await switchChainAsync({ chainId: supportedChains[0].id });
      }

      const paymasterUrl = getPaymaster(supportedChains[0].id);
      writeContracts({
        contracts: txs,
        capabilities: {
          paymasterService: {
            url: paymasterUrl,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  }, [writeContracts, txs, refetch, switchChainAsync, currentChainId]);

  return (
    <Button
      variant="outline"
      disabled={disabled}
      loading={isDepositPending}
      onClick={() => {
        deposit();
      }}
    >
      Deposit To CAB
    </Button>
  );
}
