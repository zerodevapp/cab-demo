import { EventEmitter } from "events"
import {
    ValidatorType,
    createKernelMultiChainClient,
    ecdsaSignUserOps,
    webauthnSignUserOps
} from "@zerodev/multi-chain-validator"
import type { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk"
import type { SponsorUserOperationReturnType } from "@zerodev/sdk/actions"
import { createZeroDevPaymasterClient } from "@zerodev/sdk/clients"
import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    type EstimateUserOperationGasReturnType,
    bundlerActions
} from "permissionless"
import {
    type GetPaymasterDataParameters,
    type GetPaymasterDataReturnType,
    type GetPaymasterStubDataReturnType,
    paymasterActionsEip7677
} from "permissionless/experimental"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint,
    GetEntryPointVersion,
    UserOperation
} from "permissionless/types"
import type {
    Chain,
    EIP1193Parameters,
    EIP1193RequestFn,
    Hash,
    SendTransactionParameters,
    Transport
} from "viem"
import { http, type Hex, isHex, toHex } from "viem"
import { invoiceManagerAbi } from "../abis/invoiceManagerAbi"
import type {
    GetCallsParams,
    GetCallsResult,
    GrantPermissionsParams,
    PaymasterServiceCapability,
    SendCallsParams,
    SendCallsResult
} from "./types"

import type { KernelCABClient, createKernelCABClient } from "@zerodev/cab"
import { createPublicClient } from "viem"
import {
    initializeClientsFromPasskey,
    initializeClientsFromPasskeyStorage
} from "./helpers/initializeClientsFromPasskey"
import initializeClientsFromProvider from "./helpers/initializeClientsFromProvider"
import type { Call, ExplicitAny, RepayToken } from "./types"
import { type BundlerConfig, getPublicRpc } from "./utils/chain"
import {
    cabPaymasterAddress,
    invoiceManagerAddress,
    repayTokens,
    testErc20Address
} from "./utils/constants"
import { clearZerodevSigner, getZerodevSigner } from "./utils/passkey"
import { KernelLocalStorage } from "./utils/storage"

const WALLET_CAPABILITIES_STORAGE_KEY = "WALLET_CAPABILITIES"

export class KernelEIP1193Provider<
    entryPoint extends EntryPoint
