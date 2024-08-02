import { Button } from "@mantine/core";
import {
  testErc20Address,
  vaultManagerAddress,
  testErc20VaultAddress,
} from "@/utils/constants";
import { useCabBalance } from "@/hooks";
import { useMemo, useCallback, useState } from "react";
import { parseEther, parseAbi, erc20Abi } from "viem";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { notifications } from "@mantine/notifications";
import { useAccount } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";

export function DepositButton() {
  const [isDepositPending, setIsDepositPending] = useState(false);
  const { refetch } = useCabBalance();
  const { writeContracts, isPending } = useWriteContracts();
  console.log("isPending ", isPending);
  const { address: accountAddress } = useAccount();
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

  const deposit = useCallback(async () => {
    if (!refetch) return;
    try {
      setIsDepositPending(true);
      await writeContracts({ contracts: txs });
      refetch();
      notifications.show({
        color: "green",
        message: "Deposit Success",
      });
    } catch (error) {
    } finally {
      setIsDepositPending(false);
    }
  }, [writeContracts, txs, refetch]);

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
