import { Title, Flex } from "@mantine/core";
import { supportedChains } from "@/utils/constants";
import { TransferButton } from "@/components/Button";

export default function TransferBlock({ cab }: { cab: boolean }) {
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
