import { createKernelCABClient } from "@zerodev/cab"
import { toMultiChainECDSAValidator } from "@zerodev/multi-chain-validator"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"
import {
    ENTRYPOINT_ADDRESS_V07,
    providerToSmartAccountSigner
} from "permissionless"
import { http, createPublicClient } from "viem"
import type { ExplicitAny } from "../types"
import {
    type BundlerConfig,
    getBundlerRpc,
    getChain,
    getPublicRpc
} from "../utils/chain"
import { cabPaymasterUrl } from "../utils/constants"

export default async function initializeClientsFromProvider(
    chainId: number,
    provider: ExplicitAny,
    bundlers?: BundlerConfig[]
) {
    const chain = getChain(chainId).chain
    const bundlerRpc = getBundlerRpc(chainId, bundlers)

    const publicClient = createPublicClient({
        transport: http(getPublicRpc(chain.id))
    })

    const multiChainValidator = await toMultiChainECDSAValidator(publicClient, {
        signer: await providerToSmartAccountSigner(provider),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_1
    })

    const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_1,
        plugins: {
            sudo: multiChainValidator
        }
    })

    const kernelClient = createKernelAccountClient({
        account: kernelAccount,
        chain: chain,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        bundlerTransport: http(bundlerRpc)
    })

    const cabClient = createKernelCABClient(kernelClient, {
        transport: http(cabPaymasterUrl, { timeout: 30000 })
    })

    return { kernelClient, cabClient }
}
