"use client";
import { ConnectButton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import SmartAccountBlock from "@/components/SmartAccountBlock";
import { Flex, Switch, Text } from "@mantine/core";
import { useKernelClient } from "@zerodev/waas";
import { useState, useEffect } from "react";
import { useModal, usePaymasterRegistered } from "@/hooks";

export default function Home() {
  const { openRegisterModal, registerModalOpen } = useModal();
  const { isRegistered, isPending } = usePaymasterRegistered();
  const { isConnected } = useKernelClient();
  const [checked, setChecked] = useState(true);

  useEffect(() => {
    if (isConnected && !isPending && !isRegistered) openRegisterModal?.();
  }, [isRegistered, isConnected, isPending, openRegisterModal])

  return (
    <Flex direction="column" w="100vw" h="100vh">
      <Navbar />
      
      <div className="flex flex-col h-screen justify-center items-center">
        {!isConnected ? <ConnectButton /> : (
          <>
            <div className="flex flex-col justify-center items-center absolute top-20 w-full">
              <Text size="sm">CAB Mode</Text>
              <Switch
                size="lg"
                onLabel="on"
                offLabel="off"
                checked={checked}
                onChange={(event) => setChecked(event.currentTarget.checked)}
                className="mt-4"
              />
            </div>
            <SmartAccountBlock cab={checked} />
          </>
        )}
      </div>
    </Flex>
  );
}
