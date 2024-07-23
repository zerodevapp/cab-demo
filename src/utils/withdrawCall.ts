import { type Address, encodeFunctionData, erc20Abi } from "viem"
import type { Call, SponsorTokenInfo } from "../types"

export const withdrawCall = ({
    paymaster,
    accountAddress,
    sponsorTokensInfo
}: {
    paymaster: Address
    accountAddress: Address
    sponsorTokensInfo: SponsorTokenInfo[]
}): Call[] => {
    return sponsorTokensInfo.map(({ address, amount }) => ({
        to: address,
        data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transferFrom",
            args: [paymaster, accountAddress, amount]
        }),
        value: 0n
    }))
}
