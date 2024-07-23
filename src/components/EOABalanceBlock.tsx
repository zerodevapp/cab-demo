import { useAccount } from 'wagmi';
import { supportedChains } from "@/utils/constants";
import { useTokenBalance } from "@/hooks";
import { Card, Text, Flex, Badge } from "@mantine/core";
import { formatEther } from "viem";
import { BalanceItem } from "@/components/BalanceItem";

export default function EOABalanceBlock() {
  const { address } = useAccount();
  const { data: balance } = useTokenBalance({
    address: address,
    chainId: supportedChains[1].id,
  })

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex align="center" mb="md">
        <Text size="xl" w={300} mr="xs">EOA</Text>
        <Badge color="blue" variant="light">
          {address && `${address.slice(0, 6)}...${address.slice(-2)}`}
        </Badge>
      </Flex>
      <BalanceItem
        chain={supportedChains[1].chain.name}
        logo={supportedChains[1].logo}
        balance={formatEther(balance || 0n)}
      />
    </Card>
  )
}