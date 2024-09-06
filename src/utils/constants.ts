import { optimismSepolia, sepolia } from 'wagmi/chains';
import type { Address } from 'viem';

export const ZERODEV_APP_ID = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

export const zerodevOpSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_OP_SEPOLIA_PROJECT_ID || "";

export const zerodevBaseSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_BASE_SEPOLIA_PROJECT_ID || "";

export const zerodevSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_SEPOLIA_PROJECT_ID || "";

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
    id: 11_155_111,
    logo: "/icons/eth.svg",
    chain: sepolia,
    projectId: zerodevSepoliaId,
    publicRpc: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
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

export const invoiceManagerAddress: Address = "0x5C560ee0e414d635ccaE2208cfA13715a969c631";

export const cabPaymasterAddress: Address = "0x78b09791499931CC36919Ef6A38BEC8B569E7f57";

export const testErc20Address: Address = "0x3870419ba2bbf0127060bcb37f69a1b1c090992b";

export const testErc20VaultAddress: Address = "0xaf9bec58bb2c173fef7d9ade9bbc3e179f3e8993"

export const erc20SpenderAddress= "0x7f9ae753D86c04a7C13004eaf2A97Fa95F61128F"

export const vaultManagerAddress: Address = "0xFa4A202a24Ff90f7C3843b2CefCde012dCb2762B"

export const repayTokens = [{
  address: testErc20Address,
  chainId: supportedChains[0].id,
}];