"use client";
import { getPublicRpc } from "@/utils/constants";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZeroDevProvider, createConfig as createZdConfig } from "@zerodev/waas";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, polygonAmoy } from "wagmi/chains";
import { ModalProvider } from "./ModalProvider";
import { zerodevAmoyId, zerodevSepoliaId } from "@/utils/constants";

export default function Providers({ children }: { children: ReactNode }) {
  const config = createConfig({
    chains: [sepolia, polygonAmoy],
    transports: {
      [sepolia.id]: http(getPublicRpc(sepolia.id)),
      [polygonAmoy.id]: http(getPublicRpc(polygonAmoy.id)),
    },
  });
  const queryClient = new QueryClient();
  const zdConfig = createZdConfig({
    chains: [sepolia, polygonAmoy],
    projectIds: {
      [sepolia.id]: zerodevSepoliaId,
      [polygonAmoy.id]: zerodevAmoyId,
    },
    transports: {
      [sepolia.id]: http(getPublicRpc(sepolia.id)),
      [polygonAmoy.id]: http(getPublicRpc(polygonAmoy.id)),
    },
  });

  return (
    <MantineProvider>
      <Notifications />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ZeroDevProvider config={zdConfig}>
            <ModalProvider>{children}</ModalProvider>
          </ZeroDevProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  );
}
