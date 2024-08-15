import type { ReactNode } from "react";
import { WalletConnectProvider } from "./WalletConnectProvider";

export interface YiProviderProps {
  children: ReactNode;
}

export function YiProvider({ children }: YiProviderProps) {
  return <WalletConnectProvider>{children}</WalletConnectProvider>;
}
