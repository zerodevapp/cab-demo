import type { EntryPoint } from "permissionless/types";
import type { CreateConnectorFn } from "wagmi";
import {
    KernelEIP1193Provider,
    type KernelEIP1193Provider as KernelEIP1193ProviderType,
} from "./KernelEIP1193Provider";
import type { ZeroDevVersion } from "./types";

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
                        const targetAccounts = await target.getAccounts();

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
