import { useAccount } from 'wagmi';
import { supportedChains } from "@/utils/constants";
import { useTokenBalance } from "@/hooks";
import { Title, Text, Flex } from "@mantine/core";
import { formatEther } from "viem";

export default function EOABalanceBlock() {
  const { address } = useAccount();
  const { data: balance, isSuccess } = useTokenBalance({
    address: address,
    chainId: supportedChains[1].id,
  })

  return (
    <Flex className="mb-4 items-center" direction="column">
      <Title order={3}>EOA</Title>
      {`Address: ${address}`}
      {isSuccess && <Text>{`${supportedChains[1].chain.name} Balance: ${formatEther(balance || 0n)} 6TEST`}</Text>}
    </Flex>
  )
}