import { Button, Stack } from "@mantine/core";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";

export function ConnectButton() {
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  if (isConnected) {
    return (
      <Button variant="outline" onClick={() => disconnect({})}>
        Disconnect
      </Button>
    );
  }

  const handleConnect = (connector: any) => {
    setConnectingId(connector.id);
    connect({ connector });
  };

  return (
    <Stack>
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          variant="outline"
          onClick={() => handleConnect(connector)}
          disabled={isPending && connectingId === connector.id}
        >
          {isPending && connectingId === connector.id ? "Connecting..." : `${connector.name}`}
        </Button>
      ))}
    </Stack>
  );
}