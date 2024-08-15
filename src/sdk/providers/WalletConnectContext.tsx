import type { CoreTypes, SessionTypes } from "@walletconnect/types"
import type { Web3WalletTypes } from "@walletconnect/web3wallet"
import { type Dispatch, type SetStateAction, createContext } from "react"

export enum WCLoadingState {
    APPROVE = "Approve",
    REJECT = "Reject",
    CONNECT = "Connect",
    DISCONNECT = "Disconnect"
}

export type WalletConnectParams = {
    projectId?: string
    metadata?: CoreTypes.Metadata
}

type WalletConnectContextType = {
    walletConnectParams: WalletConnectParams | undefined
    setWalletConnectParams: Dispatch<
        SetStateAction<WalletConnectParams | undefined>
    >
    error: Error | undefined
    isLoading: WCLoadingState | undefined
    sessions: SessionTypes.Struct[]
    sessionProposal: Web3WalletTypes.SessionProposal | undefined
    sessionRequest: Web3WalletTypes.SessionRequest | undefined
    connect: (uri: string) => Promise<void>
    approveSessionRequest: () => Promise<void>
    rejectSessionRequest: () => Promise<void>
    approveSessionProposal: (
        proposalData?: Web3WalletTypes.SessionProposal
    ) => Promise<void>
    rejectSessionProposal: () => Promise<void>
    disconnect: (session: SessionTypes.Struct) => Promise<void>
}

export const WalletConnectContext = createContext<WalletConnectContextType>({
    walletConnectParams: undefined,
    setWalletConnectParams: () => {},
    error: undefined,
    isLoading: undefined,
    sessions: [],
    sessionProposal: undefined,
    sessionRequest: undefined,
    connect: () => Promise.resolve(),
    approveSessionRequest: () => Promise.resolve(),
    rejectSessionRequest: () => Promise.resolve(),
    approveSessionProposal: () => Promise.resolve(),
    rejectSessionProposal: () => Promise.resolve(),
    disconnect: () => Promise.resolve()
})
