import { Title, Flex } from "@mantine/core";
import { supportedChains } from "@/utils/constants";
import { useMemo } from "react";
import { useTokenBalance } from "@/hooks";
import { useReadCab } from "@build-with-yi/wagmi";
import { TransferButton } from "@/components/Button";
import { useAccount } from "wagmi";

export default function TransferBlock({ cab }: { cab: boolean }) {
  const { address: smartAccountAddress } = useAccount();
  const chainId = supportedChains[1].id;

  const { isPending: isTokenBalancePending } = useTokenBalance({
    address: smartAccountAddress,
    chainId: chainId,
  });
  const { isPending: isCabBalancePending } = useReadCab();

  const loading = useMemo(() => {
    return cab ? isCabBalancePending : isTokenBalancePending;
  }, [cab, isTokenBalancePending, isCabBalancePending]);

  return (
    <Flex direction="column" justify="center" align="center">
      <Title order={5}>Transfer 0.01 USDC to EOA</Title>
      <Flex direction="row" gap="md">
        <TransferButton chainId={supportedChains[0].id} cab={cab} />
        <TransferButton chainId={supportedChains[1].id} cab={cab} />
      </Flex>
    </Flex>
  );
}
