"use client";
import { ConnectButton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import {
  Flex,
  Switch,
  Text,
  Box,
  Group,
  Grid,
  Container,
  Tooltip,
  Tabs,
} from "@mantine/core";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useModal, usePaymasterRegistered } from "@/hooks";
import SmartAccountBalanceBlock from "@/components/SmartAccountBalanceBlock";
import EOABalanceBlock from "@/components/EOABalanceBlock";
import TransferBlock from "@/components/TransferBlock";
import WalletConnect from "@/components/WalletConnect";
import { useEnableCab } from "@build-with-yi/wagmi";

export default function Home() {
  const [hydration, setHydration] = useState(false);
  const { openRegisterModal } = useModal();
  const { isRegistered } = usePaymasterRegistered();
  const { isEnabledOnCurrentChain, isPending } = useEnableCab();
  const { isConnected } = useAccount();
  const [checked, setChecked] = useState(false);

  useEffect(() => setHydration(true), []);

  useEffect(() => {
    if (isConnected && !isPending && !isEnabledOnCurrentChain("USDC")) {
      console.log("openRegisterModal");
      openRegisterModal?.();
    }
  }, [isConnected, isPending, isEnabledOnCurrentChain, openRegisterModal]);

  if (!hydration) return null;

  return (
    <Flex direction="column" style={{ minHeight: "100vh", overflow: "auto" }}>
      <Navbar />

      {!isConnected ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <ConnectButton />
        </Flex>
      ) : (
        <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box mt="md" mb="xl" style={{ alignSelf: "center" }}>
            <Group p="center">
              <Text size="sm">CAB Mode</Text>
              <Tooltip
                label="CAB paymaster is still registering for this account. Please wait a few moments."
                position="bottom"
                disabled={isRegistered}
              >
                <div>
                  <Switch
                    size="lg"
                    onLabel="ON"
                    offLabel="OFF"
                    checked={checked}
                    onChange={(event) =>
                      setChecked(event.currentTarget.checked)
                    }
                    disabled={!isRegistered}
                  />
                </div>
              </Tooltip>
            </Group>
          </Box>
          <Container
            w="100%"
            size="md"
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Tabs defaultValue="embedded">
              <Tabs.List mb="md">
                <Tabs.Tab value="embedded">Embedded tx</Tabs.Tab>
                <Tabs.Tab value="wallet-connect">Wallet Connect</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="embedded">
                <Flex direction="column" gap="md" style={{ flex: 1 }}>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <SmartAccountBalanceBlock cab={checked} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <EOABalanceBlock />
                    </Grid.Col>
                  </Grid>
                  <TransferBlock cab={checked} />
                </Flex>
              </Tabs.Panel>
              <Tabs.Panel value="wallet-connect">
                <WalletConnect />
              </Tabs.Panel>
            </Tabs>
          </Container>
          <Box mb="xl" />
        </Box>
      )}
    </Flex>
  );
}
