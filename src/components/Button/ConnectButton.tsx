import { Button } from "@mantine/core";
import {
  useDisconnectKernelClient,
  useKernelClient,
} from "@zerodev/waas";
import { useConnect } from "wagmi";
import { useCreateKernelClientEOA } from "@zerodev/waas";

export function ConnectButton() {
  const { isConnected } = useKernelClient();
  const { disconnect } = useDisconnectKernelClient();
  const { connectors } = useConnect();
  const { connect, isPending } = useCreateKernelClientEOA({ version: "v3" });

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
