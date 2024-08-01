import { EventEmitter } from "events"
import {
    deserializePermissionAccount,
    serializePermissionAccount,
    toPermissionValidator
} from "@zerodev/permissions"
import { toECDSASigner } from "@zerodev/permissions/signers"
import type { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk"
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import type { SponsorUserOperationReturnType } from "@zerodev/sdk/actions"
import { createZeroDevPaymasterClient } from "@zerodev/sdk/clients"
import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    type EstimateUserOperationGasReturnType,
    bundlerActions,
    createBundlerClient
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
    Client,
    EIP1193Parameters,
    EIP1193RequestFn,
    Hash,
    SendTransactionParameters,
    Transport,
} from "viem"
import { http, type Hex, isHex, toHex } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import type {
    GetCallsParams,
    GetCallsResult,
    GrantPermissionsParams,
    PaymasterServiceCapability,
    SendCallsParams,
    SendCallsResult,
    SessionType
} from "./types"
import { getPolicies, validatePermissions } from "./utils/permissions"
import { KernelLocalStorage } from "./utils/storage"
import { type CABClient } from "@zerodev/cab"
import type { SmartAccount } from "permissionless/accounts"
import type { RepayToken, Call } from "../../types"
import { repayTokens, supportedChains, testErc20Address } from "@/utils/constants";

const WALLET_CAPABILITIES_STORAGE_KEY = "WALLET_CAPABILITIES"
const WALLET_PERMISSION_STORAGE_KEY = "WALLET_PERMISSION"

export class KernelEIP1193Provider<
    entryPoint extends EntryPoint
