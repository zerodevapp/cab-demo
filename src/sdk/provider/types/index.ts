import type { Address, Hex } from "viem"

export type {
    Permission,
    PaymasterServiceCapability,
    SendCallsParams,
    SendCallsResult,
    GetCallsParams,
    GetCallsResult,
    ShowCallsParams,
    GrantPermissionsParams,
    GrantPermissionsResult,
    SessionType,
    ZeroDevVersion
} from "./provider.js"

export type RepayToken = {
    address: Address
    chainId: number
}

export type RepayTokenInfo = {
    vault: Address
    amount: bigint
    chainId: number
}

export type Call = {
    to: Address
    data: Hex
    value: bigint
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type ExplicitAny = any
