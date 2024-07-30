"use client";
import { Flex } from "@mantine/core";
import { ConnectButton, DepositButton } from "./Button";
import { useAccount } from "wagmi"
import { SelectAccountButton } from "./Button";

export default function Navbar() {
  const { isConnected } = useAccount();
  
  return (
    <Flex
      w="100vw"
      justify={"space-between"}
      px="lg"
      py={15}
      wrap="wrap"
      align="center"
    >
      <Flex justify="flex-end" miw={20} gap="sm" w="100%">
        {isConnected && (
          <>
            <SelectAccountButton />
            <DepositButton />  
            <ConnectButton />
          </>
        )}
      </Flex>
    </Flex>
  );
}
