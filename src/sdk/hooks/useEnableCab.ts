import { useMutation, useQuery } from "@tanstack/react-query"
import {
    type EnableCABSupportedToken,
    invoiceManagerAddress
} from "@zerodev/cab"
import { useCallback } from "react"
import type { Hex } from "viem"
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi"
import { cabPaymasterUrl } from "../utils/constants"

export type UseEnableCabParams = {
    onSuccess?: (txHash: Hex) => void
    onError?: (error: Error) => void
}

export type EnabledTokenInfo = {
    chainId: number
    tokens: string[]
}

export type UseEnableCabResult = {
    hash: Hex | undefined
    enableCab: ({
        tokens
    }: { tokens: EnableCABSupportedToken[] }) => Promise<Hex>
    isPending: boolean
    enabledTokens: EnabledTokenInfo[]
    isEnabledOnCurrentChain: (tokenName: string) => boolean
}

export function useEnableCab({
    onSuccess,
    onError
}: UseEnableCabParams = {}): UseEnableCabResult {
    const { data: walletClient, refetch: refetchWalletClient } =
        useWalletClient()
    const connectedChainId = useChainId()
    const { switchChainAsync } = useSwitchChain()
    const { address, chainId } = useAccount()

    const {
        data: enabledTokensData,
        refetch: refetchEnabledTokens,
        isLoading
    } = useQuery({
        queryKey: ["cabEnabled", address],
        queryFn: async () => {
            if (!address) return []
            const response = await fetch(
                `${cabPaymasterUrl}/cab/${address}/${invoiceManagerAddress}`
            )
            const data = await response.json()
            return data.enabledTokens as EnabledTokenInfo[]
        },
        enabled: !!address
    })

    const isEnabledOnCurrentChain = useCallback(
        (tokenName: string) => {
            if (!enabledTokensData || !chainId) return false
            return enabledTokensData.some(
                (info) =>
                    info.chainId === chainId && info.tokens.includes(tokenName)
            )
        },
        [enabledTokensData, chainId]
    )

    const mutation = useMutation<
        Hex,
        Error,
        { tokens: EnableCABSupportedToken[] }
    >({
        mutationKey: ["enableCab", chainId],
        mutationFn: async (tokens) => {
            if (!walletClient) {
                throw new Error("Wallet client not available")
            }

            if (chainId && connectedChainId !== chainId) {
                await switchChainAsync?.({ chainId })
                const { data: updatedWalletClient } =
                    await refetchWalletClient()
                if (!updatedWalletClient) {
                    throw new Error(
                        "Failed to update wallet client after chain switch"
                    )
                }
            }

            const txHash = (await walletClient.transport.request({
                method: "yi_enableCAB",
                params: tokens
            })) as Hex

            await refetchEnabledTokens()
            return txHash
        },
        onSuccess: (txHash) => {
            console.log("CAB enabled. TxHash:", txHash)
            onSuccess?.(txHash)
        },
        onError: (error) => {
            console.error("Failed to enable CAB:", error)
            onError?.(error)
        }
    })

    return {
        hash: mutation.data,
        enableCab: mutation.mutateAsync,
        isPending: mutation.isPending || !walletClient || isLoading,
        enabledTokens: enabledTokensData || [],
        isEnabledOnCurrentChain
    }
}