> extends EventEmitter {
    private readonly paymasterUrl?: string
    private readonly storage = new KernelLocalStorage("ZDWALLET")
    private cabClient: CABClient<
        entryPoint,
        Transport,
        Chain,
        SmartAccount<entryPoint>
    >
    private kernelClient: KernelAccountClient<
        entryPoint,
        Transport,
        Chain,
        KernelSmartAccount<entryPoint>
    >
    private bundlerClient: BundlerClient<entryPoint>

    constructor(
        cabClient: CABClient<entryPoint, Transport, Chain, SmartAccount<entryPoint>>,
        kernelClient: KernelAccountClient<entryPoint>
    ) {
        super()

        if (
            typeof cabClient.account !== "object" ||
            typeof cabClient.chain !== "object"
        ) {
            throw new Error("invalid cab client")
        }
        if (
            typeof kernelClient.account !== "object" ||
            typeof kernelClient.chain !== "object"
        ) {
            throw new Error("invalid kernel client")
        }

        this.cabClient = cabClient
        this.kernelClient = kernelClient as KernelAccountClient<
            entryPoint,
            Transport,
            Chain,
            KernelSmartAccount<entryPoint>
        >

        const capabilities = {
            [this.cabClient.account.address]: {
                [toHex(this.cabClient.chain.id)]: {
                    atomicBatch: {
                        supported: true
                    },
                    paymasterService: {
                        supported: true
                    },
                    permissions: {
                        supported: false
                    }
                }
            }
        }
        this.storeItemToStorage(WALLET_CAPABILITIES_STORAGE_KEY, capabilities)
        this.bundlerClient = this.cabClient.extend(
            bundlerActions(this.cabClient.account.entryPoint)
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
            case "eth_chainId":
                return this.handleGetChainId()
            case "eth_requestAccounts":
                return this.handleEthRequestAccounts()
            case "eth_accounts":
                return this.handleEthAccounts()
            case "eth_sendTransaction": {
                const [tx] = params as [SendTransactionParameters];
                const call: Call = {
                    to: tx.to || "0x",
                    data: tx.data || '0x',
                    value: tx.value ? BigInt(tx.value) : 0n
                };
                return this.sendUserOp([call]);
            }
            // case "eth_sendTransaction": {
            //     const p = (params as any[])[0];
            //     const capabilities: { paymasterService?: { url: string } } = {};
            //     if (this.paymasterUrl) {
            //         capabilities.paymasterService = {
            //             url: this.paymasterUrl
            //         }
            //     }
            //     const paramss = {
            //         version: "1.0",
            //         chainId: toHex(await this.handleGetChainId()),
            //         from: p.from,
            //         calls: [{
            //             to: p.to,
            //             data: p.data,
            //             value: p.value
            //         }],
            //         capabilities,
            //     }
            //     return this.handleWalletSendcalls([paramss])
            // }
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
            case "wallet_switchEthereumChain":
                return this.handleSwitchEthereumChain()
            default:
                return this.cabClient.transport.request({ method, params })
        }
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
            return await this.kernelClient.sendTransaction(tx);
        } catch (error) {
            console.error(error);
            throw error;
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

    private async handleSwitchEthereumChain() {
        throw new Error("Not implemented.")
    }

    private async handleWalletSendcalls(
        params: [SendCallsParams]
    ): Promise<SendCallsResult> {
        const accountAddress = this.cabClient.account.address
        const accountChainId = this.cabClient.chain.id

        const { calls, capabilities, from, chainId } = params[0]
        if (from !== accountAddress) {
            throw new Error("invalid account address")
        }
        if (Number(chainId) !== accountChainId) {
            throw new Error("invalid chain id")
        }
        if (
            this.cabClient.account.entryPoint !== ENTRYPOINT_ADDRESS_V07 &&
            capabilities?.permissions
        ) {
            throw new Error("Permissions not supported with kernel v2")
        }

        let kernelAccountClient: KernelAccountClient<
            entryPoint,
            Transport,
            Chain,
            KernelSmartAccount<entryPoint>
        >
        const permission = this.getItemFromStorage(
            WALLET_PERMISSION_STORAGE_KEY
        ) as SessionType
        const paymasterService = await this.getPaymasterService(
            capabilities?.paymasterService,
            this.cabClient.chain
        )

        const sessionId = capabilities?.permissions?.sessionId
        const session = permission?.[accountAddress]?.[
            toHex(accountChainId)
        ]?.find((session) => session.sessionId === sessionId)
        if (session && this.cabClient?.account?.client) {
            const sessionSigner = await toECDSASigner({
                signer: privateKeyToAccount(session.signerPrivateKey)
            })
            const sessionKeyAccount = (await deserializePermissionAccount(
                this.cabClient.account.client as Client<
                    Transport,
                    Chain,
                    undefined
                >,
                this.cabClient.account.entryPoint,
                this.kernelClient.account.kernelVersion,
                session.approval,
                sessionSigner
            )) as unknown as KernelSmartAccount<entryPoint, Transport, Chain>

            const kernelClient = createKernelAccountClient({
                account: sessionKeyAccount,
                chain: this.cabClient.chain,
                entryPoint: this.cabClient.account.entryPoint,
                bundlerTransport: http(this.cabClient.transport.url),
                middleware: {
                    sponsorUserOperation: paymasterService
                }
            })

            kernelAccountClient = kernelClient
        } else {
            kernelAccountClient = createKernelAccountClient({
                account: this.kernelClient.account,
                chain: this.kernelClient.chain,
                entryPoint: this.kernelClient.account.entryPoint,
                bundlerTransport: http(this.cabClient.transport.url),
                middleware: {
                    sponsorUserOperation: paymasterService
                }
            })
        }

        const encodedeCall = await kernelAccountClient.account.encodeCallData(
            calls.map((call) => ({
                to: call.to ?? kernelAccountClient.account.address,
                value: call.value ? BigInt(call.value) : 0n,
                data: call.data ?? "0x"
            }))
        )

        return await kernelAccountClient.sendUserOperation({
            userOperation: {
                callData: encodedeCall
            }
        })
    }

    private handleWalletCapabilities() {
        const capabilities = this.getItemFromStorage(
            WALLET_CAPABILITIES_STORAGE_KEY
        ) as Record<string, any> | undefined

        return capabilities
            ? capabilities[this.cabClient.account.address]
            : {}
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
        if (this.cabClient.account.entryPoint !== ENTRYPOINT_ADDRESS_V07) {
            throw new Error("Permissions not supported with kernel v2")
        }
        const capabilities =
            this.handleWalletCapabilities()[toHex(this.cabClient.chain.id)]
                .permissions.permissionTypes

        validatePermissions(params[0], capabilities)
        const policies = getPolicies(params[0])
        const permissions = params[0].permissions

        // signer
        const sessionPrivateKey = generatePrivateKey()
        const sessionKeySigner = toECDSASigner({
            signer: privateKeyToAccount(sessionPrivateKey)
        })

        const client = this.cabClient.account.client as Client<
            Transport,
            Chain | undefined,
            undefined
        >

        const permissionValidator = await toPermissionValidator(client, {
            entryPoint: this.kernelClient.account.entryPoint,
            kernelVersion: this.kernelClient.account.kernelVersion,
            signer: sessionKeySigner,
            policies: policies
        })

        const sudoValidator =
            this.kernelClient.account.kernelPluginManager.sudoValidator
        const sessionKeyAccount = await createKernelAccount(client, {
            entryPoint: this.kernelClient.account.entryPoint,
            kernelVersion: this.kernelClient.account.kernelVersion,
            plugins: {
                sudo: sudoValidator,
                regular: permissionValidator
            }
        })
        const enabledSignature =
            await sessionKeyAccount.kernelPluginManager.getPluginEnableSignature(
                sessionKeyAccount.address
            )
        const sessionKeyAccountWithSig = await createKernelAccount(client, {
            entryPoint: this.kernelClient.account.entryPoint,
            kernelVersion: this.kernelClient.account.kernelVersion,
            plugins: {
                sudo: sudoValidator,
                regular: permissionValidator,
                pluginEnableSignature: enabledSignature
            }
        })

        const createdPermissions =
            this.getItemFromStorage(WALLET_PERMISSION_STORAGE_KEY) || {}
        const newPermission = {
            sessionId: permissionValidator.getIdentifier(),
            entryPoint: this.cabClient.account.entryPoint,
            signerPrivateKey: sessionPrivateKey,
            approval: await serializePermissionAccount(sessionKeyAccountWithSig)
        }

        const address = this.cabClient.account.address
        const chainId = toHex(this.cabClient.chain.id)

        const mergedPermissions: SessionType = { ...createdPermissions }

        if (!mergedPermissions[address]) {
            mergedPermissions[address] = {}
        }

        if (!mergedPermissions[address][chainId]) {
            mergedPermissions[address][chainId] = []
        }

        mergedPermissions[address][chainId].push(newPermission)
        this.storeItemToStorage(
            WALLET_PERMISSION_STORAGE_KEY,
            mergedPermissions
        )
        return {
            grantedPermissions: permissions.map((permission) => ({
                type: permission.type,
                data: permission.data,
                policies: permission.policies
            })),
            expiry: params[0].expiry,
            permissionsContext: permissionValidator.getIdentifier()
        }
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
                params: [hexStubUserOperation as any, entryPoint]
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

    private async sendUserOp(calls: Call[], repayTokensParam?: RepayToken[]) {
        const _repayTokens = repayTokensParam || repayTokens

        if (!this.cabClient || !this.cabClient.account) {
            throw new Error('CABClient or account is not available');
        }
    
        try {
            // Prepare the user operation
            const prepareUserOpFromCAB = await this.cabClient.prepareUserOperationRequestCAB({
                account: this.cabClient.account,
                transactions: calls,
                repayTokens: _repayTokens
            });
    
            const { userOperation, sponsorTokensInfo, repayTokensInfo } = prepareUserOpFromCAB;
    
            // Send the user operation
            const userOpHash = await this.cabClient.sendUserOperationCAB({
                userOperation: userOperation,
                repayTokens: _repayTokens,
            });
    
            // Create a bundler client to wait for the receipt
            // const bundlerClient = createBundlerClient({
            //     chain: this.cabClient.chain,
            //     entryPoint: this.cabClient.account.entryPoint,
            //     transport: http(this.cabClient.transport.url, { timeout: 60000 }),
            // });
    
            console.log("userOpHash", userOpHash);
    
            // Emit an event or call a callback with the result
            this.emit('userOperationSent', {
                userOpHash,
                sponsorTokensInfo,
                repayTokensInfo
            });
    
            return userOpHash;
        } catch (error) {
            console.error("Error in sendUserOp:", error);
            throw error;
        }
    }
}
