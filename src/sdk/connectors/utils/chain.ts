import { sepolia, polygonAmoy } from 'wagmi/chains';

// TODO: don't use env variables here
export const zerodevAmoyId = process.env.NEXT_PUBLIC_ZERODEV_AMOY_PROJECT_ID || "";

export const zerodevSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_SEPOLIA_PROJECT_ID || "";

export const supportedChains = [
    {
      id: 11155111,
      logo: "/icons/eth.svg",
      chain: sepolia,
      projectId: zerodevSepoliaId,
      publicRpc: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
      isRepay: true,
    },
    {
      id: 80002,
      logo: "/icons/polygon.svg",
      chain: polygonAmoy,
      projectId: zerodevAmoyId,
      publicRpc: process.env.NEXT_PUBLIC_AMOY_RPC_URL,
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