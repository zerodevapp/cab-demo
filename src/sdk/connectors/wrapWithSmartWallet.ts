import type { EntryPoint } from "permissionless/types";
import type { CreateConnectorFn } from "wagmi";
import {
    KernelEIP1193Provider,
    type KernelEIP1193Provider as KernelEIP1193ProviderType,
} from "./KernelEIP1193Provider";
import { numberToHex } from "viem";
import type { Chain } from "viem";
import type { ChainConfig } from "./utils/chain";

type ExplicitAny = any;
interface SmartWalletConfig {
    chains: ChainConfig[];
}

export const wrapWithSmartWallet = (
    walletFunction: CreateConnectorFn,
    configOptions: SmartWalletConfig,
): CreateConnectorFn => {
    return (config: ExplicitAny) => {
        const wallet = walletFunction(config);
        let kernelProvider: KernelEIP1193ProviderType<EntryPoint> | null;

        const onChainChanged = async (chainId: number): Promise<Chain | undefined> => {
            const chain = config.chains.find(
                (c: ExplicitAny) => c.id === Number(chainId)
            );
            if (!chain) {
                return;
            }
            try {
                if (!kernelProvider) {
                    throw new Error("Kernel provider not available");
                }
                await kernelProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: numberToHex(chain.id) }],
                })
                return chain
            } catch (error) {
                console.error('Error switching chain:', error)
            }
        };

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

                        (provider as any).on("chainChanged", (chainId: number) => {
                            onChainChanged(chainId);
                        });

                        const chainConfig = configOptions?.chains.find((c) => c.id === connetedChain.id)

                        if (!chainConfig) {
                            throw new Error("Chain config not found");
                        }
                        kernelProvider = await KernelEIP1193Provider.initFromProvider(
                            provider,
                            configOptions.chains
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
                        const chainId = params.chainId;
                        return await onChainChanged(chainId);
                    };
                }

                return source;
            },
        });
    };
};
