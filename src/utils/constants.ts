import { optimismSepolia, baseSepolia } from 'wagmi/chains';
import { type Address } from 'viem';

export const ZERODEV_APP_ID = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

export const zerodevOpSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_OP_SEPOLIA_PROJECT_ID || "";

export const zerodevBaseSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_BASE_SEPOLIA_PROJECT_ID || "";

export const supportedAccounts = [
  "kernel",
]

export const supportedChains = [
  {
    id: 11155420,
    logo: "/icons/optimism.svg",
    chain: optimismSepolia,
    projectId: zerodevOpSepoliaId,
    publicRpc: process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL,
    isRepay: true,
  },
  {
    id: 84532,
    logo: "/icons/base.svg",
    chain: baseSepolia,
    projectId: zerodevBaseSepoliaId,
    publicRpc: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    isRepay: false,
  },
]
if (supportedChains.length !== 2) {
  throw new Error("Supported chains not configured correctly");
}

export const getChain = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  if (!chain) {
    throw new Error("Unsupported chain");
  }
  return chain;
};

export const getBundler = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  if (!chain) {
    throw new Error("Unsupported chain");
  }
  return `https://rpc.zerodev.app/api/v2/bundler/${chain.projectId}?provider=PIMLICO`;
};

export const getPimlicoRpc = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  if (!chain) {
    throw new Error("Unsupported chain");
  }
  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
}

export const getPublicRpc = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  if (!chain) {
    throw new Error("Unsupported chain");
  }
  return chain.publicRpc;
};

export const getPaymaster = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  if (!chain) {
    throw new Error("Unsupported chain");
  }
  return `https://rpc.zerodev.app/api/v2/paymaster/${chain.projectId}`;
};

export const invoiceManagerAddress: Address = "0x80F3b8c46381d5cF4B737742D5FE323b7CaA43b1";

export const cabPaymasterAddress: Address = "0xB4Aa062cC685e7e2B6881ED57FB830Cd7D4bCf25";

export const testErc20Address: Address = "0x3870419ba2bbf0127060bcb37f69a1b1c090992b";

export const testErc20VaultAddress: Address = "0x8652d7cf55e8cbc976fe53584366c6989c8ae0e5"

export const vaultManagerAddress: Address = "0x456e6c1c701e91D8A078Be9b5fDF3FA40E01CcBe"

export const repayTokens = [{
  address: testErc20Address,
  chainId: supportedChains[0].id,
}];