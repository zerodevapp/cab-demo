import { createKernelCABClient } from "@zerodev/cab"
import {
    WebAuthnMode,
    createKernelMultiChainClient,
    deserializeMultiChainWebAuthnValidator,
    toMultiChainWebAuthnValidator,
    toWebAuthnKey
} from "@zerodev/multi-chain-validator"
import { createKernelAccount } from "@zerodev/sdk"
import { http, createPublicClient } from "viem"
import type { ZeroDevVersion } from "../types"
import {
    type BundlerConfig,
    getBundlerRpc,
    getChain,
    getPublicRpc
} from "../utils/chain"
import { ZERODEV_PASSKEY_URL, cabPaymasterUrl } from "../utils/constants"
import { getZerodevSigner, setZerodevSigner } from "../utils/passkey"
import {
    getEntryPointFromZeroDevVersion,
    getKernelVersionFromZeroDevVersion
} from "../utils/provider"

export async function initializeClientsFromPasskey({
    chainId,
    version,
    passkeyName,
    authMode = "register",
    bundlers
}: {
    chainId: number
    version: ZeroDevVersion
    passkeyName: string
    authMode?: "register" | "login"
    bundlers?: BundlerConfig[]
}) {
    const chain = getChain(chainId).chain
    const bundlerRpc = getBundlerRpc(chainId, bundlers)

    const publicClient = createPublicClient({
        chain,
        transport: http(getPublicRpc(chain.id))
    })

    const entryPoint = getEntryPointFromZeroDevVersion(version)
    const kernelVersion = getKernelVersionFromZeroDevVersion(version)

    if (!authMode) {
        throw new Error("Auth mode is required for passkey instantiation")
    }
    const mode =
        authMode === "register" ? WebAuthnMode.Register : WebAuthnMode.Login

    const webAuthnKey = await toWebAuthnKey({
        passkeyName: passkeyName,
        passkeyServerUrl: ZERODEV_PASSKEY_URL,
        mode,
        passkeyServerHeaders: {}
    })

    const passkeyValidator = await toMultiChainWebAuthnValidator(publicClient, {
        webAuthnKey,
        entryPoint: entryPoint,
        kernelVersion
    })

    const passkeyData = passkeyValidator.getSerializedData()
    setZerodevSigner(passkeyData, true, chainId, version)

    const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        kernelVersion,
        plugins: {
            sudo: passkeyValidator
        }
    })

    const kernelClient = createKernelMultiChainClient({
        account: kernelAccount,
        chain: chain,
        entryPoint: entryPoint,
        bundlerTransport: http(bundlerRpc)
    })

    const cabClient = createKernelCABClient(kernelClient, {
        transport: http(cabPaymasterUrl, { timeout: 30000 })
    })

    return { kernelClient, cabClient }
}

export async function initializeClientsFromPasskeyStorage({
    bundlers,
    chainId
}: {
    bundlers?: BundlerConfig[]
    chainId?: number
} = {}) {
    const passkeySigner = getZerodevSigner()
    if (!passkeySigner?.isConnected && !passkeySigner?.signer) {
        return { kernelClient: null, cabClient: null }
    }

    const chain = getChain(chainId ?? passkeySigner.chainId).chain
    const bundlerRpc = getBundlerRpc(chain.id, bundlers)
    const publicClient = createPublicClient({
        chain,
        transport: http(getPublicRpc(chain.id))
    })
    const entryPoint = getEntryPointFromZeroDevVersion(passkeySigner.version)
    const kernelVersion = getKernelVersionFromZeroDevVersion(
        passkeySigner.version
    )

    const passkeyValidator = await deserializeMultiChainWebAuthnValidator(
        publicClient,
        {
            serializedData: passkeySigner.signer,
            entryPoint,
            kernelVersion
        }
    )
    const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        kernelVersion,
        plugins: {
            sudo: passkeyValidator
        }
    })

    const kernelClient = createKernelMultiChainClient({
        account: kernelAccount,
        chain: chain,
        entryPoint: entryPoint,
        bundlerTransport: http(bundlerRpc)
    })

    const cabClient = createKernelCABClient(kernelClient, {
        transport: http(cabPaymasterUrl, { timeout: 30000 })
    })

    return { kernelClient, cabClient }
}
