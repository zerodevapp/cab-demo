import { type Address, encodeFunctionData } from "viem"
import { invoiceManagerAbi } from "../abis/invoiceManagerAbi"
import type { RepayTokenInfo } from "../types"
import type { Call } from "../types"
import { invoiceManagerAddress } from "./constants"
import { getInvoiceId } from "./getInvoiceId"

export const createInvoiceCall = ({
    chainId,
    account,
    paymaster,
    nonce,
    repayTokensInfo
}: {
    chainId: number
    account: Address
    paymaster: Address
    nonce: bigint
    repayTokensInfo: RepayTokenInfo[]
}): Call => {
    const invoiceId = getInvoiceId(
        account,
        paymaster,
        nonce,
        BigInt(chainId),
        repayTokensInfo
    )
    return {
        to: invoiceManagerAddress,
        data: encodeFunctionData({
            abi: invoiceManagerAbi,
            functionName: "createInvoice",
            args: [nonce, paymaster, invoiceId]
        }),
        value: 0n
    }
}
