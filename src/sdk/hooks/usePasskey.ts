import { useCallback } from "react"
import { useConnect } from "wagmi"
import { passkeyConnectorId } from "../passkeyConnector"
import type { ExplicitAny } from "../provider/types"

type ConnectType = "register" | "login"

export function usePasskey() {
    const { connectAsync, connectors } = useConnect()

    const passkeyConnectorInstance = connectors.find(
        (c) => c.id === passkeyConnectorId
    )

    const connect = useCallback(
        async (type: ConnectType, passkeyName: string) => {
            if (!passkeyConnectorInstance) {
                throw new Error("Passkey connector not found")
            }
            ;(passkeyConnectorInstance as ExplicitAny).setConnectType(type)
            ;(passkeyConnectorInstance as ExplicitAny).setPasskeyName(
                passkeyName
            )

            return connectAsync({ connector: passkeyConnectorInstance })
        },
        [connectAsync, passkeyConnectorInstance]
    )

    const connectRegister = useCallback(
        (passkeyName: string) => connect("register", passkeyName),
        [connect]
    )

    const connectLogin = useCallback(
        (passkeyName: string) => connect("login", passkeyName),
        [connect]
    )

    return {
        connectRegister,
        connectLogin
    }
}
