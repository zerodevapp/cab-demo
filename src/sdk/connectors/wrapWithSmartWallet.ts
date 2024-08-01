import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from "permissionless";
import type { EntryPoint } from "permissionless/types";
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

type ExplicitAny = any;
interface SmartWalletConfig {
    projectId: string;
    version: ZeroDevVersion;
    paymasterUrl: string;
}

export const wrapWithSmartWallet = (
    walletFunction: CreateConnectorFn,
    configOptions: SmartWalletConfig,
): CreateConnectorFn => {
    return (config: ExplicitAny) => {
        const entryPoint = getEntryPointFromZeroDevVersion(configOptions.version);
        const kernelVersion = getKernelVersionFromZeroDevVersion(configOptions.version);
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
                        const accounts = await target.getAccounts();

                        const walletClient = createClient({
                            account: accounts[0],
                            chain: connetedChain,
                            name: "Connector Client",
                            transport: (opts) =>
                                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                custom(provider as ExplicitAny)({
                                    ...opts,
                                    retryCount: 0,
                                }),
                        }).extend(walletActions) as WalletClient<Transport, Chain, Account>;

                        const publicClient = createPublicClient({
                            chain: connetedChain,
                            transport: http(
                                `https://rpc.zerodev.app/api/v2/bundler/${configOptions.projectId}`
                            ),
                        });
                        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
                            entryPoint: entryPoint,
                            kernelVersion,
                            signer: walletClientToSmartAccountSigner(walletClient),
                        });
                        const kernelAccount = await createKernelAccount(publicClient, {
                            entryPoint: entryPoint,
                            kernelVersion,
                            plugins: {
                                sudo: ecdsaValidator,
                            },
                        });
                        const kernelClient = createKernelAccountClient({
                            account: kernelAccount,
                            chain: connetedChain,
                            entryPoint: entryPoint,
                            bundlerTransport: http(
                                `https://rpc.zerodev.app/api/v2/bundler/${configOptions.projectId}`
                            ),
                        });
                        kernelProvider = new KernelEIP1193Provider(kernelClient, {
                            paymasterUrl: configOptions.paymasterUrl,
                        });

                        return {
                            accounts: [kernelAccount.address],
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

                return source;
            },
        });
    };
};
