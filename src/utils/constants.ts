import { sepolia, polygonAmoy } from 'wagmi/chains'; 
import { type Address } from 'viem';

export const ZERODEV_APP_ID = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

export const zerodevAmoyId = process.env.NEXT_PUBLIC_ZERODEV_AMOY_PROJECT_ID || "";

export const zerodevSepoliaId = process.env.NEXT_PUBLIC_ZERODEV_SEPOLIA_PROJECT_ID || "";

export const cabPaymasterUrl = process.env.NEXT_PUBLIC_CAB_PAYMASTER_URL;

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
  return `https://rpc.zerodev.app/api/v2/bundler/${chain.projectId}`;
};

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

export const invoiceManagerAddress: Address = "0xAd3493E8a16DfCd55c9DBFCdeFb934b3D04db698";

export const cabPaymasterAddress: Address = "0x845B7b27912514981Bc18a0992ea737F294C6A40";

export const testErc20Address: Address = "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B";

export const testErc20VaultAddress: Address = "0xdCE76Da5c1F1706E4fA2a806c0507f1bb4BC3Bf6"

export const vaultManagerAddress: Address = "0xc9C27ca8197cA1821E1c24C1421167c815CC00A0"

export const repayTokens = [{
  address: testErc20Address,
  chainId: supportedChains[0].id,
}];