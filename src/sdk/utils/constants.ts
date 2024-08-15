export const cabPaymasterUrl =
    "https://cab-paymaster-service.onrender.com/paymaster/api"

export type SupportedChainIds = 11155111 | 80002
export type BundlerConfig = {
    id: SupportedChainIds
    bundlerRpc: string
}
