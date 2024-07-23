import {
    type Address,
    encodeAbiParameters,
    encodePacked,
    keccak256
} from "viem"
import type { RepayTokenInfo } from "../types"

export const getInvoiceId = (
    account: Address,
    cabPaymasterAddress: Address,
    nonce: bigint,
    sponsorChainId: bigint,
    repayTokens: RepayTokenInfo[]
) => {
    const repayTokensConverted = repayTokens.map((token) => ({
        ...token,
        chainId: BigInt(token.chainId),
        amount: BigInt(token.amount)
    }))
    return keccak256(
        encodePacked(
            ["address", "address", "uint256", "uint256", "bytes"],
            [
                account,
                cabPaymasterAddress,
                nonce,
                sponsorChainId,
                encodeAbiParameters(
                    [
                        {
                            name: "repayTokenInfos",
                            type: "tuple[]",
                            internalType:
                                "struct IInvoiceManager.RepayTokenInfo[]",
                            components: [
                                {
                                    name: "vault",
                                    type: "address",
                                    internalType: "contract IVault"
                                },
                                {
                                    name: "amount",
                                    type: "uint256",
                                    internalType: "uint256"
                                },
                                {
                                    name: "chainId",
                                    type: "uint256",
                                    internalType: "uint256"
                                }
                            ]
                        }
                    ],
                    [repayTokensConverted]
                )
            ]
        )
    )
}
