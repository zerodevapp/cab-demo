import { useTokenBalance } from "@/hooks";
import { useReadCab } from "@/sdk";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { supportedChains } from "@/utils/constants";
import { Text, Card, Badge, Stack, Flex } from "@mantine/core";
import { BalanceItem } from "@/components/BalanceItem";

export default function SmartBalanceBlock({ cab }: { cab: boolean }) {
  const { address } = useAccount();
  const smartAccountAddress = address ?? "0x";
  const { data: balance } = useReadCab();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex align="center" mb="md">
        <Text size="xl" w={300} mr="xs">
          Smart Account
        </Text>
        <Badge color="blue" variant="light">
          {smartAccountAddress?.slice(0, 6)}...{smartAccountAddress?.slice(-2)}
        </Badge>
      </Flex>

      <Stack gap="sm">
        {cab && balance && (
          <BalanceItem chain="CAB" balance={formatEther(balance)} highlight />
        )}
      </Stack>
    </Card>
  );
}
