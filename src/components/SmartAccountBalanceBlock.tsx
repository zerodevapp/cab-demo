import { useReadCab } from "@build-with-yi/wagmi";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Text, Card, Badge, Stack, Flex, CopyButton } from "@mantine/core";
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
        <CopyButton value={smartAccountAddress}>
          {({ copied, copy }) => (
            <Badge
              color={copied ? "teal" : "blue"}
              variant="light"
              style={{ cursor: "pointer" }}
              onClick={copy}
            >
              {copied ? "Copied!" : `${smartAccountAddress?.slice(0, 6)}...${smartAccountAddress?.slice(-2)}`}
            </Badge>
          )}
        </CopyButton>
      </Flex>

      <Stack gap="sm">
        {cab && balance && (
          <BalanceItem chain="CAB" balance={formatEther(balance)} highlight />
        )}
      </Stack>
    </Card>
  );
}
