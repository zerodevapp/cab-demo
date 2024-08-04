"use client";
import { getPublicRpc, getBundler } from "@/utils/constants";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia, polygonAmoy } from "wagmi/chains";
import { ModalProvider } from "./ModalProvider";
import { AccountProvider } from "./AccountProvider";
import { wrapEOAConnector } from "@build-with-yi/wagmi";

export default function Providers({ children }: { children: ReactNode }) {
  const config = createConfig({
    chains: [sepolia, polygonAmoy],
    transports: {
      [sepolia.id]: http(getPublicRpc(sepolia.id)),
      [polygonAmoy.id]: http(getPublicRpc(polygonAmoy.id)),
    },
    connectors: [wrapEOAConnector(injected())],
    multiInjectedProviderDiscovery: false,
  });
  const queryClient = new QueryClient();

  return (
    <MantineProvider>
      <Notifications />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AccountProvider>
            <ModalProvider>{children}</ModalProvider>
          </AccountProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  );
}
