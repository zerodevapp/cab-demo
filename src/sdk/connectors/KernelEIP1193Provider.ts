import { EventEmitter } from "events"
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
import { http, type Hex, isHex, toHex, type WalletClient, type Account } from "viem"
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

import { KernelLocalStorage } from "./utils/storage"
import { type CABClient } from "@zerodev/cab"
import type { SmartAccount } from "permissionless/accounts"
import type { RepayToken, Call } from "../../types"
import { repayTokens, supportedChains, testErc20Address } from "@/utils/constants";
import { createClient, custom, walletActions, createPublicClient } from "viem";
import { walletClientToSmartAccountSigner, createSmartAccountClient } from "permissionless";
import { signerToEcdsaKernelSmartAccount } from "permissionless/accounts";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_0 } from "@zerodev/sdk/constants";
import { getPublicRpc, getBundler, cabPaymasterUrl } from "@/utils/constants";
import { createCABClient } from "@zerodev/cab"

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
                    cab: {
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

    static async initFromProvider(
        provider: any,
        accounts: `0x${string}`[],
        chain: Chain,
    ): Promise<KernelEIP1193Provider<EntryPoint>> {
        const walletClient = createClient({
            account: accounts[0],
            chain: chain,
            name: "Connector Client",
            transport: (opts) => custom(provider)({ ...opts, retryCount: 0 }),
        }).extend(walletActions) as WalletClient<Transport, Chain, Account>;

        const publicClient = createPublicClient({
            transport: http(getPublicRpc(chain.id)),
        });

        const smartAccount = await signerToEcdsaKernelSmartAccount(publicClient, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            signer: walletClientToSmartAccountSigner(walletClient),
        });

        const smartAccountClient = createSmartAccountClient({
            account: smartAccount,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            chain: chain,
            bundlerTransport: http(getBundler(chain.id)),
            middleware: {
                sponsorUserOperation: ({ userOperation, entryPoint }) => {
                    return {
                        callGasLimit: 0n,
                        verificationGasLimit: 0n,
                        preVerificationGas: 0n,
                    } as any;
                },
            },
        });

        const cabClient = createCABClient(smartAccountClient, {
            transport: http(cabPaymasterUrl, { timeout: 30000 }),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
        }) as CABClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>;

        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            kernelVersion: KERNEL_V3_0,
            signer: walletClientToSmartAccountSigner(walletClient),
        });

        const kernelAccount = await createKernelAccount(publicClient, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            kernelVersion: KERNEL_V3_0,
            plugins: {
                sudo: ecdsaValidator,
            },
        });

        const kernelClient = createKernelAccountClient({
            account: kernelAccount,
            chain: chain,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            bundlerTransport: http(getBundler(chain.id)),
        });

        return new KernelEIP1193Provider(
            cabClient,
            kernelClient as KernelAccountClient<EntryPoint>
        );
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
                return this.sendCABUserOp([call]);
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
                const [sendCallsParams] = params as [SendCallsParams];
                // return this.sendCABUserOp(sendCallsParams.calls.map(call => ({
                //     to: call.to || '0x',
                //     data: call.data || '0x',
                //     value: call.value ? BigInt(call.value) : 0n
                // })));
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
            capabilities?.permissions
        ) {
            throw new Error("Permissions not supported with kernel v2")
        }

        if (capabilities?.cab?.useCab === true) {
            const cabCalls = calls.map(call => ({
                to: call.to || '0x',
                data: call.data || '0x',
                value: call.value ? BigInt(call.value) : 0n
            }));
            return this.sendCABUserOp(cabCalls);
        }

        let kernelAccountClient: KernelAccountClient<
            entryPoint,
            Transport,
            Chain,
            KernelSmartAccount<entryPoint>
        >

        const paymasterService = await this.getPaymasterService(
            capabilities?.paymasterService,
            this.cabClient.chain
        )

        kernelAccountClient = createKernelAccountClient({
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

    private async sendCABUserOp(calls: Call[], repayTokensParam?: RepayToken[]) {
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
