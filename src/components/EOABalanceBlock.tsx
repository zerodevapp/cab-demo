import { useAccount } from 'wagmi';
import { supportedChains } from "@/utils/constants";
import { useTokenBalance } from "@/hooks";
import { Text, Flex } from "@mantine/core";

export default function EOABalanceBlock() {
  const { address } = useAccount();
  const { data: tokenBalanc, isSuccess } = useTokenBalance({
    address: address,
    chainId: supportedChains[1].id,
  })

  return (
    <Flex className="mb-4" direction="column">
      {`EOA Address: ${address}`}
      {isSuccess && <Text>{`EOA Balance: ${tokenBalanc || 0n} 6TEST`}</Text>}
    </Flex>
  )
}