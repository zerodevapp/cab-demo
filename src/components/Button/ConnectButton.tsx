import { Button, Group, Flex, Text } from "@mantine/core";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { passkeyConnector, usePasskey } from "@build-with-yi/wagmi";

export function ConnectButton() {
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const { connectRegister, connectLogin } = usePasskey();

  if (isConnected) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          console.log("disconnecting");
          disconnect();
        }}
      >
        Disconnect
      </Button>
    );
  }

  return (
    <Group>
      <Flex
        align="center"
        direction="column"
        justify="center"
        style={{ flex: 1 }}
        gap="md"
      >
        {connectors.map((connector) => {
          if (connector.type === passkeyConnector.type) {
            return (
              <Flex
                direction="column"
                align="center"
                justify="center"
                key={connector.id}
              >
                <Text>Connect with Passkey</Text>
                <div className="flex flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => connectLogin("Yi CAB Demo")}
                    disabled={isPending}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => connectRegister("Yi CAB Demo")}
                    disabled={isPending}
                  >
                    Register
                  </Button>
                </div>
              </Flex>
            );
          }
          return (
            <Button
              key={connector.id}
              variant="outline"
              onClick={() => connect({ connector })}
              disabled={isPending}
            >
              {`Connect ${
                connector.name !== "Injected" ? `with ${connector.name}` : ""
              }`}
            </Button>
          );
        })}
      </Flex>
    </Group>
  );
}
