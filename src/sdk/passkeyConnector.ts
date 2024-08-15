import {
    ChainNotConfiguredError,
    type Connector,
    createConnector
} from "@wagmi/core"
import type { EntryPoint } from "permissionless/types"
import {
    type AddEthereumChainParameter,
    type ProviderRpcError,
    SwitchChainError,
    UserRejectedRequestError,
    getAddress,
    numberToHex
} from "viem"
import {
    KernelEIP1193Provider,
    type KernelEIP1193Provider as KernelEIP1193ProviderType
} from "./provider"
import type { ExplicitAny } from "./provider/types"
import type { BundlerConfig } from "./utils/constants"

interface PasskeyConfig {
    bundlers?: BundlerConfig[]
}

export const passkeyConnectorId = "yiPasskeyConnector"

passkeyConnector.type = "passkeyConnector" as const
export function passkeyConnector({ bundlers }: PasskeyConfig = {}) {
    type Provider = KernelEIP1193ProviderType<EntryPoint> | undefined
    let walletProvider: Provider | undefined

    let accountsChanged: Connector["onAccountsChanged"] | undefined
    let chainChanged: Connector["onChainChanged"] | undefined
    let disconnect: Connector["onDisconnect"] | undefined

    let connectType: "register" | "login" = "register"
    let passkeyName = "Yi Passkey"

    return createConnector<Provider>((config) => ({
        id: passkeyConnectorId,
        name: "Passkey",
        supportsSimulation: true,
        type: passkeyConnector.type,

        async connect({ chainId } = {}) {
            try {
                let provider = await this.getProvider()
                if (!provider) {
                    const chain = config.chains.find(
                        (chain) => chain.id === chainId
                    )
                    if (chainId && !chain) {
                        throw new SwitchChainError(
                            new ChainNotConfiguredError()
                        )
                    }

                    walletProvider =
                        await KernelEIP1193Provider.initFromPasskey({
                            chainId: chainId ?? config.chains[0].id,
                            passkeyName: passkeyName,
                            authMode: connectType,
                            bundlers
                        })
                    provider = walletProvider
                }
                if (!accountsChanged) {
                    accountsChanged = this.onAccountsChanged.bind(this)
                    provider.on("accountsChanged", accountsChanged)
                }
                if (!chainChanged) {
                    chainChanged = this.onChainChanged.bind(this)
                    provider.on("chainChanged", chainChanged)
                }
                if (!disconnect) {
                    disconnect = this.onDisconnect.bind(this)
                    provider.on("disconnect", disconnect)
                }
                const accounts = (await provider.request({
                    method: "eth_requestAccounts",
                    params: []
                })) as `0x${string}`[]

                return { accounts, chainId: chainId ?? config.chains[0].id }
            } catch (error) {
                if (
                    /(user closed modal|accounts received is empty|user denied account)/i.test(
                        (error as Error).message
                    )
                )
                    throw new UserRejectedRequestError(error as Error)
                throw error
            }
        },

        async disconnect() {
            const provider = await this.getProvider()

            if (accountsChanged) {
                provider?.removeListener("accountsChanged", accountsChanged)
                accountsChanged = undefined
            }
            if (chainChanged) {
                provider?.removeListener("chainChanged", chainChanged)
                chainChanged = undefined
            }
            if (disconnect) {
                provider?.removeListener("disconnect", disconnect)
                disconnect = undefined
            }
            provider?.disconnect()
            walletProvider = undefined
        },

        async getAccounts() {
            const provider = await this.getProvider()
            if (!provider) return []

            return (
                (await provider.request({
                    method: "eth_accounts"
                })) as string[]
            ).map((x) => getAddress(x))
        },

        async getChainId() {
            const provider = await this.getProvider()
            if (!provider) throw new Error("Provider is not initialized")

            const chainId = await provider.request({ method: "eth_chainId" })
            return Number(chainId as number)
        },

        async getProvider() {
            if (!walletProvider) {
                const provider =
                    await KernelEIP1193Provider.loadPasskeyFromStorage({
                        bundlers
                    })
                if (!provider) {
                    return undefined
                }
                if (!accountsChanged) {
                    accountsChanged = this.onAccountsChanged.bind(this)
                    provider.on(
                        "accountsChanged",
                        accountsChanged as (...args: ExplicitAny[]) => void
                    )
                }
                if (!chainChanged) {
                    chainChanged = this.onChainChanged.bind(this)
                    provider.on(
                        "chainChanged",
                        chainChanged as (...args: ExplicitAny[]) => void
                    )
                }
                if (!disconnect) {
                    disconnect = this.onDisconnect.bind(this)
                    provider.on(
                        "disconnect",
                        disconnect as (...args: ExplicitAny[]) => void
                    )
                }
                walletProvider = provider
            }
            return walletProvider
        },

        async isAuthorized() {
            try {
                const accounts = await this.getAccounts()
                return !!accounts.length
            } catch {
                return false
            }
        },

        async switchChain({ addEthereumChainParameter, chainId }) {
            const chain = config.chains.find((chain) => chain.id === chainId)
            if (!chain)
                throw new SwitchChainError(new ChainNotConfiguredError())

            const provider = await this.getProvider()
            if (!provider)
                throw new SwitchChainError(new Error("Not Connected"))

            try {
                await provider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: numberToHex(chain.id) }]
                })
                return chain
            } catch (error) {
                // Indicates chain is not added to provider
                if ((error as ProviderRpcError).code === 4902) {
                    try {
                        let blockExplorerUrls: string[]
                        if (addEthereumChainParameter?.blockExplorerUrls)
                            blockExplorerUrls =
                                addEthereumChainParameter.blockExplorerUrls
                        else
                            blockExplorerUrls = chain.blockExplorers?.default
                                .url
                                ? [chain.blockExplorers?.default.url]
                                : []

                        let rpcUrls: readonly string[]
                        if (addEthereumChainParameter?.rpcUrls?.length)
                            rpcUrls = addEthereumChainParameter.rpcUrls
                        else rpcUrls = [chain.rpcUrls.default?.http[0] ?? ""]

                        const addEthereumChain = {
                            blockExplorerUrls,
                            chainId: numberToHex(chainId),
                            chainName:
                                addEthereumChainParameter?.chainName ??
                                chain.name,
                            iconUrls: addEthereumChainParameter?.iconUrls,
                            nativeCurrency:
                                addEthereumChainParameter?.nativeCurrency ??
                                chain.nativeCurrency,
                            rpcUrls
                        } satisfies AddEthereumChainParameter

                        await provider.request({
                            method: "wallet_addEthereumChain",
                            params: [addEthereumChain]
                        })

                        return chain
                    } catch (error) {
                        throw new UserRejectedRequestError(error as Error)
                    }
                }

                throw new SwitchChainError(error as Error)
            }
        },

        onAccountsChanged(accounts) {
            if (accounts.length === 0) this.onDisconnect()
            else
                config.emitter.emit("change", {
                    accounts: accounts.map((x) => getAddress(x))
                })
        },

        onChainChanged(chain) {
            const chainId = Number(chain)
            config.emitter.emit("change", { chainId })
        },

        async onDisconnect(_error) {
            config.emitter.emit("disconnect")

            const provider = await this.getProvider()
            if (!provider) return

            if (accountsChanged) {
                provider.removeListener("accountsChanged", accountsChanged)
                accountsChanged = undefined
            }
            if (chainChanged) {
                provider.removeListener("chainChanged", chainChanged)
                chainChanged = undefined
            }
            if (disconnect) {
                provider.removeListener("disconnect", disconnect)
                disconnect = undefined
            }

            await provider.disconnect()
            walletProvider = undefined
        },

        setConnectType(type: "register" | "login") {
            connectType = type
        },

        setPasskeyName(name: string) {
            passkeyName = name
        }
    }))
}
