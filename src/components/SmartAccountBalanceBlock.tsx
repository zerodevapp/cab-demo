import { useReadCab } from "@build-with-yi/wagmi";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
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
          <BalanceItem chain="CAB" balance={formatUnits(balance, 6)} highlight />
        )}
      </Stack>
    </Card>
  );
}
