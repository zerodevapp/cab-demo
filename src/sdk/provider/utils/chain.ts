import {
    baseSepolia,
    optimismSepolia,
    polygonAmoy,
    sepolia
} from "wagmi/chains"

export type BundlerConfig = {
    id: SupportedChainIds
    bundlerRpc: string
}

export type SupportedChainIds = 11155111 | 80002 | 421614 | 11155420 | 84532

export const supportedChains = [
    {
        id: 11155111,
        chain: sepolia,
        publicRpc: sepolia.rpcUrls.default.http[0],
        isRepay: true,
        bundlerRpc:
            "https://rpc.zerodev.app/api/v2/bundler/77fbe835-11a7-4e4a-afba-fa73d544275d",
        paymasterRpc:
            "https://rpc.zerodev.app/api/v2/paymaster/77fbe835-11a7-4e4a-afba-fa73d544275d"
    },
    {
        id: 80002,
        chain: polygonAmoy,
        publicRpc: polygonAmoy.rpcUrls.default.http[0],
        isRepay: false,
        bundlerRpc:
            "https://rpc.zerodev.app/api/v2/bundler/0b735aca-9a7a-4031-b33b-10be6c554bdb",
        paymasterRpc:
            "https://rpc.zerodev.app/api/v2/paymaster/0b735aca-9a7a-4031-b33b-10be6c554bdb"
    },
    {
        id: 11155420,
        chain: optimismSepolia,
        publicRpc: optimismSepolia.rpcUrls.default.http[0],
        isRepay: false,
        bundlerRpc:
            "https://rpc.zerodev.app/api/v2/bundler/c146fa17-8920-4399-bd66-01f35e2a2e85",
        paymasterRpc:
            "https://rpc.zerodev.app/api/v2/paymaster/c146fa17-8920-4399-bd66-01f35e2a2e85"
    },
    {
        id: 84532,
        chain: baseSepolia,
        publicRpc: baseSepolia.rpcUrls.default.http[0],
        isRepay: false,
        bundlerRpc:
            "https://rpc.zerodev.app/api/v2/bundler/f828f1d6-f28a-4a36-b025-d62b89a869c4",
        paymasterRpc:
            "https://rpc.zerodev.app/api/v2/paymaster/f828f1d6-f28a-4a36-b025-d62b89a869c4"
    }
]

export const getChain = (chainId: number) => {
    const chain = supportedChains.find((chain) => chain.id === chainId)
    if (!chain) {
        throw new Error("Unsupported chain")
    }
    return chain
}

export const getPublicRpc = (chainId: number) => {
    const chain = supportedChains.find((chain) => chain.id === chainId)
    if (!chain) {
        throw new Error("Unsupported chain")
    }
    return chain.publicRpc
}

export const getBundlerRpc = (chainId: number, bundlers?: BundlerConfig[]) => {
    const bundler = bundlers?.find((b) => b.id === chainId)
    if (bundler) {
        return bundler.bundlerRpc
    }

    const defaultBundler = supportedChains.find((chain) => chain.id === chainId)
    if (defaultBundler) {
        return defaultBundler.bundlerRpc
    }

    throw new Error("Unsupported chain")
}

export const getPaymasterRpc = (chainId: number) => {
    const chain = supportedChains.find((chain) => chain.id === chainId)
    if (chain) {
        return chain.paymasterRpc
    }

    throw new Error("Unsupported chain")
}
