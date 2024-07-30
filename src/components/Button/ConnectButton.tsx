import { Button } from "@mantine/core";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (isConnected) disconnect({})
        else connect({ connector: connectors[0] });
      }}
    >
      {
        isPending ? "Connecting..." : isConnected ? "Disconnect" : "Connect"
      }
    </Button>
  );
}
