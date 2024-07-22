import { useReadContract } from "wagmi";
import { testErc20Address} from "@/utils/constants";
import { erc20Abi, type Address, zeroAddress } from "viem";

export function useTokenBalance({ chainId, address }: { chainId: number, address: Address | undefined }) {
  return useReadContract({
    address: testErc20Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId 
  })
}