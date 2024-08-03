import { sepolia, polygonAmoy } from 'wagmi/chains';

export type ChainConfig = {
  id: SupportedChainIds;
  bundlerRpc: string;
}

export type SupportedChainIds = 11155111 | 80002;

export const supportedChains = [
    {
      id: 11155111,
      chain: sepolia,
      publicRpc: sepolia.rpcUrls.default.http[0],
      isRepay: true,
    },
    {
      id: 80002,
      chain: polygonAmoy,
      publicRpc: polygonAmoy.rpcUrls.default.http[0],
      isRepay: false,
    },
  ]

  export const getChain = (chainId: number) => {
    const chain = supportedChains.find(chain => chain.id === chainId);
    if (!chain) {
      throw new Error("Unsupported chain");
    }
    return chain;
  };

  export const getPublicRpc = (chainId: number) => {
    const chain = supportedChains.find(chain => chain.id === chainId);
    if (!chain) {
      throw new Error("Unsupported chain");
    }
    return chain.publicRpc;
  };

  export const getBundler = (chainId: number, config: ChainConfig) => {
    return config.bundlerRpc;
  }