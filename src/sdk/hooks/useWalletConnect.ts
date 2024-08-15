import type { CoreTypes, SessionTypes } from "@walletconnect/types"
import type { Web3WalletTypes } from "@walletconnect/web3wallet"
import { useContext, useEffect } from "react"
import {
    type WCLoadingState,
    WalletConnectContext
} from "../providers/WalletConnectContext"

export type UseWalletConnectParameters = {
    projectId: string
    metadata: CoreTypes.Metadata
}

export type UseWalletConnectReturnType = {
    connect: (uri: string) => void
    approveSessionProposal: (
        proposalData?: Web3WalletTypes.SessionProposal
    ) => void
    rejectSessionProposal: () => void
    disconnect: (session: SessionTypes.Struct) => void
    approveSessionRequest: () => void
    rejectSessionRequest: () => void
    sessionRequest: Web3WalletTypes.SessionRequest | undefined
    sessionProposal: Web3WalletTypes.SessionProposal | undefined
    isLoading: WCLoadingState | undefined
    sessions: SessionTypes.Struct[]
    error: Error | undefined
}

export function useWalletConnect({
    projectId = "",
    metadata = {
        name: "",
        description: "",
        url: "",
        icons: []
    }
}: UseWalletConnectParameters): UseWalletConnectReturnType {
    const {
        walletConnectParams,
        setWalletConnectParams,
        sessions,
        sessionProposal,
        sessionRequest,
        error,
        isLoading,
        connect,
        approveSessionRequest,
        rejectSessionRequest,
        approveSessionProposal,
        rejectSessionProposal,
        disconnect
    } = useContext(WalletConnectContext)

    useEffect(() => {
        if (
            (!walletConnectParams?.projectId && projectId) ||
            (!walletConnectParams?.metadata?.name && metadata.name)
        ) {
            setWalletConnectParams({ projectId, metadata })
        }
    }, [projectId, metadata, walletConnectParams, setWalletConnectParams])

    return {
        connect,
        approveSessionProposal,
        rejectSessionProposal,
        disconnect,
        approveSessionRequest,
        rejectSessionRequest,
        sessionProposal,
        sessionRequest,
        isLoading,
        sessions,
        error
    }
}
