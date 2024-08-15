import type { ZeroDevVersion } from "../types"

export type ZeroDevWalletSigner = {
    isConnected: boolean
    signer: string
    chainId: number
    version: ZeroDevVersion
}

export const getZerodevSigner = (): ZeroDevWalletSigner | null => {
    if (typeof window === "undefined") return null
    const signer = window.localStorage.getItem("zerodev_wallet_signer")
    if (!signer) return null

    try {
        const parsedSigner = JSON.parse(signer)
        if (
            parsedSigner &&
            typeof parsedSigner === "object" &&
            "isConnected" in parsedSigner &&
            "signer" in parsedSigner &&
            "chainId" in parsedSigner &&
            "version" in parsedSigner
        ) {
            return parsedSigner as ZeroDevWalletSigner
        }
        return null
    } catch (err) {
        return null
    }
}

export const setZerodevSigner = (
    signer: string,
    isConnected: boolean,
    chainId: number,
    version: string
) => {
    if (typeof window === "undefined") return

    window.localStorage.setItem(
        "zerodev_wallet_signer",
        JSON.stringify({ signer, isConnected, chainId, version })
    )
    return
}

export const clearZerodevSigner = () => {
    if (typeof window === "undefined") return

    window.localStorage.removeItem("zerodev_wallet_signer")
}
