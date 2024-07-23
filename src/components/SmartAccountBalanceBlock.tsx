import { useKernelClient } from "@zerodev/waas";
import { useCabBalance, useTokenBalance } from "@/hooks";
import { formatEther } from "viem";
import { supportedChains } from "@/utils/constants";
import { Text, Flex, Title } from "@mantine/core";

export default function SmartBalanceBlock({cab}: {cab: boolean}) {
  const { address: smartAccountAddress } = useKernelClient();
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
    <>
      <Title order={3}>Smart Account</Title>
      <Text className="mb-4">Address: {smartAccountAddress}</Text>
      <Flex className="mb-4" direction="column">
        {isRepaySuccess && <Text>{ `Chain ${supportedChains[0].chain.name} Balance: ${formatEther(tokenBalanceRepay || 0n)} 6TEST`}</Text>}
        {isSponsorSuccess && <Text>{ `Chain ${supportedChains[1].chain.name} Balance: ${formatEther(tokenBalanceSponsor || 0n)} 6TEST`}</Text>}
      </Flex>
      {cab && balance && (
        <div className="mb-4">
          {`CAB Balance: ${formatEther(balance.totalBalance)} 6TEST`}
        </div>
      )}
    </>
  )
}