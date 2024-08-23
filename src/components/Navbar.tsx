"use client";
import { Flex, Button } from "@mantine/core";
import { ConnectButton, DepositButton } from "./Button";
import { useAccount } from "wagmi";
import { IconExternalLink } from "@tabler/icons-react";

export default function Navbar() {
  const { isConnected, address } = useAccount();

  const getJiffyScanUrl = () => {
    // const network = chainId === 84532 ? 'base-sepolia' :
    //                 chainId === 11155420 ? 'optimism-sepolia' : '';
    return `https://jiffyscan.xyz/account/${address}?network=base-sepolia`;
  };

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
            {/* <SelectAccountButton /> */}
            <Button
              component="a"
              href={getJiffyScanUrl()}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconExternalLink size={14} />}
            >
              View on JiffyScan
            </Button>
            <DepositButton />
            <ConnectButton />
          </>
        )}
      </Flex>
    </Flex>
  );
}
