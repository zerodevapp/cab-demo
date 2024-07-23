import { Text, Box, Group, ThemeIcon } from "@mantine/core";
import { IconCoin } from "@tabler/icons-react";
import Image from "next/image";

export function BalanceItem({ chain, logo, balance, highlight = false }: {
  chain: string,
  logo?: string,
  balance: string,
  highlight?: boolean
}) {
  return (
    <Box
      style={(theme: any) => ({
        backgroundColor: highlight ? theme.colors.yellow[1] : theme.colors.gray[0],
        padding: theme.spacing.sm,
        borderRadius: theme.radius.sm,
      })}
    >
      <Group>
        <ThemeIcon size="lg" variant="light" color={highlight ? "yellow" : "gray"}>
          {!logo ? <IconCoin size={20} /> : <Image src={logo} alt={chain} width={20} height={20} />}
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {chain} Balance
        </Text>
        <Text w={700} size="lg">
          {balance} {chain === "CAB" ? "USD" : "6TEST"}
        </Text>
      </Group>
    </Box>

  );
}