import { useCabBalance, useTokenBalance, useCABClient } from "@/hooks";
import { formatEther } from "viem";
import { supportedChains } from "@/utils/constants";
import { Text, Card, Badge, Stack, Flex } from "@mantine/core";
import { BalanceItem } from "@/components/BalanceItem";

export default function SmartBalanceBlock({cab}: {cab: boolean}) {
  const { data } = useCABClient({ chainId: supportedChains[0].id });
  const smartAccountAddress = data?.address ?? '0x';
  
  const { data: balance } = useCabBalance();
  const { data: tokenBalanceRepay, isSuccess: isRepaySuccess } = useTokenBalance({
    address: smartAccountAddress,
    chainId: supportedChains[0].id,
  })
  const { data: tokenBalanceSponsor, isSuccess: isSponsorSuccess } = useTokenBalance({
    address: smartAccountAddress,
    chainId: supportedChains[1].id,
  })

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex align="center" mb="md">
        <Text size="xl" w={300} mr="xs">Smart Account</Text>
        <Badge color="blue" variant="light">
          {smartAccountAddress?.slice(0, 6)}...{smartAccountAddress?.slice(-2)}
        </Badge>
      </Flex>

      <Stack gap="sm">
        {isRepaySuccess && (
          <BalanceItem
            chain={supportedChains[0].chain.name}
            logo={supportedChains[0].logo}
            balance={formatEther(tokenBalanceRepay || 0n)}
          />
        )}
        {isSponsorSuccess && (
          <BalanceItem
            chain={supportedChains[1].chain.name}
            logo={supportedChains[1].logo}
            balance={formatEther(tokenBalanceSponsor || 0n)}
          />
        )}
        {cab && balance && (
          <BalanceItem
            chain="CAB"
            balance={formatEther(balance)}
            highlight
          />
        )}
      </Stack>
    </Card>
  );
}
