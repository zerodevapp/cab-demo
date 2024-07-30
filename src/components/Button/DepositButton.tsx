import { Button } from "@mantine/core";
import { supportedChains, testErc20Address, vaultManagerAddress, testErc20VaultAddress } from "@/utils/constants";
import { useKernelCABClient, useCabBalance } from "@/hooks";
import { useMemo, useCallback, useState } from "react";
import { parseEther, encodeFunctionData, parseAbi, erc20Abi } from "viem";
import { vaultManagerAbi } from "@/abis/vaultManagerAbi";
import { notifications } from "@mantine/notifications";

export function DepositButton() {
  const [isDepositPending, setIsDepositPending] = useState(false);
  const chainId = supportedChains[0].id;
  const { refetch } = useCabBalance();
  const { data, isPending } = useKernelCABClient({ chainId });
  const kernelClient = data?.kernelClientVerifyingPaymaster;
  const accountAddress = data?.address;
  const disabled = isPending || !kernelClient || !accountAddress || !refetch;

  const txs = useMemo(() => {
    if (!accountAddress) return [];
    const amount = parseEther("0.3");

    return [
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: parseAbi(["function mint(address,uint256)"]),
          functionName: "mint",
          args: [accountAddress, amount]
        }),
        value: 0n,
      },
      {
        to: testErc20Address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultManagerAddress, amount],
        }),
        value: 0n
      },
      {
        to: vaultManagerAddress,
        data: encodeFunctionData({
          abi: vaultManagerAbi,
          functionName: "deposit",
          args: [testErc20Address, testErc20VaultAddress, amount, false]
        }),
        value: 0n
      } 
    ];
  }, [accountAddress]);

  const deposit = useCallback(async () => {
    if (!kernelClient || !refetch) return;
    try {
      setIsDepositPending(true);
      await kernelClient.sendTransactions({
        account: kernelClient.account,
        transactions: txs
      });
      refetch();
      notifications.show({
        color: "green",
        message: "Deposit Success",
      });
    } catch (error) {
    } finally {
      setIsDepositPending(false);
    }
  }, [kernelClient, txs, refetch]);

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