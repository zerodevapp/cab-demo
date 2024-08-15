import type { Address } from "viem"
import { supportedChains } from "./chain"

export const ZERODEV_PASSKEY_URL = "https://passkeys.zerodev.app/api/v4"

export const ZERODEV_BUNDLER_URL = "https://rpc.zerodev.app/api/v2/bundler"

export const cabPaymasterUrl =
    "https://cab-paymaster-service.onrender.com/paymaster/api"

export const invoiceManagerAddress: Address =
    "0x80F3b8c46381d5cF4B737742D5FE323b7CaA43b1"

export const cabPaymasterAddress: Address =
    "0xB4Aa062cC685e7e2B6881ED57FB830Cd7D4bCf25"

export const testErc20Address: Address =
    "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B"

export const testErc20VaultAddress: Address =
    "0x8652d7cf55e8cbc976fe53584366c6989c8ae0e5"

export const vaultManagerAddress: Address =
    "0x456e6c1c701e91D8A078Be9b5fDF3FA40E01CcBe"

export const repayTokens = [
    {
        address: testErc20Address,
        chainId: supportedChains[2].id
    },
    {
        address: testErc20Address,
        chainId: supportedChains[3].id
    }
]
