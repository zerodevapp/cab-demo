"use client";
import { ConnectButton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import { Flex, Switch, Text, Box, Group, Grid, Container } from "@mantine/core";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useModal, usePaymasterRegistered } from "@/hooks";
import SmartAccountBalanceBlock from "@/components/SmartAccountBalanceBlock";
import EOABalanceBlock from "@/components/EOABalanceBlock";
import TransferBlock from "@/components/TransferBlock";

export default function Home() {
  const [hydration, setHydration] = useState(false);
  const { openRegisterModal } = useModal();
  const { isRegistered } = usePaymasterRegistered();
  const { isConnected } = useAccount();
  const [checked, setChecked] = useState(false);

  useEffect(() => setHydration(true), []);

  useEffect(() => {
    if (isConnected && isRegistered === false) openRegisterModal?.();
  }, [isRegistered, isConnected, openRegisterModal])

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
              <Switch
                size="lg"
                onLabel="ON"
                offLabel="OFF"
                checked={checked}
                onChange={(event) => setChecked(event.currentTarget.checked)}
              />
            </Group>
          </Box>
          
          <Container size="md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
          </Container>
          <Box mb="xl" />
        </Box>
      )}
    </Flex>
  );
}
