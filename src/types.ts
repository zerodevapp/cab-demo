import type {
    EntryPoint,
    EntryPointVersion,
    GetEntryPointVersion
} from "permissionless/types"
import type { Address, Hex } from "viem"

export type SponsorTokenInfo = {
    amount: bigint
    address: Address
}

export type RepayToken = {
    address: Address
    chainId: number
}

export type RepayTokenInfo = {
    vault: Address
    amount: bigint
    chainId: number
}

export type Call = {
    to: Address
    data: Hex
    value: bigint
}

export type UserOperationWithBigIntAsHex<
    entryPointVersion extends EntryPointVersion
> = entryPointVersion extends "v0.6"
    ? {
          sender: Address
          nonce: Hex
          initCode: Hex
          callData: Hex
          callGasLimit: Hex
          verificationGasLimit: Hex
          preVerificationGas: Hex
          maxFeePerGas: Hex
          maxPriorityFeePerGas: Hex
          paymasterAndData: Hex
          signature: Hex
          factory?: never
          factoryData?: never
          paymaster?: never
          paymasterVerificationGasLimit?: never
          paymasterPostOpGasLimit?: never
          paymasterData?: never
      }
    : {
          sender: Address
          nonce: Hex
          factory: Address
          factoryData: Hex
          callData: Hex
          callGasLimit: Hex
          verificationGasLimit: Hex
          preVerificationGas: Hex
          maxFeePerGas: Hex
          maxPriorityFeePerGas: Hex
          paymaster: Address
          paymasterVerificationGasLimit: Hex
          paymasterPostOpGasLimit: Hex
          paymasterData: Hex
          signature: Hex
          initCode?: never
          paymasterAndData?: never
      }

export type GetRpcCabPaymasterSponsorTokensParameters<
    TEntryPoint extends EntryPoint
> = [
    userOperation: UserOperationWithBigIntAsHex<
        GetEntryPointVersion<TEntryPoint>
    >,
    entryPoint: TEntryPoint,
    sponsorChainId: number
]

export type GetRpcCabPaymasterSponsorTokensReturnType = {
    paymaster: Address
    sponsorTokensInfo: SponsorTokenInfo[]
}

export type GetRpcCabPaymasterStubDataParameters<
    TEntryPoint extends EntryPoint
> = [
    userOperation: UserOperationWithBigIntAsHex<
        GetEntryPointVersion<TEntryPoint>
    >,
    entryPoint: TEntryPoint,
    sponsorChainId: number,
    repayTokens: RepayToken[]
]

export type GetRpcCabPaymasterStubDataReturnType<
    TEntryPoint extends EntryPoint
> = GetEntryPointVersion<TEntryPoint> extends "v0.6"
    ? {
          paymasterAndData: Hex
          repayTokensInfo: RepayTokenInfo[]
          preVerificationGas?: Hex
          verificationGasLimit?: Hex
          callGasLimit?: Hex
      }
    : {
          paymaster: Hex
          paymasterData: Hex
          repayTokensInfo: RepayTokenInfo[]
          preVerificationGas?: Hex
          verificationGasLimit?: Hex
          callGasLimit?: Hex
          paymasterVerificationGasLimit?: Hex
          paymasterPostOpGasLimit?: Hex
      }
export type GetRpcCabPaymasterDataParameters<TEntryPoint extends EntryPoint> = [
    userOperation: UserOperationWithBigIntAsHex<
        GetEntryPointVersion<TEntryPoint>
    >,
    entryPoint: TEntryPoint,
    sponsorChainId: number,
    repayTokens: RepayToken[]
]

export type GetRpcCabPaymasterDataReturnType<TEntryPoint extends EntryPoint> =
    GetEntryPointVersion<TEntryPoint> extends "v0.6"
        ? {
              paymasterAndData: Hex
          }
        : {
              paymaster: Hex
              paymasterData: Hex
          }

export type CabPaymasterRpcScheme<TEntryPoint extends EntryPoint> = [
    {
        Method: "pm_getCabPaymasterSponsorTokens"
        Parameters: GetRpcCabPaymasterSponsorTokensParameters<TEntryPoint>
        ReturnType: GetRpcCabPaymasterSponsorTokensReturnType
    },
    {
        Method: "pm_getCabPaymasterStubData"
        Parameters: GetRpcCabPaymasterStubDataParameters<TEntryPoint>
        ReturnType: GetRpcCabPaymasterStubDataReturnType<TEntryPoint>
    },
    {
        Method: "pm_getCabPaymasterData"
        Parameters: GetRpcCabPaymasterDataParameters<TEntryPoint>
        ReturnType: GetRpcCabPaymasterDataReturnType<TEntryPoint>
    }
]
