import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { walletClientToSmartAccountSigner, createSmartAccountClient } from "permissionless";
import type { EntryPoint } from "permissionless/types";
import { signerToEcdsaKernelSmartAccount } from "permissionless/accounts"
import {
    http,
    type Account,
    type Chain,
    type Transport,
    type WalletClient,
    createClient,
    createPublicClient,
    custom,
    walletActions,
} from "viem";
import type { CreateConnectorFn } from "wagmi";
import {
    KernelEIP1193Provider,
    type KernelEIP1193Provider as KernelEIP1193ProviderType,
} from "./KernelEIP1193Provider";
import type { ZeroDevVersion } from "./types";
import {
    getEntryPointFromZeroDevVersion,
    getKernelVersionFromZeroDevVersion,
} from "./utils/provider";
import { getChain, getPublicRpc, getBundler, cabPaymasterUrl, getPimlicoRpc } from "@/utils/constants";
import { createPimlicoPaymasterClient, createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { createCABClient } from "@zerodev/cab"
import { KERNEL_V3_0 } from "@zerodev/sdk/constants"
import { type CABClient } from "@zerodev/cab"
import type { SmartAccount } from "permissionless/accounts"
import type { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk"

type ExplicitAny = any;
interface SmartWalletConfig {
    projectId: string;
    version: ZeroDevVersion;
    paymasterUrl: string;
}

export const wrapWithSmartWallet = (
    walletFunction: CreateConnectorFn,
    configOptions?: SmartWalletConfig,
): CreateConnectorFn => {
    return (config: ExplicitAny) => {
        // const entryPoint = getEntryPointFromZeroDevVersion(configOptions.version);
        // const kernelVersion = getKernelVersionFromZeroDevVersion(configOptions.version);
        const wallet = walletFunction(config);
        let kernelProvider: KernelEIP1193ProviderType<EntryPoint> | null;

        return new Proxy(wallet, {
            set(target, prop, value, receiver) {
                return Reflect.set(target, prop, value, receiver);
            },
            get(target, prop, receiver) {
                const source = Reflect.get(target, prop, receiver);
                if (prop === "connect") {
                    return async (params: ExplicitAny) => {
                        console.log('blake')
                        await target.connect(params);
                        const chainId = await target.getChainId();
                        const chain = config.chains.find(
                            (c: ExplicitAny) => c.id === chainId
                        );
                        if (!chain) {
                            await target.switchChain?.({
                                chainId: config.chains[0].id,
                            });
                        }
                        const connetedChain = chain ?? config.chains[0];

                        const provider = await target.getProvider();
                        const targetAccounts = await target.getAccounts();

                        // const walletClient = createClient({
                        //     account: accounts[0],
                        //     chain: connetedChain,
                        //     name: "Connector Client",
                        //     transport: (opts) =>
                        //         // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                        //         custom(provider as ExplicitAny)({
                        //             ...opts,
                        //             retryCount: 0,
                        //         }),
                        // }).extend(walletActions) as WalletClient<Transport, Chain, Account>;

                        // const publicClient = createPublicClient({
                        //     transport: http(getPublicRpc(chainId)),
                        // });

                        // const smartAccount = await signerToEcdsaKernelSmartAccount(publicClient, {
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        //     signer: walletClientToSmartAccountSigner(walletClient),
                        // })

                        // const smartAccountClient = createSmartAccountClient({
                        //     account: smartAccount,
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        //     chain: connetedChain,
                        //     bundlerTransport: http(getBundler(chainId)),
                        //     middleware: {
                        //         sponsorUserOperation: ({ userOperation, entryPoint }) => {
                        //             return {
                        //                 callGasLimit: 0n,
                        //                 verificationGasLimit: 0n,
                        //                 preVerificationGas: 0n,
                        //             } as any;
                        //         },
                        //     },
                        // })

                        // const cabClient = createCABClient(smartAccountClient, {
                        //     transport: http(
                        //         cabPaymasterUrl,
                        //         {
                        //             timeout: 30000
                        //         }
                        //     ),
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        // }) as CABClient<
                        //     EntryPoint,
                        //     Transport,
                        //     Chain,
                        //     SmartAccount<EntryPoint>
                        // >


                        // const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        //     kernelVersion: KERNEL_V3_0,
                        //     signer: walletClientToSmartAccountSigner(walletClient),
                        // });
                        // const kernelAccount = await createKernelAccount(publicClient, {
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        //     kernelVersion: KERNEL_V3_0,
                        //     plugins: {
                        //         sudo: ecdsaValidator,
                        //     },
                        // });
                        // const kernelClient = createKernelAccountClient({
                        //     account: kernelAccount,
                        //     chain: connetedChain,
                        //     entryPoint: ENTRYPOINT_ADDRESS_V07,
                        //     bundlerTransport: http(getBundler(chainId)),
                        // });
                        // kernelProvider = new KernelEIP1193Provider(
                        //     cabClient,
                        //     kernelClient as KernelAccountClient<EntryPoint>,
                        // );
                        kernelProvider = await KernelEIP1193Provider.initFromProvider(
                            provider,
                            [...targetAccounts],
                            connetedChain
                        );
                        const accounts = (await kernelProvider.request({
                            method: "eth_requestAccounts",
                            params: [],
                        })) as `0x${string}`[];

                        return {
                            accounts,
                            chainId: connetedChain.id,
                        };
                    };
                }

                if (prop === "getProvider") {
                    return async () => {
                        if (kernelProvider) {
                            return kernelProvider;
                        }
                        return target.getProvider();
                    };
                }

                if (prop === "disconnect") {
                    return async () => {
                        await target.disconnect();
                        kernelProvider = null;
                        return;
                    };
                }

                if (prop === "switchChain") {
                    return async (params: ExplicitAny) => {
                        if (target.switchChain) {
                            await target.switchChain(params);
                        }
                        const provider = await target.getProvider();
                        const targetAccounts = await target.getAccounts();
                        const chainId = params.chainId;
                        const chain = config.chains.find(
                            (c: ExplicitAny) => c.id === chainId
                        );
                        kernelProvider = await KernelEIP1193Provider.initFromProvider(
                            provider,
                            [...targetAccounts],
                            chain
                        );;
                        return;
                    };
                }

                return source;
            },
        });
    };
};