> extends EventEmitter {
    private readonly storage = new KernelLocalStorage("ZDWALLET")
    private cabEnabled = false
    private bundlerClient!: BundlerClient<entryPoint>

    constructor(
        private cabClient: ReturnType<typeof createKernelCABClient>,
        private kernelClient: KernelAccountClient<
            entryPoint,
            Transport,
            Chain,
            KernelSmartAccount<entryPoint>
        >,
        private instantiationType: "provider" | "passkey",
        private provider?: ExplicitAny,
        private bundlers?: BundlerConfig[]
    ) {
        super()
        this.validateClients()
        this.initializeCapabilities()
        this.initializeBundlerClient()
        this.checkCabRegistration().then((isRegistered) => {
            this.cabEnabled = isRegistered
        })
    }

    private validateClients() {
        if (
            !this.isValidClient(this.cabClient) ||
            !this.isValidClient(this.kernelClient)
        ) {
            throw new Error("Invalid client configuration")
        }
    }

    private initializeCapabilities() {
        const capabilities = {
            [this.kernelClient.account.address]: {
                [toHex(this.kernelClient.chain.id)]: {
                    atomicBatch: { supported: true },
                    paymasterService: { supported: true },
                    permissions: { supported: false }
                }
            }
        }
        this.storeItemToStorage(WALLET_CAPABILITIES_STORAGE_KEY, capabilities)
    }

    private initializeBundlerClient() {
        this.bundlerClient = this.kernelClient.extend(
            bundlerActions(this.kernelClient.account.entryPoint)
        )
    }

    static async initFromProvider(
        provider: ExplicitAny,
        bundlers?: BundlerConfig[]
    ): Promise<KernelEIP1193Provider<EntryPoint>> {
        const chainId = Number(
            (await provider.request({
                method: "eth_chainId",
                params: []
            })) as `0x${string}`
        )
        const { kernelClient, cabClient } = await initializeClientsFromProvider(
            chainId,
            provider,
            bundlers
        )

        return new KernelEIP1193Provider(
            cabClient as KernelCABClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            kernelClient as KernelAccountClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            "provider",
            provider,
            bundlers
        )
    }

    static async loadPasskeyFromStorage({
        bundlers
    }: {
        bundlers?: BundlerConfig[]
    }) {
        const { kernelClient, cabClient } =
            await initializeClientsFromPasskeyStorage()

        if (!kernelClient || !cabClient) {
            return null
        }
        return new KernelEIP1193Provider(
            cabClient as KernelCABClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            kernelClient as KernelAccountClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            "passkey",
            undefined,
            bundlers
        )
    }

    static async initFromPasskey({
        chainId,
        passkeyName,
        authMode,
        bundlers
    }: {
        chainId: number
        passkeyName: string
        authMode?: "register" | "login"
        bundlers?: BundlerConfig[]
    }): Promise<KernelEIP1193Provider<EntryPoint>> {
        const { kernelClient, cabClient } = await initializeClientsFromPasskey({
            chainId,
            version: "v3.1",
            passkeyName,
            authMode,
            bundlers
        })

        return new KernelEIP1193Provider(
            cabClient as KernelCABClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            kernelClient as KernelAccountClient<
                EntryPoint,
                Transport,
                Chain,
                KernelSmartAccount<EntryPoint>
            >,
            "passkey",
            undefined,
            bundlers
        )
    }

    getChainId() {
        return this.handleGetChainId()
    }

    async request({
        method,
        params = []
    }: EIP1193Parameters): ReturnType<EIP1193RequestFn> {
        switch (method) {
            case "yi_getCabBalance":
                return this.handleGetCabBalance()
            case "yi_enableCAB":
                return this.handleEnableCAB()
            case "eth_chainId":
                return this.handleGetChainId()
            case "eth_requestAccounts":
                return this.handleEthRequestAccounts()
            case "eth_accounts":
                return this.handleEthAccounts()
            case "eth_sendTransaction":
                return this.handleEthSendTransaction(params)
            case "eth_sign":
                return this.handleEthSign(params as [string, string])
            case "personal_sign":
                return this.handlePersonalSign(params as [string, string])
            case "eth_signTypedData":
            case "eth_signTypedData_v4":
                return this.handleEthSignTypedDataV4(params as [string, string])
            case "wallet_getCapabilities":
                return this.handleWalletCapabilities()
            case "wallet_sendCalls":
                return this.handleWalletSendcalls(params as [SendCallsParams])
            case "wallet_getCallsStatus":
                return this.handleWalletGetCallStatus(
                    params as [GetCallsParams]
                )
            case "wallet_grantPermissions":
                return this.handleWalletGrantPermissions(
                    params as [GrantPermissionsParams]
                )
            case "wallet_switchEthereumChain": {
                const chainId = (params as [{ chainId: string }])[0]
                return this.handleSwitchEthereumChain(chainId)
            }
            default:
                return this.kernelClient.transport.request({ method, params })
        }
    }

    private async handleGetCabBalance() {
        return this.cabClient.getCabBalance({
            address: this.kernelClient.account.address,
            token: testErc20Address,
            repayTokens
        })
    }

    private handleGetChainId() {
        return this.cabClient.chain.id
    }

    private async handleEthRequestAccounts(): Promise<string[]> {
        if (!this.cabClient.account) {
            return []
        }
        return [this.cabClient.account.address]
    }

    private async handleEthAccounts(): Promise<string[]> {
        if (!this.cabClient.account) {
            return []
        }
        return [this.cabClient.account.address]
    }

    private async handleEthSendTransaction(params: unknown): Promise<Hash> {
        const [tx] = params as [SendTransactionParameters]
        try {
            return await this.kernelClient.sendTransaction(tx)
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    private async handleEthSign(params: [string, string]): Promise<string> {
        if (!this.cabClient?.account) {
            throw new Error("account not connected!")
        }
        const [address, message] = params
        if (
            address.toLowerCase() !==
            this.cabClient.account.address.toLowerCase()
        ) {
            throw new Error(
                "cannot sign for address that is not the current account"
            )
        }

        return this.kernelClient.signMessage({
            message,
            account: this.kernelClient.account
        })
    }

    private async handlePersonalSign(
        params: [string, string]
    ): Promise<string> {
        if (!this.cabClient?.account) {
            throw new Error("account not connected!")
        }
        const [message, address] = params
        if (
            address.toLowerCase() !==
            this.cabClient.account.address.toLowerCase()
        ) {
            throw new Error(
                "cannot sign for address that is not the current account"
            )
        }

        return this.kernelClient.signMessage({
            message,
            account: this.kernelClient.account
        })
    }

    private async handleEthSignTypedDataV4(
        params: [string, string]
    ): Promise<string> {
        if (!this.cabClient?.account) {
            throw new Error("account not connected!")
        }
        const [address, typedDataJSON] = params
        const typedData = JSON.parse(typedDataJSON)
        if (
            address.toLowerCase() !==
            this.cabClient.account.address.toLowerCase()
        ) {
            throw new Error(
                "cannot sign for address that is not the current account"
            )
        }

        return this.kernelClient.signTypedData({
            account: this.kernelClient.account,
            domain: typedData.domain,
            types: typedData.types,
            message: typedData.message,
            primaryType: typedData.primaryType
        })
    }

    private async handleSwitchEthereumChain({ chainId }: { chainId: string }) {
        let kernelClient: ExplicitAny
        let cabClient: ExplicitAny

        if (this.instantiationType === "provider") {
            // Get the chainId from the provider as the provider should have already switched the chain
            const chainIdFromProvider = Number(
                (await this.provider.request({
                    method: "eth_chainId",
                    params: []
                })) as `0x${string}`
            )
            ;({ kernelClient, cabClient } = await initializeClientsFromProvider(
                Number(chainId) ?? chainIdFromProvider,
                this.provider,
                this.bundlers
            ))
        } else if (this.instantiationType === "passkey") {
            if (!chainId) {
                throw new Error(
                    "Chain ID is required for passkey instantiation"
                )
            }
            ;({ kernelClient, cabClient } =
                await initializeClientsFromPasskeyStorage({
                    bundlers: this.bundlers,
                    chainId: Number(chainId)
                }))
        } else {
            throw new Error("Unsupported instantiation type")
        }
        this.kernelClient = kernelClient as unknown as KernelAccountClient<
            entryPoint,
            Transport,
            Chain,
            KernelSmartAccount<entryPoint>
        >
        this.cabClient = cabClient as KernelCABClient<
            EntryPoint,
            Transport,
            Chain,
            KernelSmartAccount<EntryPoint>
        >
        this.cabEnabled = await this.checkCabRegistration()
        this.bundlerClient = this.kernelClient.extend(
            bundlerActions(this.kernelClient.account.entryPoint)
        )

        if (this.instantiationType === "passkey") {
            this.emit("chainChanged", toHex(this.kernelClient.chain.id))
        }

        return this.kernelClient.chain
    }

    private async checkCabRegistration(): Promise<boolean> {
        try {
            const publicClient = createPublicClient({
                transport: http(getPublicRpc(this.kernelClient.chain.id))
            })

            const result = await publicClient.readContract({
                address: invoiceManagerAddress,
                abi: invoiceManagerAbi,
                functionName: "cabPaymasters",
                args: [this.cabClient.account.address]
            })

            return result && result[0] === cabPaymasterAddress
        } catch (error) {
            console.error("Error checking CAB registration:", error)
            return false
        }
    }

    private async handleWalletSendcalls(
        params: [SendCallsParams]
    ): Promise<SendCallsResult> {
        const accountAddress = this.cabClient.account.address
        const accountChainId = this.cabClient.chain.id

        const { calls, from, chainId, capabilities } = params[0]

        if (from !== accountAddress) {
            throw new Error("invalid account address")
        }
        if (Number(chainId) !== accountChainId) {
            throw new Error("invalid chain id")
        }
        if (capabilities?.permissions) {
            throw new Error("Permissions not supported with kernel v2")
        }

        if (this.cabEnabled === true && !capabilities?.paymasterService?.url) {
            const cabCalls = calls.map((call) => ({
                to: call.to || "0x",
                data: call.data || "0x",
                value: call.value ? BigInt(call.value) : 0n
            }))
            return this.sendCABUserOp(cabCalls)
        }

        const paymasterService = await this.getPaymasterService(
            capabilities?.paymasterService,
            this.cabClient.chain
        )

        const kernelAccountClient = createKernelMultiChainClient({
            account: this.kernelClient.account,
            chain: this.kernelClient.chain,
            entryPoint: this.kernelClient.account.entryPoint,
            bundlerTransport: http(this.kernelClient.transport.url),
            middleware: {
                sponsorUserOperation: paymasterService
            }
        })

        const encodedeCall = await kernelAccountClient.account.encodeCallData(
            calls.map((call) => ({
                to: call.to ?? kernelAccountClient.account.address,
                value: call.value ? BigInt(call.value) : 0n,
                data: call.data ?? "0x"
            }))
        )

        const userOperation =
            await kernelAccountClient.prepareMultiUserOpRequest(
                {
                    userOperation: {
                        callData: encodedeCall
                    }
                },
                this.instantiationType === "passkey"
                    ? ValidatorType.WEBAUTHN
                    : ValidatorType.ECDSA,
                1
            )

        let signedUserOps: ExplicitAny
        if (this.instantiationType === "passkey") {
            signedUserOps = await webauthnSignUserOps({
                // @ts-ignore
                account: kernelAccountClient.account,
                multiUserOps: [
                    {
                        // @ts-ignore
                        userOperation: userOperation,
                        chainId: kernelAccountClient.chain.id
                    }
                ],
                entryPoint: kernelAccountClient.account.entryPoint
            })
        } else {
            signedUserOps = await ecdsaSignUserOps({
                // @ts-ignore
                account: kernelAccountClient.account,
                multiUserOps: [
                    {
                        // @ts-ignore
                        userOperation: userOperation,
                        chainId: kernelAccountClient.chain.id
                    }
                ],
                entryPoint: kernelAccountClient.account.entryPoint
            })
        }

        kernelAccountClient.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
        try {
            return await this.bundlerClient.sendUserOperation({
                // @ts-ignore
                userOperation: signedUserOps[0]
            })
        } catch (error) {
            console.error("Error sending user operation:", error)
            throw error
        }
    }

    private handleWalletCapabilities() {
        const capabilities = this.getItemFromStorage(
            WALLET_CAPABILITIES_STORAGE_KEY
        ) as Record<string, ExplicitAny> | undefined

        return capabilities ? capabilities[this.cabClient.account.address] : {}
    }

    private async handleWalletGetCallStatus(
        params: [GetCallsParams]
    ): Promise<GetCallsResult> {
        const userOpHash = params[0]

        if (!isHex(userOpHash)) {
            throw new Error(
                "Invalid params for wallet_getCallStatus: not a hex string"
            )
        }
        const result = await this.bundlerClient.getUserOperationReceipt({
            hash: userOpHash as Hex
        })
        if (!result?.success) {
            return {
                status: "PENDING"
            }
        }
        return {
            status: "CONFIRMED",
            receipts: [
                {
                    logs: result.logs.map((log) => ({
                        address: log.address,
                        data: log.data,
                        topics: log.topics
                    })),
                    status: result.success ? "0x1" : "0x0",
                    blockHash: result.receipt.blockHash,
                    blockNumber: toHex(result.receipt.blockNumber),
                    gasUsed: toHex(result.receipt.gasUsed),
                    transactionHash: result.receipt.transactionHash
                }
            ]
        }
    }

    private async handleWalletGrantPermissions(
        params: [GrantPermissionsParams]
    ) {
        console.log("handleWalletGrantPermissions", params)
        throw new Error("Permissions not supported")
    }

    private async getPaymasterService(
        paymaster: PaymasterServiceCapability | undefined,
        chain: Chain
    ) {
        if (!paymaster?.url) return undefined

        // verifying paymaster
        return async ({
            userOperation,
            entryPoint
        }: {
            userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
            entryPoint: entryPoint
        }) => {
            const paymasterClient = createZeroDevPaymasterClient({
                chain: chain,
                entryPoint: entryPoint,
                transport: http(paymaster.url)
            })
            const paymasterEip7677Client = paymasterClient.extend(
                paymasterActionsEip7677(entryPoint)
            )

            // 1. get stub data from paymasterService
            const stubData = await paymasterEip7677Client.getPaymasterStubData({
                userOperation: userOperation,
                chain: chain
            })
            const stubUserOperation = {
                ...userOperation,
                ...stubData
            }
            const hexStubUserOperation = Object.fromEntries(
                Object.entries(stubUserOperation).map(([key, value]) => {
                    if (typeof value === "bigint") return [key, toHex(value)]
                    return [key, value]
                })
            )

            // 2. estimate userOp gas
            const gas = (await this.kernelClient.request({
                method: "eth_estimateUserOperationGas",
                params: [hexStubUserOperation as ExplicitAny, entryPoint]
            })) as EstimateUserOperationGasReturnType<entryPoint>

            const userOperationWithGas = {
                ...stubUserOperation,
                callGasLimit: gas.callGasLimit,
                verificationGasLimit: gas.verificationGasLimit,
                preVerificationGas: gas.preVerificationGas
            } as GetPaymasterDataParameters<entryPoint>["userOperation"]

            // 3. get paymaster data
            const paymasterData = await paymasterEip7677Client.getPaymasterData(
                {
                    userOperation: userOperationWithGas,
                    chain: chain
                }
            )

            if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
                const paymasterDataV06 =
                    paymasterData as GetPaymasterDataReturnType<ENTRYPOINT_ADDRESS_V06_TYPE>
                return {
                    callGasLimit: BigInt(gas.callGasLimit),
                    verificationGasLimit: BigInt(gas.verificationGasLimit),
                    preVerificationGas: BigInt(gas.preVerificationGas),
                    paymasterAndData: paymasterDataV06?.paymasterAndData,
                    maxFeePerGas: BigInt(userOperation.maxFeePerGas),
                    maxPriorityFeePerGas: BigInt(
                        userOperation.maxPriorityFeePerGas
                    )
                } as SponsorUserOperationReturnType<entryPoint>
            }
            const stubDataV07 =
                stubData as GetPaymasterStubDataReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>
            const paymasterDataV07 =
                paymasterData as GetPaymasterDataReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>

            return {
                callGasLimit: BigInt(gas.callGasLimit),
                verificationGasLimit: BigInt(gas.verificationGasLimit),
                preVerificationGas: BigInt(gas.preVerificationGas),
                paymaster: paymasterDataV07.paymaster,
                paymasterData: paymasterDataV07.paymasterData,
                paymasterVerificationGasLimit:
                    stubDataV07.paymasterVerificationGasLimit &&
                    BigInt(stubDataV07.paymasterVerificationGasLimit),
                paymasterPostOpGasLimit:
                    stubDataV07?.paymasterPostOpGasLimit &&
                    BigInt(stubDataV07.paymasterPostOpGasLimit),
                maxFeePerGas: BigInt(userOperation.maxFeePerGas),
                maxPriorityFeePerGas: BigInt(userOperation.maxPriorityFeePerGas)
            } as SponsorUserOperationReturnType<entryPoint>
        }
        // TODO: other paymaster services
    }

    private getItemFromStorage<T>(key: string): T | undefined {
        const item = this.storage.getItem(key)
        return item ? JSON.parse(item) : undefined
    }

    private storeItemToStorage<T>(key: string, item: T) {
        this.storage.setItem(key, JSON.stringify(item))
    }

    private async sendCABUserOp(
        calls: Call[],
        repayTokensParam?: RepayToken[]
    ) {
        const _repayTokens = repayTokensParam || repayTokens

        if (!this.cabClient || !this.cabClient.account) {
            throw new Error("CABClient or account is not available")
        }

        try {
            // Prepare the user operation
            const prepareUserOpFromCAB =
                await this.cabClient.prepareUserOperationRequestCAB({
                    account: this.cabClient.account,
                    transactions: calls,
                    repayTokens: _repayTokens
                })

            const { userOperation } = prepareUserOpFromCAB

            // Send the user operation
            const userOpHash = await this.cabClient.sendUserOperationCAB({
                userOperation: userOperation,
                repayTokens: _repayTokens
            })

            return userOpHash
        } catch (error) {
            console.error("Error in sendUserOp:", error)
            throw error
        }
    }

    private async handleEnableCAB() {
        await this.cabClient.enableCAB({
            tokens: [{ name: "6TEST", networks: [11155420, 84532] }]
        })
        this.cabEnabled = true
    }

    private isValidClient(client: ExplicitAny): boolean {
        return (
            typeof client.account === "object" &&
            typeof client.chain === "object"
        )
    }

    async disconnect(): Promise<void> {
        // this.kernelClient = undefined
        // this.cabClient = undefined
        // this.bundlerClient = undefined
        // this.bundlers = undefined
        const serializedData = getZerodevSigner()
        if (serializedData) {
            clearZerodevSigner()
        }
        // this.emit('disconnect', standardErrors.provider.disconnected('User initiated disconnection'));
    }
}
